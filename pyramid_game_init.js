/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

// UI stuff
function addBlockToLoadingBar()
{
	statusBoxLoadingBar.appendChild(document.createElement("div"));
}
function clearLoadingBar()
{
	statusBoxLoadingBar.innerHTML = "";
}

// This function should be called if an externally-caused error occurs anywhere.
// This function hides the entire game, will cause everything to reset and re-initialize.
// It will show the loading bar and status, or an error message describing what's wrong.
function notConnected()
{
	if (initializing) errorDuringInitialization = true;
	connected = false;
	
	if (initializingFailedBecauseWrongNetwork)
	{
		connected = true;
		statusBoxStatus.innerHTML = "Invalid network! Please switch to "+REQUIRED_NETWORK_NAME+"!";
		
		// Keep polling until we are on the correct network
		setTimeout(pollForCorrectNetwork, 1000);
	}
	
	else if (initializingFailedBecauseNotSyncedBlocksBehind != null)
	{
		statusBoxStatus.innerHTML = "Your Ethereum client is not synchronized:<br/>It's about "+initializingFailedBecauseNotSyncedBlocksBehind+" blocks behind.<br/><br/>Please wait until it has synchronized more.";
	}
	
	else if (initializingFailedBecauseNoAccounts)
	{
		connected = true;
		if (web3.currentProvider.isMetaMask === true)
		{
			statusBoxStatus.innerHTML = "No accounts found!<br/>Maybe you haven't logged in to MetaMask yet?";
		}
		
		else if (typeof(mist) !== "undefined")
		{
			statusBoxStatus.innerHTML = "No accounts found! Maybe you haven't given this app permission to view accounts? Mist should have a '<b style='color: rgb(130, 165, 205); background-color: white; padding: 5px; font-size: 10pt;margin: 0px 5px 0px 5px;font-family: Arial;'>CONNECT</b>' button to the top-right of this page.";
		}
		
		// Unknown client
		else
		{
			statusBoxStatus.innerHTML = "No accounts found! Maybe you haven't logged in to your Ethereum client yet, or maybe you haven't given this app permission to view accounts?";
		}
		
		// Keep polling until we can access accounts
		setTimeout(pollForAccessToAccounts, 1000);
	}
	
	// If the user is on a mobile OS, give them the bad news
	else if (isAndroidOriOSorWindowsPhone())
	{
		statusBoxStatus.innerHTML = "Unfortunately this DApp currently does not support mobile devices...<br/><br/>... but you can try it on a PC, Mac or laptop!";
	}
	
	// If the user is using Chrome, recommend MetaMask
	else if (isChrome())
	{
		statusBoxStatus.innerHTML = "Could not connect to the Ethereum network!<br/><br/>If you haven't installed Ethereum yet, we recommend the <a href='#' onclick='chrome.webstore.install(\"https://chrome.google.com/webstore/detail/nkbihfbeogaeaoehlefnkodbefgpgknn\");'>MetaMask Chrome plugin.</a><br/><br/>If you have already installed Ethereum, please make sure it is running, it is synchronized and this app has permission to access it. You may also have to log in.";
	}
	else
	{
		statusBoxStatus.innerHTML = "Could not connect to the Ethereum network!<br/><br/>If you haven't installed Ethereum yet, we recommend using the Google Chrome browser with the MetaMask plugin, or installing <a href='https://parity.io/' target='_blank'>Parity</a><br/><br/>If you have already installed Ethereum, please make sure it is running, it is synchronized and this app has permission to access it. You may also have to log in.";
	}
	
	statusBox.classList.add("statusBoxMiddleOfScreen");
	statusBox.classList.remove("statusBoxTopLeft");
	
	hideAccountBar();
	
	hideChatbox();
	
	chatboxArrow.style.opacity = 0.0;
	accountBarArrow.style.opacity = 0.0;
	
	pyramidField.classList.remove("animateBlockAppear");
	pyramidField.style.display = "none";
	
	statusBoxLoadingBar.style.display = "none";
	
	if (window.browserInjectedPlugin === false)
	{
		window.web3 = undefined;
	}
}


