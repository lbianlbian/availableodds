const solanaWeb3 = require('@solana/web3.js');
var jsonFile = require('./initGames.json');

var connection = new solanaWeb3.Connection("https://devnet.genesysgo.net/", "confirmed");
var programID = new solanaWeb3.PublicKey("M8WYXm9YGPcBqt8QpAMgZXbMFjVXeTyMrQ94pAtkitK");

var output;

//to round to n decimal places
function round(num, places) {
    var multiplier = Math.pow(10, places);
    return Math.round(num * multiplier) / multiplier;
}

async function getOdds(ha){
  var all0s = new solanaWeb3.PublicKey(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

  var offset = -1;
  if(ha == 0){
    offset = 2;
  }
  else if(ha == 1){
    offset = 37;
  }
  
  var accs = await connection.getProgramAccounts
    (programID, 
      {filters:
       [
        {memcmp: {offset: offset, bytes: all0s} }
       ]
      }
    );

  for(var x = 0; x < accs.length; x++){
    
    var id1 = accs[x].account.data[0];
    var id2 = accs[x].account.data[1];
    var indexNeeded = 256 * id1 + id2;
    
    var stakeHome = (accs[x].account.data[34] * 256 * 256 + accs[x].account.data[35] * 256 + accs[x].account.data[36]) / 100;
    var stakeAway = (accs[x].account.data[69] * 256 * 256 + accs[x].account.data[70] * 256 + accs[x].account.data[71]) / 100;

    if(stakeHome == 0 || stakeAway == 0){
      continue;
    }

    var toMatchOdds;
    var toMatchStake;
    var highest;
    var secondHighest;
    var thirdHighest; 
    
    if(ha == 0){
      toMatchStake = stakeHome;
      toMatchOdds = (stakeHome + stakeAway) / stakeHome;
      highest = output[indexNeeded].home[0];
      secondHighest = output[indexNeeded].home[1];
      thirdHighest = output[indexNeeded].home[2];
    }
    else if(ha == 1){
      toMatchStake = stakeAway;
      toMatchOdds = (stakeHome + stakeAway) / stakeAway;
      highest = output[indexNeeded].away[0];
      secondHighest = output[indexNeeded].away[1];
      thirdHighest = output[indexNeeded].away[2];
    }
    
    toMatchOdds = round(toMatchOdds, 2);
    toMatchStake = round(toMatchStake, 2);

    if(toMatchOdds == highest.odds){
      highest.accArr.push({amount: toMatchStake, acc: accs[x].pubkey.toString()});
      highest.totalAmount += toMatchStake;
    }
    else if(toMatchOdds == secondHighest.odds){
      secondHighest.accArr.push({amount: toMatchStake, acc: accs[x].pubkey.toString()});
      secondHighest.totalAmount += toMatchStake;
    }
    else if(toMatchOdds == thirdHighest.odds){
      thirdHighest.accArr.push({amount: toMatchStake, acc: accs[x].pubkey.toString()});
      thirdHighest.totalAmount += toMatchStake;
    }
    else if(toMatchOdds > highest.odds){
      thirdHighest.odds = secondHighest.odds;
      thirdHighest.totalAmount = secondHighest.totalAmount;
      thirdHighest.accArr = secondHighest.accArr;
      
      secondHighest.odds = highest.odds;
      secondHighest.totalAmount = highest.totalAmount;
      secondHighest.accArr = highest.accArr;
      
      highest.odds = toMatchOdds;
      highest.totalAmount = toMatchStake;
      highest.accArr = [{ amount: toMatchStake, acc: accs[x].pubkey.toString() }];
    }
    else if(toMatchOdds > secondHighest.odds){
      thirdHighest.odds = secondHighest.odds;
      thirdHighest.totalAmount = secondHighest.totalAmount;
      thirdHighest.accArr = secondHighest.accArr;
      
      secondHighest.odds = toMatchOdds;
      secondHighest.totalAmount = toMatchStake;
      secondHighest.accArr = [{amount: toMatchStake, acc: accs[x].pubkey.toString()}];
    }
    else if(toMatchOdds > thirdHighest.odds){
      thirdHighest.odds = toMatchOdds;
      thirdHighest.totalAmount = toMatchStake;
      thirdHighest.accArr = [{amount: toMatchStake, acc: accs[x].pubkey.toString() }];
    }
  }
}

//avoid cors error: https://stackoverflow.com/questions/44405448/how-to-allow-cors-with-node-js-without-using-express

const http = require('http');
var url = require("url");
const port = 8080;

http.createServer(async (req, res) => {
  //res.set('Access-Control-Allow-Origin', '*');
  const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  "Access-Control-Max-Age": 2592000, // 30 days
  /** add other headers too */
};

  if (['GET', 'POST'].indexOf(req.method) > -1) {
    res.writeHead(200, headers);
    var stringifiedInit = JSON.stringify(jsonFile);
    output = JSON.parse(stringifiedInit);
    await getOdds(0);
    await getOdds(1);
    res.write( JSON.stringify(output) );
    
    res.end();
    return;
  }

  res.writeHead(405, headers);
  res.end(`${req.method} is not allowed for the request.`);
}).listen(port);
