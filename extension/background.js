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
    constructor(tabId) {
        this.id = tabId;
        this.isControlled = false;
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
        this.storage[tabId] = new TabProperties(tabId);
    }

    remove(tabId) {
        delete this.storage[tabId];
    }

    each(func) {
        for (var tabId in this.storage) {
            if (this.storage.hasOwnProperty(tabId)) {
                func(parseInt(tabId), this.storage[tabId]);
            }
        }
    }
};

class RegisteredTabsCollection extends TabsCollection {
    constructor(/*strategy*/) {
        super();

        // this.strategy = strategy;

        this.events = {"registered": [], "unregistered": [], "controlled": [], "uncontrolled": []};
    }

    add(tabId) {
        if (super.has(tabId)) {
            return;
        }

        // this.strategy.beforeTabRegistered(tabId);

        super.add(tabId);
        this.fireEvent("registered", tabId);

        // this.strategy.afterTabRegistered(tabId);
    }

    remove(tabId) {
        if (!super.has(tabId)) {
            return;
        }

        // this.strategy.beforeTabUnregistered(tabId);

        super.remove(tabId);
        this.fireEvent("unregistered", tabId);

        // this.strategy.afterTabUnregistered(tabId);
    }

    setControlled(tabId) {
        this.toggleControlled(tabId, true);
    }

    setUncontrolled(tabId) {
        this.toggleControlled(tabId, false);
    }

    getControlledTabs() {
        let self = this;
        let controlled = [];
        this.each(function (tabId, tabProps) {
            if (tabProps.isControlled) {
                controlled.push(tabId);
            }
        });

        return controlled;
    }

    toggleControlled(tabId, state) {
        if (!this.has(tabId)) {
            throw new Error("The tab " + tabId + " is not registered");
        }

        let tabProps = this.get(tabId);

        if (state === undefined) {
            state = !tabProps.isControlled;
        } else if (typeof(state) != typeof(true)) { // default parameter behaviour
            throw new Error("State parameter for toggleControlled() must be bool");
        }
        
        if (state) {
            // this.strategy.beforeTabControlled(tabId);
            tabProps.isControlled = true;
            this.fireEvent("controlled", tabId);
            // this.strategy.afterTabControlled(tabId);
            console.log("Tab " + tabId + " is controlled now");
        } else {
            // this.strategy.beforeTabUncontrolled(tabId);
            tabProps.isControlled = false;
            this.fireEvent("uncontrolled", tabId);
            // this.strategy.afterTabUncontrolled(tabId);
            console.log("Tab " + tabId + " is UNcontrolled now");
        }
    }

    addListener(event, listener, priority) {
        if (priority === undefined) {
            priority = 0;
        } else {
            priority = parseInt(priority);
        }

        if (!this.events.hasOwnProperty(event)) {
            throw "Unknown event " + event;
        }

        this.events[event].push({listener: listener, priority: priority});
    }

    fireEvent(event, data) {
        if (!this.events.hasOwnProperty(event)) {
            throw "Unknown event " + event;
        }

        let priorities = [];
        this.events[event].forEach(function(el) {
            priorities.push(el.priority);
        });
        priorities.sort(function compareNumbers(a, b) {
            return a - b;
        });
        let events = this.events;
        priorities.forEach(function(pr) {
            events[event].forEach(function(el) {
                if (el.priority === pr) {
                    el.listener(data);
                }
            });
        });
    }

    eachControlled(func) {
        this.each(function (tabId, tabProps) {
            if (tabProps.isControlled === true) {
                func(tabId, tabProps);
            }
        });
    }
}

class PageAction {
    constructor(onClickHandler) {
        chrome.pageAction.onClicked.addListener(onClickHandler);
    }

    showPageAction(tabId) {
        chrome.pageAction.show(tabId);
        this._setIcon(tabId, false);
        this._setTitle(tabId, "This tab can be controlled by media keys, click to enable");
    }

    hidePageAction(tabId) {
        // callback is used to rule out an error when the tab is closed and no longer exists
        chrome.tabs.get(tabId, function (tab) {
            if (chrome.runtime.lastError === undefined) {
                chrome.pageAction.hide(tab.id);
            }
        });
    }

