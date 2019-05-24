var result;
var resultDb;
//
function alreadySelected(definition){
    var existed = false;

    resultDb.forEach(element => {

        if (element.definition === definition)
        {
            existed = true;
        }
    });
    return existed;
}
// Scan in online result for id
function lookingDefinitionIdInOnline(definition){
    var id = -1

    for (var i=0; i < result.length; i++)
    {
        var element = result[i];
        if (element.definition === definition)
        {
           id = i;
        }
    }
    return id;
}

// insert into database
function selectOneDefinition(docId) {
    $("#div_loading").show();
    $("#td_selected").show().html("");
    var selectedDocument = result[docId];
    selectedDocument.deleted = "0";
    
    // insert
    $.post("/api/core/adddocument", selectedDocument, function (dataAdd) {

        //var searchword = $("#searchword").val();
        var searchword = selectedDocument.definition.label;
        $.get("/api/core/readdocument?searchword=" + searchword, function (data) {


            $("#div_loading").hide();
            $("#td_selected").show().html("");
            resultDb = data; // from DB
            $("#td_selected").show().html(formHtmlDeleteCard(resultDb));
        });
    });

    $("#select_"+ docId).html("");// Hide button
}

// insert into database
function deleteOneDefinition(docId) {
    
    $("#div_loading").show();
    $("#td_selected").show().html("");
    var deletedDocument = resultDb[docId];
    deletedDocument.deleted = "1";
    
    //console.log(resultDb);
    // update
    $.post("/api/core/updatedocument", deletedDocument , function (data) {
        //var searchword = $("#searchword").val();
        var searchword = deletedDocument.definition.label;
        $.get("/api/core/readdocument?searchword=" + searchword, function (readdata) {
            $("#div_loading").hide();
            /* Get definitions from Cached DB */
            $("#td_selected").show().html("");
            resultDb = readdata; // from DB
            $("#td_selected").show().html(formHtmlDeleteCard(resultDb));

            // dispay select button
            var deleteId = lookingDefinitionIdInOnline(deletedDocument.definition);
            $("#select_"+deleteId).html("<a href=\"javascript:selectOneDefinition('"+deleteId+"');\">SELECT</a>")
        });
    });
}

function formHtmlSelect(data){
    var strResult = "<table class=\"table\"><tbody>";
    var i = 0;
    
    data.forEach(word => {
        i++;
        var btnSelect = "<button onclick=\"javascript:selectOneDefinition('"+(i-1)+"');\" style=\"float: right;\">Select</button>";
        var alreadySave = alreadySelected(word.definition);
        //console.log(i + "; " + alreadySave);
        if (alreadySave)
            btnSelect = "";
        strResult += "<tr><td>" + i + ") " + word.definition + "<br> Label: "+word.label+"<br> Source: <a href='"+ word.link +"'>" + word.dictionary + "</a>"  +
         "</td><td><div id='select_"+(i-1)+"'>"+btnSelect+"</div></td></tr>";
    });
    strResult += "</tbody></table>"
    return strResult;
}


function formHtmlDelete(data){
    //console.log(data);
    var strResult = "<table class=\"table\"><tbody>";
    var i = 0;
    
    data.forEach(word => {
        i++;
        strResult += "<tr><td>" + i + ") " + word.definition + "<br> Source: <a href='"+ word.link +"'>" 
        + word.dictionary + "</a>"  + "</td><td><button onclick=\"javascript:deleteOneDefinition('"+(i-1)
        + "');\" style=\"float: right;\">Delete</button></td></tr>";
    });
    strResult += "</tbody></table>"
    return strResult;
}

function dispayCategories(categories){
    //console.log(categories);
    var str = "";
    for(var i =0; i < categories.length; i++){
        str += "<div title='Matching category and score from IBM Natural Language Understanding.'>"+categories[i].label 
        + "<span>" 
            + " (" + categories[i].score +")"
        + "</span></div>";
       
    }
    return str;
}

