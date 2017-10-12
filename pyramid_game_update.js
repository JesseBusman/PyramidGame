/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

var updateGameIsRunning = false;
async function updateGame()
{
	// Prevent updateGame() from running multiple times simultaneously
	if (updateGameIsRunning) return;
	updateGameIsRunning = true;
	
	try
	{
		// Fetch the current total amount of blocks from the user's Ethereum client
		var newTotalBlocks = await getTotalAmountOfBlocksAsync(gameInstance);
		newTotalBlocks = parseInt(newTotalBlocks.toString());
		
		// If there is nothing to update, quit
		if (pyramidTotalBlocks == newTotalBlocks)
		{
			console.log("There are no new blocks.");
		}
		else
		{
			console.log("There are "+(newTotalBlocks-pyramidTotalBlocks)+" new blocks!");
			
			var totalNewBlocksLoaded = 0;
			
			var newBlockCoordinates = [];
			var newBlockAddresses = [];
			
			if (initializing && !errorDuringInitialization)
			{
				$("statusBoxStatus").innerHTML = "Loading block coordinates...";
			}
			
			// Loop over all the new blocks and fetch their coordinates asynchronously
			for (var i=pyramidTotalBlocks; i<newTotalBlocks; i++)
			{
				newBlockCoordinates[i] = getBlockCoordinatesAtIndexAsync(gameInstance, i);
			}
			
			newBlockCoordinates = await Promise.all(newBlockCoordinates);
			
			addBlockToLoadingBar();
			
			if (initializing && !errorDuringInitialization)
			{
				$("statusBoxStatus").innerHTML = "Loading block addresses...";
			}
			
			// Loop over all the new blocks and fetch their addresses asynchronously
			for (var i=pyramidTotalBlocks; i<newTotalBlocks; i++)
			{
				newBlockAddresses[i] = getBlockAddress(gameInstance, newBlockCoordinates[i]);
			}
			
			newBlockAddresses = await Promise.all(newBlockAddresses);
			
			// Loop over all the new blocks and update the game state
			while (pyramidTotalBlocks < newTotalBlocks)
			{
				var coords = newBlockCoordinates[pyramidTotalBlocks];
				
				// Extract the x & y coordinates from the contract response
				coords = parseInt(coords.toString());
				var x = (coords >> 16) & 0xFFFF;
				var y = coords & 0xFFFF;
				
				// Update some variables
				// These values are needed to properly arrange the rows of blocks in the UI
				if (initializing)
				{
					if (pyramidHighestYonInit == null)
					{
						pyramidHighestYonInit = y;
						pyramidHighestYonInitXcoord = x;
					}
					else
					{
						if (y > pyramidHighestYonInit)
						{
							pyramidHighestYonInitXcoord = x;
							pyramidHighestYonInit = y;
						}
					}
				}
				
				if (pyramidHighestYWithPlacedBlock === null) pyramidHighestYWithPlacedBlock = y;
				else pyramidHighestYWithPlacedBlock = Math.max(pyramidHighestYWithPlacedBlock, y);
				
				if (pyramidHighestXWithPlacedBlock === null) pyramidHighestXWithPlacedBlock = x;
				else pyramidHighestXWithPlacedBlock = Math.max(pyramidHighestXWithPlacedBlock, x);
				
				if (pyramidLowestXWithPlacedBlock === null) pyramidLowestXWithPlacedBlock = x;
				else pyramidLowestXWithPlacedBlock = Math.min(pyramidLowestXWithPlacedBlock, x);
				
				// Get the address of the sender of this block
				var address = newBlockAddresses[pyramidTotalBlocks];
				
				// Generate the account picture of the person who placed this bet
				var betAccountPicture = blockies({ // All options are optional
					seed: address.toString(), // seed used to generate icon data, default: random
					size: 8, // width/height of the icon in blocks, default: 8
					scale: 5, // width/height of each block in pixels, default: 4
				});
				
				// If the user clicks on an account picture, open etherscan in a new window
				betAccountPicture.setAttribute("title", address.toString()+"\r\nClick to view on etherscan.io");
				betAccountPicture.addEventListener("click", (function(clickedAddress){return (function(e){
					window.open("https://etherscan.io/address/"+clickedAddress.toString());
				});})(address.toString()));
				
				// Add an animation to the account picture
				betAccountPicture.classList.add("animateBlockAppear");
				
				// Create the cell
				var cellDiv = getCell_createIfNotExists(x, y, false);
				
				// Add the account picture at the start of the cell div
				cellDiv.insertBefore(betAccountPicture, cellDiv.childNodes[0]);
				
				// If the block was hidden, we need to animate its opacity to 1.0
				if (cellDiv.classList.contains("hiddenBlock"))
				{
					cellDiv.classList.remove("hiddenBlock");
					cellDiv.classList.add("animateBlockAppear");
					cellDiv.classList.add("placedBlock");
				}
				
				// If the block was already shown, just set its style
				else if (cellDiv.classList.contains("availableBlock"))
				{
					cellDiv.classList.remove("availableBlock");
					cellDiv.classList.add("animateBlockAppearPartiallyToFully");
					cellDiv.classList.add("placedBlock");
				}
				
				else
				{
					// This should never happen
					throw "Error: Placed block location was neither hidden nor available: "+cellDiv.classList+" id="+cellDiv.id;
				}
				
				// The waiting for confirmation animation should always be removed
				// from a placed block
				cellDiv.classList.remove("waitingForConfirmationAnimation");
				
				for (var i=0; i<betsSubmittedAndWaitingFor.length; i++)
				{
					// If the block was placed by the user, remove it from the waiting list,
					// and update the status message
					if (betsSubmittedAndWaitingFor[i][0] == x &&
					    betsSubmittedAndWaitingFor[i][1] == y)
					{
						betsSubmittedAndWaitingFor.splice(i, 1);
						i--;
						if (betsSubmittedAndWaitingFor.length == 0 && statusBoxStatus.innerHTML.includes("Block submitted"))
						{
							statusBoxStatus.innerHTML = "Block successfully placed";
							updateWithdrawableBalance();
							updateChatMessagesLeft();
							var accountIndex = accounts.indexOf(address);
							if (accountIndex != -1) updateAccountBalance(accountIndex);
						}
					}
				}
				
				// Update the returned ETH of this block
				updateBlockReturnedEth(x, y);
				
				// Update the returned ETH of the blocks below
				updateBlockReturnedEth(x, y-1);
				updateBlockReturnedEth(x+1, y-1);
				
				// Update the available status of the blocks above
				getCell_createIfNotExists(x, y+1, true);
				getCell_createIfNotExists(x-1, y+1, true);
				
				// If this is the bottom layer, update the available status of the blocks besides
				if (y == 0)
				{
					getCell_createIfNotExists(x+1, y, false);
					getCell_createIfNotExists(x-1, y, false);
				}
				
				pyramidTotalBlocks++;
			}
		}
		
		if (initializing && !errorDuringInitialization)
		{
			$("statusBoxStatus").innerHTML = "Loading chatbox...";
		}
		
		await updateChatMessages();
		
		updateGameIsRunning = false;
	}
	catch (e)
	{
		updateGameIsRunning = false;
		console.log("Not connected because of failure in updateGame():");
		console.log(e);
		notConnected();
	}
}

