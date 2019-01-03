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



/* DATA ANALYSIS BY MOHAMMED */

var bodyParser = require('body-parser');

var db;

var cloudant;


var dbCredentials = {
    dbName: 'annotator-b'
};

var methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());


function getDBCredentialsUrl(jsonData) {
    var vcapServices = JSON.parse(jsonData);

    // Pattern match to find the first instance of a Cloudant service in
    console.log(vcapServices);
    for (var vcapService in vcapServices) {
        console.log(vcapService);
        if (vcapService.match(/cloudant/i)) {
            return vcapServices[vcapService][0].credentials.url;
        }
    }
}

//console.log(process.env.VCAP_SERVICES);



/*

function initDBConnection() {
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    if (process.env.VCAP_SERVICES) {
        dbCredentials.url = getDBCredentialsUrl(process.env.VCAP_SERVICES);
    } else { //When running locally, the VCAP_SERVICES will not be set

        dbCredentials.url = "https://ebdcae1e-9365-41ed-a418-8212b402e8f9-bluemix:832b9aaf3cf3f743710d220ad4763aea248960261592ed1052600689b88db4b6@ebdcae1e-9365-41ed-a418-8212b402e8f9-bluemix.cloudantnosqldb.appdomain.cloud";
    }

    cloudant = require('cloudant')(dbCredentials.url);

    db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();



// Read All Documents
app.get('/alldocuments', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    readAllDocuemnts(function(data)
    {
        res.send(data);
        res.end();
    });

});



function readAllDocuemnts(callback) {
    db.list({include_docs: true}, function (err, data) {
        josn_data = JSON.stringify(data);
        documents = [];
        console.log(data.total_rows);
        for (var i = 0; i < data.total_rows; i++) {
            documents [i] = data.rows[i]
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

app.get('/adddocument', function (req, res) {

    var sampleDoc = '{"word": "word", "definition": "definition", "dict": "dict"}';
    sampleDoc = JSON.parse(sampleDoc);
    createDocument(sampleDoc, function(data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
        res.end();
    });


});


// search word
app.get('/readdocument', function () {


});

*/

/* END MOHAMMED */


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


app.get('/test', function(req, res){
	res.send('test:' + process.env.ASSISTANT_USERNAME);
	res.end();
});