function pollForAccessToAccounts()
{
	if (!connected) return;
	
	console.log("Polling for access to accounts...");
	getAccountsAsync().then(async function(accs){
		if (accs.length != 0)
		{
			console.log("We now have access to accounts! Re-initializing...");
			initializingFailedBecauseNoAccounts = false;
			errorDuringInitialization = false;
			init();
		}
		else
		{
			console.log("No access to accounts!");
			setTimeout(pollForAccessToAccounts, 1000);
		}
	},
	function(err){
		console.log("Not connected because of error in pollForAccessToAccounts() in getAccountsAsync() callback:");
		notConnected();
	});
}


function pollForCorrectNetwork()
{
	if (!connected) return;
	
	console.log("Polling for correct network ID...");
	getNetworkIdAsync().then(async function(id){
		currentNetworkId = id;
		if (currentNetworkId != REQUIRED_NETWORK_ID)
		{
			console.log("Still on invalid network ID: "+currentNetworkId);
			setTimeout(pollForCorrectNetwork, 1000);
		}
		else
		{
			console.log("We are now in the correct network! Re-initializing...");
			initializingFailedBecauseWrongNetwork = false;
			errorDuringInitialization = false;
			init();
		}
	},
	function(err){
		console.log("Not connected because of error in pollForCorrectNetwork() in getNetworkIdAsync() callback:");
		notConnected();
	});
}