async function updateAccountBalance(accountIndex)
{
	if (!accountIndex && !(accountIndex === 0)) throw "updateAccountBalance needs a parameter!";
	try
	{
		var bal = await getAccountBalanceAsync(accounts[accountIndex]);
		
		// If the account balance changes, and there was a withdrawal in progress,
		// we  now consider the withdrawal to be completed!
		if (accountBalances[accountIndex] != null && bal.comparedTo(accountBalances[accountIndex]) != 0)
		{
			console.log("The account balance of "+accounts[accountIndex]+" changed from "+accountBalances[accountIndex]+" to "+bal);
			await updateWithdrawableBalance();
			
			if (accountsBalanceBeingWithdrawn[accountIndex] === true)
			{
				console.log("There was a withdrawal for that account in progress, we now consider it completed.");
				accountsBalanceBeingWithdrawn[accountIndex] = false;
			}
		}
		
		accountBalances[accountIndex] = bal;
		$("accountBalance"+accountIndex).innerHTML = fromWeiRoundedDown(bal);
		$("accountBalance"+accountIndex).setAttribute("title", ""+web3.fromWei(bal));
	}
	catch (e)
	{
		console.log("Not connected because of failure in updateAccountBalance():");
		console.log(e);
		notConnected();
	}
}


async function updateWithdrawableBalance()
{
	try
	{
		// If there's a withdrawal in progress for the selected account, show a 0 withdrawable balance
		if (accountsBalanceBeingWithdrawn[selectedAccountIndex] === true)
		{
			divWithdrawableBalance.innerHTML = "0";
			divWithdrawableBalance.setAttribute("title", "0");
		}
		else
		{
			var theSelectedAccountIndex = selectedAccountIndex;
			
			var balance = await getCurrentWithdrawableBalanceAsync(gameInstance, selectedAccount);
			
			// If the user selected a different account while we were loading the withdrawable balance,
			// quit and start over
			if (theSelectedAccountIndex != selectedAccountIndex)
			{
				setTimeout(updateWithdrawableBalance, 10);
				return;
			}
			
			divWithdrawableBalance.innerHTML = fromWeiRoundedDown(balance.toString());
			divWithdrawableBalance.setAttribute("title", ""+web3.fromWei(balance));
		}
	}
	catch (e)
	{
		console.log("Not connected because updateWithdrawableBalance() failed:");
		console.log(e);
		notConnected();
	}
}
