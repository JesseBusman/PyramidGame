/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

/*
These functions exist only to facility the use of the 'async' and 'await' keywords
with the Ethereum contract functions. This makes it easier to deal with their
asynchronous nature.
*/

function getAccountsAsync()
{
	return new Promise((resolve, reject) => {
		window.web3.eth.getAccounts(function(err, accs){
			if (err != null) { reject(err); return; }
			resolve(accs);
		});
	});
}
function getAccountBalanceAsync(account)
{
	return new Promise((resolve, reject) => {
		window.web3.eth.getBalance(account, function (err, bal){
			if (err != null) { reject(err); return; }
			resolve(bal);
		});
	});
}
function getBetAmountAtLayerAsync(gameInstance, layer)
{
	return new Promise((resolve, reject) => {
		gameInstance.getBetAmountAtLayer(layer, function(err, betAmount){
			if (err != null) { reject(err); return; }
			resolve(betAmount);
		});
	});
}
function getTotalAmountOfBlocksAsync(gameInstance)
{
	return new Promise((resolve, reject) => {
		gameInstance.getTotalAmountOfBlocks(function(err, blockCount){
			if (err != null) { reject(err); return; }
			resolve(blockCount);
		});
	});
}
function getTotalAmountOfChatMessagesAsync(gameInstance)
{
	return new Promise((resolve, reject) => {
		gameInstance.getTotalAmountOfChatMessages(function(err, messageCount){
			if (err != null) { reject(err); return; }
			resolve(messageCount);
		});
	});
}
function getChatMessageAtIndexAsync(gameInstance, messageIndex)
{
	return new Promise((resolve, reject) => {
		gameInstance.getChatMessageAtIndex(messageIndex, function(err, message){
			if (err != null) { reject(err); return; }
			resolve(message);
		});
	});
}
function registerUsernameAsync(gameInstance, account, usernameBytes)
{
	return new Promise((resolve, reject) => {
		gameInstance.registerUsername(
			usernameBytes,
			{from: account, gas: 150000},
			function(err){
				if (err != null) { reject(err); return; }
				resolve();
			}
		);
	});
}
function getBlockCoordinatesAtIndexAsync(gameInstance, index)
{
	return new Promise((resolve, reject) => {
		gameInstance.allBlockCoordinates(index, function(err, coordinates){
			if (err != null) { reject(err); return; }
			resolve(coordinates);
		});
	});
}
function getCurrentWithdrawableBalanceAsync(gameInstance, account)
{
	return new Promise((resolve, reject) => {
		gameInstance.addressBalances(account, function(err, theWithdrawableBalance){
			if (err != null) { reject(err); return; }
			resolve(theWithdrawableBalance);
		});
	});
}
function getBlockAddress(gameInstance, coords)
{
	return new Promise((resolve, reject) => {
		gameInstance.coordinatesToAddresses(coords, function(err, address){
			if (err != null) { reject(err); return; }
			resolve(address);
		});
	});
}
function getTotalWeiPlacedByAddress(gameInstance, address)
{
	return new Promise((resolve, reject) => {
		gameInstance.addressesToTotalWeiPlaced(address, function(err, totalWei){
			if (err != null) { reject(err); return; }
			resolve(totalWei);
		});
	});
}
function getUsernameByAddressAsync(gameInstance, address)
{
	return new Promise((resolve, reject) => {
		gameInstance.addressesToUsernames(address, function(err, username){
			if (err != null) { reject(err); return; }
			resolve(username);
		});
	});
}
function getAddressByUsernameAsync(gameInstance, username)
{
	return new Promise((resolve, reject) => {
		gameInstance.usernamesToAddresses(username, function(err, address){
			if (err != null) { reject(err); return; }
			resolve(address);
		});
	});
}
function getChatMessagesLeftAsync(gameInstance, address)
{
	return new Promise((resolve, reject) => {
		gameInstance.addressesToChatMessagesLeft(address, function(err, chatMessagesLeft){
			if (err != null) { reject(err); return; }
			resolve(chatMessagesLeft);
		});
	});
}
function sendChatMessageAsync(gameInstance, address, message)
{
	return new Promise((resolve, reject) => {
		gameInstance.sendChatMessage(
			message,
			{from: address, gas: 150000},
			function(err, chatMessagesLeft)
			{
				if (err != null) { reject(err); return; }
				resolve(chatMessagesLeft);
			}
		);
	});
}
function isChatMessageCensored(gameInstance, index)
{
	return new Promise((resolve, reject) => {
		gameInstance.censoredChatMessages(
			index,
			function(err, censoredStatus)
			{
				if (err != null) { reject(err); return; }
				resolve(censoredStatus);
			}
		);
	});
}
function getNetworkIdAsync()
{
	return new Promise((resolve, reject) => {
		window.web3.version.getNetwork(function(err, netId){
			if (err != null) { reject(err); return; }
			resolve(netId);
		});
	});
}
