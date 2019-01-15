/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

var bodyParser = require('body-parser');

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
app.use(bodyParser.json());


// get the app environment from Cloud Foundry
//var appEnv = cfenv.getAppEnv();


var session = require('express-session');
var CloudantStore = require('connect-cloudant-store')(session);


var cloudantStore = new CloudantStore({
  url: 'https://80e12b37-1fae-4c6e-90ab-bb55c8ead656-bluemix:2c1544fb5218812dc2bc5c78f3be2daf6ad8ac31b9ba54d3204496768c782613@80e12b37-1fae-4c6e-90ab-bb55c8ead656-bluemix.cloudant.com',
  databaseName: 'sessions',
  prefix: ''
});

cloudantStore.on('connect', function() {
  console.log("Cloudant Session store is ready for use");
});

cloudantStore.on('disconnect', function() {
  console.log("An error occurred connecting to Cloudant Session Storage");
});

app.use(session({
  store: cloudantStore,
  secret: 'qwerty12',
  resave: true,
  saveUninitialized: false,
  cookie: {
            maxAge:365*24*60*60*1000,
            expires: false},
}));
var sess;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());





// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  //console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {};

const appEnv = cfenv.getAppEnv(appEnvOpts);


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


app.get('/api/core/test', function(req, res){

	var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
	var str = '';
	for (var vcapService in vcapServices) {
        if (vcapService.match(/cloudant/i)) {
            str = vcapServices[vcapService][0].credentials.url;
        }
    }

	res.send("Test get cloudant service: " + str);
	//res.send("Test:" + getDBCredentialsUrl(process.env.VCAP_SERVICES));
	//res.end();
});


var db;

var cloudant;


var dbCredentials = {
    dbName: 'annotator-b'
};

//var methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
//app.use(methodOverride());


function getDBCredentialsUrl(jsonData) {
    var vcapServices = JSON.parse(jsonData);

    // Pattern match to find the first instance of a Cloudant service in
    for (var vcapService in vcapServices) {
        if (vcapService.match(/cloudant/i)) {
            return vcapServices[vcapService][0].credentials.url;
        }
    }
}

function initDBConnection() {
	/*
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    if (process.env.VCAP_SERVICES) {
        dbCredentials.url = getDBCredentialsUrl(process.env.VCAP_SERVICES);
    } else { //When running locally, the VCAP_SERVICES will not be set


    }
    */

   dbCredentials.url = "https://ebdcae1e-9365-41ed-a418-8212b402e8f9-bluemix:832b9aaf3cf3f743710d220ad4763aea248960261592ed1052600689b88db4b6@ebdcae1e-9365-41ed-a418-8212b402e8f9-bluemix.cloudantnosqldb.appdomain.cloud";

    cloudant = require('cloudant')(dbCredentials.url);

    db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();


function readAllDocuemnts(callback) {
    db.list({include_docs: true}, function (err, data) {
        josn_data = JSON.stringify(data);
        documents = [];
        console.log(data.total_rows);
        for (var i = 0; i < data.total_rows; i++) {
            documents [i] = data.rows[i];
        }
        callback(documents);
    });
    return null;
}

// create a document
function createDocument(document, callback) {
    //var nextDocID = parseInt(getNumDocuments()) + 1;
    //console.log('Doc_2#' + nextDocID);
    word = document.word;
    definition = document.definition;
    dict =  document.dict;
    db.insert({name : word, value: {word: word, definition: definition, dict: dict}}, function (err, data) {
        console.log('Error:', err);
        console.log('Data:', data);
        callback(data);
    });
}

// Read All Documents
app.get('/api/core/allwords', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    readAllDocuemnts(function(data)
    {
        res.send(data);
        res.end();
    });

});

app.get('/api/core/addword', function (req, res) {

    var sampleDoc = '{"word": "word", "definition": "definition", "dict": "dict"}';
    sampleDoc = JSON.parse(sampleDoc);
    createDocument(sampleDoc, function(data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
        res.end();
    });

});

// read/search word
function readDocument(word, callback) {
    var query = {selector: {name: word}};
    db.find(query, function (err, data) {
        console.log('Error:', err);
        console.log('Data:', data);
        callback(data);
    });
}
app.get('/api/core/readword', function (req, res) {
    var result = readDocument("word", function (data) {
            console.log(data);
            res.setHeader('Content-Type', 'application/json');
            res.send(data["docs"]);
            res.end();
        }
    );

});
function updateDocument(word, dict, callback) {
    var query = { selector: { name: word}};
    db.find(query, function(err, data) {
        console.log('Error:', err);
        console.log('Data:', data);
        callback(data);
    });
}
app.get('/api/core/updateword', function (req, res) {
    var result = updateDocument("word" ,"dict", function(data)
        {
            console.log(data);
            res.setHeader('Content-Type', 'application/json');
            res.send(data["docs"]);
            res.end();
        }
    );

});

module.exports = app;
