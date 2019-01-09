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
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://admin:admin123456@cluster0-shard-00-00-cmwhk.mongodb.net:27017,cluster0-shard-00-01-cmwhk.mongodb.net:27017,cluster0-shard-00-02-cmwhk.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("annotator");
 // var myobj = { name: "Thinesh", password:"thinesh1234",address: "Highway 37" };
  dbo.collection("dictionary").findOne({}, function(err, result) {
    if (err) throw err;
    console.log(result.name);
    db.close();
  });
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
