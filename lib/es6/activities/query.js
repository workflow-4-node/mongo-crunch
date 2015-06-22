"use strict";

let wf4node = require("../../../deps/workflow-4-node");
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

Query.prototype.doWork = function (callContext) {
    callContext.schedule(this.get("query"), "_queryGot");
};

Query.prototype._queryGot = function (callContext, reason, result) {
    if (reason === Activity.states.complete) {
        callContext.activity.doQuery.call(this, callContext, result);
    }
    else {
        callContext.end(reason, result);
    }
};

Query.prototype.doQuery = function(callContext, query) {
    callContext.fail(new Error("Not implemented!"));
};

module.exports = Query;
