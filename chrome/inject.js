// Inject.js injects itself into practically every page,
// then hooks on the target elements.
//
// Liang Wang @ University of Helsinki, Finland
// 2014.06.22
//


// Todo: these constants will be moved to background.js
WIKISIM_URL = "http://probe-1.tb.hiit.fi:8080/query_by_url";
NEWSSIM_URL = "http://probe-1.tb.hiit.fi:8090/query_by_url";
WIKITXT_URL = "http://probe-1.tb.hiit.fi:8080/query_by_text";
NEWSTXT_URL = "http://probe-1.tb.hiit.fi:8090/query_by_text";


// Communicate with extension, set up global variable
var uid = null;
chrome.runtime.sendMessage({req_id: "fbid"}, function(response) {
    uid = response.fbid;
    // Query the simserver
    query_simserver('news');
    query_simserver('wiki');
});


// Define global variables
var wiki_items = [];
var news_items = [];
var text_items = [];


// Load the plugin pad page
var pad_url = chrome.extension.getURL("pad.html");
$('body').append('<div id="icn_ext_pad"></div>');
$('#icn_ext_pad').load(pad_url, function() {
    $('#icn_pad_wiki_btn').click(expand_list);
    $('#icn_pad_news_btn').click(expand_list);
});


// Load the plugin nav page
var nav_url = chrome.extension.getURL("nav.html");
$('body').append('<div id="icn_ext_nav"></div>');
$('#icn_ext_nav').load(nav_url, function() {
    $('#icn_pad_btn').click(function() { show_icn_pad(); });
    $('#icn_share_btn').click(function() { send_facebook_message(); });
    $('#icn_nav_drag').drags();
});


// Setup the ticker tape
setInterval(function () {
    update_ticker_tape();
}, 4000);



// Define general helper functions

function update_ticker_tape() {
    if (wiki_items.length==0 && news_items.length==0)
	return;
    if ($('#icn_ticker_tape').is(":hidden") && $('#icn_pad').is(":hidden"))
	$('#icn_ticker_tape').show(100);

    var items = null;
    if (Math.random() < 0.5) {
	items = wiki_items;
	$('#icn_home_btn').toggleClass('red', true);
	$('#icn_home_btn').toggleClass('teal', false);
    } else {
	items = news_items;
	$('#icn_home_btn').toggleClass('teal', true);
	$('#icn_home_btn').toggleClass('red', false);
    }

    if (items.length != 0) { 
	index = Math.round(Math.random() * items.length - 1);
	hitem = items[index];
	hinfo = "<a href='" + hitem.link + "'>" + hitem.title + "</a>"
	$('#icn_ticker_tape').html(hinfo);
    }
}


// Query the simserver, either news or wiki.
function query_simserver(stype) {

    var simurl = ""
    var color = ""

    if (stype == "wiki") {
	simurl = WIKISIM_URL
	color = "red"
    } else if (stype == "news") {
	simurl = NEWSSIM_URL
	color = "blue"
    }

    $.ajax({
	type: "POST",
	url: simurl,
	data: {
	    "url": window.location.href,
	    "uid": uid
	},
	async: true,
	cache: false,
	success: function(html) {
	    var json = jQuery.parseJSON(html);
	    $.each(json, function(key, val) {
		title = decode_utf8(val.title);
		link = decode_utf8(val.wiki_url);
		similarity = Math.round(val.similarity * 100);
		timestamp = format_timestamp(val.timestamp * 1000);
		// push to different list according to the stype
		eval(stype+'_items').push( {title:title, link:link, similarity:similarity, timestamp:timestamp} );
	    });
	    // Todo: not sure it is a good idea?
	    update_ticker_tape();
	    update_icn_pad('#icn_pad_news', news_items, 5);
	    update_icn_pad('#icn_pad_wiki', wiki_items, 5);
	}
    });

}


// Encode given string to UTF8.
function decode_utf8(old_str) {
    var utf8str;
    try{
	utf8str = decodeURIComponent(escape(old_str));
    }catch(e){
	utf8str = old_str;
    }
    return utf8str;
}


// Shorten long text
function text_ellipsis(ostr) {
    var nstr;
    strlen = 16;
    if (ostr.length > strlen + 3) {
	nstr = ostr.substring(0, strlen) + '...';
    }
    else {
	nstr = ostr;
    }
    return nstr;
}


// Format the timestamp string
function format_timestamp(ts) {
    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var t = 0;
    if (ts != 0) {
	var d = new Date(ts);
	t = month[d.getMonth()] + ' ' + d.getDate();
    }
    return t;
}


