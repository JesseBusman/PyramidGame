/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/


/**** Constants ****/

// These arrays contains the URL's where this site may be hosted at.
// They exist so we can host the same game on different domain names,
// web servers and paths without having to change anything

// These ones are prefered
let URLS_WITH_HTTP_AND_HTTPS = ["pyramidgame.jesbus.com/", "pyramidgame.jesbus.com/index.html"];

// These ones are secondary
let URLS_WITH_ONLY_HTTPS = ["jessebusman.github.io/PyramidGame/", "jessebusman.github.io/PyramidGame/index.html"];

// These ones are tertiary
let URLS_WITH_ONLY_HTTP = ["pyramidgamedev3.jesb.us/", "pyramidgamedev3.jesb.us/index.html"];

let REQUIRED_NETWORK_ID = 1;
let REQUIRED_NETWORK_NAME = "the main Ethereum network";

let ADMINISTRATOR_ADDRESS = "";

let GAME_ADDRESS = "0xC3c94e2d9A33AB18D5578BD63DfdaA3e0EA74a49";
let GAME_ABI = 
JSON.parse('[{"constant":true,"inputs":[{"name":"","type":"uint32"}],"name":"coordinatesToAddresses","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"y","type":"uint16"}],"name":"getBetAmountAtLayer","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"newFeeDivisor","type":"uint256"}],"name":"setFeeDivisor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"addressesToTotalWeiPlaced","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint16"},{"name":"y","type":"uint16"}],"name":"isThereABlockAtCoordinates","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTotalAmountOfBlocks","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"chatMessageIndex","type":"uint256"}],"name":"censorChatMessage","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"addressesToChatMessagesLeft","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"username","type":"bytes32"}],"name":"registerUsername","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"addressBalances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"index","type":"uint256"}],"name":"getChatMessageAtIndex","outputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"addressesToUsernames","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"message","type":"string"}],"name":"sendChatMessage","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTotalAmountOfChatMessages","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"chatMessages","outputs":[{"name":"person","type":"address"},{"name":"message","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"amountToWithdraw","type":"uint256"}],"name":"withdrawBalance","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint16"},{"name":"y","type":"uint16"}],"name":"placeBlock","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allBlockCoordinates","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"censoredChatMessages","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newAdministrator","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"usernamesToAddresses","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]');

// This variable basically keeps track of whether the browser tab is focused.
// If it's not focused, we don't need to waste CPU cycles on polling,
// because the user isn't watching anyway.
var shouldPollForNewBets = true;


/**** Global game variables ****/
var gameABIinstance = null;
var gameInstance = null;
var currentNetworkId = null;


/**** Game initialization state variables ****/
var initializing = false;
var errorDuringInitialization = false;
var initializingFailedBecauseNoAccounts = false;
var connected = false;


/**** Account bar elements ****/
var accountBar = $("accountBar");
var accountBarArrow = $("accountBarArrow");

/* Account selector */
var divAccountSelectorContainer = $("divAccountSelectorContainer");

/* Withdraw box */
var divWithdrawableBalanceContainer = $("divWithdrawableBalanceContainer");
var divWithdrawableBalance = $("divWithdrawableBalance");
var btnWithdraw = $("btnWithdraw");


/**** Account bar state ****/
var showingAccountBar = true;

var accounts = [];
var accountBalances = [];
var accountPictures = [];
var accountsBalanceBeingWithdrawn = [];
var accountsLoaded = 0;

var selectedAccount = null;
var selectedAccountIndex = 0;
var selectedAccountUsername = null;
var selectedAccountChatMessagesLeft = null;


/**** Chatbox elements ****/
var chatbox = $("chatbox");
var chatboxUsername = $("chatboxUsername");
var chatMessageBox = $("chatMessageBox");
var chatboxArrow = $("chatboxArrow");


/**** Chatbox state ****/
var currentTotalChatMessages = null;
var showingChatbox = false;
var sendingChatMessage = false;
var addressesWaitingForUsername = [];


/**** Status box elements ****/

var statusBox = $("statusBox");
var statusBoxStatus = $("statusBoxStatus");
var statusBoxLoadingBar = $("statusBoxLoadingBar");


/**** Pyramid field elements ****/
var pyramidField = $("pyramidField");


/**** Pyramid field state ****/
var pyramidTotalBlocks = 0;
var pyramidBottomLayerWei = null;
var pyramidHighestYWithPlacedBlock = null;
var pyramidHighestXWithPlacedBlock = null;
var pyramidLowestXWithPlacedBlock = null;
var pyramidHighestYonInit = null;
var pyramidHighestYonInitXcoord = null;
var betsSubmittedAndWaitingFor = [];
