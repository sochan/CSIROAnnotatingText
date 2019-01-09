
/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();



//var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
//var app = express();


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
/*
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
*/


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
	console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
	next();
});

//app.use(express.static("./public"));

app.use(cors());

app.get("/dictionary-api", function(req, res) {
	//res.json(skierTerms);
	//console.log(req.body);
	const client = new MongoClient(uri, { useNewUrlParser: true });
	client.connect(err => {
	const collection = client.db("test").collection("dictionary").find({}).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result);
	autoSearch.push(result);
	res.json(result);
   client.close();
  });
}); 
	//autoSearch.push(req.body);
	//res.json(autoSearch);
});

app.post("/dictionary-api", function(req, res) {
    //skierTerms.push(req.body);
	//res.json(skierTerms);
	var words=req.body;
	//printTerms.push(req.body);
	console.log(req.body);
	//res.json(req.body);
    const client = new MongoClient(uri, { useNewUrlParser: true });
	client.connect(err => {
	const collection = client.db("test").collection("dictionary").insertOne(req.body, function(err, resp) {
    if (err) throw err;
    console.log("1 vocabulary inserted");
	//autoSearch.push(req.body);
	//res.json(printTerms);
   client.close();
  });
});
	client.connect(err => {
	const collection = client.db("test").collection("dictionary").find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
	printTerms.push(result);
	res.json(result);
	console.log(req.body);
   client.close();
});
});
});

app.delete("/dictionary-api/:term", function(req, res) {
    skierTerms = skierTerms.filter(function(definition) {
        return definition.term.toLowerCase() !== req.params.term.toLowerCase();
    });
    res.json(skierTerms);
});

/*var http = require('http');
var options = {
  host: 'www.google.com',
  path: '/index.html'
};

var req = http.get(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));

  // Buffer the body entirely for processing as a whole.
  var bodyChunks = [];
  res.on('data', function(chunk) {
    // You can process streamed parts here...
    bodyChunks.push(chunk);
  }).on('end', function() {
    var body = Buffer.concat(bodyChunks);
    console.log('BODY: ' + body);
    // ...and/or process the entire body here.
  })
});

req.on('error', function(e) {
  console.log('ERROR: ' + e.message);
});
*/
app.listen(appEnv.port);

//console.log("Express app running on port 3000");

module.exports = app;


//app.set('port',process.env.PORT);

// start server on the specified port and binding host
//app.listen(process.env.PORT, '0.0.0.0', function() {
  // print a message when the server starts listening
  //console.log("server starting on " + appEnv.url);
//});
