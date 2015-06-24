"use strict";

let MapReduceBase = require('./mapReduceBase');
let util = require('util');

function InlineMR() {
    MapReduceBase.call(this);
}

util.inherits(InlineMR, MapReduceBase);

InlineMR.prototype.doReduce = function(callContext, options) {
    let coll = this.get("getCollection").call(this);
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
