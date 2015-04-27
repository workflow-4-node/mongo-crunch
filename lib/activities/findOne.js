var util = require('util');
var Query = require('./query');

function FindOne() {
    Query.call(this);
}

util.inherits(FindOne, Query);

FindOne.prototype.doQuery = function(callContext, query) {
    var coll = callContext.activity.getCollection(this);
    coll.findOne(query || {}, this.get('options'), function(err, result) {
        if (err) {
            callContext.fail(err);
        }
        else {
            callContext.complete(result);
        }
    });
}

module.exports = FindOne;