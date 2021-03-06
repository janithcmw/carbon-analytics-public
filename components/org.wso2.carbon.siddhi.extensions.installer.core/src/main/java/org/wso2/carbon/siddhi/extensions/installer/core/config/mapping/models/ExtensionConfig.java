/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

package org.wso2.carbon.siddhi.extensions.installer.core.config.mapping.models;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contains configuration of an extension.
 */
public class ExtensionConfig {

    private Map<String, String> extension = new HashMap<>();
    private ExtensionIdentifierConfig identifier;
    private List<DependencyConfig> dependencies = new ArrayList<>();

    public List<DependencyConfig> getManuallyInstallableDependencies() {
        return dependencies.stream()
            .filter(dependency -> !dependency.isAutoDownloadable())
            .collect(Collectors.toList());
    }

    public List<DependencyConfig> getAutoDownloadableDependencies() {
        return dependencies.stream()
            .filter(DependencyConfig::isAutoDownloadable)
            .collect(Collectors.toList());
    }

    public Map<String, String> getExtensionInfo() {
        return extension;
    }

    public ExtensionIdentifierConfig getIdentifier() {
        return identifier;
    }

    public List<DependencyConfig> getDependencies() {
        return dependencies;
    }

}
