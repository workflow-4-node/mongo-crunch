"use strict";
let wf4node = require("workflow-4-node");
let CollectionOp = require("./collectionOp");
let util = require("util");
let Activity = wf4node.activities.Activity;
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");
let debug = require("debug")("mongo-crunch:Aggregate");

function Aggregate() {
    CollectionOp.call(this);
    this.pipeline = null;
    this.options = null;
    this.toArray = false;
}

util.inherits(Aggregate, CollectionOp);

Aggregate.prototype.doWork = function (callContext) {
    callContext.schedule(this.pipeline, "_pipelineGot");
};

Aggregate.prototype._pipelineGot = function (callContext, reason, result) {
    if (reason === Activity.states.complete) {
        if (_.isPlainObject(result) || _.isArray(result)) {
            let coll = this.getCollection.call(this);
            let options = this.options || {};
            if (_.isUndefined(options.allowDiskUse)) {
                options.allowDiskUse = true;
            }
            debug(`Executing aggregate:\n${util.inspect(result)}\noptions:\n${util.inspect(options)}`);
            let cursor = coll.aggregate(result, options);
            if (this.toArray) {
                debug("Converting cursor to array.");
                cursor.toArray(function (err, _result) {
                    if (err) {
                        debug("toArray failed.");
                        callContext.fail(err);
                    }
                    else {
                        debug(`${_result.length} documents got.`);
                        callContext.complete(_result);
                    }
                    cursor.close();
                });
            }
            else {
                debug(`Registering cursor in the context.`);
                UnitOfWork.registerOpenedCursor(this, cursor);
                callContext.complete(cursor);
            }
        }
        else {
            if (result) {
                callContext.fail(new Error("Aggregation pipeline expected."));
            }
            else {
                callContext.fail(new Error("Invalid aggregation pipeline:" + JSON.stringify(result)));
            }
        }
    }
    else {
        callContext.end(reason, result);
    }
};

module.exports = Aggregate;