async function init()
{
	// Prevent the init() function from running multiple times simultaneously
	if (initializing)
	{
		console.log("init() called, but it's already running! initializing="+initializing);
		return;
	}
	if (!errorDuringInitialization)
	{
		statusBoxLoadingBar.style.display = "inline-block";
		$("statusBoxStatus").innerHTML = "Connecting...";
	}
	
	window.browserInjectedPlugin = null;
	
	initializingFailedBecauseNoAccounts = false;
	initializingFailedBecauseWrongNetwork = false;
	initializingFailedBecauseNotSyncedBlocksBehind = null;
	initializing = true;
	pyramidBottomLayerWei = null;
	errorDuringInitialization = false;
	pyramidTotalBlocks = 0;
	gameInstance = null;
	currentNetworkId = null;
	
	chatboxUsername.innerHTML = "";
	chatMessagesDiv.innerHTML = "";
	
	currentTotalChatMessages = 0;
	
	accounts = [];
	accountBalances = [];
	accountPictures = [];
	accountsBalanceBeingWithdrawn = [];
	accountsLoaded = 0;
	
	pyramidHighestYWithPlacedBlock = null;
	pyramidHighestXWithPlacedBlock = null;
	pyramidLowestXWithPlacedBlock = null;
	
	pyramidHighestYonInit = null;
	
	betsSubmittedAndWaitingFor = [];
	
	try
	{
		// Loop through blocks that are waiting for confirmation because the
		// user submitted them and add their coordinates to betsSubmittedAndWaitingFor
		var confirmingCoords = readCookie("confirmingCoords");
		if (confirmingCoords !== null)
		{
			var confirmingCoordsArr = confirmingCoords.trim().split("__");
			for (var i=0; i<confirmingCoordsArr.length; i++)
			{
				if (confirmingCoordsArr[i] == "") continue;
				var coords = confirmingCoordsArr[i].split("_");
				if (coords.length === 3 && (typeof coords[2]) === "string" && coords[2].length === 42)
				{
					betsSubmittedAndWaitingFor.push([parseInt(coords[0]), parseInt(coords[1]), coords[2]]);
				}
				else
				{
					console.error("Error in confirmingCoords cookie syntax: "+confirmingCoords);
				}
			}
		}
	}
	catch (e)
	{
		console.log("Error in reading confirmingCoords cookie:");
		console.error(e);
	}
	
	selectedAccount = null;
	selectedAccountIndex = 0;
	selectedAccountUsername = null;

	pyramidField.innerHTML = "";
	
	clearLoadingBar();
	
	
	statusBox.classList.remove("statusBoxTopLeft");
	statusBox.classList.add("statusBoxMiddleOfScreen");
	
	pyramidField.classList.remove("animateBlockAppear");
	pyramidField.style.display = "none";
	
	console.log("Intializing DApp...");
	//window.web3 = undefined;
	try
	{
		var currentDomainAndPath = window.location.hostname + window.location.pathname;
		
		console.log("currentDomainAndPath = "+currentDomainAndPath);
		
		// Checking if Web3 has been injected by the browser
		// (Mist, MetaMask or some other plugin or add-on)
		if (typeof web3 !== 'undefined')
		{
			window.browserInjectedPlugin = true;
			
			console.log("currentProvider:");
			console.log(window.web3.currentProvider);
			
			console.log("window.web3.currentProvider.constructor.name="+window.web3.currentProvider.constructor.name);
			
			// If we have something injected, we prefer to use HTTPS.
			if (document.location.protocol == "http:" /* &&
			    web3.currentProvider.isMetaMask === true */ )
			{
				console.log("We have a browser plugin! Redirecting to HTTPS...");
				if (URLS_WITH_HTTP_AND_HTTPS.includes(currentDomainAndPath) ||
				    URLS_WITH_ONLY_HTTPS.includes(currentDomainAndPath))
				{
					top.location = "https://"+currentDomainAndPath;
					return;
				}
				else
				{
					console.log("We can't redirect to HTTPS because this site does not support it!");
				}
			}
			
			// Use Mist/MetaMask's provider
			console.log("The browser has injected web3:");
			console.log(web3.currentProvider);
			window.web3 = new Web3(web3.currentProvider);
		}
		else
		{
			window.browserInjectedPlugin = false;
			
			// If we are on HTTPS, we cannot connect to the local node because the local node is HTTP. Browsers don't allow JS to connect from HTTPS to HTTP. We must reload the page to use HTTP.
			if (document.location.protocol == "https:")
			{
				console.log("Redirecting to HTTP...");
				
				// If the current site also supports HTTP:
				if (URLS_WITH_HTTP_AND_HTTPS.includes(currentDomainAndPath) ||
				    URLS_WITH_ONLY_HTTP.includes(currentDomainAndPath))
				{
					top.location = "http://"+currentDomainAndPath;
					return;
				}
				
				// If the current site does not support HTTP,
				// we need to redirect to a different site that
				// does support HTTP:
				else
				{
					console.log("We have to redirect to a different site, because this site only supports HTTPS");
					
					top.location = "http://"+URLS_WITH_HTTP_AND_HTTPS[0];
					return;
				}
			}
			
			console.log("The browser has not injected web3! Attempting connection to local node...");
			
			// Fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
			window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
		}
	}
	catch (e)
	{
		console.log("Not connected because of failure in initializing web3.js:");
		console.log(e);
		notConnected();
		initializing = false;
		return;
	}
	
	try
	{
		await getNetworkAsync();
		
		addBlockToLoadingBar();
		
		var syncState = null;
		
		try
		{
			console.log("Checking if the user's client is synchronized...");
			
			syncState = await getIsSyncingAsync();
			
			console.log("SYNC STATE:");
			console.log(syncState);
		}
		catch (e)
		{
			console.error("Warning: Error occurred while checking sync state:");
			console.error(e);
		}
		
		if (syncState === false)
		{
			console.log("The client is synced! :-)");
		}
		else if (syncState === null)
		{
			console.log("Could not check sync state!");
		}
		else if (syncState.hasOwnProperty("currentBlock") && syncState.hasOwnProperty("highestBlock"))
		{
			var currentBlock = parseInt(syncState.currentBlock);
			var highestBlock = parseInt(syncState.highestBlock);
			var blocksBehind = highestBlock - currentBlock;
			
			console.log("currentBlock="+currentBlock);
			console.log("highestBlock="+highestBlock);
			console.log("blocksBehind="+blocksBehind);
			
			if (blocksBehind > 100) // If the user is more than 100 blocks (~50 minutes) behind, throw an error
			{
				initializingFailedBecauseNotSyncedBlocksBehind = blocksBehind;
				throw "Your Ethereum client is not synchronized: you are "+blocksBehind+" blocks behind.";
			}
		}
		
		gameABIinstance = window.web3.eth.contract(GAME_ABI);
		gameInstance = gameABIinstance.at(GAME_ADDRESS);
		
		console.log(gameInstance);
		
		currentNetworkId = await getNetworkIdAsync();
		
		console.log("Current network id: "+currentNetworkId);
		
		if (currentNetworkId != REQUIRED_NETWORK_ID)
		{
			initializingFailedBecauseWrongNetwork = true;
			throw "Incorrect network!";
		}
		
		addBlockToLoadingBar();
		
		pyramidBottomLayerWei = await getBetAmountAtLayerAsync(gameInstance, 0);
		
		addBlockToLoadingBar();
		
		if (!errorDuringInitialization)
		{
			statusBoxStatus.innerHTML = "Loading your accounts...";
		}
		
		await reloadAccounts();
		
		if (accounts.length == 0)
		{
			initializingFailedBecauseNoAccounts = true;
			throw "No accounts found!";
		}
		
		addBlockToLoadingBar();
		
		// Initialize these five things simultaneously
		var updateGamePromise = updateGame();
		var updateChatMessagesPromise = updateChatMessages();
		var updateWithdrawableBalancePromise = updateWithdrawableBalance();
		var updateChatboxUsernamePromise = updateChatboxUsername();
		var updateChatMessagesLeftPromise = updateChatMessagesLeft();
		
		await updateGamePromise;
		
		addBlockToLoadingBar();
		
		if (initializing && !errorDuringInitialization)
		{
			$("statusBoxStatus").innerHTML = "Loading chatbox...";
		}
		
		await updateChatMessagesPromise;
		
		addBlockToLoadingBar();
		
		setTimeout(function(){
			document.body.scrollY = document.body.scrollHeight;
			document.body.scrollX = pyramidHighestYonInitXcoord * 150;
		}, 250);
		
		await updateWithdrawableBalancePromise;
		
		addBlockToLoadingBar();
		
		await updateChatboxUsernamePromise;
		await updateChatMessagesLeftPromise;
		
		addBlockToLoadingBar();
		
		console.log("updateBlockReturnedEthCounter = "+updateBlockReturnedEthCounter);
		console.log("getCell_createIfNotExistsCounter = "+getCell_createIfNotExistsCounter);
	}
	catch (e)
	{
		console.log("Not connected because of failure in init():");
		console.log(e);
		notConnected();
		initializing = false;
		return;
	}
	
	// Initiliazation is done!
	initializing = false;
	connected = true;
	
	// Move the status box from the center of the screen to the top left corner
	statusBox.classList.remove("statusBoxMiddleOfScreen");
	statusBox.classList.add("statusBoxTopLeft");
	
	// Set the top left corner status text
	statusBoxStatus.innerHTML = "Connected";
	
	// Hide or show the account bar and chatbox, based on previous browser session state.
	// By default, the account bar will be shown, and the chatbox will also be shown.
	if (!readCookie("showAccountBar") || readCookie("showAccountBar") === "yes") showAccountBar();
	else hideAccountBar();
	if (!readCookie("showChatbox") || readCookie("showChatbox") === "yes") showChatbox();
	else hideChatbox();
	
	// Show the arrows to hide & show the account bar and chatbox
	chatboxArrow.style.opacity = 1.0;
	accountBarArrow.style.opacity = 1.0;
	
	// Display the pyramid grid
	pyramidField.style.display = "table-cell";
	pyramidField.classList.add("animateBlockAppear");
}

