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
      if (this.readyState == 4 && this.status == 200) {
        result = JSON.parse(this.responseText);
      }
    };
    xhttp.open("GET", url, false);
    xhttp.send();

    return result;
  }
// update adaptors' API here
var adaptors = [
   // "https://annotatingtext.appspot.com/api/adaptor/dictionary1/?term=",
    "https://annotatingtext.appspot.com/api/adaptor/dictionary2/?term=",
    "https://annotatingtext.appspot.com/api/adaptor/dictionary3/?term=",
    "https://annotatingtext.appspot.com/api/adaptor/dictionary4/?term="
];

/**
 * Get definitions from Adaptors
 * @param {string} searchword 
 */
function analyseInput(searchword){ 

    var output ={
        origsearchword: searchword,
        suggestsearchword: "",
        error : ""
    }

    var sugword= searchword.toLowerCase();
    sugword = sugword.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_'); // replace sepcial chars with empty char
    sugword = sugword.trim(); // remove spaces

    output.suggestsearchword = sugword;


    var txtLength = output.suggestsearchword.length; // get length 
    
    if(txtLength > 256){
        output.error = "Your search text is too long" 
    }

    return output;
}

module.exports = {
    /**
     * Get definitions from Adaptors
     * @param {string} searchword 
     */
    getDefFromAdaptors: function (searchword) {
        var resultanalyse = analyseInput(searchword); // call analyseInput 
        //console.log(resultanalyse.)
        var resultFromAdaptor = {
            definitions: [],
            error: resultanalyse.error
        };

        // Check error message
        if (resultanalyse.error != "") {
            resultFromAdaptor.error = resultanalyse.error;
            return resultFromAdaptor;
        }

        for (var i = 0; i < adaptors.length; i++) {
            var resUrl = grabUrl(adaptors[i] + resultanalyse.suggestsearchword);
            if (resUrl.length > 0) //
            {
                if (resUrl[0].definition != "") {
                    resultFromAdaptor.definitions.push.apply(resultFromAdaptor.definitions, resUrl);
                }

            }
        }
        return resultFromAdaptor;
    }
};

/*
 * End Data Analysis
 */