"use strict";

let wf4node = require("workflow-4-node");
let CollectionOp = require("./collectionOp");
let util = require("util");
let Activity = wf4node.activities.Activity;

function Query() {
    CollectionOp.call(this);
    this.query = null;
    this.options = null;
    this.nonScopedProperties.add("doQuery");
}

util.inherits(Query, CollectionOp);

Object.defineProperties(Query.prototype, {
    collectionify: {
        value: true,
        enumerable: false
    }
});

Query.prototype.doWork = function (callContext) {
    callContext.schedule([this.query, this.options], "_parsGot");
};

Query.prototype._parsGot = function (callContext, reason, result) {
    if (reason === Activity.states.complete) {
        callContext.activity.doQuery.call(this, callContext, result[0], result[1] || {});
    }
    else {
        callContext.end(reason, result);
    }
};

Query.prototype.doQuery = function(callContext, query, options) {
    callContext.fail(new Error("Not implemented!"));
};

module.exports = Query;
