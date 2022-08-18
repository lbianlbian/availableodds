const solanaWeb3 = require('@solana/web3.js');
var jsonFile = require('./initGames.json');

var connection = new solanaWeb3.Connection("https://devnet.genesysgo.net/", "confirmed");
var programID = new solanaWeb3.PublicKey("M8WYXm9YGPcBqt8QpAMgZXbMFjVXeTyMrQ94pAtkitK");



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
    //await getOdds(0);
    //await getOdds(1);
    res.write( JSON.stringify(output) );
    
    res.end();
    return;
  }

  res.writeHead(405, headers);
  res.end(`${req.method} is not allowed for the request.`);
}).listen(port);
