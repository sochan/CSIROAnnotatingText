$(document).ready(function () {

    $.getJSON('/dictionary-get-api', printTerms);
    $('form').submit(function (e) {
        e.preventDefault();
        $.post('/dictionary-api', {term: $('#term').val(), defined: $('#defined').val()}, printTerms);
        this.reset();
		$('#alertMsg').html('<div class="alert alert-success" role="alert">'+"Vocabulary successfully inserted"+'</div>').fadeTo(5000,5000).slideUp(500, function(){});
		
    });

});

function printTerms(terms) {
    $('body>dl').empty();
	var termStrings =[];
    $.each(terms, function () {
        $('<dt>').text(this.term).appendTo('body>dl');
		if(this.term!==undefined){
		termStrings.push(this.term);
		}
	//	alert(this.term);
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




