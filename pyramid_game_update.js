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
		
		console.log("newTotalBlocks:");
		console.log(newTotalBlocks);
		
		newTotalBlocks = parseInt(newTotalBlocks.toString());
		
		// If there is nothing to update, quit
		if (pyramidTotalBlocks == newTotalBlocks)
		{
		}
		
		// If there are suddenly 0 blocks, even though we previously had > 0,
		// it probably means that Mist screwed up by returning invalid data.
		// Show the user an appropriate error message
		else if (pyramidTotalBlocks > 0 && newTotalBlocks == 0)
		{
			statusBoxStatus.innerHTML = "Lost connection... Re-establishing...";
			//initializationFailedBecauseOfIllegalContractOutput = true;
			//connected = false;
			//updateGameIsRunning = false;
			//notConnected();
			console.error("newTotalBlocks was 0!!!!!!!!!!!!11");
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
				// If we can load it from cache.js, do it:
				if (i < CACHED_BLOCK_COORDINATES.length)
				{
					newBlockCoordinates[i] = CACHED_BLOCK_COORDINATES[i];
				}
				
				// otherwise, load it from the blockchain through web3.js
				else
				{
					newBlockCoordinates[i] = getBlockCoordinatesAtIndexAsync(gameInstance, i);
				}
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
				// If we can load it from cache.js, do it:
				if (i < CACHED_BLOCK_ADDRESSES.length)
				{
					newBlockAddresses[i] = CACHED_BLOCK_ADDRESSES[i];
				}
				
				// otherwise, load it from the blockchain through web3.js
				else
				{
					newBlockAddresses[i] = getBlockAddress(gameInstance, newBlockCoordinates[i]);
				}
			}
			
			newBlockAddresses = await Promise.all(newBlockAddresses);
			
			addBlockToLoadingBar();
			
			if (initializing && !errorDuringInitialization)
			{
				$("statusBoxStatus").innerHTML = "Loading usernames...";
			}
			
			// Load any new usernames we need:
			var usernames = [];
			var loadingUsernameAddresses = [];
			for (var i=pyramidTotalBlocks; i<newTotalBlocks; i++)
			{
				// If we already have this address' username, skip it
				if (addressesToUsernames.hasOwnProperty(newBlockAddresses[i])) continue;
				
				// If we already going to load this address' username, skip it
				if (loadingUsernameAddresses.includes(newBlockAddresses[i])) continue;
				
				// If we can load it from cache.js, do it:
				if (CACHED_ADDRESSES_TO_USERNAMES.hasOwnProperty(newBlockAddresses[i]))
				{
					usernames[i] = encodeUTF8hex(CACHED_ADDRESSES_TO_USERNAMES[newBlockAddresses[i]]);
				}
				
				// ...otherwise, load it from the blockchain through web3.js
				else
				{
					usernames[i] = getUsernameByAddressAsync(gameInstance, newBlockAddresses[i]);
				}
				
				loadingUsernameAddresses.push(newBlockAddresses[i]);
			}
			usernames = await Promise.all(usernames);
			
			for (var i=pyramidTotalBlocks; i<newTotalBlocks; i++)
			{
				if (usernames[i])
				{
					var u = decodeUTF8hex(usernames[i]);
					if (u.length == 0) continue;
					addressesToUsernames[newBlockAddresses[i]] = u;
					console.log("Loaded username "+u+" for address "+newBlockAddresses[i]);
				}
			}
			
			totalBlocksSpan.innerHTML = "" + newTotalBlocks;
			
			// Loop over all the new blocks and update the game state
			while (pyramidTotalBlocks < newTotalBlocks)
			{
				var coords = newBlockCoordinates[pyramidTotalBlocks];
				
				// Extract the x & y coordinates from the contract response
				coords = parseInt(coords.toString());
				
				if (coords === 0 || coords === null)
				{
					statusBoxStatus.innerHTML = "Lost connection... Re-establishing...";
					break;
					//initializationFailedBecauseOfIllegalContractOutput = true;
					//throw "Error: We received all-zero coordinates from block index "+pyramidTotalBlocks+"!";
				}
				
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
				
				// Update the pyramidGrid global variable
				if (y >= pyramidGrid.length) pyramidGrid.push([]); // Add a new row if necessary
				pyramidGrid[y][x] = address;
				
				// Create the cell
				var cellDiv = getCell_createIfNotExists(x, y, false);
				
				// Generate the account picture of the person who placed this bet
				var betAccountPicture = blockies({ // All options are optional
					seed: address.toString(), // seed used to generate icon data, default: random
					size: 8, // width/height of the icon in blocks, default: 8
					scale: 5, // width/height of each block in pixels, default: 4
				});
				
				// If the user clicks on an account picture, open etherscan in a new window
				betAccountPicture.setAttribute("title", (addressesToUsernames.hasOwnProperty(address) ? (addressesToUsernames[address]+"\r\n") : "")+address.toString()+"\r\nClick to view on etherscan.io");
				betAccountPicture.addEventListener("click", (function(clickedAddress){return (function(e){
					window.open("https://etherscan.io/address/"+clickedAddress.toString());
				});})(address.toString()));
				
				// Add an animation to the account picture
				betAccountPicture.classList.add("animateBlockAppear");
				
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
						console.log("A block was successfully placed! Removing it from the confirmingCoords cookie and from the betsSubmittedAndWaitingFor array...");
						
						// Update the confirmingCoords cookie to remove these coordinates
						var oldCookieArr = readCookie("confirmingCoords").split("__");
						var newCookieString = "";
						for (var j=0; j<oldCookieArr.length; j++)
						{
							if (oldCookieArr[j] == "") continue;
							if (!oldCookieArr[j].startsWith(""+x+"_"+y)) newCookieString += oldCookieArr[j] + "__";
						}
						createCookie("confirmingCoords", newCookieString, 5 * 60);
						
						betsSubmittedAndWaitingFor.splice(i, 1);
						
						if (betsSubmittedAndWaitingFor.length == 0 && statusBoxStatus.innerHTML.includes("Block submitted"))
						{
							statusBoxStatus.innerHTML = "Block successfully placed";
							updateWithdrawableBalance();
							updateChatMessagesLeft();
							var accountIndex = accounts.indexOf(address);
							if (accountIndex != -1) updateAccountBalance(accountIndex);
						}
						
						i--;
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
		
		if (initializing && window.scroll)
		{
			setTimeout(function(){
				var rememberedXscrollPos = readCookie("xPos");
				if (rememberedXscrollPos === null)
				{
					console.log("Scrolling the user to a random horizontal position.");
					rememberedXscrollPos = parseInt(Math.random() * document.body.scrollWidth);
				}
				
				window.scroll({
					top: document.body.scrollHeight + 1000,
					left: rememberedXscrollPos,
					behavior: 'smooth'
				});
			}, 550);
		}
		
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
			
			// If the account balance increased, and there was a withdrawal for that account in progress, we now consider it completed by the amount the account balance increased.
			if (bal.comparedTo(accountBalances[accountIndex]) == 1)
			{
				if (accountsBalanceBeingWithdrawn[accountIndex].comparedTo(new BigNumber(0)) != 0)
				{
					console.log("There was a withdrawal in flight on "+accounts[accountIndex]+"! We now consider it completed.");
				}
				accountsBalanceBeingWithdrawn[accountIndex] = accountsBalanceBeingWithdrawn[accountIndex].sub(bal.sub(accountBalances[accountIndex]));
				if (accountsBalanceBeingWithdrawn[accountIndex].comparedTo(new BigNumber(0)) == -1)
				{
					accountsBalanceBeingWithdrawn[accountIndex] = new BigNumber(0);
				}
			}
		}
		accountBalances[accountIndex] = bal;
		
		var withdrawableBalance = await getCurrentWithdrawableBalanceAsync(gameInstance, accounts[accountIndex]);
		
		// If there are block placements in flight for the currently selected account,
		// reduce the available withdrawableBalance by the amount that will be spent:
		for (var i=0; i<betsSubmittedAndWaitingFor.length; i++)
		{
			var yBeingSubmitted = betsSubmittedAndWaitingFor[i][1];
			var accountBeingSubmitted = betsSubmittedAndWaitingFor[i][2];
			console.log("updateAccountBalance: "+accountBeingSubmitted+" is submitting at y="+yBeingSubmitted);
			if (accountBeingSubmitted === accounts[accountIndex])
			{
				withdrawableBalance = withdrawableBalance.sub(getBetAmountByY(yBeingSubmitted));
			}
		}
		
		// If more than the withdrawable balance has been used up,
		// subtract the rest from the displayed account balance:
		if (withdrawableBalance.comparedTo(new BigNumber(0)) == -1)
		{
			bal = bal.add(withdrawableBalance);
		}
		
		// If we end up with a negative balance, show "Loading..."
		if (bal.comparedTo(new BigNumber(0)) == -1)
		{
			$("accountBalance"+accountIndex).innerHTML = "Loading...";
			accountBalances[accountIndex] = new BigNumber(0);
		}
		else
		{
			$("accountBalance"+accountIndex).innerHTML = fromWeiRoundedDown(bal);
			$("accountBalance"+accountIndex).setAttribute("title", ""+web3.fromWei(bal));
		}
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
		var theSelectedAccountIndex = selectedAccountIndex;
		
		var balance = await getCurrentWithdrawableBalanceAsync(gameInstance, selectedAccount);
		
		// If there's a withdrawal in progress for the selected account, reduce the withdrawable balance by that amount:
		balance = balance.sub(accountsBalanceBeingWithdrawn[selectedAccountIndex]);
		
		// If there are block placements in flight for the currently selected account,
		// reduce the available balance by the amount that will be spent:
		for (var i=0; i<betsSubmittedAndWaitingFor.length; i++)
		{
			var yBeingSubmitted = betsSubmittedAndWaitingFor[i][1];
			var accountBeingSubmitted = betsSubmittedAndWaitingFor[i][2];
			console.log("updateWithdrawableBalance: "+accountBeingSubmitted+" is submitting at y="+yBeingSubmitted);
			if (accountBeingSubmitted === selectedAccount)
			{
				balance = balance.sub(getBetAmountByY(yBeingSubmitted));
			}
		}
		
		if (balance.comparedTo(new BigNumber(0)) == -1) balance = new BigNumber(0);
		
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
	catch (e)
	{
		console.log("Not connected because updateWithdrawableBalance() failed:");
		console.log(e);
		notConnected();
	}
}
