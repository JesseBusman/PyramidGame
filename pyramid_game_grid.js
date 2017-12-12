/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

var getCell_createIfNotExistsCounter = 0;

function addNumbersToCell(x, y)
{
	var cellDiv = $("cell"+x+"_"+y);
	
	var betAmountForThisCell = getBetAmountByY(y);
	
	var cellAmountDiv = document.createElement("div");
	cellAmountDiv.classList.add("cellEthAmount");
	cellAmountDiv.innerHTML = "- "+web3.fromWei(betAmountForThisCell);
	cellDiv.appendChild(cellAmountDiv);
	
	cellReturnedAmountDiv = document.createElement("div");
	cellReturnedAmountDiv.classList.add("cellReturnedEthAmount");
	cellReturnedAmountDiv.innerHTML = "+ ???";
	cellDiv.appendChild(cellReturnedAmountDiv);
}

function getCell_createIfNotExists(x, y, onlyCreateIfRowExists)
{
	getCell_createIfNotExistsCounter++;
	if (y < 0) throw "Negative y coordinate!";
	
	// Fetch the row div of the y coordinate
	var rowDiv = $("row"+y);
	
	// If the row div does not exist yet...
	if (!rowDiv)
	{
		// If the y coordinate is higher than the highest possibly displayed block,
		// and we should not create a new row, quit
		if (onlyCreateIfRowExists && y > pyramidHighestYWithPlacedBlock+1)
		{
			return;
		}
		
		// Create the row div
		rowDiv = document.createElement("div");
		rowDiv.setAttribute("id", "row"+y);
		pyramidField.insertBefore(rowDiv, pyramidField.childNodes[0]);
		
		if (pyramidLowestXWithPlacedBlock == 0)
		{
			throw "This should never happen";
		}
		
		// Create n-y row cells, where n is the amount of cells in the bottom row
		// pyramidLowestXWithPlacedBlock-1 is the lowest x with an available block
		// pyramidHighestXWithPlacedBlock+1 is the highest x with an available block
		for (var i=pyramidLowestXWithPlacedBlock-1; i<=pyramidHighestXWithPlacedBlock+1-y; i++)
		{
			getCell_createIfNotExists(i, y, false);
		}
	}
	
	// Load the cell div, if it exists
	var cellDiv = $("cell"+x+"_"+y);
	
	// Load the cell div's neighbours, if they exist
	var leftCellDiv = $("cell"+(x-1)+"_"+y);
	var rightCellDiv = $("cell"+(x+1)+"_"+y);
	var belowLeft = $("cell"+x+"_"+(y-1));
	var belowRight = $("cell"+(x+1)+"_"+(y-1));
	
	var justCreatedTheCell = false;
	var cellReturnedAmountDiv = null;
	
	// If the cell does not already exist, create it
	if (!cellDiv)
	{
		justCreatedTheCell = true;
		var betAmountForThisCell = getBetAmountByY(y);
		
		// Create the cell UI elements
		cellDiv = document.createElement("div");
		cellDiv.setAttribute("id", "cell"+x+"_"+y);
		cellDiv.setAttribute("xpos", x);
		cellDiv.setAttribute("ypos", y);
		cellDiv.classList.add("hiddenBlock");
		
		// If neither the cell to the left nor the cell to the right already existed in the UI ...
		if (!leftCellDiv && !rightCellDiv)
		{
			if (rowDiv.childNodes.length == 0)
			{
				rowDiv.appendChild(cellDiv);
			}
			else
			{
				var inserted = false;
				for (var i=0; i<rowDiv.childNodes.length; i++)
				{
					var xx = parseInt(rowDiv.childNodes[i].getAttribute("xpos"));
					if (xx == x) throw "This should not happen";
					if (xx > x)
					{
						rowDiv.insertBefore(cellDiv, rowDiv.childNodes[i]);
						inserted = true;
						break;
					}
				}
				if (!inserted)
				{
					rowDiv.appendChild(cellDiv);
				}
			}
		}
		
		// If the cell to the right already existed in the UI, insert the new cell before it
		else if (rightCellDiv)
		{
			rowDiv.insertBefore(cellDiv, rightCellDiv);
		}
		
		// If the cell to the left already existed in the UI, insert the next cell after it
		else
		{
			rowDiv.insertBefore(cellDiv, leftCellDiv.nextSibling);
		}
		
		if (!hideNumbersOnBlocks) addNumbersToCell(x, y);
		
		cellDiv.addEventListener("click", async function(e){
			if (cellDiv.classList.contains("hiddenBlock"))
			{
				console.log("Click on hidden block");
			}
			else if (cellDiv.classList.contains("placedBlock"))
			{
				console.log("Click on placed block");
			}
			else if (cellDiv.classList.contains("waitingForConfirmationAnimation"))
			{
				console.log("Click on processing block");
			}
			
			// When an available cell is clicked, we should start the block placing procedure.
			else if (cellDiv.classList.contains("availableBlock"))
			{
				console.log("Click on available block");
				
				// Fetch the available balance
				var availableBalance = await getCurrentWithdrawableBalanceAsync(gameInstance, selectedAccount);
				
				// Fetch the account balance
				var theAccountBalance = new BigNumber(accountBalances[selectedAccountIndex]);
				
				// If there are block placements in flight for the currently selected account,
				// reduce the available balance
				for (var i=0; i<betsSubmittedAndWaitingFor.length; i++)
				{
					var yBeingSubmitted = betsSubmittedAndWaitingFor[i][1];
					var accountBeingSubmitted = betsSubmittedAndWaitingFor[i][2];
					console.log("cellDiv.onClick: "+accountBeingSubmitted+" is submitting at y="+yBeingSubmitted);
					if (accountBeingSubmitted === selectedAccount)
					{
						availableBalance = availableBalance.sub(getBetAmountByY(yBeingSubmitted));
					}
				}
				
				// If there are withdrawals in flight for the currently selected account,
				// reduce the available balance
				availableBalance = availableBalance.sub(accountsBalanceBeingWithdrawn[selectedAccountIndex]);
				//console.log("The withdrawable balance of account "+selectedAccount+" is being withdraw. Therefore, to place a block, we need to provide the transaction with the full bet amount. We can't use any withdrawable balance, because it may be gone before the bet transaction goes through.");
				
				// If the available balance is smaller than 0,
				// subtract the rest from the account balance:
				if (availableBalance.comparedTo(new BigNumber(0)) == -1)
				{
					theAccountBalance = theAccountBalance.add(availableBalance);
					availableBalance = new BigNumber(0);
				}
				
				// Calculate the amount of ETH the user needs to send to the contract
				// to place a block at the clicked location
				var transactionAmount = null;
				
				// If the available balance is greater than or equal to the bet amount,
				// the user doesn't need to send any ETH to the contract.
				if (availableBalance.comparedTo(betAmountForThisCell) != -1)
				{
					transactionAmount = new BigNumber(0);
				}
				
				// Otherwise, the user needs to supply the difference
				else
				{
					transactionAmount = betAmountForThisCell.sub(availableBalance);
				}
				
				// If the amount the user has to supply is not available in the selected account,
				// tell the user the bad news.
				if (transactionAmount.comparedTo(theAccountBalance) == 1)
				{
					console.log("theAccountBalance = "+web3.fromWei(theAccountBalance));
					console.log("availableBalance = "+web3.fromWei(availableBalance));
					console.log("transactionAmount = "+web3.fromWei(transactionAmount));
					alert("There's not enough balance in account "+selectedAccount+"\r\nAt least "+web3.fromWei(transactionAmount)+" ETH is required");
					return;
				}
				
				console.log("theAccountBalance = "+web3.fromWei(theAccountBalance)+" ETH");
				console.log("availableBalance = "+web3.fromWei(availableBalance)+" ETH");
				
				var fromAccountIndex = selectedAccountIndex;
				
				// Initiate the block placing transaction
				gameInstance.placeBlock(
					x,
					y,
					{from: selectedAccount, value: transactionAmount, gas: 130000},
					function(err){
						if (err != null)
						{
							if (err.toString().includes("rejected"))
							{
								statusBoxStatus.innerHTML = "Block placement cancelled";
								cellDiv.classList.remove("waitingForConfirmationAnimation");
								return;
							}
							statusBoxStatus.innerHTML = "Block placement failed";
							cellDiv.classList.remove("waitingForConfirmationAnimation");
							return;
						}
						statusBoxStatus.innerHTML = "Block submitted! Waiting for confirmation...";
						
						// Add the coordinates to a cookie. If the user refreshes,
						// the waitingForConfirmationAnimation should be added again
						var confirmingCoords = readCookie("confirmingCoords");
						if (confirmingCoords === null) confirmingCoords = "";
						confirmingCoords += x+"_"+y+"_"+selectedAccount+"__";
						createCookie("confirmingCoords", confirmingCoords, 5 * 60);
						
						betsSubmittedAndWaitingFor.push([x, y, selectedAccount]);
						console.log("betsSubmittedAndWaitingFor="+JSON.stringify(betsSubmittedAndWaitingFor));
						updateGame();
						updateAccountBalance(fromAccountIndex);
						updateWithdrawableBalance();
					}
				);
				
				// Animate the block
				cellDiv.classList.remove("animateNewBlockSpace");
				cellDiv.classList.add("waitingForConfirmationAnimation");
				
				statusBoxStatus.innerHTML = "Placing block...";
			}
			else
			{
				console.error("ERROR: Click on block of unknown type!!!");
			}
		});
		
		// Calculate the width of the pyramid
		var rowWidth = ($("row0").childNodes.length * 140 + 50) + "px";
		
		// Set all the pyramid rows to the correct width
		// (this will automatically be animated because of a CSS transition)
		for (var i=0; ; i++)
		{
			var row = $("row"+i);
			if (!row) break;
			row.style.width = rowWidth;
			row.style.minWidth = rowWidth;
		}
	}
	else
	{
		cellReturnedAmountDiv = cellDiv.getElementsByClassName("cellReturnedEthAmount")[0];
	}
	
	// Some UI stuff
	if (!cellDiv.classList.contains("placedBlock"))
	{
		if (y == 0)
		{
			cellDiv.classList.remove("hiddenBlock");
			cellDiv.classList.add("availableBlock");
		}
		else
		{
			if (belowLeft && belowRight &&
				belowLeft.classList.contains("placedBlock") &&
				belowRight.classList.contains("placedBlock"))
			{
				cellDiv.classList.remove("hiddenBlock");
				cellDiv.classList.add("availableBlock");
			}
		}
	}
	
	// If we just created this cell, we need to animate its width from 0 to a full block width.
	if (justCreatedTheCell)
	{
		cellDiv.classList.add("animateNewBlockSpace");
		
		// Add it to the global registry
		pyramidHtmlBlockElements.push({"x": x, "y": y, "el": cellDiv});
	}
	
	// If a cell above does not exist yet, create it:
	if (rightCellDiv && !$("cell"+(x)+"_"+(y+1))) getCell_createIfNotExists(x, y+1, true);
	if (leftCellDiv && !$("cell"+(x-1)+"_"+(y+1))) getCell_createIfNotExists(x-1, y+1, true);
	
	// If the block is waiting for confirmation because the
	// user submitted it, add the waitingForConfirmationAnimation
	var confirmingCoords = readCookie("confirmingCoords");
	if (confirmingCoords != null && !cellDiv.classList.contains("placedBlock"))
	{
		var confirmingCoordsArr = confirmingCoords.trim().split("__");
		for (var i=0; i<confirmingCoordsArr.length; i++)
		{
			if (confirmingCoordsArr[i] == "") continue;
			var coords = confirmingCoordsArr[i].split("_");
			if (parseInt(x) === parseInt(coords[0]) &&
				parseInt(y) === parseInt(coords[1]))
			{
				cellDiv.classList.add("waitingForConfirmationAnimation");
				break;
			}
		}
	}
	
	return cellDiv;
}


