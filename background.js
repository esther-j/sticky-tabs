// Whenever a tab is updated, figure out all of the previous tabs
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (!changeInfo.url) {
		return;
	}
	console.log(getDomain(changeInfo.url));
	stickTab(tab);

});

chrome.tabs.onAttached.addListener(function callback(tabId, attachInfo){
	chrome.windows.getCurrent(function(window) {
		if (attachInfo.newWindowId == window.id) {
			var queryInfo = {currentWindow: true, index: attachInfo.newPosition};
			chrome.tabs.query(queryInfo, function(tabs) {
				stickTab(tabs[0]);
			});
		}
	});
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo) {
	chrome.storage.local.get('selfMove', function(data) {
		if (data.selfMove) {
			console.log("found selfmove");
			chrome.storage.local.remove(['selfMove'], function() {});
		}
		else {
			console.log("did not find selfmove");
			chrome.windows.getCurrent(function(window) {
				if (moveInfo.windowId == window.id) {
					chrome.tabs.query({currentWindow: true, index: moveInfo.toIndex}, function(movedTab) {
						movedTabDomain = getDomain(movedTab[0].url);
						chrome.tabs.query({currentWindow: true}, function(tabs) {
							allDomains = recordTabs(tabs);
							if (allDomains.hasOwnProperty(movedTabDomain)) {
								var relatedTabs = [];
								for (var index of Object.keys(allDomains[movedTabDomain])) {
									relatedTabs.push(allDomains[movedTabDomain][index])
								}
								moveTab(relatedTabs, moveInfo.toIndex);
							}
						});
					});
				}
			});
		}
	});
	console.log("user moved a tab");
});

function stickTab(tab) {
	var domain = getDomain(tab.url);
	chrome.tabs.query({currentWindow: true, active: false}, function(tabs) {
		var index;
		for (t of tabs) {
			if (getDomain(t.url) == domain) {
				index = t.index;
			}
		}
		if (index) {
			if (index < tab.index) {
				index++;
			}
			moveTab(tab.id, index);
		}
	});
}

function moveTab(tabId, toIndex) {
	chrome.storage.local.set({selfMove: true}, function() {
		chrome.tabs.move(tabId, {index: toIndex}, function() {
			if (chrome.runtime.lastError) {
				console.log("found error");
				return moveTab(tabId, toIndex) //try again?
			}
			else {
				saveTabs();
			}
			console.log("moved");
		});
	});
}

function saveTabs() {
	chrome.storage.local.clear(function() {
		chrome.tabs.query({currentWindow: true}, function(tabs) {
			// gets all the domain indexes and writes into an object
			var allDomains = recordTabs(tabs);
			chrome.storage.local.set(allDomains, function() {
				if (chrome.runtime.error) {
					console.log("error");
				}
			});
		});
	});
}

function recordTabs(allTabs) {
	var record = {};
	for (let tab of allTabs) {
		var domain = getDomain(tab.url);
		if (!record.hasOwnProperty(domain)) {
			record[domain] = {};
		}
		record[domain][tab.index] = tab.id;
	}
	return record;
}

function getDomain(tab) {
	var domain = tab.match(/[^(\/\/)]*\/\/[^\/]*/);
	//note: this is a weird case that requires bug catching
	if (domain == null) {
		return tab;
	}
	return domain[0];
}

function invalidDomain() {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'images/icon200.png',
		requireInteraction: true,
		title: 'Error: Unable to read URL',
		message: 'Oops! It looks like we were unable to read that URL. \
					Please submit a bug report - sorry about that.',
		buttons: [{
			title: 'Make a report'
			}
		],
		priority: 2,
	});
}
