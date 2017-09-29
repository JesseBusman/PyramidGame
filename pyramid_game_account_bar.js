/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

async function reloadAccounts()
{
	accounts = [];
	$("divAccountSelector").innerHTML = "";
	selectedAccount = null;
	selectedAccountIndex = null;
	
	// Fetch the accounts from the user's Ethereum client
	accounts = await getAccountsAsync();
	
	console.log("accounts = "+JSON.stringify(accounts));
	
	// If there are no accounts, throw
	// The user will be shown an appropriate error
	if (accounts.length == 0)
	{
		initializingFailedBecauseNoAccounts = true;
		throw "No accounts found!";
	}
	
	// MetaMask sets the defaultAccount automatically,
	// but for Mist we have to do it manually
	if (!web3.eth.defaultAccount)
	{
		console.log("Setting web3.eth.defaultAccount to "+accounts[0]);
		web3.eth.defaultAccount = accounts[0];
	}
	
	// If we have remembered which account the user selected previously,
	// select it again
	if (readCookie("selectedAccountIndex")) selectedAccountIndex = parseInt(readCookie("selectedAccountIndex"));
	
	// Loop over all the accounts
	for (var i=0; i<accounts.length; i++)
	{
		// Generate the familiar account image that people use
		// to identify Ethereum addresses
		accountPictures[i] = blockies({
			seed: accounts[i], // seed used to generate icon data, default: random
			size: 8, // width/height of the icon in blocks, default: 8
			scale: 8, // width/height of each block in pixels, default: 4 
		});
		
		// By default, we assume that there is no withdrawal in flight
		accountsBalanceBeingWithdrawn[i] = false;
		
		// Create the UI elements for the account
		var accountDiv = document.createElement("div");
		{
			accountDiv.appendChild(accountPictures[i]);
			
			var accBalDiv = document.createElement("div");
			{
				var accDiv = document.createElement("div");
				accDiv.innerHTML = accounts[i];
				accBalDiv.appendChild(accDiv);
				
				var balDiv = document.createElement("div");
				balDiv.setAttribute("id", "accountBalance"+i);
				balDiv.innerHTML = "Loading balance...";
				balDiv.setAttribute("class", "ethAmount");
				accBalDiv.appendChild(balDiv);
			}
			accBalDiv.setAttribute("class", "addressAndBalance");
			accountDiv.appendChild(accBalDiv);
			
			accountDiv.addEventListener("click", createAccountClickedListener(i));
			
			if (selectedAccount === null && selectedAccountIndex !== null)
			{
				if (selectedAccountIndex === i)
				{
					selectedAccount = accounts[i];
					accountDiv.style.display = "block";
				}
				else
				{
					accountDiv.style.display = "none";
				}
			}
			else if (selectedAccount !== null && selectedAccountIndex === null)
			{
				if (selectedAccount === accounts[i])
				{
					selectedAccountIndex = i;
					accountDiv.style.display = "block";
				}
				else
				{
					accountDiv.style.display = "none";
				}
			}
			else if (selectedAccount === null && selectedAccountIndex === null)
			{
				selectedAccountIndex = 0;
				selectedAccount = accounts[i];
			}
			else
			{
				if (selectedAccountIndex == i)
				{
					if (selectedAccount != accounts[i]) console.error("Invalid selected account state! #2");
				}
				else
				{
					accountDiv.style.display = "none";
				}
			}
		}
		accountDiv.setAttribute("class", "accountAndAmountBlock");
		$("divAccountSelector").appendChild(accountDiv);
	}
	
	// Advance the loading bar if we are in the init screen
	if (initializing) addBlockToLoadingBar();
	
	// Load all the account balances
	for (var i=0; i<accounts.length; i++)
	{
		updateAccountBalance(i);
	}
	
	// Load more things which are based on the current selected account
	updateWithdrawableBalance();
	updateChatboxUsername();
	updateChatMessagesLeft();
}

