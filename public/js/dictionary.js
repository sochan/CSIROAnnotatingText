$(document).ready(function () {

    $.getJSON('/dictionary-api', printTerms);
    $('form').submit(function (e) {
        e.preventDefault();
        $.post('/dictionary-api', {term: $('#term').val(), defined: $('#defined').val()}, printTerms);
        this.reset();
		$('#alertMsg').html('<div align="center" style="color:green">'+"Vocabulary successfully inserted"+'</div>').fadeTo(5000,5000).slideUp(500, function(){});
		
    });

});

function printTerms(terms) {
    $('body>dl').empty();
	var termStrings =[];
    $.each(terms, function () {
        $('<dt>').text(this.term).appendTo('body>dl');
		if(this.term!=undefined){
		termStrings.push(this.term);
		}
		alert(this.term);
        $('<dd>').text(this.defined).appendTo('body>dl');
		
    });
	
    $( "#searchID" ).autocomplete({
      source: termStrings
    });
	
    $('dt').off('dblclick').dblclick(function() {
        $.ajax({
            url: '/dictionary-api/' + $(this).text(),
            type: 'DELETE',
            success: printTerms
        });
    });
}


/* $(function() {
$("#searchID").autocomplete({
			//source:terms
         source: function(req,res) {
            $.ajax({
                //url: "/dictionary-api"+req.term,
                dataType: "jsonp",
                type: "GET",
                data: {
                    term: req.term
                },
                success: function(data) {
                    res($.map(data, function(item) {
                        return {
                            label: item.text,//text comes from a collection of mongo
                            value: item.text
                        };
                    }));
                },
                error: function(xhr) {
                    alert(xhr.status + ' : ' + xhr.statusText);
                }
            });
        },
        select: function(event, ui) {
				} 
    });
}); */

