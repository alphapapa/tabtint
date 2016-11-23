window.addEventListener("load", function(event) {FabTabOverlay.Initialize();}, false);
window.addEventListener("unload", function(event) {FabTabOverlay.DeInitialize();}, false);

var FabTabWebProgressListener =
{
    QueryInterface: function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports)) return this;
        throw Components.results.NS_NOINTERFACE;
    },

    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus)
    {
        if(aFlag & Components.interfaces.nsIWebProgressListener.STATE_STOP && aFlag & Components.interfaces.nsIWebProgressListener.STATE_IS_NETWORK)
        {
            if (document.defaultView.FabTabOverlay)
            {
                var aTabs = getBrowser().mTabs;
                var oTab;
                var iIndex, iLen = aTabs.length;
                for (iIndex = 0; iIndex < iLen; iIndex ++)
                {
                    if (aTabs[iIndex].linkedBrowser && aTabs[iIndex].linkedBrowser.contentDocument.location ==  aWebProgress.DOMWindow.document.location)
                    {
                        oTab = aTabs[iIndex];
                        setTimeout(function() {document.defaultView.FabTabOverlay.UpdateTabs(oTab);}, 100);
                    }
                }
            }
        }
        return 0;
    },

    onLocationChange: function(aProgress, aRequest, aURI) {return 0;},
    onProgressChange: function() {return 0;},
    onStatusChange: function() {return 0;},
    onSecurityChange: function() {return 0;},
    onLinkIconAvailable: function() {return 0;}
}

