/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

console.log("Detecting async support...");

// If the browser does not support async, tell the user the bad news
try
{
	(new Function("async () => {}"))();
	console.log("We have async support!");
}
catch (e)
{
	statusBoxStatus.innerHTML = "Your browser does not support JavaScript async. To use this app, you must use a browser that does.<br/>For example:<br/><ul><li>Google Chrome</li><li>Mozilla Firefox</li><li>Microsoft Edge</li></ul>";
	statusBoxStatus.style.color = "white";
	statusBoxLoadingBar.style.display = "none";
	throw "We don't have async support!";
}
