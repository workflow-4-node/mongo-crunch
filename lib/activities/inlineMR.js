var MapReduceBase = require('./mapReduceBase');
var util = require('util');

function InlineMR() {
    MapReduceBase.call(this);
}

util.inherits(InlineMR, MapReduceBase);

InlineMR.prototype.doReduce = function(callContext, options) {
    var coll = callContext.activity.getCollection(this);
    options.out.inline = 1;
    coll.mapReduce(this.map, this.reduce, options, function(err, result) {
        if (err) {
            callContext.fail(err);
        }
        else {
            callContext.complete(result);
        }
    });
}

module.exports = InlineMR;
