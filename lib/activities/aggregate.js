"use strict";

let CollectionOp = require('./collectionOp');
let util = require('util');
let Activity = require("../../deps/workflow-4-node").activities.Activity;
let _ = require('lodash');
let MongoDBContext = require('./mongoDBContext');

function Aggregate() {
    CollectionOp.call(this);
    this.pipeline = null;
    this.options = null;
    this.toArray = false;
}

util.inherits(Aggregate, CollectionOp);

Aggregate.prototype.doWork = function (callContext) {
    callContext.schedule(this.get('pipeline'), '_pipelineGot');
};

Aggregate.prototype._pipelineGot = function (callContext, reason, result) {
    if (result === Activity.states.complete) {
       if (_.isPlainObject(result) || _.isArray(result)) {
           let coll = callContext.activity.getCollection(this);
           let cursor = coll.aggregate(result, this.get("options"));
           if (this.get("toArray")) {
               cursor.toArray(function(err, result) {
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
               MongoDBContext.registerOpenedCursor(this, cursor);
               callContext.complete(cursor);
           }
       }
       else {
           if (result)
            callContext.fail(new Error("Aggregation pipeline expected."));
           else
               callContext.fail(new Error("Invalid aggregation pipeline:" + JSON.stringify(result)));
       }
    }
    else {
        callContext.end(reason, result);
    }
}

module.exports = Aggregate;
