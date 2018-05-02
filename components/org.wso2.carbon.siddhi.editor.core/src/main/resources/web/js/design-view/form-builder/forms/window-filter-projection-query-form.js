/**
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

define(['require', 'log', 'jquery', 'lodash', 'querySelect', 'queryOutputInsert', 'queryOutputDelete',
        'queryOutputUpdate', 'queryOutputUpdateOrInsertInto', 'queryWindow', 'queryOrderByValue'],
    function (require, log, $, _, QuerySelect, QueryOutputInsert, QueryOutputDelete, QueryOutputUpdate,
              QueryOutputUpdateOrInsertInto, QueryWindow, QueryOrderByValue) {

        var constants = {
            PROJECTION: 'projectionQueryDrop',
            FILTER: 'filterQueryDrop',
            WINDOW_QUERY: 'windowQueryDrop'
        };

        /**
         * @class WindowFilterProjectionQueryForm Creates a forms to collect data from a window/filter/projection query
         * @constructor
         * @param {Object} options Rendering options for the view
         */
        var WindowFilterProjectionQueryForm = function (options) {
            this.configurationData = options.configurationData;
            this.application = options.application;
            this.consoleListManager = options.application.outputController;
            this.gridContainer = $("#grid-container");
            this.toolPaletteContainer = $("#tool-palette-container");
        };

        /**
         * @function generate the form for the simple queries (projection, filter and window)
         * @param element selected element(query)
         * @param formConsole Console which holds the form
         * @param formContainer Container which holds the form
         */
        WindowFilterProjectionQueryForm.prototype.generatePropertiesForm = function (element, formConsole,
                                                                                     formContainer) {
            var self = this;
            // The container and the tool palette are disabled to prevent the user from dropping any elements
            self.gridContainer.addClass('disabledbutton');
            self.toolPaletteContainer.addClass('disabledbutton');

            var id = $(element).parent().attr('id');
            var clickedElement = self.configurationData.getSiddhiAppConfig().getWindowFilterProjectionQuery(id);
            if (clickedElement.getQueryInput() === ''
                || clickedElement.getQueryInput().getFrom() === '') {
                alert('Connect an input element');
                self.gridContainer.removeClass('disabledbutton');
                self.toolPaletteContainer.removeClass('disabledbutton');

                // close the form window
                self.consoleListManager.removeConsole(formConsole);
                self.consoleListManager.hideAllConsoles();
            } else if (clickedElement.getQueryOutput() === '' || clickedElement.getQueryOutput().getTarget() === '') {
                alert('Connect an output stream');
                self.gridContainer.removeClass('disabledbutton');
                self.toolPaletteContainer.removeClass('disabledbutton');

                // close the form window
                self.consoleListManager.removeConsole(formConsole);
                self.consoleListManager.hideAllConsoles();
            } else {
                var savedQueryInput = {};
                if (clickedElement.getQueryInput().getWindow() === '') {
                    savedQueryInput = {
                        input: {
                            from : clickedElement.getQueryInput().getFrom()
                        },
                        filter: {
                            filter : clickedElement.getQueryInput().getFilter()
                        },
                        postWindowFilter: {
                            filter : clickedElement.getQueryInput().getPostWindowFilter()
                        }
                    };
                } else {
                    savedQueryInput = {
                        input: {
                            from : clickedElement.getQueryInput().getFrom()
                        },
                        filter: {
                            filter : clickedElement.getQueryInput().getFilter()
                        },
                        window : {
                            functionName: clickedElement.getQueryInput().getWindow().getFunction(),
                            parameters: clickedElement.getQueryInput().getWindow().getParameters()
                        },
                        postWindowFilter: {
                            filter : clickedElement.getQueryInput().getPostWindowFilter()
                        }
                    };
                }

                var inputElementName = clickedElement.getQueryInput().getFrom();
                var savedGroupByAttributes = clickedElement.getGroupBy();
                var having = clickedElement.getHaving();
                var savedOrderByAttributes = clickedElement.getOrderBy();
                var limit = clickedElement.getLimit();
                var outputRateLimit = clickedElement.getOutputRateLimit();
                var outputElementName = clickedElement.getQueryOutput().getTarget();

                var groupBy = [];
                _.forEach(savedGroupByAttributes, function (savedGroupByAttribute) {
                    var groupByAttributeObject = {
                        attribute: savedGroupByAttribute
                    };
                    groupBy.push(groupByAttributeObject);
                });

                var orderBy = [];
                _.forEach(savedOrderByAttributes, function (savedOrderByValue) {
                    var orderByValueObject = {
                        attribute: savedOrderByValue.getValue(),
                        order: savedOrderByValue.getOrder()
                    };
                    orderBy.push(orderByValueObject);
                });

                var possibleGroupByAttributes = [];
                var isInputElementNameFound = false;
                var isOutputElementNameFound = false;
                var inputElementType = '';
                var outputElementType = '';
                var outputElementAttributesList = [];
                _.forEach(self.configurationData.getSiddhiAppConfig().streamList, function (stream) {
                    if (stream.getName() === inputElementName) {
                        isInputElementNameFound = true;
                        inputElementType = 'stream';
                        _.forEach(stream.getAttributeList(), function (attribute) {
                            possibleGroupByAttributes.push(attribute.getName());
                        });
                    }
                    if (stream.getName() === outputElementName) {
                        isOutputElementNameFound = true;
                        outputElementType = 'stream';
                        outputElementAttributesList = stream.getAttributeList();
                    }
                });

                _.forEach(self.configurationData.getSiddhiAppConfig().windowList, function (window) {
                    if (!isInputElementNameFound && window.getName() === inputElementName) {
                        isInputElementNameFound = true;
                        inputElementType = 'window';
                        _.forEach(window.getAttributeList(), function (attribute) {
                            possibleGroupByAttributes.push(attribute.getName());
                        });
                    }
                    if (!isOutputElementNameFound && window.getName() === outputElementName) {
                        isOutputElementNameFound = true;
                        outputElementType = 'window';
                        outputElementAttributesList = window.getAttributeList();
                    }
                });

                _.forEach(self.configurationData.getSiddhiAppConfig().tableList, function (table) {
                    if (!isInputElementNameFound && table.getName() === inputElementName) {
                        isInputElementNameFound = true;
                        inputElementType = 'table';
                        _.forEach(table.getAttributeList(), function (attribute) {
                            possibleGroupByAttributes.push(attribute.getName());
                        });
                    }
                    if (!isOutputElementNameFound && table.getName() === outputElementName) {
                        isOutputElementNameFound = true;
                        outputElementType = 'table';
                        outputElementAttributesList = table.getAttributeList();
                    }
                });

                var select = [];
                if (clickedElement.getSelect() === '') {
                    for (var i = 0; i < outputElementAttributesList.length; i++) {
                        var attr = {
                            expression: '',
                            as: outputElementAttributesList[i].getName()
                        };
                        select.push(attr);
                    }
                } else if(clickedElement.getSelect().getValue() === '') {
                    for (var i = 0; i < outputElementAttributesList.length; i++) {
                        var attr = {
                            expression: '',
                            as: outputElementAttributesList[i].getName()
                        };
                        select.push(attr);
                    }
                } else if (clickedElement.getSelect().getValue() === '*') {
                    select = '*';
                } else if (!(clickedElement.getSelect().getValue() === '*')) {
                    var selectedAttributes = clickedElement.getSelect().getValue();
                    for (var i = 0; i < outputElementAttributesList.length; i++) {
                        var expressionStatement = "";
                        if (selectedAttributes[i] !== undefined && selectedAttributes[i].expression !== undefined) {
                            expressionStatement = selectedAttributes[i].expression;
                        }
                        var attr = {
                            expression: expressionStatement,
                            as: outputElementAttributesList[i].getName()
                        };
                        select.push(attr);
                    }
                }

                var savedQueryOutput = clickedElement.getQueryOutput();
                if (savedQueryOutput !== undefined && savedQueryOutput !== "") {
                    var savedQueryOutputTarget = savedQueryOutput.getTarget();
                    var savedQueryOutputType = savedQueryOutput.getType();
                    var output = savedQueryOutput.getOutput();
                    var queryOutput;
                    if ((savedQueryOutputTarget !== undefined && savedQueryOutputTarget !== '')
                        && (savedQueryOutputType !== undefined && savedQueryOutputType !== '')
                        && (output !== undefined && output !== '')) {
                        // getting the event tpe and pre load it
                        var eventType;
                        if (output.getEventType() === '') {
                            eventType = 'all events';
                        } else if (output.getEventType() === 'all') {
                            eventType = 'all events';
                        } else if (output.getEventType() === 'current') {
                            eventType = 'current events';
                        } else if (output.getEventType() === 'expired') {
                            eventType = 'expired events';
                        }
                        if (savedQueryOutputType === "insert") {
                            queryOutput = {
                                insertTarget: savedQueryOutputTarget,
                                eventType: eventType
                            };
                        } else if (savedQueryOutputType === "delete") {
                            queryOutput = {
                                deleteTarget: savedQueryOutputTarget,
                                eventType: eventType,
                                on: output.getOn()
                            };
                        } else if (savedQueryOutputType === "update") {
                            queryOutput = {
                                updateTarget: savedQueryOutputTarget,
                                eventType: eventType,
                                set: output.getSet(),
                                on: output.getOn()
                            };
                        } else if (savedQueryOutputType === "update_or_insert_into") {
                            queryOutput = {
                                updateOrInsertIntoTarget: savedQueryOutputTarget,
                                eventType: eventType,
                                set: output.getSet(),
                                on: output.getOn()
                            };
                        }
                    }
                }

                var fillQueryInputWith = savedQueryInput;
                var fillQuerySelectWith = {
                    select : select,
                    groupBy : groupBy,
                    postFilter: {
                        having : having
                    }
                };
                var fillQueryOutputWith = {
                    orderBy : orderBy,
                    limit: {
                        limit : limit
                    },
                    outputRateLimit: {
                        outputRateLimit : outputRateLimit
                    },
                    output: queryOutput
                };

                var inputSchema;
                if (inputElementType === 'window'){
                    inputSchema = {
                        type: "object",
                        title: "Query Input",
                        required: true,
                        options: {
                            disable_properties: false
                        },
                        properties: {
                            input: {
                                propertyOrder: 1,
                                type: "object",
                                title: "Input",
                                required: true,
                                properties: {
                                    from: {
                                        required: true,
                                        title: "Window",
                                        type: "string",
                                        template: inputElementName,
                                        minLength: 1
                                    }
                                }
                            },
                            filter: {
                                propertyOrder: 2,
                                type: "object",
                                title: "Filter",
                                required: true,
                                properties: {
                                    filter: {
                                        title: "Condition",
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            }
                        }
                    }
                } else {
                    inputSchema = {
                        type: "object",
                        title: "Query Input",
                        required: true,
                        options: {
                            disable_properties: false
                        },
                        properties: {
                            input: {
                                propertyOrder: 1,
                                type: "object",
                                title: "Input",
                                required: true,
                                properties: {
                                    from: {
                                        required: true,
                                        title: "Stream/Table",
                                        type: "string",
                                        template: inputElementName,
                                        minLength: 1
                                    }
                                }
                            },
                            filter: {
                                propertyOrder: 2,
                                type: "object",
                                title: "Filter",
                                required: true,
                                properties: {
                                    filter: {
                                        required: true,
                                        title: "Condition",
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            },
                            window: {
                                propertyOrder: 3,
                                title: "Window",
                                type: "object",
                                properties: {
                                    functionName: {
                                        required: true,
                                        title: "Name",
                                        type: "string",
                                        minLength: 1
                                    },
                                    parameters: {
                                        required: true,
                                        type: "array",
                                        format: "table",
                                        title: "Parameters",
                                        items: {
                                            type: "object",
                                            title: 'Attribute',
                                            properties: {
                                                parameter: {
                                                    type: 'string',
                                                    title: 'Parameter Name',
                                                    minLength: 1
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            postWindowFilter: {
                                propertyOrder: 4,
                                type: "object",
                                title: "Post Window Filter",
                                properties: {
                                    filter: {
                                        required: true,
                                        title: "Condition",
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            }
                        }
                    };
                }
                var outputSchema;
                if (outputElementType === 'table') {
                    outputSchema = {
                        title: "Action",
                        propertyOrder: 5,
                        required: true,
                        oneOf: [
                            {
                                $ref: "#/definitions/queryOutputInsertType",
                                title: "Insert"
                            },
                            {
                                $ref: "#/definitions/queryOutputDeleteType",
                                title: "Delete"
                            },
                            {
                                $ref: "#/definitions/queryOutputUpdateType",
                                title: "Update"
                            },
                            {
                                $ref: "#/definitions/queryOutputUpdateOrInsertIntoType",
                                title: "Update Or Insert"
                            }
                        ]
                    };
                } else {
                    outputSchema = {
                        required: true,
                        title: "Action",
                        propertyOrder: 5,
                        type: "object",
                        properties: {
                            insert: {
                                required: true,
                                title: "Operation",
                                type: "string",
                                template: "Insert"
                            },
                            insertTarget: {
                                type: 'string',
                                title: 'Into',
                                template: savedQueryOutputTarget,
                                required: true
                            },
                            eventType: {
                                required: true,
                                title: "For",
                                type: "string",
                                enum: ['current events', 'expired events', 'all events'],
                                default: 'all events'
                            }
                        }
                    };
                }

                $(formContainer).append('<div class="row"><div id="form-query-input" class="col-md-4"></div>' +
                    '<div id="form-query-select" class="col-md-4"></div>' +
                    '<div id="form-query-output" class="col-md-4"></div></div>');

                var editorInput = new JSONEditor($('#form-query-input')[0], {
                    schema: inputSchema,
                    startval: fillQueryInputWith,
                    show_errors: "always",
                    disable_properties: true,
                    display_required_only: true,
                    no_additional_properties: true,
                    disable_array_delete_all_rows: true,
                    disable_array_delete_last_row: true,
                    disable_array_reorder: true
                });
                var editorSelect = new JSONEditor($('#form-query-select')[0], {
                    schema: {
                        required: true,
                        options: {
                            disable_properties: false
                        },
                        type: "object",
                        title: "Query Select",
                        properties: {
                            select: {
                                propertyOrder: 1,
                                title: "Select",
                                required: true,
                                oneOf: [
                                    {
                                        $ref: "#/definitions/querySelectUserDefined",
                                        title: "User Defined Attributes"
                                    },
                                    {
                                        $ref: "#/definitions/querySelectAll",
                                        title: "All Attributes"
                                    }
                                ]
                            },
                            groupBy: {
                                propertyOrder: 2,
                                type: "array",
                                format: "table",
                                title: "Group By Attributes",
                                uniqueItems: true,
                                items: {
                                    type: "object",
                                    title: 'Attribute',
                                    properties: {
                                        attribute: {
                                            type: 'string',
                                            title: 'Attribute Name',
                                            enum: possibleGroupByAttributes,
                                            default: ""
                                        }
                                    }
                                }
                            },
                            postFilter: {
                                propertyOrder: 3,
                                type: "object",
                                title: "Post Select Filter",
                                properties: {
                                    having: {
                                        required: true,
                                        title: "Condition",
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            }
                        },
                        definitions: {
                            querySelectUserDefined: {
                                required: true,
                                type: "array",
                                format: "table",
                                title: "Select Attributes",
                                uniqueItems: true,
                                options: {
                                    disable_array_add: true,
                                },
                                items: {
                                    title: "Value Set",
                                    type: "object",
                                    properties: {
                                        expression: {
                                            title: "Expression",
                                            type: "string",
                                            minLength: 1
                                        },
                                        as: {
                                            title: "As",
                                            type: "string"
                                        }
                                    }
                                }
                            },
                            querySelectAll: {
                                type: "string",
                                title: "Select All Attributes",
                                template: '*'
                            }

                        }
                    },
                    startval: fillQuerySelectWith,
                    show_errors: "always",
                    disable_properties: true,
                    display_required_only: true,
                    no_additional_properties: true,
                    disable_array_delete_all_rows: true,
                    disable_array_delete_last_row: true,
                    disable_array_reorder: true
                });
                //disable fields that can not be changed
                for (var i = 0; i < outputElementAttributesList.length; i++) {
                    editorSelect.getEditor('root.select.' + i + '.as').disable();
                }
                var editorOutput = new JSONEditor($('#form-query-output')[0], {
                    schema: {
                        required: true,
                        type: "object",
                        title: "Query Output",
                        options: {
                            disable_properties: false
                        },
                        properties: {
                            orderBy: {
                                propertyOrder: 2,
                                type: "array",
                                format: "table",
                                title: "Order By Attributes",
                                uniqueItems: true,
                                items: {
                                    type: "object",
                                    title: 'Attribute',
                                    properties: {
                                        attribute: {
                                            required: true,
                                            type: 'string',
                                            title: 'Attribute Name',
                                            enum: possibleGroupByAttributes,
                                            default: ""
                                        },
                                        order: {
                                            required: true,
                                            type: "string",
                                            title: "Order",
                                            enum: ['asc', 'desc'],
                                            default: 'asc'
                                        }
                                    }
                                }
                            },
                            limit: {
                                propertyOrder: 3,
                                type: "object",
                                title: "Limit",
                                properties: {
                                    limit: {
                                        required: true,
                                        title: "Number of Events per Output",
                                        type: "number",
                                        minLength: 1
                                    }
                                }
                            },
                            outputRateLimit: {
                                propertyOrder: 4,
                                type: "object",
                                title: "Rate Limiting",
                                properties: {
                                    outputRateLimit: {
                                        required: true,
                                        title: "By Events/Time/Snapshot",
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            },
                            output: outputSchema
                        },
                        definitions: {
                            queryOutputInsertType: {
                                required: true,
                                title: "Action",
                                type: "object",
                                options: {
                                    disable_properties: true
                                },
                                properties: {
                                    insertTarget: {
                                        type: 'string',
                                        title: 'Into',
                                        template: savedQueryOutputTarget,
                                        required: true
                                    },
                                    eventType: {
                                        required: true,
                                        title: "For",
                                        type: "string",
                                        enum: ['current events', 'expired events', 'all events'],
                                        default: 'all events'
                                    }
                                }
                            },
                            queryOutputDeleteType: {
                                required: true,
                                title: "Action",
                                type: "object",
                                options: {
                                    disable_properties: true
                                },
                                properties: {
                                    deleteTarget: {
                                        type: 'string',
                                        title: 'From',
                                        template: savedQueryOutputTarget,
                                        required: true
                                    },
                                    eventType: {
                                        title: "For",
                                        type: "string",
                                        enum: ['current events', 'expired events', 'all events'],
                                        default: 'all events',
                                        required: true
                                    },
                                    on: {
                                        type: 'string',
                                        title: 'On Condition',
                                        minLength: 1,
                                        required: true
                                    }
                                }
                            },
                            queryOutputUpdateType: {
                                required: true,
                                title: "Action",
                                type: "object",
                                options: {
                                    disable_properties: true
                                },
                                properties: {
                                    updateTarget: {
                                        type: 'string',
                                        title: 'From',
                                        template: savedQueryOutputTarget,
                                        required: true
                                    },
                                    eventType: {
                                        title: "For",
                                        type: "string",
                                        enum: ['current events', 'expired events', 'all events'],
                                        default: 'all events',
                                        required: true
                                    },
                                    set: {
                                        required: true,
                                        type: "array",
                                        format: "table",
                                        title: "Set",
                                        uniqueItems: true,
                                        items: {
                                            type: "object",
                                            title: 'Set Condition',
                                            properties: {
                                                attribute: {
                                                    type: "string",
                                                    title: 'Attribute',
                                                    minLength: 1
                                                },
                                                value: {
                                                    type: "string",
                                                    title: 'Value',
                                                    minLength: 1
                                                }
                                            }
                                        }
                                    },
                                    on: {
                                        type: 'string',
                                        title: 'On Condition',
                                        minLength: 1,
                                        required: true
                                    }
                                }
                            },
                            queryOutputUpdateOrInsertIntoType: {
                                required: true,
                                title: "Action",
                                type: "object",
                                options: {
                                    disable_properties: true
                                },
                                properties: {
                                    updateOrInsertIntoTarget: {
                                        type: 'string',
                                        title: 'From/Into',
                                        template: savedQueryOutputTarget,
                                        required: true
                                    },
                                    eventType: {
                                        title: "For",
                                        type: "string",
                                        enum: ['current events', 'expired events', 'all events'],
                                        default: 'all events',
                                        required: true
                                    },
                                    set: {
                                        required: true,
                                        type: "array",
                                        format: "table",
                                        title: "Set",
                                        uniqueItems: true,
                                        items: {
                                            type: "object",
                                            title: 'Set Condition',
                                            properties: {
                                                attribute: {
                                                    type: "string",
                                                    title: 'Attribute',
                                                    minLength: 1
                                                },
                                                value: {
                                                    type: "string",
                                                    title: 'Value',
                                                    minLength: 1
                                                }
                                            }
                                        }
                                    },
                                    on: {
                                        type: 'string',
                                        title: 'On Condition',
                                        minLength: 1,
                                        required: true
                                    }
                                }

                            }

                        }
                    },
                    startval: fillQueryOutputWith,
                    show_errors: "always",
                    disable_properties: true,
                    display_required_only: true,
                    no_additional_properties: true,
                    disable_array_delete_all_rows: true,
                    disable_array_delete_last_row: true,
                    disable_array_reorder: true
                });

                $(formContainer).append('<div id="form-submit"><button type="button" ' +
                    'class="btn btn-default">Submit</button></div>' +
                    '<div id="form-cancel"><button type="button" class="btn btn-default">Cancel</button></div>');

                // 'Submit' button action
                var submitButtonElement = $('#form-submit')[0];
                submitButtonElement.addEventListener('click', function () {
                    self.gridContainer.removeClass('disabledbutton');
                    self.toolPaletteContainer.removeClass('disabledbutton');

                    // close the form window
                    self.consoleListManager.removeConsole(formConsole);
                    self.consoleListManager.hideAllConsoles();

                    var inputConfig = editorInput.getValue();
                    var selectConfig = editorSelect.getValue();
                    var outputConfig = editorOutput.getValue();

                    var type;
                    // change the query icon depending on the fields filled
                    if (inputConfig.window) {
                        type = "window";
                        $(element).parent().removeClass();
                        $(element).parent().addClass(constants.WINDOW_QUERY + ' jtk-draggable');
                    } else if ((inputConfig.filter && inputConfig.filter.filter)
                        || (inputConfig.postWindowFilter && inputConfig.postWindowFilter.filter)) {
                        type = "filter";
                        $(element).parent().removeClass();
                        $(element).parent().addClass(constants.FILTER + ' jtk-draggable');
                    } else if (!((inputConfig.filter && inputConfig.filter.filter) || inputConfig.window
                        || (inputConfig.postWindowFilter && inputConfig.postWindowFilter.filter))) {
                        type = "projection";
                        $(element).parent().removeClass();
                        $(element).parent().addClass(constants.PROJECTION + ' jtk-draggable');
                    }

                    var queryInput = clickedElement.getQueryInput();
                    queryInput.setType(type);
                    if (inputConfig.filter !== undefined && inputConfig.filter.filter !== undefined) {
                        queryInput.setFilter(inputConfig.filter.filter);
                    } else {
                        queryInput.setFilter('');
                    }

                    if (inputConfig.window !== undefined) {
                        var windowOptions = {};
                        _.set(windowOptions, 'function', inputConfig.window.functionName);
                        _.set(windowOptions, 'parameters', inputConfig.window.parameters);
                        var queryWindow = new QueryWindow(windowOptions);
                        queryInput.setWindow(queryWindow);
                    } else {
                        queryInput.setWindow('');
                    }

                    if (inputConfig.postWindowFilter !== undefined &&
                        inputConfig.postWindowFilter.filter !== undefined) {
                        queryInput.setPostWindowFilter(inputConfig.postWindowFilter.filter);
                    } else {
                        queryInput.setPostWindowFilter('');
                    }

                    var selectAttributeOptions = {};
                    if (selectConfig.select instanceof Array) {
                        _.set(selectAttributeOptions, 'type', 'user_defined');
                        _.set(selectAttributeOptions, 'value', selectConfig.select);
                    } else if (selectConfig.select === "*") {
                        _.set(selectAttributeOptions, 'type', 'all');
                        _.set(selectAttributeOptions, 'value', selectConfig.select);
                    } else {
                        console.log("Value other than \"user_defined\" and \"all\" received!");
                    }
                    var selectObject = new QuerySelect(selectAttributeOptions);
                    clickedElement.setSelect(selectObject);

                    if (selectConfig.groupBy !== undefined) {
                        var groupByAttributes = [];
                        _.forEach(selectConfig.groupBy, function (groupByAttribute) {
                            groupByAttributes.push(groupByAttribute.attribute);
                        });
                        clickedElement.setGroupBy(groupByAttributes);
                    } else {
                        clickedElement.setGroupBy('');
                    }

                    if (selectConfig.postFilter !== undefined && selectConfig.postFilter.having !== undefined) {
                        clickedElement.setHaving(selectConfig.postFilter.having);
                    } else {
                        clickedElement.setHaving('');
                    }

                    clickedElement.getOrderBy().removeAllElements();
                    if (outputConfig.orderBy !== undefined) {
                        _.forEach(outputConfig.orderBy, function (orderByValue) {
                            var orderByValueObjectOptions = {};
                            _.set(orderByValueObjectOptions, 'value', orderByValue.attribute);
                            _.set(orderByValueObjectOptions, 'order', orderByValue.order);
                            var orderByValueObject = new QueryOrderByValue(orderByValueObjectOptions);
                            clickedElement.addOrderByValue(orderByValueObject);
                        });
                    }

                    if (outputConfig.limit !== undefined && outputConfig.limit.limit !== undefined) {
                        clickedElement.setLimit(outputConfig.limit.limit);
                    } else {
                        clickedElement.setLimit('');
                    }

                    if (outputConfig.outputRateLimit !== undefined
                        && outputConfig.outputRateLimit.outputRateLimit !== undefined) {
                        clickedElement.setOutputRateLimit(outputConfig.outputRateLimit.outputRateLimit);
                    } else {
                        clickedElement.setOutputRateLimit('');
                    }

                    var queryOutput = clickedElement.getQueryOutput();
                    var outputObject;
                    var outputType;
                    var outputTarget;
                    if (outputConfig.output !== undefined) {
                        if (outputConfig.output.insertTarget !== undefined) {
                            outputType = "insert";
                            outputTarget = outputConfig.output.insertTarget;
                            outputObject = new QueryOutputInsert(outputConfig.output);
                        } else if (outputConfig.output.deleteTarget !== undefined) {
                            outputType = "delete";
                            outputTarget = outputConfig.output.deleteTarget;
                            outputObject = new QueryOutputDelete(outputConfig.output);
                        } else if (outputConfig.output.updateTarget !== undefined) {
                            outputType = "update";
                            outputTarget = outputConfig.output.updateTarget;
                            outputObject = new QueryOutputUpdate(outputConfig.output);
                        } else if (outputConfig.output.updateOrInsertIntoTarget !== undefined) {
                            outputType = "update_or_insert_into";
                            outputTarget = outputConfig.output.updateOrInsertIntoTarget;
                            outputObject = new QueryOutputUpdateOrInsertInto(outputConfig.output);
                        } else {
                            console.log("Invalid output type for query received!")
                        }

                        if (outputConfig.output.eventType === undefined) {
                            outputObject.setEventType('');
                        } else if(outputConfig.output.eventType === "all events"){
                            outputObject.setEventType('all');
                        } else if(outputConfig.output.eventType === "current events"){
                            outputObject.setEventType('current');
                        } else if(outputConfig.output.eventType === "expired events"){
                            outputObject.setEventType('expired');
                        }
                        queryOutput.setTarget(outputTarget);
                        queryOutput.setOutput(outputObject);
                        queryOutput.setType(outputType);
                    }
                });

                // 'Cancel' button action
                var cancelButtonElement = $('#form-cancel')[0];
                cancelButtonElement.addEventListener('click', function () {
                    self.gridContainer.removeClass('disabledbutton');
                    self.toolPaletteContainer.removeClass('disabledbutton');
                    // close the form window
                    self.consoleListManager.removeConsole(formConsole);
                    self.consoleListManager.hideAllConsoles();
                });
            }
        };

        return WindowFilterProjectionQueryForm;
    });
