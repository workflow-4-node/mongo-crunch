"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let CollectionOp = require("./collectionOp");
let _ = require("lodash");

function MapReduceBase() {
    CollectionOp.call(this);

    this.map = null;
    this.reduce = null;
    this.finalize = null;
    this.query = null;
    this.sort = null;
    this.limit = null;
    this.scope = null;
    this.sharded = true;
    this.nonAtomic = false;

    this.codeProperties.add("map");
    this.codeProperties.add("reduce");
    this.codeProperties.add("finalize");
    this.nonScopedProperties.add("sharded");
    this.nonScopedProperties.add("nonAtomic");
}

util.inherits(MapReduceBase, CollectionOp);

MapReduceBase.prototype.doWork = function (callContext) {
    callContext.schedule([
            this.query,
            this.sort,
            this.limit,
            this.scope,
            this.map,
            this.reduce,
            this.finalize
        ],
        "_parsGot"
    );
};

MapReduceBase.prototype._parsGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let query = result[0];
    let sort = result[1];
    let limit = result[2];
    let scope = result[3];
    let map = result[4];
    let reduce = result[5];
    let finalize = result[6] || undefined;

    if (!_.isFunction(map) && !_.isString(map)) {
        throw new TypeError("Map function is not a function.");
    }
    if (!_.isFunction(reduce) && !_.isString(reduce)) {
        throw new TypeError("Reduce function is not a function.");
    }
    if (!_.isUndefined(finalize) && !_.isFunction(finalize) && !_.isString(finalize)) {
        throw new TypeError("Finalize function is not a function.");
    }

    let coll = this.getCollection.call(this);

    callContext.activity.doReduce.call(this, callContext, coll, map, reduce,
        {
            query: query,
            sort: sort,
            limit: limit,
            scope: scope,
            finalize: this.finalize,
            sharded: this.sharded,
            nonAtomic: this.nonAtomic
        });
};

MapReduceBase.prototype.doReduce = function (callContext, options) {
    callContext.fail(new Error("Not implemented."));
};

module.exports = MapReduceBase;
