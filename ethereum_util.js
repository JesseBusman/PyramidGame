/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

// Utility functions for rounding ETH amounts
function fromWeiRoundedUp(wei)
{
	var num = window.web3.fromWei(wei).toString();
	
	// If the number contains an exponentional, we don't try to change it
	if (num.indexOf("e+") !== -1) return num;
	
	// Search for the decimal point
	var decimalPointPos = num.indexOf('.');
	
	// If there is no decimal point, we don't need to change anything
	// because the number is already rounded
	if (decimalPointPos === -1) return num;
	
	// Calculate the amount of decimals after the decimal point
	var decimals = num.length - decimalPointPos - 1;
	if (decimals == 0) throw "This should never happen.";
	
	// If there are 5 or less decimals, the number is already
	// sufficiently rounded and we don't need to change anything
	if (decimals <= 5) return num;
	
	// Remove all the decimals beyond the 5th
	num = num.substr(0, num.length - (decimals - 5));
	
	// Add 1 to the 4th digit. If the digit is higher than 10,
	// make it 0 and add 1 to the previous digit.
	// Discard 0's at the end.
	
	// For example: 123.8499 will become 123.85
	// For example: 123.8467 will become 123.8468
	var newNumber = "";
	var carry = 1;
	for (var i=num.length-1; i>=0; i--)
	{
		var currentChar = num.charAt(i);
		if (currentChar == '.')
		{
			newNumber = "." + newNumber;
		}
		else if ("0123456789".indexOf(currentChar) !== -1)
		{
			var currentDigit = parseInt(currentChar);
			currentDigit += carry;
			if (currentDigit == 10)
			{
				// Only add the 0 if there are already digits in the buffer
				if (newNumber != "") newNumber = "0" + newNumber
				carry = 1;
			}
			else
			{
				newNumber = "" + currentDigit + newNumber;
				carry = 0;
			}
		}
		else
		{
			throw "Unexpected character in wei amount: "+currentChar;
		}
	}
	return newNumber;
}

function fromWeiRoundedDown(wei)
{
	var num = window.web3.fromWei(wei).toString();
	
	// If the number contains an exponentional, we don't try to change it
	if (num.indexOf("e+") !== -1) return num;
	
	// Search for the decimal point
	var decimalPointPos = num.indexOf('.');
	
	// If there is no decimal point, we don't need to change anything
	// because the number is already rounded
	if (decimalPointPos === -1) return num;
	
	// Calculate the amount of decimals after the decimal point
	var decimals = num.length - decimalPointPos - 1;
	
	if (decimals == 0) throw "This should never happen.";
	
	// If there are 5 or less decimals, the number is already
	// sufficiently rounded and we don't need to change anything
	if (decimals <= 5) return num;
	
	// Remove all the decimals beyond the 5th
	return num.substr(0, num.length - (decimals - 5));
}
