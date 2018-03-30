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
    constructor(strategy) {
        super();

        this.events = {"registered": [], "unregistered": [], "controlled": [], "uncontrolled": []};

        if (strategy == "stack") {
            this.strategy = new AudibleTabControlLogicStrategy(this);
            this.contextMenu = new ContextMenu(this, false);
        } else if (strategy == "simple") {
            this.strategy = new DefaultTabControlLogicStrategy(this);
            this.contextMenu = new ContextMenu(this, true);
        }

        let self = this;
        this.pageAction = new PageAction(function (tab) {
            if (self.get(tab.id).isControlled) {
                self.strategy.setUncontrolled(tab.id);
            } else {
                self.strategy.setControlled(tab.id);
            }
        });
        this.addListener("registered", function (tabId) { self.pageAction.showPageAction(tabId); });
        this.addListener("unregistered", function (tabId) { self.pageAction.hidePageAction(tabId); });
        this.addListener("controlled", function (tabId) { self.pageAction.setPageActionStateControlled(tabId); });
        this.addListener("uncontrolled", function (tabId) { self.pageAction.setPageActionStateUncontrolled(tabId); });
    }

    add(tabId) {
        if (super.has(tabId)) {
            return;
        }

        this.strategy.beforeTabRegistered(tabId);

        super.add(tabId);
        this.fireEvent("registered", tabId);

        this.strategy.afterTabRegistered(tabId);
    }

    remove(tabId) {
        if (!super.has(tabId)) {
            return;
        }

        this.strategy.beforeTabUnregistered(tabId);

        super.remove(tabId);
        this.fireEvent("unregistered", tabId);

        this.strategy.afterTabUnregistered(tabId);
    }

    toggleRegistered(tabId) {
        if (this.has(tabId)) {
            this.remove(tabId);
        } else {
            this.add(tabId);
        }
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
            this.strategy.beforeTabControlled(tabId);
            tabProps.isControlled = true;
            this.fireEvent("controlled", tabId);
            this.strategy.afterTabControlled(tabId);
            console.log("Tab " + tabId + " is controlled now");
        } else {
            this.strategy.beforeTabUncontrolled(tabId);
            tabProps.isControlled = false;
            this.fireEvent("uncontrolled", tabId);
            this.strategy.afterTabUncontrolled(tabId);
            console.log("Tab " + tabId + " is UNcontrolled now");
        }
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

    applyCommand(command) {
        this.strategy.beforeCommandApplied(command);
        this.sendCommandToControlledTabs(command);
        this.strategy.afterCommandApplied(command);
    }

    sendCommandToControlledTabs(command) {
        let self = this;
        this.each(function (tabId, tabProps) {
            if (tabProps.isControlled) {
                self.sendCommandToTab(command, tabId);
            }
        });
    }

    sendCommandToTab(command, tabId) {
        chrome.tabs.sendMessage(tabId, {command: command});
        console.log("Command " + command + " was sent to tab " + tabId);
    }

    setControlStrategy(strategy) {
        this.strategy = strategy;
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
                console.log('Received message from tab ' + sender.tab.id + ': ', request);
                self.processMessageFromPage(request.command, sender.tab.id);
            }
        );
    }

    addOnCommandListener() {
        let self = this;
        chrome.commands.onCommand.addListener(function (command) {
            console.log('Command:', command);

            self.registeredTabs.applyCommand(command);
        });
    }

    addTabRemovedListener() {
        let self = this;
        chrome.tabs.onRemoved.addListener(function (tabId) {
            self.registeredTabs.remove(tabId);
        });
    }

    attach() {
        this.addOnMessageListener();
        this.addOnCommandListener();
        this.addTabRemovedListener();
    }
}

class ContextMenu {
    constructor(registeredTabs, full) {
        this.registeredTabs = registeredTabs;

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
                self.registeredTabs.strategy.setUncontrolled(tab.id);
            }
        });
        chrome.contextMenus.create({
            parentId: "keySocketMediaKeys-group",
            id: "keySocketMediaKeys-enableThisTab",
            title: "Enable this tab",
            onclick: function (a, tab) {
                self.registeredTabs.strategy.setControlled(tab.id);
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
    }

    beforeTabRegistered(tabId) {

    }
    
    afterTabRegistered(tabId) {
        if (this.controlledByDefault) {
            this.registeredTabs.setControlled(tabId);
        }
    }

    beforeTabUnregistered(tabId) {

    }

    afterTabUnregistered(tabId) {

    }

    beforeTabControlled(tabId) {

    }

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

    beforeTabUncontrolled(tabId) {

    }

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
    constructor(registeredTabs) {
        super(registeredTabs);
        this.controlledByDefault = false;
        this.onlyOneIsControlled = true;

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
            console.log('Audible check: update playingTabs (remove)', tabId, this.audibleTabsStack);
        }
    }

    _setAudibleTabAsSingleControlledAndAddToStack(tabId) {
        this.audibleTabsStack.push(tabId);
        console.log('Update playingTabs (add)', tabId, this.audibleTabsStack);

        let self = this;
        this.registeredTabs.each(function (itabId, tabProps) {
            // pause all other registered tabs (not just controlled) when any new tab starts playback
            if (itabId != tabId && self.audibleTabsStack.has(itabId)) {
                self.registeredTabs.sendCommandToTab('play-pause', itabId);
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
        this._setControlledTabFromStack();
    }

    afterTabControlled(tabId) {
        super.afterTabControlled(tabId);
        this.controlledTabsStack.pushOnTop(tabId); // move last controlled tab to the top of the stack
    }

    _setControlledTabFromStack() {
        let topmost = this.controlledTabsStack.getTopmost();
        if (topmost !== undefined) {
            this.registeredTabs.setControlled(topmost);
        }
    }

    setUncontrolled(tabId) {
        this.controlledTabsStack.pop(); // remove from stack if disabled manually
        super.setUncontrolled(tabId);
        this._setControlledTabFromStack(); // disabling active page requires to activate control on another page from stack
    }

    beforeCommandApplied(command) {
        super.beforeCommandApplied(command);
        if (this.registeredTabs.getControlledTabs().length < 1) { // whan no tabs are conrtolled we make current active tab controllable ...
            let self = this;
            chrome.tabs.query({active: true, windowType: "normal", currentWindow: true}, function (tabs) {
                if (tabs.length > 0 && self.registeredTabs.has(tabs[0].id)) { // ... if it's registered
                    self.registeredTabs.setControlled(tabs[0].id);
                    self.registeredTabs.sendCommandToTab(command, tabs[0].id);
                }
            });
        }
    }
}

class CustomStack {
    constructor() {
        this.stack = [];
    }

    push(value) {
        this.stack.push(value);
    }

    pushOnTop(value) {
        this.remove(value);
        this.stack.push(value);
    }

    pop() {
        return this.stack.pop();
    }

    getTopmost() {
        return this.stack[this.stack.length - 1];
    }

    remove(value) {
        let index = this.stack.indexOf(value);
        if (index !== -1) {
            this.stack.splice(index, 1);
        }
    }

    has(value) {
        return this.stack.indexOf(value) !== -1;
    }
}

let registeredTabs = new RegisteredTabsCollection("stack");

let messaging = new Messaging(registeredTabs);
messaging.attach();