    setPageActionStateControlled(tabId) {
        this._setIcon(tabId, true);
        this._setTitle(tabId, "Click to disable media keys for this tab");
    }

    setPageActionStateUncontrolled(tabId) {
        this._setIcon(tabId, false);
        this._setTitle(tabId, "Click to enable media keys for this tab");
    }

    _setTitle(tabId, title) {
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: title
        });
    }

    _setIcon(tabId, isControlled) {
        let activity = "";
        if (isControlled === false) {
            activity = "-inactive";
        } else if (isControlled !== true) {
            throw new Error("Page action isControlled state is not boolean: " + isActive);
        }

        chrome.pageAction.setIcon({
            tabId: tabId,
            path: {
                "19": "icons/icon19" + activity + ".png",
                "38": "icons/icon38" + activity + ".png"
            }
        });
    }
}

class ExtToTabsMessaging {
    constructor(commandListeners) {
        this.commandListeners = commandListeners;

        this.addOnMessageListener();
    }

    addOnMessageListener() {
        let self = this;
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                let tabId = sender.tab.id;
                console.log('Received message from tab ' + tabId + ': ', request);
                if (tabId) {
                    self.processMessageFromPage(request.command, tabId);
                }
            }
        );
    }

    processMessageFromPage(command, tabId) {
        switch (command) {
            case "registerTab": this.commandListeners.registerTab(tabId); break; // @todo
            case "unregisterTab": this.commandListeners.unregisterTab(tabId); break; // @todo
        }
    }

    sendCommandToTab(command, tabId) {
        chrome.tabs.sendMessage(tabId, {command: command});
        console.log("Command " + command + " was sent to tab " + tabId);
    }
}

class ContextMenu {
    constructor(registeredTabs, strategy, full) {
        this.registeredTabs = registeredTabs;
        this.strategy = strategy;

        this.setupContextMenu(full);

        let self = this;
        let updateContextMenuHandler = function (tabId) {
            self.updateContextMenu(tabId);
        }
        this.registeredTabs.addListener("registered", updateContextMenuHandler);
        this.registeredTabs.addListener("unregistered", updateContextMenuHandler);
        this.registeredTabs.addListener("controlled", updateContextMenuHandler);
        this.registeredTabs.addListener("uncontrolled", updateContextMenuHandler);
        
        chrome.tabs.onActivated.addListener(function (evt) {
            self.updateContextMenu(evt.tabId);
        });
    }

    updateContextMenu(tabId) {
        let self = this;
        chrome.tabs.query({active: true}, function(tab) {
            tab = tab[0];
            if (tab.id == tabId) {
                if (self.registeredTabs.has(tabId) && self.registeredTabs.get(tabId).isControlled) {
                    chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: true});
                    chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: false});
                } else {
                    chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: false});
                    chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: true});
                }
            }
        });
    };

    setupContextMenu(full) {
        chrome.contextMenus.create({id: "keySocketMediaKeys-group", title: "Key Socket Media Keys"});

        let self = this;

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-disableThisTab",
            title: "Disable this tab",
            onclick: function (a, tab) {
                self.strategy.setUncontrolled(tab.id);
            }
        });
        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableThisTab",
            title: "Enable this tab",
            onclick: function (a, tab) {
                self.strategy.setControlled(tab.id);
            }
        });

        if (!full) {
            return;
        }

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
                self.registeredTabs.each(function (tabId) {
                    self.registeredTabs.setUncontrolled(tabId);
                });
            }
        });
        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableAllTabs",
            title: "Enable all tabs",
            onclick: function (a, tab) {
                self.registeredTabs.each(function (tabId) {
                    self.registeredTabs.setControlled(tabId);
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
                self.registeredTabs.each(function (tabId, tabProps) {
                    self.registeredTabs.toggleControlled(tabId, tabId == tab.id);
                });
            }
        });

        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableAllBut",
            title: "Enable all but this tab",
            onclick: function (a, tab) {
                self.registeredTabs.each(function (tabId, tabProps) {
                    self.registeredTabs.toggleControlled(tabId, tabId != tab.id);
                });
            }
        });
    }
}

