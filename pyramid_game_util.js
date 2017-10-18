/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

// Encode special HTML characters
function escapeHtml(text)
{
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Utility functions for cookies
function createCookie(name, value, seconds)
{
	var expires = "";
	if (seconds)
	{
		var date = new Date();
		date.setTime(date.getTime() + (seconds*1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name)
{
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i=0; i<ca.length; i++)
	{
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}
function eraseCookie(name)
{
	createCookie(name, "", -1);
}

// Utility functions for UTF8 encoding and decoding
function getUTF8byteCount(str)
{
	return encodeURIComponent(str).replace(/%[A-F\d]{2}/g, 'U').length;
}
function encodeUTF8hex(str)
{
	var ret = "";
	for (var i=0; i<str.length; i++)
	{
		var c = str.charAt(i);
		c = encodeURIComponent(c);
		if (c.length == 1)
		{
			ret += c.charCodeAt(0).toString(16);
		}
		else
		{
			ret += c.replace(/%/g, "");
		}
	}
	return ret;
}
function decodeUTF8hex(hex)
{
	// Remove any null terminators
	while (hex.substring(hex.length - 2) === "00")
	{
		hex = hex.substring(0, hex.length - 2);
	}
	
	// Remove the 0x hex literal prefix, if it's there
	if (hex.substring(0, 2) === "0x")
	{
		hex = hex.substring(2);
	}
	
	return decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-fA-F]{2}/g, '%$&'));
}

// Utility functions for user agent checking
function isChrome()
{
	var isChromium = window.chrome;
	var winNav = window.navigator;
	var vendorName = winNav.vendor;
	var isOpera = winNav.userAgent.indexOf("OPR") > -1;
	var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
	var isIOSChrome = winNav.userAgent.match("CriOS");
	
	if (isIOSChrome)
	{
		return true;
	}
	else if (isChromium !== null &&
	         typeof isChromium !== "undefined" &&
	         vendorName === "Google Inc." &&
	         isOpera === false &&
	         isIEedge === false)
	{
		return true;
	}
	else
	{ 
		return false;
	}
}
function isAndroidOriOSorWindowsPhone()
{
	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
	
	// Windows Phone must come first because its UA also contains "Android"
	if (/windows phone/i.test(userAgent))
	{
		return true;
	}
	if (/android/i.test(userAgent))
	{
		return true;
	}
	if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)
	{
		return true;
	}
    return false;
}

// Function that locally calculates the bet amount at a certain layer of the pyramid
function getBetAmountByY(y)
{
	return pyramidBottomLayerWei.mul((new BigNumber(2)).pow(new BigNumber(y)));
}