// Display or hide the ICN_PAD
function show_icn_pad() {
    if (wiki_items.length==0 && news_items.length==0)
	return;
    $('#icn_pad').toggle(300);
    $('#icn_ticker_tape').toggle();
}


// Click function of the wiki and news buttons on icn_pad
function expand_list() {
    if(this.id=='icn_pad_wiki_btn') {
	update_icn_pad('#icn_pad_news', news_items, 1);
	update_icn_pad('#icn_pad_wiki', wiki_items, 9);
    } else if(this.id=='icn_pad_news_btn') {
	update_icn_pad('#icn_pad_wiki', wiki_items, 1)
	update_icn_pad('#icn_pad_news', news_items, 9);
    }
}


// Update the icn_pad, helper function of the previous click function
function update_icn_pad(stype, items, num) {
    $(stype).html("");
    for (i = 0; i < num; i++) { 
	hitem = items[i];
	hinfo = '<a class="item" href="' + hitem.link + '" target="_blank"><div class="ui gray horizontal label"> ' + hitem.similarity + '</div>' + hitem.title + '</a>';
	if (hitem.timestamp != 0)
	    hinfo = '<a class="item" href="' + hitem.link + '" target="_blank"><div class="ui gray horizontal label"> ' + hitem.timestamp + '</div>' + hitem.title + '</a>';
	$(stype).append(hinfo);
    }
}


// Deal with the text selection. Credits to Mark Kolich.
if(!window.Kolich){
    Kolich = {};
}

Kolich.Selector = {};
Kolich.Selector.getSelected = function(){
    var t = '';
    if(window.getSelection){
	t = window.getSelection();
    }else if(document.getSelection){
	t = document.getSelection();
    }else if(document.selection){
	t = document.selection.createRange().text;
    }
    return t;
}

Kolich.Selector.mouseup = function(){
    var st = Kolich.Selector.getSelected();
    st = String(st);
    // Todo: fixed this click issue
    isHovered = $('#icn_txtpad').is(":hover");
    // filter out the short text
    if(st!='' && st.length > 50 && !isHovered){
	text_items = [];
	$('#icn_txtpad_list').html('');
	query_by_text(st, 'wiki');
	query_by_text(st, 'news');
    } else {
	$('#icn_txtpad').hide(100);
    }
}

$(document).ready(function(){
    $(document).bind("mouseup", Kolich.Selector.mouseup);
});


function query_by_text(qtext, stype) {
    var qtext = new String(qtext);
    var simurl = null;
    var color = null;

    if (stype == "wiki") {
	simurl = WIKITXT_URL;
	color = 'red';
    } else if (stype == "news") {
	simurl = NEWSTXT_URL;
	color = 'teal';
    }

    $.ajax({
	type: "POST",
	url: simurl,
	data: {
	    "text": qtext
	},
	dataType: "text",
	async: true,
	cache: false,
	success: function(html) {
	    var json = jQuery.parseJSON(html);
	    $.each(json, function(key, val) {
		title = decode_utf8(val.title);
		link = decode_utf8(val.wiki_url);
		similarity = Math.round(val.similarity * 100);
		timestamp = format_timestamp(val.timestamp * 1000);

		item = '<a class="item" href="' + link + '" target="_blank"><div class="' + color + ' ui circular label"> ' + similarity + '</div>' + title + '</a>';
		if (timestamp != 0)
		    item = '<a class="item" href="' + link + '" target="_blank"><div class="' + color + ' ui horizontal label"> ' + timestamp + '</div>' + title + '</a>';
		text_items.push(item);
		$('#icn_txtpad_list').append(item);
	    });
	    if ($('#icn_txtpad').is(":hidden") && text_items.length !=0 )
		$('#icn_txtpad').show(100);
	}
    });

}


function update_txtpad(llist) {
    $('#icn_txtpad_list').html('');    
    $.each(llist, function(key, val) {
	$('#icn_txtpad_list').append(val);
    });
}


// Send facebook message
function send_facebook_message() {
    link = window.location.href;
    fburl = 'http://www.facebook.com/dialog/send?app_id=266391803547350&link=' + link + '&redirect_uri=' + link;
    window.open(fburl);
}


// Draggable function
(function($) {
    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
            drg_h = $drag.outerHeight(),
            drg_w = $drag.outerWidth(),
            pos_y = $drag.offset().top + drg_h - e.pageY,
            pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });

    }
})(jQuery);