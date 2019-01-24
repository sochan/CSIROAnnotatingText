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
    var getOnlineDictionaries = getDefFromAdaptors(req.body.searchword);
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
 * Data Analysis
 */

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
/**
 * XMLHttRequest from W3School
 * @param {*} url 
 */
function grabUrl(url) {
    var result;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        result = JSON.parse(this.responseText);
      }
    };
    xhttp.open("GET", url, false);
    xhttp.send();

    return result;
  }
// update adaptors' API here
var adaptors = [
    "https://annotatingtext.appspot.com/api/adaptor/dictionary1/?term=",
    "https://annotatingtext.appspot.com/api/adaptor/dictionary2/?term=",
    "https://annotatingtext.appspot.com/api/adaptor/dictionary3/?term=",
    "https://annotatingtext.appspot.com/api/adaptor/dictionary4/?term="
];

/**
 * Get definitions from Adaptors
 * @param {string} searchword 
 */
function getDefFromAdaptors(searchword){
    searchword = searchword.toLowerCase();
    var resultFromAdaptor =[];
    for (var i=0; i < adaptors.length; i++)
    {
        var resUrl = grabUrl(adaptors[i] + searchword);
        if (resUrl.length > 0) //
        {
            if (resUrl[0].definition !== "")
            {
               // isExistedResponse(resUrl);// insert list into Cached if not yet
                resultFromAdaptor.push.apply(resultFromAdaptor, resUrl);
            }
                
        }  
    }
	return resultFromAdaptor;
}

/*
 * End Data Analysis
 */

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

app.get('/api/core/test2', function(req, res){

	//res.setHeader('Content-Type', 'application/json');
	
	
	var wrd = getDefDictionary1("food11");
	
	
	//res.send(wrd);
	if (typeof wrd !== 'undefined')
		res.send("Definition: " + wrd.definition);
	else res.send("Not found");
	//res.send("Test:" + getDBCredentialsUrl(process.env.VCAP_SERVICES));
	res.end();
});


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
    
    var results = getDefFromAdaptors(req.query.searchword);
    res.json(results);

    res.end();
    

});

/*
 * End Testing
 */

module.exports = app;