function createSelectCard(document, id){

   
    var btnSelect = "<a href=\"javascript:selectOneDefinition('"+id+"');\">SELECT</a>";
    var alreadySave = alreadySelected(document.definition);
    if (alreadySave)
        btnSelect = "";
    var strResult =  "<div class=\"row\">"
                        + "<div class=\"col s12 m15\">"
                            + "<div class=\"card blue-grey darken-1\">"
                                + "<div class=\"card-content white-text\">"
                                    + "<span class=\"card-title\"><a rel=\"noopener noreferrer\" target=\"_blank\" href=\""+ document.link+"\">" + document.label + "</a></span>"
                                    + "<p>" + document.definition + "</p>"
                                + "</div>"
                                + "<div>"
                                + "Original source: <a rel=\"noopener noreferrer\" target=\"_blank\" href=\""+ document.link+"\">" + document.dictionary + "</a>"
                                + "</div>"
                                + "<div>Categories:</div>" 
                                + dispayCategories(document.categories)
                                + "<div class=\"card-action\">"
                                    + "<div id='select_"+id+"'>" + btnSelect + "</div>"
                                + "</div>"
                            + "</div>"
                        + "</div>"
                    + "</div>";
    return strResult;
}

function formHtmlSelectCard(data){
    var strResult = "";
    var i= 0;
    
    data.forEach(word => {
        strResult += createSelectCard(word, i);
        i++;
    });
    
    return strResult;
}

function createDeleteCard(document, id){

    var btnSelect = "<a href=\"javascript:deleteOneDefinition('"+id+"');\">DELETE</a>";

    var strResult =  "<div class=\"row\">"
                        +"<div class=\"col s12 m15\">"
                            +"<div class=\"card blue-grey darken-1\">"
                                +"<div class=\"card-content white-text\">"
                                    +"<span class=\"card-title\"><a rel=\"noopener noreferrer\" target=\"_blank\" href=\""+ document.link+"\">" + document.label + "</a></span>"
                                    +"<p>" + document.definition + "</p>"
                                +"</div>"
                                +"<div>"
                                + "Dictionary: " + document.dictionary
                                +"</div>"
                                +"<div class=\"card-action\">"
                                    +"<div id='select_"+id+"'>"+btnSelect+"</div>"
                                +"</div>"
                            +"</div>"
                        +"</div>"
                    +"</div>";
    return strResult;
}

function formHtmlDeleteCard(data){
    var strResult = "";
    var i= 0;
    data.forEach(word => {
        strResult += createDeleteCard(word, i);
        i++;
    });
    return strResult;
}

function getSelectedDictionaries(){
    var dictionaries = document.getElementsByName('dictionary');
    var selectDics = "";
    for(var i=0; dictionaries[i]; ++i){
        if(dictionaries[i].checked){
             selectDics  += dictionaries[i].value + ";";
        }
  }

    return selectDics;
}

// https://stackoverflow.com/questions/8644428/how-to-highlight-text-using-javascript
function highlight(word, definition, controlId) {
    var inputText = document.getElementById(controlId);
    var innerHTML = inputText.innerHTML;
    var index = innerHTML.indexOf(word);
    if (index >= 0) { 
        innerHTML = innerHTML.substring(0,index) 
        + "<span name='mykeyword' title='"+definition+"' class='highlight'>" 
        + innerHTML.substring(index,index+word.length) + "</span>" 
        + innerHTML.substring(index + word.length);
        inputText.innerHTML = innerHTML;
    }
  }

// get list of best definitions related to each keyword
// https://stackoverflow.com/questions/4020796/finding-the-max-value-of-an-attribute-in-an-array-of-objects
// 
function getBestMatchDefinition(dataFromIBM){
    var result = [];
    var keywords = dataFromIBM.keywords;
    // loop in dataFromIBM
    for(var i=0; i < keywords.length; i++){
        var word = keywords[i];
        
        // get array
        var tempArray = cleanOneKeyword(word, dataFromIBM);

        // get max score
        var maxScore = Math.max.apply(Math, tempArray.map(function(o) { return o.score; }));

        // get definition
        var bestDefinition = tempArray.find(function(o){ return o.score == maxScore; })
        result.push(bestDefinition);
    }

    return result;
}

// Clean array for one keyword;
// After getting all definitions for one word, we can get one definition that has the highest score
function cleanOneKeyword(word, dataFromIBM){
    var arrayOneWord =[];
    dataFromIBM.definitions.forEach(def => {
        var oneDefinition = {
            "label": word,
            "definition": "",
            "link": "",
            "dictionary": "",
            "category": "",
            "score": 0
        }
        if (def.label == word && def.categories.length>0){
            oneDefinition.definition = def.definition;
            oneDefinition.link = def.link;
            oneDefinition.dictionary = def.dictionary;
            oneDefinition.category = def.categories[0].label;
            oneDefinition.score = def.categories[0].score;

            arrayOneWord.push(oneDefinition);

        }
            
    });
    return arrayOneWord;
}