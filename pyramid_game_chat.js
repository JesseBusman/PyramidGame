/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

// This function will ask the user to enter a username,
// and it will associate this username with the user's address
// in the Pyramid Game contract.
async function letUserRegisterUsername()
{
	var theAccount = selectedAccount;
	
	var username = "";
	while (true)
	{
		if (username = prompt("Please enter a username for "+theAccount+".\r\n(no more than 32 characters, or 32 bytes)\r\nThis username will be permanently tied to the aforementioned address.", username))
		{
			// Remove trailing and leading whitespace
			username = username.trim();
			
			var resultLengthInBytes = getUTF8byteCount(username);
			
			// If the user didn't enter anything, we will assume they're
			// fucking pissed and want the god damn dialog box to just
			// fucking disappear already.
			if (resultLengthInBytes == 0 || username.length == 0) return;
			
			// Verify that username length is within bounds,
			// because the username is stored in a Solidity bytes32 type.
			if (resultLengthInBytes > 32)
			{
				alert("The username may not be longer than 32 characters, or 32 bytes in UTF8.\r\n"+username+" is "+resultLengthInBytes+" bytes!");
				continue;
			}
			if (resultLengthInBytes < 2)
			{
				alert("The username must be at least 2 characters, or 2 bytes in UTF8.");
				continue;
			}
			
			// Set the status box text in the top left corner
			statusBoxStatus.innerHTML = "Submitting username...";
			
			// Generate UTF8 hex
			var hexUsernameString = "0x"+encodeUTF8hex(username);
			
			if (hexUsernameString.length/2 - 1 != resultLengthInBytes) throw "Caculated byte length of UTF8 string does not match the hex length!!!";
			
			
			try
			{
				// Check if the username is already registered
				var addr = await getAddressByUsernameAsync(gameInstance, hexUsernameString);
				
				// If it is already registered, tell the user the bad news
				if (addr != "0x0000000000000000000000000000000000000000")
				{
					alert("Unfortunately, the username "+result+" has already been registered :-(");
					continue;
				}
				
				// Initiate the username registration transaction to the user's Ethereum client
				await registerUsernameAsync(gameInstance, theAccount, hexUsernameString);
				
				// Remember that there is a username request in flight for this address
				addressesWaitingForUsername.push(theAccount);
				
				// Update the status box text in the top left corner
				statusBoxStatus.innerHTML = "Waiting for username confirmation...";
			}
			catch (e)
			{
				// If the user cancelled the request inside their Ethereum client
				if (e.toString().indexOf("has been rejected") != -1)
				{
					if (statusBoxStatus.innerHTML.indexOf("username") != -1)
						statusBoxStatus.innerHTML = "Username registration cancelled";
					return;
				}
				
				// If the user closed the browser tab before the transaction was broadcast
				if (e.toString().indexOf("JSON RPC response: \"\"") != -1) return;
				
				// Otherwise, an unknown error occurred.
				// Tell the user the bad news:
				alert("An error occurred while registering your username:\r\n"+e.toString());
			}
			return;
		}
		else
		{
			return;
		}
	}
}

// UI things, they should speak for themselves
chatboxArrow.addEventListener("click", function(e){
	if (!connected) return;
	if (showingChatbox)
	{
		createCookie("showChatbox", "no", 100);
		hideChatbox();
	}
	else
	{
		createCookie("showChatbox", "yes", 100);
		showChatbox();
	}
});
function hideChatbox()
{
	chatbox.style.transform = "translate(100%, 0px)";
	chatbox.style.opacity = 0.0;
	chatboxArrow.style.transform = "rotate(-90deg)";
	showingChatbox = false;
}
function showChatbox()
{
	chatbox.style.transform = "translate(0%, 0px)";
	chatbox.style.opacity = 1.0;
	chatboxArrow.style.transform = "rotate(90deg)";
	showingChatbox = true;
}


