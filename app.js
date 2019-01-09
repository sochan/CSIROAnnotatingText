/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var cors = require("cors");
var bodyParser = require("body-parser");
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();


var printTerms=[{}];
var autoSearch=[{}];
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://admin:admin123456@cluster0-shard-00-00-cmwhk.mongodb.net:27017,cluster0-shard-00-01-cmwhk.mongodb.net:27017,cluster0-shard-00-02-cmwhk.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("dictionary").findOne({}, function(err, res) {
    if (err) throw err;
    console.log("Result is "+ res.term);
   client.close();
  });
 // perform actions on the collection object
  //client.close();
  //console.log('Connected to MongoDB');
});
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