class DefaultTabControlLogicStrategy {
    constructor(registeredTabs) {
        this.controlledByDefault = true;
        this.onlyOneIsControlled = false;

        this.registeredTabs = registeredTabs;

        let self = this;
        this.registeredTabs.addListener("registered", function (tabId) { self.afterTabRegistered(tabId); });
        this.registeredTabs.addListener("unregistered", function (tabId) { self.afterTabUnregistered(tabId); });
        this.registeredTabs.addListener("controlled", function (tabId) { self.afterTabControlled(tabId); });
        this.registeredTabs.addListener("uncontrolled", function (tabId) { self.afterTabUncontrolled(tabId); });
    }

    // beforeTabRegistered(tabId) {

    // }
    
    afterTabRegistered(tabId) {
        if (this.controlledByDefault) {
            this.registeredTabs.setControlled(tabId);
        }
    }

    // beforeTabUnregistered(tabId) {

    // }

    afterTabUnregistered(tabId) {

    }

    // beforeTabControlled(tabId) {

    // }

    afterTabControlled(tabId) {
        if (this.onlyOneIsControlled) {
            let self = this;
            this.registeredTabs.each(function (itabId, tabProps) {
                if (itabId != tabId && tabProps.isControlled) {
                    self.registeredTabs.setUncontrolled(itabId);
                }
            });
        }
    }

    // beforeTabUncontrolled(tabId) {

    // }

    afterTabUncontrolled(tabId) {

    }

    setControlled(tabId) {
        this.registeredTabs.setControlled(tabId);
    }

    setUncontrolled(tabId) {
        this.registeredTabs.setUncontrolled(tabId);
    }

    beforeCommandApplied(command) {

    }

    afterCommandApplied(command) {

    }
}

class AudibleTabControlLogicStrategy extends DefaultTabControlLogicStrategy {
    constructor(registeredTabs, messaging) {
        super(registeredTabs);
        this.controlledByDefault = false;
        this.onlyOneIsControlled = true;

        this.messaging = messaging;

        this.audibleTabsStack = new CustomStack();
        this.controlledTabsStack = new CustomStack();

        let self = this;
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
            self.checkAudible(tabId, changeInfo);
        });
    }

    checkAudible(tabId, changeInfo) {
        if (!changeInfo.hasOwnProperty('audible')) {
            return;
        }
        
        if (!this.registeredTabs.has(tabId)) {
            console.log('Audible check: ignore unregistered tab', tabId);
            return;
        }
        
        if (changeInfo.audible) { // if the tab started to play sound ...
            console.log('Audible check: set tab ' + tabId + ' as single contgrolled');
            this._setAudibleTabAsSingleControlledAndAddToStack(tabId); // ... make it controllable, ...
        } else {
            this.audibleTabsStack.remove(tabId); // if stopped remove it from the list
            console.log('Audible check: update playingTabs (remove)', tabId, this.audibleTabsStack.stack);
        }
    }

    _setAudibleTabAsSingleControlledAndAddToStack(tabId) {
        this.audibleTabsStack.push(tabId);
        console.log('Update playingTabs (add)', tabId, this.audibleTabsStack.stack);

        let self = this;
        this.registeredTabs.each(function (itabId, tabProps) {
            // pause all other registered tabs (not just controlled) when any new tab starts playback
            if (itabId != tabId && self.audibleTabsStack.has(itabId)) {
                self.messaging.sendCommandToTab('play-pause', itabId);
                console.log('Update playingTabs (`play-pause` sent)', itabId);
            }

            // make current the tab controlled
            if (itabId == tabId && tabProps.isControlled == false) {
                self.registeredTabs.setControlled(itabId);
            }
        });
    }

    afterTabRegistered(tabId) {
        super.afterTabRegistered(tabId);
        let self = this;
        chrome.tabs.get(tabId, function (tab) {
            if (tab.audible) { // if tab has already been playing in time of registring (for ex. youtube with autoplayback) ...
                self._setAudibleTabAsSingleControlledAndAddToStack(tabId); // ... we pass controll to it
            }
        });
    }

    afterTabUnregistered(tabId) {
        // say bye-bye to just closed or renavigated tab
        super.afterTabUnregistered(tabId);
        this.controlledTabsStack.remove(tabId);
        this.audibleTabsStack.remove(tabId);
        console.log("Tab " + tabId + " is unregisterer: playingTabs, controlledTabs", this.audibleTabsStack.stack, this.controlledTabsStack.stack);
        this._setControlledTabFromStack();
    }

    afterTabControlled(tabId) {
        super.afterTabControlled(tabId);
        this.controlledTabsStack.pushOnTop(tabId); // move last controlled tab to the top of the stack
        console.log("Moved last controlled tab to the top of the stack", tabId, this.controlledTabsStack.stack);
    }

    _setControlledTabFromStack() {
        let topmost = this.controlledTabsStack.getTopmost();
        if (topmost !== undefined) {
            this.registeredTabs.setControlled(topmost);
            console.log("Controlled tab was set from stack", topmost.id, this.controlledTabsStack.stack);
        } else {
            console.log("No tabs in stack to set controlled", this.controlledTabsStack.stack);
        }
    }

    setUncontrolled(tabId) {
        this.controlledTabsStack.pop(); // remove from stack if disabled manually
        super.setUncontrolled(tabId);
        this._setControlledTabFromStack(); // disabling active page requires to activate control on another page from stack
    }

    beforeCommandApplied(command) { // called from Controller
        super.beforeCommandApplied(command);
        if (this.registeredTabs.getControlledTabs().length < 1) { // when no tabs are conrtolled we make current active tab controllable ...
            let self = this;
            chrome.tabs.query({active: true, windowType: "normal", currentWindow: true}, function (tabs) {
                if (tabs.length > 0 && self.registeredTabs.has(tabs[0].id)) { // ... if it's registered
                    self.registeredTabs.setControlled(tabs[0].id);
                    self.messaging.sendCommandToTab(command, tabs[0].id);
                }
            });
        }
    }
}

