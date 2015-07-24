"use strict";

let util = require('util');
let Query = require('./query');
let UnitOfWork = require('./unitOfWork');
let debug = require("debug")("mongo-crunch:Find");

function Find() {
    Query.call(this);

    this.toArray = false;
}

util.inherits(Find, Query);

Find.prototype.doQuery = function(callContext, query, options) {
    let coll = this.getCollection.call(this);
    query = query || {};
    debug(`Executing query:\n${util.inspect(query)}\noptions:\n${util.inspect(options)}`);
    let cursor = coll.find(query, options);
    if (this.toArray) {
        debug(`Converting cursor to array.`);
        cursor.toArray(function(err, result) {
            debug(`Result documents count: ${result.length}`);
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
        debug(`Registering cursor in context.`);
        UnitOfWork.registerOpenedCursor(this, cursor);
        callContext.complete(cursor);
    }
};

module.exports = Find;