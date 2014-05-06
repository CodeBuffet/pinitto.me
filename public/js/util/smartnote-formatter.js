/*
	SmartNote - feature implementation of https://github.com/pinittome/pinitto.me/issues/109
	Author: Peter Willemsen <peter@codebuffet.co>

	This file is higly modular, you can create new formatters in util/formatters and add those to the formatters array.

*/

define(['formatters/checkmark'], function(checkmark) {
    
	var formatters = [checkmark]

    return function formatText(noteText) {
    	for(var i = 0; i < formatters.length; i++) {
    		noteText = formatters[i].format(noteText);
    	}
    };

})
