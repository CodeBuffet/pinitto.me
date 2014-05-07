define(['util/formatters/baseformatter'], function(BaseFormatter) {

	var fmt = new BaseFormatter('Check mark', function(card, noteText) {

			var result = "";

			// Split strings in newlines
			var lines = noteText.split("\n");
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if(line.indexOf('[] ') == 0) {
					var strippedLine = line.substring(3, line.length);
					result += '<input type="checkbox" onclick="cardCheckMarkClick(true, \'' + card.attr('id') + '\', \'' + strippedLine + '\')"></input> ' + strippedLine;
				}
				else if(line.indexOf('[x] ') == 0) {
					var strippedLine = line.substring(4, line.length);
					result += '<input type="checkbox" onclick="cardCheckMarkClick(false, \'' + card.attr('id') + '\', \'' + strippedLine + '\')" checked></input> ' + strippedLine;
				}
				else {
					result += line;
				}

				result += "\n<br />";
			};

			return result;

	});
    return fmt;

})

// Yeah I know it's ugly, but it works ;) If a better method can be found then ideas are welcome ;)
window.cardCheckMarkClick = function(check, cardID, textToReplace) {
	var card = $("#" + cardID);
	var textarea = card.find('textarea');
	var noteText = textarea.val();

	if(check) {
		noteText = noteText.replace("[] " + textToReplace, "[x] " + textToReplace);
	}
	else {
		noteText = noteText.replace("[x] " + textToReplace, "[] " + textToReplace);
	}
	textarea.val(noteText);
	textarea.trigger('propertychange');

	return false;
}