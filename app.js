/*eslint-env node*/

// Call other components

//var analysis = require('./components/dataanalysis');

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

var bodyParser = require('body-parser');

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// Call Python
//const spawn = require("child_process").spawn;

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
/*
// Endpoin to call Python
app.get('/api/data/callpy', function(req, res){
    const pythonProcess = spawn('python',["./public/NLP/hello.py", " Sample Search Text"]);
    pythonProcess.stdout.on('data', (data) => {
        // Do something with the data returned from python script
        res.send(data);
        res.end();
    });
});
*/
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


///////////////////// Connect to Adaptor 
var axios = require('axios');

function concatarray(arr1, arr2){
    var myresult = arr1;
    if (arr2.length >0){
        if (arr2[0].definition != "")
            myresult = myresult.concat(arr2);
    }
    return myresult;
}

function analyseInput(searchword){ 

    var output ={
        origsearchword: searchword,
        suggestsearchword: "",
        error : ""
    };

    var sugword= searchword.toLowerCase();
    sugword = sugword.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_'); // replace sepcial chars with empty char
    sugword = sugword.trim(); // remove spaces

    output.suggestsearchword = sugword;


    var txtLength = output.suggestsearchword.length; // get length 
    
    if(txtLength > 256){
        output.error = "Your search text is too long";
    }

    return output;
}


var allAdaptors = [ 'https://annotatingtext.appspot.com/api/adaptor/dictionary5/?term=',
                    'https://annotatingtext.appspot.com/api/adaptor/dictionary2/?term=',
                    'https://annotatingtext.appspot.com/api/adaptor/dictionary3/?term=',
                    'https://annotatingtext.appspot.com/api/adaptor/dictionary4/?term='];

const GetDefinitions = async(searchText, callback)=> {
    // Get words from fielter
    var words = FilterInput(searchText);
    var requestManyAxios = [];
    for(var i =0; i< allAdaptors.length; i++){
        for (var j =0; j< words.length; j++){
            requestManyAxios.push(axios.get(allAdaptors[i] + words[j]))
        }
    }
    
    try{
        var responses = await axios.all(requestManyAxios);
        callback(responses);
    } catch (err){
        callback(err);
    }
}

app.get('/api/core/definitions', function (req, res){
    var resultFromAdaptor = {
        definitions: [],
        error: ""
    };
    var searchword = req.query.searchword;
    GetDefinitions(searchword, function(dataFromAdaptor){
        for (var i = 0; i < dataFromAdaptor.length; i++)
        {
            resultFromAdaptor.definitions = concatarray(resultFromAdaptor.definitions, dataFromAdaptor[i].data);
        }
        res.send(resultFromAdaptor);
        res.end();
    });
});


///////////////////// 

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
 * Natural Language Understanding
 */


const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');

const stopWord = require('stopword');

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2019-04-02',
  iam_apikey: 'YZ3C9wBFRz5CkDSbewAXnzAmk6C4zgLNbMT27rNBLZjq',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api'
});

app.get('/api/data/nlpanalyse', function(req, res){
	
	var searchText = req.query.searchword;
    const analyzeParams = {
        'text': searchText,
        //'url' : 'www.ibm.com',
        'features': {
          'entities': {
            'emotion': true,
            'sentiment': true,
            'limit': 2,
          },
          'keywords': {
            'emotion': true,
            'sentiment': true,
            'limit': 5,
          },
        },
      };
      
      
      naturalLanguageUnderstanding.analyze(analyzeParams)
        .then(analysisResults => {
            
            res.send(JSON.stringify(analysisResults, null, 2));
            res.end();
        })
        .catch(err => {
            res.send ("ERR:", err);
            res.end();
        });
});

// Remove stopwords with Stopword of NodeJS 
// https://www.npmjs.com/package/stopword

function FilterInput(searchText){
    return stopWord.removeStopwords(searchText.split(' '));
}

app.get('/api/data/removestopwords', function(req, res){
    
    const oldStr = 'a really Interesting string with some words';

    res.send(FilterInput(oldStr));
    res.end();

    // newString is now [ 'really', 'Interesting', 'string', 'words' ]
});


/*
* End Natural Language Understanding
*/


/*
 * Testing
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


app.get('/api/core/test3', function(req, res){
    var str = "fooD";
    str = str.toLowerCase();
    var upper = str.replace(/^\w/, function (chr) {
        return chr.toUpperCase();
      });

    res.send(upper);
    res.end();
});


/*
 * End Testing
 */


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
  });
  

module.exports = app;