var FabTabOverlay =
{
    bInitialized:false,

    Initialize: function()
    {
        this.oPreferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        this.oPreferences = this.oPreferences.getBranch("extensions.fabtab.");

        var oContainer = getBrowser().tabContainer;
        if (oContainer) {
            oContainer.setAttribute("fabtabtab", true);
        }

        if (this.bInitialized) return true;

        this.oPrefObserver =
        {
            observe: function(subject, topic, prefName)
            {
                if (topic == "nsPref:changed" && prefName.indexOf("extensions.fabtab.") >= 0)
                {
                    setTimeout(function() {FabTabOverlay.RefreshAll(false);}, 100);
                }
            }
        };

        this.bInitialized = true;

        this.oStrings = document.getElementById("fabtab-string-bundle");

        this.aPixelCache = null;
        this.aPixelCache = [];

        var oPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranchInternal);
        oPrefService.addObserver("extensions.fabtab.fuzzycolormatch", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.x", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.y", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.width", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.height", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.preventwhite", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.preventblack", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.activeonly", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.opacity", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.hue", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.saturation", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.activetabsaturation", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.activetabopacity", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.whitetextthreshold", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.hostnamecache", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.colornavbar", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.activetabbold", this.oPrefObserver, false);
        oPrefService.addObserver("extensions.fabtab.contrastclosebutton", this.oPrefObserver, false);

        var oContainer = getBrowser().tabContainer;
        oContainer.addEventListener("TabOpen", function(event) {event.originalTarget.linkedBrowser.addProgressListener(FabTabWebProgressListener);}, false);
        oContainer.addEventListener("TabClose", function(event) {event.originalTarget.linkedBrowser.removeProgressListener(FabTabWebProgressListener);}, false);
        oContainer.addEventListener("TabSelect", function(event) {FabTabOverlay.UpdateTabs();}, false);

        var aTabs = getBrowser().mTabs;
        var iIndex, iLen = aTabs.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            aTabs[iIndex].linkedBrowser.addProgressListener(FabTabWebProgressListener);
        }

        this.UpdateTabs();
        this.InitializeTabContextMenu();
    },

    InitializeTabContextMenu: function()
    {
        if (!this.oPreferences.getBoolPref("hidecmitems"))
        {
            if (!document.getElementById('fabtab-context-clear'))
            {
                var oMenuPopup = document.getAnonymousElementByAttribute(gBrowser, "anonid", "tabContextMenu")
                if (!oMenuPopup) oMenuPopup = document.getElementById("tabContextMenu")
                var oElement;

                oElement = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', "menuseparator");
                oMenuPopup.appendChild(oElement);

                oElement = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', "menuitem");
                oElement.setAttribute("id", "fabtab-context-clear");
                oElement.setAttribute("label", this.GetString("fabtab.context.clear"));
                oElement.addEventListener("command", function() {FabTabOverlay.RefreshAll(true);});

                oMenuPopup.appendChild(oElement);

                oElement = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', "menuitem");
                oElement.setAttribute("id", "fabtab-context-clearall");
                oElement.setAttribute("label", this.GetString("fabtab.context.clearall"));
                oElement.addEventListener("command", function() {FabTabOverlay.RefreshAll(false);});
                oMenuPopup.appendChild(oElement);
            }
        }
    },

    DeInitialize: function()
    {
        var oContainer = getBrowser().tabContainer;
        oContainer.removeEventListener("TabOpen", function(event) {event.originalTarget.linkedBrowser.addProgressListener(FabTabWebProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);}, false);
        oContainer.removeEventListener("TabClose", function(event) {event.originalTarget.linkedBrowser.removeProgressListener(FabTabWebProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);}, false);

        var oPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranchInternal);
        oPrefService.removeObserver("extensions.fabtab.fuzzycolormatch", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.x", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.y", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.width", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.height", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.preventwhite", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.preventblack", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.activeonly", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.opacity", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.hue", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.saturation", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.activetabsaturation", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.activetabopacity", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.whitetextthreshold", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.hostnamecache", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.colornavbar", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.activetabbold", this.oPrefObserver, false);
        oPrefService.removeObserver("extensions.fabtab.contrastclosebutton", this.oPrefObserver, false);

        this.bInitialized = false;
    },

    RefreshAll: function(bResetCurrentOnly)
    {
        if (bResetCurrentOnly)
        {
            this.aPixelCache[this.GetURL(getBrowser().selectedTab.linkedBrowser.contentDocument.URL)] = "";
        }
        else
        {
            this.aPixelCache = null;
            this.aPixelCache = [];
        }

        this.UpdateTabs();
    },

    UpdateTabs: function(oTab)
    {
        var bActiveOnly = this.oPreferences.getBoolPref("activeonly");
        var oTabs;
        if (oTab && !bActiveOnly) oTabs = new Array(oTab);
        else oTabs = getBrowser().mTabs;

        var oWindow;
        var oCanvas = document.getElementById("fabtab-canvas");
        var oContext = oCanvas.getContext("2d");
        var oImageData;
        var oPixelArray;
        var oTabPreview;
        var oToolbarButtons, oToolbox;
        var aPixels;
        var aRGBValues = new Array();
        var aRGBValue;
        var sDataURL, sPixel, sContrastTextColor, sNewPixel, sLNewPixel, sRGBA, sRGBAG1, sRGBAG2;
        var iPIndex, iPLen, iPixel, iWidth, iHeight;
        var iIndex, iFMCount, iLen = oTabs.length;
        var iFuzzyColorMatch = this.oPreferences.getIntPref("fuzzycolormatch");
        var iPreventWhite = this.oPreferences.getIntPref("preventwhite");
        var iPreventBlack = this.oPreferences.getIntPref("preventblack");
        var iOpacity = this.oPreferences.getIntPref("opacity") / 100;
        var iHueFactor = this.oPreferences.getIntPref("hue") / 100;
        var iSaturationFactor = this.oPreferences.getIntPref("saturation") / 100;
        var iATSaturationFactor = this.oPreferences.getIntPref("activetabsaturation") / 100;
        var iATOpacity = this.oPreferences.getIntPref("activetabopacity") / 100;
        var iNewOpacity = 100;
        var iX = this.oPreferences.getIntPref("x");
        var iY = this.oPreferences.getIntPref("y");
        var iWidth = this.oPreferences.getIntPref("width");
        var iHeight = this.oPreferences.getIntPref("height");
        var iCWidth = (iWidth / 2);
        var iCHeight = (iHeight / 2);
        var iTabsY;
        var iTBIndex, iTBLen, iBIndex, iBLen;
        var bColorNavBar = this.oPreferences.getBoolPref("colornavbar");
        var bActiveTabBold = this.oPreferences.getBoolPref("activetabbold");
        var bContrastCloseButton = this.oPreferences.getBoolPref("contrastclosebutton");
        var oContainer = getBrowser().tabContainer;

        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            aPixels = null;
            aPixels = [];

            aRGBValues = null;
            aRGBValues = new Array();
            if (oTabs[iIndex].localName != "tab") continue;
            oWindow = oTabs[iIndex].linkedBrowser.contentWindow;
            if (oWindow)
            {
                try
                {
                    sPixel = "";
                    try {sPixel = this.aPixelCache[this.GetURL(oTabs[iIndex].linkedBrowser.contentDocument.URL)];}
                    catch (e) {}

                    if (this.GetURL(oTabs[iIndex].linkedBrowser.contentDocument.URL) == "about:blank") sPixel = "rgb(255,255,255)";

                    if (!sPixel || sPixel == "")
                    {
                        if (iWidth > (oWindow.innerWidth - 25)) iWidth = oWindow.innerWidth - 25;
                        if (iHeight > (oWindow.innerHeight - 25)) iHeight = oWindow.innerHeight - 25;
                        iCWidth = parseInt(iWidth / 2);
                        iCHeight = parseInt(iHeight / 2);

                        oCanvas.style.width = iCWidth + "px";
                        oCanvas.style.height = iCHeight + "px";
                        oCanvas.width = iCWidth;
                        oCanvas.height = iCHeight;

                        oContext.clearRect(0, 0, iCWidth, iCHeight);
                        oContext.save();
                        oContext.scale(iCWidth/iWidth, iCHeight/iHeight);
                        this.HideFrames(oWindow, true);
                        oContext.drawWindow(oWindow, iX, iY, iWidth, iHeight, "rgb(0,0,0)");
                        this.HideFrames(oWindow, false);
                        oContext.restore();
                        oImageData = oContext.getImageData(0,0,iCWidth,iCHeight);

                        oPixelArray = oImageData.data;
                        iPLen = oPixelArray.length;
                        for (iPIndex = 0; iPIndex < iPLen - 3; iPIndex += 4)
                        {
                            sPixel = "rgb(" + oPixelArray[iPIndex] + "," + oPixelArray[iPIndex + 1] + "," + oPixelArray[iPIndex + 2] + ")";
                            if (this.AllowColor(oPixelArray[iPIndex], oPixelArray[iPIndex + 1], oPixelArray[iPIndex + 2], iPreventWhite, iPreventBlack))
                            {
                                try
                                {
                                    iPixel = aPixels[sPixel];
                                    if (!iPixel) iPixel = 0;
                                    if (isNaN(iPixel)) iPixel = 0;
                                    aPixels[sPixel] = iPixel + 1;
                                }
                                catch (e)
                                {
                                    aPixels[sPixel] = 1;
                                }
                            }
                        }

                        aPixels = this.SortRGBArray(aPixels);
                        if (this.GetRGBValue(aPixels, 0))
                        {
                            for (iPIndex = 0; iPIndex < 32; iPIndex ++)
                            {
                                try
                                {
                                    sPixel = this.GetRGBValue(aPixels, iPIndex);
                                    if (sPixel)
                                    {
                                        aRGBValue = this.RGBValueToRGBArray(sPixel);
                                        aRGBValues[aRGBValues.length] = new Array(aRGBValue, aPixels[sPixel]);
                                    }
                                }
                                catch (e) {break;}
                            }
                            aPixels = null;
                            aPixels = [];

                            iPLen = aRGBValues.length;
                            for (iPIndex = 0; iPIndex < iPLen; iPIndex ++)
                            {
                                iFMCount = this.GetFuzzyMatchColorCount(aRGBValues, aRGBValues[iPIndex], iFuzzyColorMatch);
                                aPixels[this.RGBArrayToRGBValue(aRGBValues[iPIndex][0])] = (iFMCount * aRGBValues[iPIndex][1]);
                                aRGBValues[iPIndex][2] = iFMCount;
                            }

                            aPixels = this.SortRGBArray(aPixels);

                            sPixel = this.GetRGBValue(aPixels, 0);
                            this.aPixelCache[this.GetURL(oTabs[iIndex].linkedBrowser.contentDocument.URL)] = sPixel;
                        }
                    }

                    if (!bActiveOnly || oTabs[iIndex].linkedPanel == getBrowser().selectedTab.linkedPanel)
                    {
                        sNewPixel = this.MultiplyHueAndSaturation(sPixel, iHueFactor, iSaturationFactor);
                        sContrastTextColor = this.GetContrastTextColor(sNewPixel)
                        iNewOpacity = iOpacity;
                        sLNewPixel = this.LighterColor(sNewPixel, 75);
                        sRGBA = sLNewPixel.replace("rgb(", "rgba(");
                        sRGBA = sRGBA.replace(")", ",0.5)");

                        if (oTabs[iIndex].linkedPanel == getBrowser().selectedTab.linkedPanel)
                        {
                            iNewOpacity = iATOpacity;
                            sNewPixel = this.MultiplyHueAndSaturation(sPixel, iHueFactor, iATSaturationFactor);
                            sContrastTextColor = this.GetContrastTextColor(sNewPixel)

                            if (bColorNavBar) {
                                /*Color all toolbars below the tabs*/
                                iTabsY = document.getElementById("TabsToolbar").boxObject.screenY;
                                oToolbox = document.getElementById("navigator-toolbox");
                                if (oToolbox) {
                                    iTBLen = oToolbox.children.length;
                                    for (iTBIndex = 0; iTBIndex < iTBLen; iTBIndex ++) {
                                        if (oToolbox.children[iTBIndex] && oToolbox.children[iTBIndex].nodeName == "toolbar") {
                                            if (oToolbox.children[iTBIndex].boxObject.screenY > iTabsY) {
                                                oToolbox.children[iTBIndex].style.setProperty("background-color", sNewPixel, "important");
                                                oToolbox.children[iTBIndex].style.setProperty("color", sContrastTextColor, "important");
                                            }
                                        }
                                    }
                                    /*Set toolbarbuttons text colors*/
                                    oToolbarButtons = oToolbox.getElementsByTagName("toolbarbutton");
                                    iBLen = oToolbarButtons.length;
                                    for (iBIndex = 0; iBIndex < iBLen; iBIndex ++) {
                                        if (oToolbarButtons[iBIndex].boxObject.screenY > iTabsY) {
                                            oToolbarButtons[iBIndex].style.setProperty("color", sContrastTextColor, "important");
                                        }
                                    }
                                }
                                oToolbox = document.getElementById("vertical-toolbox");
                                if (oToolbox) {
                                    oToolbox.style.setProperty("background-color", sNewPixel, "important");
                                    oToolbox.style.setProperty("-moz-appearance", "none", "important");
                                    oToolbox.style.setProperty("border-top-width", "0px", "important");
                                    iTBLen = oToolbox.children.length;
                                    for (iTBIndex = 0; iTBIndex < iTBLen; iTBIndex ++) {
                                        if (oToolbox.children[iTBIndex] && oToolbox.children[iTBIndex].nodeName == "toolbar") {
                                            oToolbox.children[iTBIndex].style.setProperty("background-color", sNewPixel, "important");
                                            oToolbox.children[iTBIndex].style.setProperty("color", sContrastTextColor, "important");
                                        }
                                    }
                                    /*Set toolbarbuttons text colors*/
                                    oToolbarButtons = oToolbox.getElementsByTagName("toolbarbutton");
                                    iBLen = oToolbarButtons.length;
                                    for (iBIndex = 0; iBIndex < iBLen; iBIndex ++) {
                                        oToolbarButtons[iBIndex].style.setProperty("color", sContrastTextColor, "important");
                                    }
                                }
                            }

                            if (bColorNavBar || document.getElementById("TabsToolbar").getAttribute("tabsontop") == "false") {
                                /*Border color of the navigator-toolbox and the TabsToolbar*/
                                document.getElementById("navigator-toolbox").style.setProperty("border-bottom-color", sNewPixel, "important");
                                if (document.getElementById("TabsToolbar").getAttribute("tabsontop") != "false") {
                                    document.getElementById("navigator-toolbox").style.setProperty("margin-bottom", "-1px", "important");
                                }
                                document.getElementById("TabsToolbar").style.setProperty("border-bottom-color", sNewPixel, "important");
                            }
                        }

                        /*Color the tab*/
                        oTabs[iIndex].style.setProperty("opacity", iNewOpacity, "");

                        /*Add a bit of gradient*/
                        oTabs[iIndex].style.setProperty("background-image", "-moz-linear-gradient(" + sLNewPixel + ", " + sRGBA + " 50%), -moz-linear-gradient(" + sNewPixel + ", " + sNewPixel + ")", "important");

                        /*Set the tab text color*/
                        oTabs[iIndex].style.setProperty("color", sContrastTextColor, "important");
                        var oTabText = document.getAnonymousElementByAttribute(oTabs[iIndex], "class", "tab-text");
                        if (oTabText) oTabText.style.setProperty("color", sContrastTextColor, "important");

                        /*Change the close X color*/
                        if (bContrastCloseButton) {
                            this.SetDarkOrLightTab(oTabs[iIndex], sNewPixel);
                        } else {
                            oTabs[iIndex].removeAttribute("lightclose");
                        }

                        /*Optional bold active tab text*/
                        oTabs[iIndex].setAttribute("activetabisbold", bActiveTabBold);
                    }
                    else
                    {
                        /*Remove the tab styles again*/
                        oTabs[iIndex].style.backgroundColor = "";
                        oTabs[iIndex].style.color = "";
                        oTabs[iIndex].style.opacity = "";
                        oTabs[iIndex].style.backgroundImage = "";
                        oTabs[iIndex].removeAttribute("lightclose");
                        oTabs[iIndex].removeAttribute("activetabisbold");

                        /*Force remove the color on the text node*/
                        var oTabText = document.getAnonymousElementByAttribute(oTabs[iIndex], "class", "tab-text");
                        if (oTabText) oTabText.style.color = "";
                    }
                }
                catch (e) {this.WriteDebugMessage(e);}
            }
        }
    },

    HideFrames: function(oWindow, bHide)
    {
        var aFrames = oWindow.document.getElementsByTagName("IFRAME");
        var iIndex, iLen = aFrames.length;

        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            try
            {
                if (bHide)
                {
                    if (aFrames[iIndex].contentDocument.location.host != oWindow.document.location.host)
                    {
                        aFrames[iIndex].setAttribute("fabtabdisplay", aFrames[iIndex].style.display);
                        aFrames[iIndex].style.display = "none";
                    }
                }
                else
                {
                    if (aFrames[iIndex].contentDocument.location.host != oWindow.document.location.host)
                    {
                        aFrames[iIndex].style.display = aFrames[iIndex].getAttribute("fabtabdisplay");
                        aFrames[iIndex].removeAttribute("fabtabdisplay");
                    }
                }
            } catch (e) {}
        }
    },

    HandleTabSelect: function(oTab)
    {
        if (oTab) this.UpdateTabs();
    },

    FindInPixelArray: function(aArray, sFind)
    {
        var iIndex, iLen = aArray.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++) if (aArray[iIndex][0] == sFind) return iIndex;
        return -1;
    },

    GetFuzzyMatchColorCount: function(aRGBValues, aRGBValue, iFuzzyColorMatch)
    {
        var iROrg = aRGBValue[0][0];
        var iGOrg = aRGBValue[0][1];
        var iBOrg = aRGBValue[0][2];
        var iIndex, iLen;
        var iRDiff;
        var iGDiff;
        var iBDiff;
        var iDiff;
        var iCount = 0;

        iLen = aRGBValues.length;

        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            iRDiff = Math.pow((iROrg - aRGBValues[iIndex][0][0]), 2);
            iGDiff = Math.pow((iGOrg - aRGBValues[iIndex][0][1]), 2);
            iBDiff = Math.pow((iBOrg - aRGBValues[iIndex][0][2]), 2);


            iDiff = Math.sqrt(iRDiff + iGDiff + iBDiff);
            if (iDiff <= iFuzzyColorMatch)
            {
                iCount ++;
            }
        }
        return iCount;
    },

    RGBValueToRGBArray: function(sRGB)
    {
        sRGB = sRGB.replace("rgb(", "").replace(")", "");
        var aRGB = sRGB.split(",");
        var iIndex, iLen = aRGB.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++) aRGB[iIndex] = parseInt(aRGB[iIndex]);

        return aRGB;
    },

    RGBArrayToRGBValue: function(aRGB)
    {
        return "rgb(" + aRGB[0] + "," + aRGB[1] + "," + aRGB[2] + ")";
    },

    SortRGBArray: function(aInput)
    {
        var aOutput = [];
        var aTemp = [];
        var sKey;
        var iIndex;

        for (sKey in aInput) aTemp.push([sKey, aInput[sKey]]);
        aTemp.sort(function () {return arguments[0][1] > arguments[1][1]});

        for (iIndex = aTemp.length - 1; iIndex >= 0; iIndex --) aOutput[aTemp[iIndex][0]] = aTemp[iIndex][1];

        return aOutput;
    },

    GetRGBValue: function(aRGBArray, iPosition)
    {
        var sRGBValue;
        var iIndex = 0;
        for (sRGBValue in aRGBArray)
        {
            if (iIndex == iPosition) return sRGBValue;
            iIndex ++;
        }
        return "";
    },

    AllowColor: function(iR, iG, iB, iPreventWhite, iPreventBlack)
    {
        if (iR > (255 - iPreventWhite) && iG > (255 - iPreventWhite) && iB > (255 - iPreventWhite)) return false;
        if (iR < iPreventBlack && iG < iPreventBlack && iB < iPreventBlack) return false;
        return true;
    },

    /*Code by Pimm Hogeling, code licensed under MPL 1.1*/
    MultiplyHueAndSaturation: function(rgbString,hfactor,sfactor)
    {
        if(sfactor == 1 && hfactor == 1) return rgbString;
        if(rgbString == "rgb(255,255,255)") return rgbString;

        // Retrieve the color channels from the input.
        var colorParts = /^rgb\(([0-9]+),([0-9]+),([0-9]+)\)$/.exec(rgbString);
        var red = parseInt(colorParts[1]) / 255;
        var green = parseInt(colorParts[2]) / 255;
        var blue = parseInt(colorParts[3]) / 255;

        // If the three color channels are equal to each other, the color is some shade of grey. The saturation of grey is 0, so in
        // this case the output will be equal to the input, too. Return the result immediately.
        if(red == green && green == blue) return rgbString;

        // Convert the RGB color to hue, saturation and lightness.
        var max = Math.max(red,Math.max(green,blue));
        var min = Math.min(red,Math.min(green,blue));
        var hue = (max == min?0:(max == red?((1 / 6) * (green - blue)) / (max - min) + 1:(max == green?((1 / 6) * (blue - red)) / (max - min) + (1 / 3):((1 / 6) * (red - green)) / (max - min) + (2 / 3))));
        var lightness = (1 / 2) * (max + min);
        var saturation = (lightness <= 1 / 2?(max - min) / (2 * lightness):(max - min) / (2 - 2 * lightness));
        // Apply the passed saturation factor.
        saturation *= sfactor;
        // Apply the passed hue factor.
        hue *= hfactor;
        // Convert the hue, (modified) saturation and lightness back to an RGB color.
        var q = (lightness < 1 / 2?lightness * (1 + saturation):(lightness + saturation) - (lightness * saturation));
        var p = 2 * lightness - q;
        red = hue + 1 / 3;
        green = hue;
        blue = hue - 1 / 3;
        if(red < 0) {
            red++;
        }
        else if(red > 1) {
            red--;
        }
        if(green < 0) {
            green++;
        }
        else if(green > 1) {
            green--;
        }
        if(blue < 0) {
            blue++;
        }
        else if(blue > 1) {
            blue--;
        }
        red = (red < 1 / 6?p + (((q - p) * 6) * red):(red < 1 / 2?q:(red < 2 / 3?p + (((q - p) * 6) * (2 / 3 - red)):p)));
        green = (green < 1 / 6?p + (((q - p) * 6) * green):(green < 1 / 2?q:(green < 2 / 3?p + (((q - p) * 6) * (2 / 3 - green)):p)));
        blue = (blue < 1 / 6?p + (((q - p) * 6) * blue):(blue < 1 / 2?q:(blue < 2 / 3?p + (((q - p) * 6) * (2 / 3 - blue)):p)));

        // Return the resulting RGB color in the expected format.
        return ((((("rgb(" + Math.round(red * 255)) + ",") + Math.round(green * 255)) + ",") + Math.round(blue * 255)) + ")";
    },

    LighterColor: function(rgbString, factor)
    {
        if(rgbString == "rgb(255,255,255)") return rgbString;

        var colorParts = /^rgb\(([0-9]+),([0-9]+),([0-9]+)\)$/.exec(rgbString);
        var red = Math.min(255, parseInt(colorParts[1]) + factor);
        var green = Math.min(255, parseInt(colorParts[2]) + factor);
        var blue = Math.min(255, parseInt(colorParts[3]) + factor);

        return "rgb(" + red + "," + green + "," + blue + ")";
    },

    GetContrastTextColor: function(sRGB)
    {
        sRGB = sRGB.replace('rgb(', '');
        sRGB = sRGB.replace(')', '');
        var aRGB = sRGB.split(',');
        var iR = parseInt(aRGB[0]);
        var iG = parseInt(aRGB[1]);
        var iB = parseInt(aRGB[2]);

        var iBackY = ((iR * 299) + (iG * 587) + (iB * 114)) / 1000;
        var iTextY = ((0 * 299) + (0 * 587) + (0 * 114)) / 1000;

        var iBDiff = Math.abs(iBackY - iTextY);
        var iCDiff = iR + iG + iB;

        var iThreshold = this.oPreferences.getIntPref("whitetextthreshold");
        if (iBDiff < iThreshold && iCDiff <= (iThreshold * 2)) return "rgb(255,255,255)"
        return "rgb(0,0,0)"
    },

    SetDarkOrLightTab: function(oTab, sRGB) {
        sRGB = sRGB.replace('rgb(', '');
        sRGB = sRGB.replace(')', '');
        var aRGB = sRGB.split(',');
        var iR = parseInt(aRGB[0]);
        var iG = parseInt(aRGB[1]);
        var iB = parseInt(aRGB[2]);

        var iBackY = ((iR * 299) + (iG * 587) + (iB * 114)) / 1000;
        var iTextY = ((0 * 299) + (0 * 587) + (0 * 114)) / 1000;

        var iBDiff = Math.abs(iBackY - iTextY);
        var iCDiff = iR + iG + iB;

        var iThreshold = this.oPreferences.getIntPref("whitetextthreshold");
        if (iBDiff < iThreshold && iCDiff <= (iThreshold * 2)) {
            oTab.setAttribute("lightclose", true);
        } else {
            oTab.setAttribute("lightclose", false);
        }
    },

    GetURL: function(sURL)
    {
        if (!this.oPreferences.getBoolPref("hostnamecache")) return sURL;

        var sHost = sURL;
        try
        {
            var oIOS = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            var oURI = oIOS.newURI(sURL,null,null);
            sHost = oURI.host;
        }
        catch (e) {}

        return sHost;
    },

    GetString: function(sName, sVar1, sVar2, sVar3, sVar4, sVar5, sVar6, sVar7)
    {
        var sbService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
        var oStringBundle = sbService.createBundle("chrome://fabtab/locale/fabtab.properties");

        var sResult = "";

        if(oStringBundle)
        {
            sResult  = oStringBundle.GetStringFromName(sName);
            if (sVar1 || (typeof(sVar1) == "number" && sVar1 == 0)) sResult = sResult.replace(/%1/g, sVar1);
            if (sVar2 || (typeof(sVar2) == "number" && sVar2 == 0)) sResult = sResult.replace(/%2/g, sVar2);
            if (sVar3 || (typeof(sVar3) == "number" && sVar3 == 0)) sResult = sResult.replace(/%3/g, sVar3);
            if (sVar4 || (typeof(sVar4) == "number" && sVar4 == 0)) sResult = sResult.replace(/%4/g, sVar4);
            if (sVar5 || (typeof(sVar5) == "number" && sVar5 == 0)) sResult = sResult.replace(/%5/g, sVar5);
            if (sVar6 || (typeof(sVar6) == "number" && sVar6 == 0)) sResult = sResult.replace(/%6/g, sVar6);
            if (sVar7 || (typeof(sVar7) == "number" && sVar7 == 0)) sResult = sResult.replace(/%7/g, sVar7);
        }
        return sResult;
    },

    WriteDebugMessage: function(aMsg)
    {
        var oConsole = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces["nsIConsoleService"]);
        oConsole.logStringMessage(aMsg);
    }
};


//installing first time
var EUObjFabTab = {
	SetExistingUser : function() {
		var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		
		try{	
			prefManager.getBoolPref("extensions.fabtab.use");
		}
		catch(ex) {
			prefManager.setBoolPref("extensions.fabtab.use", true);
		}
	}
}
setTimeout(function() { EUObjFabTab.SetExistingUser() }, 2000);