import CustomStack from '/modules/stack.js';

class Controller {
    constructor(strategyName) {
        this.registeredTabs;

        let self = this;
        this.messaging = new ExtToTabsMessaging({
            registerTab: function (tabId) { self.registeredTabs.add(tabId); },
            unregisterTab: function (tabId) { self.registeredTabs.remove(tabId); }
        });

        switch (strategyName){
            case "stack":
                this.registeredTabs = new RegisteredTabsCollection();
                this.strategy = new AudibleTabControlLogicStrategy(this.registeredTabs, this.messaging);
                new ContextMenu(this.registeredTabs, false);
                break;
            case "simple":
                this.registeredTabs = new RegisteredTabsCollection();
                this.strategy = new DefaultTabControlLogicStrategy(this.registeredTabs);
                new ContextMenu(this.registeredTabs, true);
                break;
        }

        this.setupPageAction();
        
        this.attachChromeListeners();
    }

    setupPageAction() {
        let self = this;
        let pageAction = new PageAction(function (tab) {
            if (self.registeredTabs.get(tab.id).isControlled) {
                self.strategy.setUncontrolled(tab.id);
            } else {
                self.strategy.setControlled(tab.id);
            }
        });
        self.registeredTabs.addListener("registered", function (tabId) { pageAction.showPageAction(tabId); }, -1);
        self.registeredTabs.addListener("unregistered", function (tabId) { pageAction.hidePageAction(tabId); }, -1);
        self.registeredTabs.addListener("controlled", function (tabId) { pageAction.setPageActionStateControlled(tabId); }, -1);
        self.registeredTabs.addListener("uncontrolled", function (tabId) { pageAction.setPageActionStateUncontrolled(tabId); }, -1);
    }

    attachChromeListeners() {
        this.addOnCommandListener();
        this.addTabRemovedListener();
    }

    addOnCommandListener() { // user press shortcut
        let self = this;
        chrome.commands.onCommand.addListener(function (command) {
            console.log('Command:', command);
            
            self.strategy.beforeCommandApplied(command);
            self.registeredTabs.eachControlled(function (tabid) {
                self.messaging.sendCommandToTab(command, tabid);
            });
            self.strategy.afterCommandApplied(command);
        });
    }

    addTabRemovedListener() { // tab is closed by user
        let self = this;
        chrome.tabs.onRemoved.addListener(function (tabId) {
            self.registeredTabs.remove(tabId);
        });
    }
}

let controller = new Controller("stack");