document.body.addEventListener("mousemove", function(event)
{
	if (!shouldPollForNewBets)
	{
		shouldPollForNewBets = true;
		console.log("window has focus because of mouse movement");
	}
}, false);
window.addEventListener("focus", function(event)
{
	shouldPollForNewBets = true;
	console.log("window has focus");
}, false);


// Set the name of the hidden property and the change event for visibility
var documentHiddenProperty = null, visibilityChangeEventName = null;
if (typeof document.hidden !== "undefined")
{ // Opera 12.10 and Firefox 18 and later support 
	documentHiddenProperty = "hidden";
	visibilityChangeEventName = "visibilitychange";
}
else if (typeof document.msHidden !== "undefined")
{
	documentHiddenProperty = "msHidden";
	visibilityChangeEventName = "msvisibilitychange";
}
else if (typeof document.webkitHidden !== "undefined")
{
	documentHiddenProperty = "webkitHidden";
	visibilityChangeEventName = "webkitvisibilitychange";
}

// If the visibility API is not supported, use the blur event
if (typeof document[documentHiddenProperty] === "undefined")
{
	window.addEventListener("blur", function(event)
	{
		shouldPollForNewBets = false;
		console.log("window lost focus");
	}, false);
}
else
{
	document.addEventListener(visibilityChangeEventName, function(){
		if (document[documentHiddenProperty])
		{
			console.log("document is hidden");
			shouldPollForNewBets = false;
		}
		else
		{
			console.log("document is unhidden");
			shouldPollForNewBets = true;
		}
	}, false);
}


