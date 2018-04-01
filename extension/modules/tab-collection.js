/*
 * Copyright 2018 Valery Leontyev. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 /**
  * Tab related properties copntainer
  */
 class TabProperties {
    constructor(tabId) {
        this.id = tabId;
        this.isControlled = false;
    }
}

/**
 * A collection (map) of TabProperties for purpose of accounting browser tabs
 */
class TabCollection {
    constructor() {
        this.storage = new Map();
    }

    has(tabId) {
        return this.storage.has(tabId)
    }

    get(tabId) {
        return this.storage.get(tabId);
    }

    add(tabId) {
        this.storage.set(parseInt(tabId), new TabProperties(tabId));
    }

    remove(tabId) {
        this.storage.delete(tabId);
    }

    each(func) {
        for (const [tabId, tabProps] of this.storage) {
            func(parseInt(tabId), tabProps);
        }
    }
};

export {TabProperties, TabCollection}