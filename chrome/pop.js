// Improve UI on pop.htm
//
// Liang Wang @ University of Helsinki, Finland
// 2014.07.09
//

// Communicate with extension, set up global variable
var uid = null;
chrome.runtime.sendMessage({req_id: "fbid"}, function(response) {
    uid = response.fbid;
    if (uid != null && $('#icn_pop_login').is(':visible') ) {
	$('#icn_pop_login').hide();
	$('#icn_pop_useri').show();

	// set user information
	img_src = 'http://graph.facebook.com/' + uid + '/picture'
	$('#icn_pop_userp').attr('src', img_src);
    }
});
