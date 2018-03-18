/*
 * Copyright 2015 Boris Smus. All Rights Reserved.
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

class TabProperties {
    constructor() {
        this.id = undefined;
        this.isCongtrolled = false;
        this.isAudible = false;
    }

    get id() {
        return this.id;
    }
    set id(value) {
        this.id = value;
    }
    
    get controlled() {
        return this.isCongtrolled;
    }
    set controlled(value) {
        this.isCongtrolled = value;
    }

    get audible() {
        return this.isAudible;
    }
    set audible(value) {
        this.isAudible = value;
    }
}

class TabsCollection {
    constructor() {
        this.storage = {};
    }

    has(tabId) {
        return this.storage.hasOwnProperty(tabId)
    }

    get(tabId) {
        if (this.has(tabId)) {
            return this.storage[tabId];
        }
        return undefined;
    }

    add(tabId) {
        this.storage[tabId] = new TabProperties();
    }

    remove(tabId) {
        delete this.storage[tabId];
    }

    each(func) {
        for (var tabId in this.storage) {
            if (this.storage.hasOwnProperty(tabId)) {
                func(parseInt(tabId));
            }
        }
    }
};

class RegisteredTabsCollection extends TabsCollection {
    constructor() {
        super();

        this.events = {"registered": [], "unregistered": []};
    }

    add(tabId) {
        if (super.has(tabId)) {
            return;
        }

        super.add(tabId);
        this.showPageAction(tabId);

        this.fireEvent("registered", tabId);
    }

    remove(tabId) {
        if (!super.has(tabId)) {
            return;
        }

        super.remove(tabId);
        this.hidePageAction(tabId);

        this.fireEvent("unregistered", tabId);
    }

    showPageAction(tabId) {
        chrome.pageAction.show(tabId);
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: {
                '19': 'icons/icon19.png',
                '38': 'icons/icon38.png'
            }
        });
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: 'Click to disable media keys for this tab'
        });
    }

    hidePageAction(tabId) {
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: {
                '19': 'icons/icon19-inactive.png',
                '38': 'icons/icon38-inactive.png'
            }
        });
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: 'Click to enable media keys for this tab'
        });
    }

    addListener(event, listener) {
        if (!this.events.hasOwnProperty(event)) {
            throw "Unknown event " + event;
        }
        this.events[event].push(listener);
    }

    fireEvent(event, data) {
        if (!this.events.hasOwnProperty(event)) {
            throw "Unknown event " + event;
        }
        this.events[event].forEach(function(el) {
            el(data);
        });
    }

    sendCommand(command) {
        this.each(function (tabId) {
            chrome.tabs.sendMessage(tabId, {command: command});
        });
    }
}

class Messaging {
    constructor(registeredTabs) {
        this.registeredTabs = registeredTabs;
    }

    processMessageFromPage(command, tabId) {
        if (command == 'registerTab' && tabId) {
            this.registeredTabs.add(tabId);
        } else if (command == 'unregisterTab' && tabId) {
            this.registeredTabs.remove(tabId);
        }
    }

    addOnMessageListener() {
        let self = this;
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                console.log('Received tab message: ', request);
                self.processMessageFromPage(request.command, sender.tab.id);
            }
        );
    }

    addOnCommandListener() {
        let self = this;
        chrome.commands.onCommand.addListener(function (command) {
            console.log('Command:', command);

            self.registeredTabs.sendCommand(command);
        });
    }

    addOnPageActionClickedListener() {
        let self = this;
        chrome.pageAction.onClicked.addListener(function (tab) {
            if (self.registeredTabs.has(tab.id)) {
                self.registeredTabs.remove(tab.id);
            } else {
                self.registeredTabs.add(tab.id);
            }
        });
    }

    addTabRemovedListener() {
        chrome.tabs.onRemoved.addListener(this.unregisterTab);
    }

    attach() {
        this.addOnMessageListener();
        this.addOnCommandListener();
        this.addOnPageActionClickedListener();
        this.addTabRemovedListener();
    }
}

class ContextMenu {
    constructor(registeredTabs) {
        this.registeredTabs = registeredTabs;

        this.setupContextMenu();

        let self = this;
        let updateContextMenuHandler = function (tabId) {
            self.updateContextMenu(tabId);
        }
        this.registeredTabs.addListener("registered", updateContextMenuHandler);
        this.registeredTabs.addListener("unregistered", updateContextMenuHandler);
        
        chrome.tabs.onActivated.addListener(function (evt) {
            self.updateContextMenu(evt.tabId);
        });
    }

    updateContextMenu(tabId) {
        let self = this;
        chrome.tabs.query({active: true}, function(tab) {
            tab = tab[0];
            if (tab.id == tabId) {
                if (self.registeredTabs.has(tabId)) {
                    chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: true});
                    chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: false});
                }
                else {
                    chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: false});
                    chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: true});
                }
            }
        });
    };

    setupContextMenu() {
        chrome.contextMenus.create({id: "keySocketMediaKeys-group", title: "Key Socket Media Keys"});

        let self = this;

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-disableThisTab",
            title: "Disable this tab",
            onclick: function (a, tab) {
                self.registeredTabs.remove(tab.id);
            }
        });
        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableThisTab",
            title: "Enable this tab",
            onclick: function (a, tab) {
                self.registeredTabs.add(tab.id);
            }
        });

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-separator1",
            type: "separator"
        });

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-disableAllTabs",
            title: "Disable all tabs",
            onclick: function (a, tab) {
                chrome.tabs.getAllInWindow(null, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        self.registeredTabs.remove(tabs[i].id);
                    }
                });
            }
        });
        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableAllTabs",
            title: "Enable all tabs",
            onclick: function (a, tab) {
                chrome.tabs.getAllInWindow(null, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        self.registeredTabs.add(tabs[i].id);
                    }
                });
            }
        });

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-separator2",
            type: "separator"
        });

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-disableAllBut",
            title: "Disable all but this tab",
            onclick: function (a, tab) {
                chrome.tabs.getAllInWindow(null, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        if (tab.id !== tabs[i].id) {
                            self.registeredTabs.remove(tabs[i].id);
                        }
                    }
                });

                self.registeredTabs.add(tab.id);
            }
        });

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableAllBut",
            title: "Enable all but this tab",
            onclick: function (a, tab) {
                self.registeredTabs.remove(tab.id);

                chrome.tabs.getAllInWindow(null, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        if (tab.id !== tabs[i].id) {
                            self.registeredTabs.add(tabs[i].id);
                        }
                    }
                });
            }
        });
    }
}

let registeredTabs = new RegisteredTabsCollection();

let messaging = new Messaging(registeredTabs);
messaging.attach();

let contextMenu = new ContextMenu(registeredTabs);