 
leaderboardArrow.addEventListener("click", function(e){
	if (!connected) return;
	if (showingLeaderboard)
	{
		createCookie("showLeaderboard", "no", 100 * 24 * 60 * 60);
		hideLeaderboard();
	}
	else
	{
		createCookie("showLeaderboard", "yes", 100 * 24 * 60 * 60);
		showLeaderboard();
	}
});
function hideLeaderboard()
{
	leaderboardContainer.style.transform = "translate(-100%, 0px)";
	leaderboardContainer.style.opacity = 0.0;
	leaderboardArrow.style.transform = "rotate(90deg)";
	showingLeaderboard = false;
}
function showLeaderboard()
{
	leaderboardContainer.style.transform = "translate(0%, 0px)";
	leaderboardContainer.style.opacity = 1.0;
	leaderboardArrow.style.transform = "rotate(-90deg)";
	showingLeaderboard = true;
}

var leaderboardSortColumn = 0;

function sortLeaderboardBy(columnId)
{
	leaderboardSortColumn = columnId;
	updateLeaderboard();
}

function updateLeaderboard()
{
	var leaderboard = $("leaderboard");
	
	leaderboard.innerHTML = "";
	
	var table = document.createElement("table");
	{
		var thead = document.createElement("thead");
		{
			var h = "<tr><th></th><th></th>";
			h += "<th>";
			if (leaderboardSortColumn == 5) h += "<u>";
			h += "<a href='#' onclick='sortLeaderboardBy(5);return false;'>Username</a>";
			if (leaderboardSortColumn == 5) h += "</u>";
			
			h += "</th><th>";
			if (leaderboardSortColumn == 4) h += "<u>";
			h += "<a href='#' onclick='sortLeaderboardBy(4);return false;'>Blocks</a>";
			if (leaderboardSortColumn == 4) h += "</u>";
			h += "</th><th>&nbsp;</th><th>";
			
			if (leaderboardSortColumn == 0) h += "<u>";
			h += "<a href='#' onclick='sortLeaderboardBy(0);return false;'>Revenue</a>";
			if (leaderboardSortColumn == 0) h += "</u>";
			h += "</th><th>&nbsp;&nbsp;-</th><th>";
			
			if (leaderboardSortColumn == 1) h += "<u>";
			h += "<a href='#' onclick='sortLeaderboardBy(1);return false;'>Placed</a>";
			if (leaderboardSortColumn == 1) h += "</u>";
			h += "</th><th>&nbsp;&nbsp;&nbsp;=</th><th>";
			
			if (leaderboardSortColumn == 2) h += "<u>";
			h += "<a href='#' onclick='sortLeaderboardBy(2);return false;'>Profit</a>";
			if (leaderboardSortColumn == 2) h += "</u>";
			h += "</th><th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>";
			
			if (leaderboardSortColumn == 3) h += "<u>";
			h += "<a href='#' onclick='sortLeaderboardBy(3);return false;'>Potential</a>";
			if (leaderboardSortColumn == 3) h += "</u>";
			h += "</th></tr>";
			
			thead.innerHTML = h;
		}
		table.appendChild(thead);
		var tbody = document.createElement("tbody");
		{
			var rows = [];
			for (var addr in addressMetadata)
			{
				if (addressMetadata.hasOwnProperty(addr))
				{
					rows.push(addressMetadata[addr]);
				}
			}
			
			rows.sort(function(a, b){
				if (leaderboardSortColumn == 1) return b.totalBet.comparedTo(a.totalBet); // sort by placed
				else if (leaderboardSortColumn == 0) return b.totalProfit.comparedTo(a.totalProfit); // sort by revenue
				else if (leaderboardSortColumn == 2) return b.totalProfit.sub(b.totalBet).comparedTo(a.totalProfit.sub(a.totalBet)); // sort by profit
				else if (leaderboardSortColumn == 3) return b.potentialProfit.comparedTo(a.potentialProfit); // sort by potential
				else if (leaderboardSortColumn == 4) return (b.blockCount > a.blockCount) ? 1 : -1; // sort by block count
				else if (leaderboardSortColumn == 5) // sort by username
				{
					var aDoesNotHaveUsername = !addressesToUsernames[a.address] || addressesToUsernames[a.address].trim().length == 0;
					var bDoesNotHaveUsername = !addressesToUsernames[b.address] || addressesToUsernames[b.address].trim().length == 0;
					if (aDoesNotHaveUsername && bDoesNotHaveUsername) return b.totalProfit.sub(b.totalBet).comparedTo(a.totalProfit.sub(a.totalBet)); // sort people without username by profit
					
					if (aDoesNotHaveUsername) return 1;
					if (bDoesNotHaveUsername) return -1;
					
					return (addressesToUsernames[b.address].trim().toLowerCase() < addressesToUsernames[a.address].trim().toLowerCase()) ? 1 : -1;
				}
				else return 0;
			});
			
			for (var i=0; i<rows.length; i++)
			{
				var row = document.createElement("tr");
				{
					var usernameTd = document.createElement("td");
					{
						usernameTd.innerHTML = i+1;
					}
					row.appendChild(usernameTd);
					
					var firstTd = document.createElement("td");
					{
						var accountPicture = blockies({ // All options are optional
							seed: rows[i].address.toString(), // seed used to generate icon data, default: random
							size: 8, // width/height of the icon in blocks, default: 8
							scale: 3, // width/height of each block in pixels, default: 4
						});
						firstTd.appendChild(accountPicture);
					}
					row.appendChild(firstTd);
					
					var usernameTd = document.createElement("td");
					{
						if (addressesToUsernames[rows[i].address]) usernameTd.innerHTML = addressesToUsernames[rows[i].address];
					}
					row.appendChild(usernameTd);
					
					/*var secondTd = document.createElement("td");
					{
						secondTd.innerHTML = ""+web3.fromWei(rows[i]["totalBetNotOnSelf"]) + "";
					}
					row.appendChild(secondTd);*/
					
					var secondTd = document.createElement("td");
					{
						secondTd.innerHTML = ""+rows[i]["blockCount"];
						secondTd.setAttribute("colspan", 2);
					}
					row.appendChild(secondTd);
					
					var secondTd = document.createElement("td");
					{
						secondTd.innerHTML = ""+web3.fromWei(rows[i]["totalProfit"]) + "";
						secondTd.setAttribute("colspan", 2);
					}
					row.appendChild(secondTd);
					
					var secondTd = document.createElement("td");
					{
						secondTd.innerHTML = ""+web3.fromWei(rows[i]["totalBet"]) + "";
						secondTd.setAttribute("colspan", 2);
					}
					row.appendChild(secondTd);
					
					var secondTd = document.createElement("td");
					{
						secondTd.innerHTML = ""+web3.fromWei(rows[i]["totalProfit"].sub(rows[i]["totalBet"])) + "";
						secondTd.setAttribute("colspan", 2);
					}
					row.appendChild(secondTd);
					
					var secondTd = document.createElement("td");
					{
						secondTd.innerHTML = ""+web3.fromWei(rows[i]["potentialProfit"]) + "";
					}
					row.appendChild(secondTd);
				}
				tbody.appendChild(row);
			}
		}
		table.appendChild(tbody);
	}
	leaderboard.appendChild(table);
}