var updateBlockReturnedEthCounter = 0; // A counter for debugging purposes

// Update the little + ... ETH text on the block
async function updateBlockReturnedEth(x, y)
{
	if (hideNumbersOnBlocks) return;
	
	updateBlockReturnedEthCounter++;
	if (y < 0) return;
	var cellDiv = getCell_createIfNotExists(x, y, true);
	if (cellDiv)
	{
		var cellReturnedAmountDiv = cellDiv.getElementsByClassName("cellReturnedEthAmount")[0];
		
		var cellAboveLeftDiv = $("cell"+(x-1)+"_"+(y+1));
		var cellAboveRightDiv = $("cell"+x+"_"+(y+1));
		
		var totalReturnedAmount = new BigNumber(0);
		
		var blocksPlacedAbove = 0;
		
		if (cellAboveLeftDiv && cellAboveLeftDiv.classList.contains("placedBlock"))
		{
			totalReturnedAmount = totalReturnedAmount.add(getBetAmountByY(y));
			blocksPlacedAbove++;
		}
		if (cellAboveRightDiv && cellAboveRightDiv.classList.contains("placedBlock"))
		{
			totalReturnedAmount = totalReturnedAmount.add(getBetAmountByY(y));
			blocksPlacedAbove++;
		}
		
		// If there are 0, 1 or 2 blocks above,
		// make the returned amount's background red, orange or green respectively.
		if (blocksPlacedAbove == 0) cellReturnedAmountDiv.style.backgroundColor = "rgba(255, 0, 0, 0.2)"; // Red
		else if (blocksPlacedAbove == 1) cellReturnedAmountDiv.style.backgroundColor = "rgba(255, 200, 0, 0.2)"; // Orange
		else cellReturnedAmountDiv.style.backgroundColor = "rgba(0, 200, 0, 0.2)"; // Green
		
		cellReturnedAmountDiv.innerHTML = "+ "+fromWeiRoundedDown(totalReturnedAmount);
		
	}
}

