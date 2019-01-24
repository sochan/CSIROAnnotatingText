var result;
var resultDb;
// insert into database
function selectOneDefinition(docId) {
    $("#div_loading").show();
    $("#td_selected").show().html("");
    var selectedDocument = result[docId];
    selectedDocument.deleted = "0";
    
    // insert
    $.post("/api/core/adddocument", selectedDocument, function (dataAdd) {
        
        var searchword = $("#searchword").val();
        $.get("/api/core/readdocument?searchword=" + searchword, function (data) {
            $("#div_loading").hide();
            $("#td_selected").show().html("");
            resultDb = data; // from DB
            $("#td_selected").show().html(formHtmlDelete(resultDb));
        });
    });
    
}

// insert into database
function deleteOneDefinition(docId) {
    
    $("#div_loading").show();
    $("#td_selected").show().html("");
    var deletedDocument = resultDb[docId];
    deletedDocument.deleted = "1";
    console.log(resultDb);
    // update
    $.post("/api/core/updatedocument", deletedDocument , function (data) {
        var searchword = $("#searchword").val();
        $.get("/api/core/readdocument?searchword=" + searchword, function (readdata) {
            $("#div_loading").hide();
            /* Get definitions from Cached DB */
            $("#td_selected").show().html("");
            resultDb = readdata; // from DB
            $("#td_selected").show().html(formHtmlDelete(resultDb));
        });
    });
}

function formHtmlSelect(data){
    var strResult = "<table class=\"table\"><tbody>";
    var i = 0;
    
    data.forEach(word => {
        i++;
        strResult += "<tr><td>" + i + ") " + word.definition + "<br> Source: <a href='"+ word.link +"'>" + word.dictionary + "</a>"  + "</td><td><button onclick=\"javascript:selectOneDefinition('"+(i-1)+"');\" style=\"float: right;\">Select</button></td></tr>";
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
        strResult += "<tr><td>" + i + ") " + word.definition + "<br> Source: <a href='"+ word.link +"'>" + word.dictionary + "</a>"  + "</td><td><button onclick=\"javascript:deleteOneDefinition('"+(i-1)+"');\" style=\"float: right;\">Delete</button></td></tr>";
    });
    strResult += "</tbody></table>"
    return strResult;
}