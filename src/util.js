var crypto = require('crypto')

exports.inArray = function(needle, haystack) {
    for (var i = 0; i < haystack.length; i++) {
        if (needle == haystack[i]) return true
    }
    return false
}

exports.hashPassword = function(password, callback) {
    var algorithm = 'sha256';
    var hash, hmac;

    hmac = crypto.createHmac(algorithm, config.password.salt);

    // change to 'binary' if you want a binary digest
    hmac.setEncoding('hex');

    // write in the text that you want the hmac digest for
    hmac.write(password);

    // you can't read from the stream until you call end()
    hmac.end();

    // read out hmac digest
    hash = hmac.read(); 

    callback(hash);   
}

exports.totals = { cards: 0, boards: 0, sockets: 0 }

exports.ObjectId = require('mongodb').ObjectID
