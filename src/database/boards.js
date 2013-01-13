var database = require('../database').connection,
    utils    = require('../util'),
    sanitize = require('validator').sanitize,
    util     = require('util'),
    events   = require('events');

database.collection('boards', function(error, boards) {
	if (error) throw Error(error)
    exports.db = boards;

    exports.setName = function(id, name, callback) {
    	boards.update(
			{_id: new utils.ObjectId(id.replace('/', ''))},
			{$set:{name:name}},
			{w:1},
			function(error, numberOfResults) {
    			callback(error)
    		}
	    );
    }
});