chatMessageBox.addEventListener("keydown", function(e){
	// If the user pressed Enter inside the chat message text field...
	if (e.keyCode == 13)
	{
		// If we are already sending a message, quit
		if (sendingChatMessage) return;
		sendingChatMessage = true;
		
		// Asynchronously perform the sending
		(async function(){
			var message = chatMessageBox.value.trim();
			
			// If there is no message, quit
			if (message.length == 0) return;
						
			// Disable the chat message input field.
			// This will make the text gray and immutable to the user
			chatMessageBox.enabled = false;
			chatMessageBox.disabled = true;
			
			statusBoxStatus.innerHTML = "Sending chat message...";
			
			try
			{
				console.log("Calling sendChatMessageAsync...");
				
				// Wait until the message has been transmitted
				await sendChatMessageAsync(gameInstance, selectedAccount, message);
				
				if (statusBoxStatus.innerHTML.indexOf("chat") != -1)
					statusBoxStatus.innerHTML = "Waiting for chat message confirmation...";
				
				// Clear the chat message field only if the sending did not throw an exception
				chatMessageBox.value = "";
			}
			catch (e)
			{
				console.error("Failure in sending chat message:");
				console.error(e);
				
				// If the user closed the tab before broadcasting the chat message transaction
				if (e.toString().indexOf("JSON RPC response: \"\"") != -1)
				{
				}
				
				// If the user canceled the transaction from their Ethereum client
				else if (e.toString().indexOf("rejected") != -1)
				{
					if (statusBoxStatus.innerHTML.indexOf("chat") != -1)
						statusBoxStatus.innerHTML = "Sending chat message was canceled";
				}
				
				// If an unknown error occurred:
				else
				{
					alert("An error occurred while sending the chat message:\r\n"+e.toString());
				}
			}
			
			// Re-enable the chat message input field.
			chatMessageBox.enabled = true;
			chatMessageBox.disabled = false;
			
			sendingChatMessage = false;
		})();
	}
});

// This function will check if there are any new chat messages available.
// If so, it will display them.
// If there are more than 20, it will display the last 20.
async function updateChatMessages()
{
	// Fetch the current amount of chat message from the Ethereum blockchain
	var newTotalChatMessages = await getTotalAmountOfChatMessagesAsync(gameInstance);
	newTotalChatMessages = parseInt(newTotalChatMessages.toString());
	
	// If there are no new chat messages, do nothing
	if (newTotalChatMessages == currentTotalChatMessages) { }
	
	// If there are new messages...
	else
	{
		if (currentTotalChatMessages == null)
		{
			// We need the last 20 (or less) chat messages!
			currentTotalChatMessages = Math.max(0, newTotalChatMessages-20);
		}
		else
		{
			// We need no more than the last 20 chat messages!
			currentTotalChatMessages = Math.max(currentTotalChatMessages, newTotalChatMessages-20);
		}
		
		console.log("Adding chat messages from index "+currentTotalChatMessages+" to (excl.) index "+newTotalChatMessages);
		
		// If the chatbox is already scrolled all the way down,
		// we should scroll it down all the way down again
		// after adding all the new chat messages
		var shouldScrollDown = chatMessagesDiv.scrollY == chatMessagesDiv.scrollHeight || currentTotalChatMessages == 0;
		
		// Loop over all the new chat messages and add them to the UI
		for (; currentTotalChatMessages<newTotalChatMessages; currentTotalChatMessages++)
		{
			// Check in the blockchain if the chat message has been censored by the administrator
			var isCensored = await isChatMessageCensored(gameInstance, currentTotalChatMessages);
			
			// Get the chat message username, address and message
			var msg = await getChatMessageAtIndexAsync(gameInstance, currentTotalChatMessages);
			
			// If this chat message was placed by the current user,
			// update the status box message in the top left corner
			if (accounts.indexOf(msg[0]) != -1 && statusBoxStatus.innerHTML.indexOf("chat message confirmation"))
			{
				statusBoxStatus.innerHTML = "Connected";
			}
			
			var newMessageDiv = document.createElement("div");
			{
				var messageSenderDiv = blockies({
					seed: msg[0], // seed used to generate icon data, default: random
					size: 8, // width/height of the icon in blocks, default: 8
					scale: 3, // width/height of each block in pixels, default: 4 
				});
				
				newMessageDiv.appendChild(messageSenderDiv);
				
				var usernameAndMessageDiv = document.createElement("div");
				{
					var messageUsernameDiv = document.createElement("div");
					{
						messageUsernameDiv.innerHTML = escapeHtml(decodeUTF8hex(msg[1]));
					}
					usernameAndMessageDiv.appendChild(messageUsernameDiv);
					var messageMessageDiv = document.createElement("div");
					{
						if (isCensored) messageMessageDiv.innerHTML = "<i>Censored by the administrator</i>";
						else messageMessageDiv.innerHTML = escapeHtml(msg[2]);
					}
					usernameAndMessageDiv.appendChild(messageMessageDiv);
				}
				newMessageDiv.appendChild(usernameAndMessageDiv);
			}
			chatMessagesDiv.appendChild(newMessageDiv);
			if (!initializing) newMessageDiv.classList.add("newChatMessageAnimation");
		}
		
		// If we should scroll down, scroll down
		if (shouldScrollDown)
		{
			// If we are initializing, scroll down without animation
			if (initializing)
			{
				chatMessagesDiv.scrollY = chatMessagesDiv.scrollHeight;
				chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
			}
			
			// If we are not initializing, scroll down with animation
			else
			{
				setTimeout(function(){
					console.log("Scrolling chatbox to bottom...");
					chatMessagesDiv.scroll({
						top: chatMessagesDiv.scrollHeight,
						left: 0,
						behavior: 'smooth'
					});
				}, 500);
			}
		}
		
		console.log("We have loaded chat messages: "+currentTotalChatMessages);
	}
}

