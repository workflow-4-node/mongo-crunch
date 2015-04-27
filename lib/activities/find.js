var util = require('util');
var Query = require('./query');
var MongoDBContext = require('./mongoDBContext');

function Find() {
    Query.call(this);

    this.toArray = false;
}

util.inherits(Find, Query);

Find.prototype.doQuery = function(callContext, query) {
    var coll = callContext.activity.getCollection(this);
    var cursor = coll.find(query || {}, this.get('options'));
    if (this.get("toArray")) {
        cursor.toArray(function(err, result) {
            if (err) {
                callContext.fail(err);
            }
            else {
                callContext.complete(result);
            }
            cursor.close();
        });
    }
    else {
        MongoDBContext.registerOpenedCursor(this, cursor);
        callContext.complete(cursor);
    }
}

module.exports = Find;