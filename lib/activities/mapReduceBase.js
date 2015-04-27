var util = require('util');
var Activity = require('workflow-4-node').activities.Activity;
var CollectionOp = require('./collectionOp');
var _ = require('lodash');

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

    this.codeProperties.add('map');
    this.codeProperties.add('reduce');
    this.codeProperties.add('finalize');
    this.nonScopedProperties.add('map');
    this.nonScopedProperties.add('reduce');
    this.nonScopedProperties.add('finalize');
    this.nonScopedProperties.add('doReduce');
    this.nonScopedProperties.add('sharded');
    this.nonScopedProperties.add('nonAtomic');
}

util.inherits(CollectionOp, Activity);

MapReduceBase.prototype.doWork = function(callContext) {
    callContext.schedule(
        this.get('query'),
        this.get('sort'),
        this.get('limit'),
        this.get('scope'),
        '_parsGot'
    );
}

MapReduceBase.prototype._parsGot = function(callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    if (!_.isFunction(this.map) && !_.isString(this.map)) throw new TypeError("Map function is not a function.");
    if (!_.isFunction(this.reduce) && !_.isString(this.reduce)) throw new TypeError("Reduce function is not a function.");
    if (this.finalize) {
        if (!_.isFunction(this.finalize) && !_.isString(this.finalize)) throw new TypeError("Finalize function is not a function.");
    }

    var query = result[0];
    var sort = result[1];
    var limit = result[2];
    var scope = result[3];

    callContext.activity.doReduce.call(this, callContext,
        {
            query: query,
            sort: sort,
            limit: limit,
            scope: scope,
            out: { sharded: this.sharded, nonAtomic: this.nonAtomic }
        });
}

MapReduceBase.prototype.doReduce = function(callContext, options) {
    callContext.fail(new Error("Not implemented"));
}

module.exports = MapReduceBase;