// Update the amount of chat message the user has left on the currently selected account
async function updateChatMessagesLeft()
{
	var prev = selectedAccountChatMessagesLeft;
	selectedAccountChatMessagesLeft = await getChatMessagesLeftAsync(gameInstance, selectedAccount);
	
	// Reduce from a BigNumber to a normal JavaScript number
	selectedAccountChatMessagesLeft = parseInt(selectedAccountChatMessagesLeft.toString());
	
	// If it changed, update the enabled-ness of the chat message text field,
	// but not if a chat message is being sent
	if (prev != selectedAccountChatMessagesLeft && !sendingChatMessage)
	{
		console.log(selectedAccount+" has "+selectedAccountChatMessagesLeft+" chat messages left");
		
		if (selectedAccountChatMessagesLeft == 0)
		{
			chatMessageBox.enabled = false;
			chatMessageBox.disabled = true;
		}
		else
		{
			chatMessageBox.enabled = true;
			chatMessageBox.disabled = false;
		}
	}
	
	// Update the chat message text field placeholder text
	if (selectedAccountChatMessagesLeft == 0)
	{
		chatMessageBox.setAttribute("placeholder", "Place a block to write a chat message");
	}
	else
	{
		chatMessageBox.setAttribute("placeholder", "Enter a chat message here (you have "+selectedAccountChatMessagesLeft+" left)");
	}
}

async function updateChatboxUsername()
{
	var theAccount = selectedAccount;
	var username = await getUsernameByAddressAsync(gameInstance, theAccount);
	
	// If the user selected a different account while we were fetching the username,
	// we should ignore the response and start again.
	if (theAccount != selectedAccount)
	{
		setTimeout(updateChatboxUsername, 10);
		return;
	}
	
	// Decode HEX to UTF8 string
	username = decodeUTF8hex(username);
	
	if (username == "")
	{
		chatboxUsername.innerHTML = "<a href='#' onclick='letUserRegisterUsername();'>Set username</a>";
		selectedAccountUsername = null;
	}
	else
	{
		chatboxUsername.innerHTML = escapeHtml(username);
		selectedAccountUsername = username;
		
		var index = addressesWaitingForUsername.indexOf(selectedAccount);
		if (index != -1)
		{
			addressesWaitingForUsername.splice(index, 1);
			if (statusBoxStatus.innerHTML.indexOf("username confirmation") != -1)
			{
				statusBoxStatus.innerHTML = "Username has been created";
			}
		}
	}
}