btnWithdraw.addEventListener("click", async function(e){
	if (!connected)
	{
		alert("Not connected to the Ethereum network! Please connect and/or refresh this page.");
		return;
	}
	try
	{
		// Store the selected account at the time the button is pressed
		var theSelectedAccount = selectedAccount;
		var theSelectedAccountIndex = selectedAccountIndex;
		
		// Fetch the withdrawable balance
		var bal = await getCurrentWithdrawableBalanceAsync(gameInstance, theSelectedAccount);
		
		// If the withdrawable balance is greater than 0....
		if (bal.comparedTo(new BigNumber(0)) == 1)
		{
			// We now declare to the rest of the system that there is a withdrawal in flight
			// on the account
			accountsBalanceBeingWithdrawn[theSelectedAccountIndex] = true;
			
			// Set the top-right status text
			statusBoxStatus.innerHTML = "Withdrawing...";
			
			console.log("In account "+theSelectedAccount+" at index "+theSelectedAccountIndex+" has "+window.web3.fromWei(bal));
			
			// Initiate the withdrawal request to the user's Ethereum client
			gameInstance.withdrawBalance(
				bal,
				{
					from: theSelectedAccount,
					gas: 30000
				},
				(
					function(accountIndex){
						return function(err){
							// If the user canceled the withdrawal request from their Ethereum client
							if (err != null && err.message.toString().includes("rejected"))
							{
								accountsBalanceBeingWithdrawn[accountIndex] = false;
								statusBoxStatus.innerHTML = "Withdrawal cancelled";
								updateWithdrawableBalance();
								return;
							}
							
							// If there was some other failure
							if (err != null)
							{
								console.log("Not connected because of failure in withdrawBalance():");
								console.log(err);
								notConnected();
								return;
							}
							
							// If the withdrawal transaction has been published to the Ethereum network
							// (but has not necessarily confirmed in the blockchain yet!)
							updateWithdrawableBalance();
							updateAccountBalance(accountIndex);
							statusBoxStatus.innerHTML = "Withdrawal submitted";
							
							// The fact that accountsIsBalanceBeingWithdrawn[accountIndex] is still true
							// will indicate to the block placement code that there may appear to be a balance,
							// but we cannot use the balance of this account because a withdrawal for that balance
							// has been published.
							
							// When the account balance changes, we will assume that the withdrawal has been confirmed
							// in the blockchain and we will reset accountsIsBalanceBeingWithdrawn[accountIndex]
						}
					}
				) (theSelectedAccountIndex)
			);
		}
		
		// If the withdrawable balance is not greater than 0...
		else
		{
			alert("There's nothing to withdraw in the selected account!");
		}
	}
	catch (e)
	{
		console.log("Not connected because of failure in button withdraw click");
		console.log(e);
		notConnected();
	}
});


// UI things, they should speak for themselves:
accountBarArrow.addEventListener("click", function(e){
	if (!connected) return;
	if (showingAccountBar)
	{
		createCookie("showAccountBar", "no", 100);
		hideAccountBar();
	}
	else
	{
		createCookie("showAccountBar", "yes", 100);
		showAccountBar();
	}
});
function hideAccountBar()
{
	accountBar.style.transform = "translate(-100%, 0px)";
	accountBar.style.opacity = 0.0;
	accountBarArrow.style.transform = "rotate(90deg)";
	showingAccountBar = false;
}
function showAccountBar()
{
	accountBar.style.transform = "translate(0%, 0px)";
	accountBar.style.opacity = 1.0;
	accountBarArrow.style.transform = "rotate(-90deg)";
	showingAccountBar = true;
}

var showingFullAccountList = false;
function createAccountClickedListener(index)
{
	// This function will be executed when the account at index has been clicked
	return function(e) {
		
		// If it's the only account, and it's already selected, we don't need to do anything
		if (index == 0 && selectedAccountIndex == 0 && accounts.length == 1) return;
		
		// If the full account list is not shown, we should make all the accounts
		// visible with an animation
		if (showingFullAccountList == false)
		{
			for (var i=0; i<accounts.length; i++)
			{
				var accDiv = $("divAccountSelector").childNodes[i];
				if (i != selectedAccountIndex)
				{
					accDiv.classList.remove("animateRemoveAccount");
					accDiv.classList.add("animateNewAccount");
					accDiv.style.display = "block";
				}
			}
			showingFullAccountList = true;
		}
		
		// If the full account list is already shown, we make the clicked account
		// the selected account, and we hide all the other accounts with an animation
		else
		{
			selectedAccountIndex = index;
			selectedAccount = accounts[index];
			web3.eth.defaultAccount = selectedAccount;
			for (var i=0; i<accounts.length; i++)
			{
				var accDiv = $("divAccountSelector").childNodes[i];
				if (i != selectedAccountIndex)
				{
					accDiv.classList.remove("animateNewAccount");
					accDiv.classList.add("animateRemoveAccount");
				}
				accDiv.style.backgroundColor = "";
			}
			showingFullAccountList = false;
			createCookie("selectedAccountIndex", ""+selectedAccountIndex, 100);
			
			// The selected account has changed, so we should reload
			// the data related to the selected account
			updateWithdrawableBalance();
			updateChatboxUsername();
			updateChatMessagesLeft();
		}
	};
}