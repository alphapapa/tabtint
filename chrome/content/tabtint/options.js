function ResetDefaults()
{
    if (DisplayQuestion("tabtint.reset.question"))
    {
        var oPreferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		var oBranch = oPreferences.getBranch("extensions.tabtint.");
		var oDefaultBranch = oPreferences.getDefaultBranch("extensions.tabtint.");

        var oLen = {value:0};
        var aPrefs = oDefaultBranch.getChildList("" , oLen);
        for each(var aPref in aPrefs)
        {
            try {
                switch (oDefaultBranch.getPrefType(aPref))
                {
                    case oDefaultBranch.PREF_STRING:
                        oBranch.setCharPref(aPref, oDefaultBranch.getCharPref(aPref));
                        break;
                    case oDefaultBranch.PREF_INT:
                        oBranch.setIntPref(aPref, oDefaultBranch.getIntPref(aPref));
                        break;
                    case oDefaultBranch.PREF_BOOL:
                        oBranch.setBoolPref(aPref, oDefaultBranch.getBoolPref(aPref));
                        break;
                }
            } catch (e) {/*Pref removed?*/}
        }
    }
}

function DisplayQuestion(sMessageID)
{
    var oPS = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    var iFlags = oPS.BUTTON_TITLE_YES * oPS.BUTTON_POS_0 + oPS.BUTTON_TITLE_NO * oPS.BUTTON_POS_1;
    var iResult = oPS.confirmEx(null, GetString("tabtint.reset.title"), GetString(sMessageID), iFlags, null, null, null, null, {});
    if (iResult == 0) return true;
    return false;
}

function GetString(sName, sVar1, sVar2, sVar3, sVar4, sVar5, sVar6, sVar7)
{
    var sbService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var oStringBundle = sbService.createBundle("chrome://tabtint/locale/tabtint.properties");

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
}
