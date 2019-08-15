chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	console.log(changeInfo.url);
	chrome.tabs.query({currentWindow: true}, function(tabs) {
		tabs.forEach(function(curTab) {
			let domain = curTab.url.match(/[^(\/\/)]*\/\/[^\/]*/);
			var allDomains = [];
			if (domain == null) {
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
			else {
				domain = domain[0];
				allDomains.push(domain);
			}
			console.log("full tab", curTab.url);
			console.log("this tab", domain);
		});
	})
});