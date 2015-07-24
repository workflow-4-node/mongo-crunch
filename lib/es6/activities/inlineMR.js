"use strict";

let MapReduceBase = require('./mapReduceBase');
let util = require("util");

function InlineMR() {
    MapReduceBase.call(this);
}

util.inherits(InlineMR, MapReduceBase);

InlineMR.prototype.doReduce = function(callContext, coll, map, reduce, options) {
    options.out = { inline: 1 };
    coll.mapReduce(map, reduce, options, function(err, result) {
        if (err) {
            callContext.fail(err);
        }
        else {
            callContext.complete(result.map(function(i) { return i.value; }));
        }
    });
};

module.exports = InlineMR;
