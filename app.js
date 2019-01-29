/*eslint-env node*/

// Call other components

var analysis = require('./components/dataanalysis');

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
var appEnv = cfenv.getAppEnv();


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


var db;

var cloudant;


var dbCredentials = {
    dbName: 'annotator-b'
};

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

/*
 * CORE
 */


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

    cloudant = require('cloudant')(dbCredentials.url)

    db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();


function readAllDocuemnts(callback) {
    db.list({include_docs: true}, function (err, data) {
       var josn_data = JSON.stringify(data);
       var documents = [];
        for (var i = 0; i < data.total_rows; i++) {
            documents [i] = data.rows[i];
        }
        callback(documents);
    });
    return null;
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

function readAllLabels(callback) {
    db.list({include_docs: true}, function (err, data) {
       var josn_data = JSON.stringify(data);
       var labels = [];

       data.rows.forEach(element => {
            var lbl = element.doc.label;
            console.log(lbl);
            if (labels.indexOf(lbl) === -1) // not exist
                labels.push(lbl);
         });
        callback(labels);
    });
    return null;
}
// Read All Documents
app.get('/api/core/alllabels', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    readAllLabels(function(data)
    {
        res.send(data);
        res.end();
    });

});




// create a document
/**
 * It is used to insert new
 * @param {document} document
 * @param {*} callback 
 */
function createDocument(document, callback) {
    db.insert({
        "label": document.label,
        "definition": document.definition,
        "dictionary": document.dictionary,
        "deleted": document.deleted,
        "link": document.link
    }, function (err, data) {
        callback(data);
    });
}

app.post('/api/core/adddocument/', function (req, res) {
    var document = req.body;
    createDocument(document, function(data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
        res.end();
    });
});

function readLabels(callback){

}

// read/search word, seleted, not deleted
function readDocument(word, callback) {
    var searchWord = word.toLowerCase();//correctSearchWord(word);
    var query = {selector: {label: searchWord, deleted:"0"}};
    db.find(query, function (err, data) {
        callback(data);
    });
}

app.get('/api/core/readdocument', function (req, res) {
    var result = readDocument(req.query.searchword, function (data) { //req.body.searchword
            res.setHeader('Content-Type', 'application/json');
            res.send(data["docs"]);
            res.end();
        }
    );
});


app.post('/api/core/connectonlinedictionary', function(req, res){
    var getOnlineDictionaries = analysis.getDefFromAdaptors(req.body.searchword);
    res.send(getOnlineDictionaries);
    res.end();
});

function readDocumentById(docId, callback) {
    var query = {selector: {_id: docId, deleted: "0"}};
    db.find(query, function (err, data) {
        callback(data);
    });
}

app.get('/api/core/getdocumentbyid', function (req, res) {
    var result = readDocumentById(req.query._id, function (data) { //req.body.searchword
        res.setHeader('Content-Type', 'application/json');
        res.send(data["docs"][0]);
        res.end();
    });
});

function updateDocument(document, callback) {
     db.insert({"_id":document._id, "_rev": document._rev, "label": document.label, "definition": document.definition, "dictionary": document.dictionary,"link":document.link, "deleted" : document.deleted}, function (err, data) {
        callback(data);
    });

}

app.post('/api/core/updatedocument', function (req, res) {
    var document = req.body;
    var result = updateDocument(document, function(data)
        {
            res.send("DONE");
            res.end();
        }
    );
});


// check existed document 
/**
 * 
 * @param [{
 *  label: "",
 *  definition: "",
 *  link: "",
 *  dictionary: ""
 * }] documents 
 * @param {*} callback 
 */
function isExisted(documents, callback){
    var document = documents[0];
    var query = { selector: { label: document.label, link: document.link}};
    db.find(query, function(err, data){
        callback(data);
    });
}

/**
 * Check existed if not insert
 * @param {*} doc 
 */
function isExistedResponse(documents){
    
    var result = isExisted(documents, function (data) {
        if (data["docs"].length === 0) // not exist then insert
        {
            documents.forEach(doc => {
                createDocument(doc, function(data){

                });
            });
        }
    });
}

/*
 *  End Core
 */



/*
 * Testing
 */

app.get('/api/core/test1', function(req, res){

	//res.setHeader('Content-Type', 'application/json');
	
	
	var wrd = getDefDictionary1("food");
	
	
	//res.send(wrd);
	if (wrd !== "")
		res.send("Definition: " + wrd.definition);
	else res.send("Not found");
	//res.send("Test:" + getDBCredentialsUrl(process.env.VCAP_SERVICES));
	res.end();
});
/**
 * correct searched word input for example 'fooD' to 'Food'
 * @param {string} searchWord 
 */

function correctSearchWord(searchWord){
    var str = searchWord.toLowerCase();
    var upper = str.replace(/^\w/, function (chr) {
        return chr.toUpperCase();
      });
    return upper;
}




app.get('/api/core/test3', function(req, res){
    var str = "fooD";
    str = str.toLowerCase();
    var upper = str.replace(/^\w/, function (chr) {
        return chr.toUpperCase();
      });

    res.send(upper);
    res.end();
});


app.get('/api/core/test4', function(req, res){
    
    var results = analysis.getDefFromAdaptors(req.query.searchword);
    res.json(results);

    res.end();
    

});

/*
 * End Testing
 */

module.exports = app;
