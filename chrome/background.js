// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Set up global varible
var fbid = null;  // Facebook user id
chrome.cookies.get({ url:'http://probe-1.tb.hiit.fi', name:'fbid'}, function (cookie) { fbid = cookie.value });


// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log('Activate prefecting!');
    chrome.tabs.executeScript(null, { file: "jquery-2.1.0.min.js" }, function() {
	//Todo
    });
});


// Hook on tab creation event.
chrome.tabs.onCreated.addListener(function(tab) {
    if (fbid == null) {
	chrome.cookies.get({ url:'http://probe-1.tb.hiit.fi', name:'fbid'}, function (cookie) { fbid = cookie.value });
    }
});


// Listen messages from the content script
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
	if (request.req_id == "fbid")
	    sendResponse({fbid: fbid});
    });