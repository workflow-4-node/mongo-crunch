"use strict";

let util = require('util');
let Activity = require("../../deps/workflow-4-node").activities.Activity;
let Collection = require('mongodb').Collection;

function CollectionOp() {
    Activity.call(this);

    this.collection = null;
    this.nonScopedProperties.add('getCollection');
    this.nonScopedProperties.add('doWork');
}

util.inherits(CollectionOp, Activity);

CollectionOp.prototype.getCollection = function(scope) {
    let collection = scope.get('collection');
    if (!(collection instanceof Collection)) throw new Error('MongoDB collection \'' + collection + '\' doesn\'t exists.');
    return collection;
};

CollectionOp.prototype.run = function(callContext, args) {
    callContext.schedule(this.get('collection'), '_collectionGot');
}

CollectionOp.prototype._collectionGot = function(callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    callContext.activity.doWork.call(this, callContext);
}

CollectionOp.prototype.doWork = function(callContext){
    callContext.fail(new Error("Not implemented."));
}

module.exports = CollectionOp;