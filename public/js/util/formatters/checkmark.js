define(['baseformatter'], function(BaseFormatter) {

	var fmt = new BaseFormatter('Check mark', function(noteText) {

			alert("Willing to replate:" + noteText);

	});
    return fmt;

})