window.addEventListener("load", function(e){
	console.log("Calling init() because the page loaded...");
	init();
	
	// Create the 2 second polling interval
	setInterval(async function(){
		// Don't try to update things if init() failed because of no accounts
		if (initializingFailedBecauseNoAccounts) return;
		
		// Don't try to update things if init() failed because of wrong network
		if (initializingFailedBecauseWrongNetwork) return;
		
		// If we are not connected, attempt to connect
		if (!connected)
		{
			init();
			return;
		}
		
		// Don't try to update things if init() is running
		if (initializing) return;
		
		if (!shouldPollForNewBets) return;
		
		// Update the game to check for new blocks
		updateGame();
		
		// Check for new chat messages
		updateChatMessages();
		
		// If the user uses MetaMask, and the first account is suddenly
		// different, reload the accounts:
		if (web3.currentProvider.isMetaMask === true)
		{
			var newAccounts = await getAccountsAsync();
			if (newAccounts.length != accounts.length ||
			    (newAccounts.length >= 1 && newAccounts[0] != accounts[0]))
			{
				await reloadAccounts();
			}
		}
		
		if (showingAccountBar)
		{
			updateWithdrawableBalance();
			for (var i=0; i<accounts.length; i++)
			{
				updateAccountBalance(i);
			}
		}
		
		if (showingChatbox)
		{
			if (addressesWaitingForUsername.indexOf(selectedAccount) != -1)
			{
				updateChatboxUsername();
			}
			
			updateChatMessagesLeft();
		}
		
		// When the user switches to a different blockchain, re-initialize the game
		var newNetworkId = await getNetworkIdAsync();
		if (newNetworkId != currentNetworkId)
		{
			console.log("Network changed from "+currentNetworkId+" to "+newNetworkId+"! Re-initializing...");
			errorDuringInitialization = false;
			notConnected();
			init();
		}
	}, 2000);
});

// Make the background scroll at half the speed when the user scrolls the game horizontally
window.addEventListener("scroll", function(e){
	var horizontalScroll = window.scrollX;
	document.body.style.backgroundPosition = parseInt(-horizontalScroll/2) + "px 0px";
});