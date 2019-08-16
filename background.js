//Whenever a tab is updated, figure out all of the previous tabs
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (!changeInfo.url) {
		return;
	}
	console.log(changeInfo.url);
	saveTabs(tab);

});


function moveTab(tab) {
	chrome.storage.local.get(null, function(data) {
		//when you open a tab, you want to get its tab number
		var domain = getDomain(tab.url);
		var result = data[domain];
		if (result) {
			var prevTabIndex = result[result.length - 1];
			chrome.tabs.move(tab.id, {'index': prevTabIndex + 1}, function() {
				console.log("moved");
			});
		}
		else {
			console.log("did not move");
		}
	});
}

function saveTabs(tab) {
	chrome.storage.local.clear();
	chrome.tabs.query({currentWindow: true, active: false}, function(tabs) {
		// gets all the domain indexes and writes into an object
		var allDomains = {};
		for (let curTab of tabs) {
			var domain = getDomain(curTab.url);
			if (allDomains.hasOwnProperty(domain)) {
				allDomains[domain].push(curTab.index);
			}
			else {
				allDomains[domain] = [curTab.index];
			}
		}
		console.log("all domains", allDomains);
		chrome.storage.local.set(allDomains, function() {
			if (chrome.runtime.error) {
				console.log("a problem happened");
			}
			else {
				moveTab(tab);
			}
		});
	});
}

function getDomain(tab) {
	var domain = tab.match(/[^(\/\/)]*\/\/[^\/]*/);
	//note: this is a weird case that requires bug catching
	if (domain == null) {
		return tab
	}
	return domain[0]
}

function invalidDomain() {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'images/icon200.png',
		requireInteraction: true,
		title: 'Error: Unable to read URL',
		message: 'Oops! It looks like we were unable to read that URL. \
					Please submit a bug report - sorry about that.',
		buttons: [
			{title: 'Make a report'}
		],
		priority: 2,
	});
}
