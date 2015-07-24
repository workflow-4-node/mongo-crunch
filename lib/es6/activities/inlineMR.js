"use strict";

let MapReduceBase = require('./mapReduceBase');
let util = require("util");

function InlineMR() {
    MapReduceBase.call(this);
}

util.inherits(InlineMR, MapReduceBase);

InlineMR.prototype.doReduce = function(callContext, coll, map, reduce, options) {
    let self = this;
    options.out = { inline: 1 };
    coll.mapReduce(map, reduce, options, function(err, result) {
        if (err) {
            callContext.fail(err);
        }
        else if (this.flatten) {
            callContext.complete(result.map(function(i) { return i.value; }));
        }
        else {
            callContext.complete(result);
        }
    });
};

module.exports = InlineMR;
