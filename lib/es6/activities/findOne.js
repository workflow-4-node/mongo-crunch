"use strict";

let util = require('util');
let Query = require('./query');

function FindOne() {
    Query.call(this);
}

util.inherits(FindOne, Query);

FindOne.prototype.doQuery = function(callContext, query, options) {
    let coll = this.get("getCollection").call(this);
    coll.findOne(query || {}, options, function(err, result) {
        if (err) {
            callContext.fail(err);
        }
        else {
            callContext.complete(result);
        }
    });
}

module.exports = FindOne;