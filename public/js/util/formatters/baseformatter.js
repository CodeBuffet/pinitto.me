define([], function() {

    function BaseFormatter(name, replaceFunction) {
        this.name = name;
        this.replaceFunction = replaceFunction;
        this.format = function(noteText) {
        	return this.replaceFunction(noteText);
        };
    };
    
    return BaseFormatter;

})
