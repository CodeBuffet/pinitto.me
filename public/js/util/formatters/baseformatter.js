define([], function() {

    function BaseFormatter(name, replaceFunction) {
        this.name = name;
        this.replaceFunction = replaceFunction;
        this.format = function(card, noteText) {
        	return this.replaceFunction(card, noteText);
        };
    };
    
    return BaseFormatter;

})
