var db       = require('../database').connection,
    utils    = require('../util.js');

db.collection('cards', function(error, cards) {
	if (error) throw Error(error);
    exports.db = cards;
    
    exports.add = function(data, callback) {
    	cards.insert(data, function(error, result) {
    		if (error) throw error('Could not create new card', error);
    		callback(result);
    	});
    }
    
    exports.updatePosition = function(data, board, callback) {
        cards.update(
			{_id: new utils.ObjectId(data.cardId), board: board},
			{$set:{position:data.position}},
			{w:1},
			function(error, numberOfResults) {
    			if (error || (numberOfResults != 1)) throw Error('Could not save new card position', error);
    			callback();
    	    }
    	);
    }
    
    exports.updateSize = function(data, board) {
    	cards.update(
			{_id: new utils.ObjectId(data.cardId), board: board},
			{$set:{size:data.size}},
			{w:1},
			function(error, numberOfResults) {
				if (error || (numberOfResults != 1)) throw Error('Could not save new card size', error);
			}
	    );
    }
    
    exports.remove = function(data, board, callback) {
    	cards.remove(
			{_id: new utils.ObjectId(data.cardId), board: board},
			{w:1},
			function(error, numberOfResults) {
    			if (error || (numberOfResults != 1)) throw new Error('Card not deleted');
    			callback();
    		}
    	);
    }
    
    exports.updateColour = function(data, board) {
    	cards.update(
			{_id: new utils.ObjectId(data.cardId), board: board},
			{$set:{cssClass:data.cssClass}},
			{w:1},
			function(error, numberOfResults) {
    			if (error) throw Error('Could not update card colour', error);
    		}
	    );
    }
    
    exports.updateOrder = function(data, board, callback) {
    	cards.update(
			{_id: new utils.ObjectId(data.cardId), board: board},
			{$set:{zIndex:data.zIndex}},
			{w:1},
			function(error, numberOfResults) {
    			if (error) throw Error('Could not save new card zIndex', error);
    			callback();
    		}
	    );
	}
	
	exports.updateContent = function(data, board) {
		cards.update(
			{_id: new utils.ObjectId(data.cardId), board: board},
			{$set:{content:data.content}},
			{w:1},
			function(error, numberOfResults) {
				if (error) throw Error('Could not save new card content', error);
			}
	    );
	}
	
	exports.fetch = function(boardId, callback) {
		cards.find({board: boardId}).batchSize(10).toArray(function(error, cards) {
		    if (error) throw Error('Can not load cards');
		    callback(cards);
		});
	}
});