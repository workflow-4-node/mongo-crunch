"use strict";

let MapReduceBase = require("./mapReduceBase");
let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let _ = require("lodash");
let Collection = require("mongodb").Collection;

function MapReduceToCollBase() {
    MapReduceBase.call(this);

    this.toCollection = null;
    this.nonScopedProperties.add("action");
    this.nonScopedProperties.add("doReduceToCollection");
}

util.inherits(MapReduceToCollBase, MapReduceBase);

Object.defineProperties(MapReduceToCollBase.prototype, {
    action: {
        get: function() {
            // Descendants should override this only ...
            throw new Error("Not implemented!");
        }
    }
});

MapReduceToCollBase.prototype.doReduce = function(callContext, coll, map, reduce, options) {
    this._coll = coll;
    this._map = map;
    this._reduce = reduce;
    this._options = options;
    callContext.schedule(this.toCollection, "_toCollectionGot");
};

MapReduceToCollBase.prototype._toCollectionGot = function(callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let options = this._options;
    if (_.isString(result)) {
        options.out[callContext.activity.action] = result;
    }
    else if (result instanceof Collection) {
        options.out[callContext.activity.action] = result.collectionName;
        options.out.db = result.namespace.substr(0, result.namespace.length - (result.collectionName.length + 1));
    }
    else {
        if (result) {
            callContext.fail(new Error("Invalid toCollection value: " + JSON.stringify(result)));
        }
        else {
            callContext.fail(new Error("Value of toCollection expected."));
        }
        return;
    }

    callContext.activity.doReduceToCollection.call(this, callContext);
};

MapReduceToCollBase.prototype.doReduceToCollection = function(callContext) {
    this._coll.mapReduce(this._map, this._reduce, this._options, function(err, collection) {
        if (err) {
            callContext.fail(err);
        }
        else {
            callContext.complete(collection);
        }
    });
};

module.exports = MapReduceToCollBase;
