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

// Tabs registration & activation

// All tabs that is supported by extension (have plugins)
var registeredTabs = [];
// Currently active tab
var activeTab;

// By default no tabs are active and a tab must be activated to receive key commands

var registerTab = function (tabId) {
    if (registeredTabs.indexOf(tabId) === -1) {
        registeredTabs.push(tabId);

        chrome.pageAction.show(tabId);

        deactivateTab(tabId);
    }
};

var unregisterTab = function (tabId) {
    deactivateTab(tabId);

    var index = registeredTabs.indexOf(tabId);
    if (index > -1) {
        registeredTabs.splice(index, 1);

        chrome.pageAction.hide(tabId);
    }
};

var activateTab = function (tabId) {
    for (var i = 0; i < registeredTabs.length; i++) {
        deactivateTab(registeredTabs[i]);
    }

    activeTab = tabId;

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

    updateContextMenu(tabId);
};

var deactivateTab = function (tabId) {
    if (activeTab === tabId) {
        activeTab = undefined;
    }

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

    updateContextMenu(tabId);
};

// Commands and messages

chrome.commands.onCommand.addListener(function (command) {
    console.log('Command:', command);
    chrome.tabs.sendMessage(activeTab, {command: command});
});

chrome.runtime.onMessage.addListener(
    function (request, sender) {
        console.log('Received tab message: ', request);

        if (request.command === 'registerTab' && sender.tab) {
            registerTab(sender.tab.id);
        } else if (request.command === 'unregisterTab' && sender.tab) {
            unregisterTab(sender.tab.id);
        }
    }
);

chrome.tabs.onRemoved.addListener(unregisterTab);

chrome.tabs.onActivated.addListener(function (evt) {
    updateContextMenu(evt.tabId);
});

// Page action click handler

chrome.pageAction.onClicked.addListener(function (tab) {
    if (activeTab === tab.id) {
        deactivateTab(tab.id);
    } else {
        activateTab(tab.id);
    }
});

// Context menu manipulation

var updateContextMenu = function(tabId) {
    chrome.tabs.query({active: true}, function(tabs) {
        var tab = tabs[0];
        if (tab.id === tabId) {
            var tabIsActive = (activeTab === tabId);
            chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: tabIsActive});
            chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: !tabIsActive});
        }
    });
};

chrome.contextMenus.create({id: "keySocketMediaKeys-group", title: "Key Socket Media Keys"});


chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-enableThisTab",
    title: "Enable this tab",
    onclick: function (a, tab) {
        activateTab(tab.id);
    }
});
chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-disableThisTab",
    title: "Disable this tab",
    onclick: function (a, tab) {
        deactivateTab(tab.id);
    }
});