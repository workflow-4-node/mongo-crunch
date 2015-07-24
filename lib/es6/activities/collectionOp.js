"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let Collection = require("mongodb").Collection;

function CollectionOp() {
    Activity.call(this);

    this.collection = null;
    this.nonScopedProperties.add("doWork");
}

util.inherits(CollectionOp, Activity);

CollectionOp.prototype.getCollection = function() {
    let collection = this.collection;
    if (!(collection instanceof Collection)) {
        throw new Error(`'${collection} is not a Collection instance'`);
    }
    return collection;
};

CollectionOp.prototype.run = function(callContext, args) {
    callContext.schedule(this.collection, "_collectionGot");
};

CollectionOp.prototype._collectionGot = function(callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    this.collection = result;
    callContext.activity.doWork.call(this, callContext);
};

CollectionOp.prototype.doWork = function(callContext){
    callContext.fail(new Error("Not implemented."));
};

module.exports = CollectionOp;