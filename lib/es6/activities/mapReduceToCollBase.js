"use strict";

let MapReduceBase = require("./mapReduceBase");
let util = require("util");
let _ = require("lodash");
let Collection = require("mongodb").Collection;

function MapReduceToCollBase() {
    MapReduceBase.call(this);

    this.toCollection = null;
    this.nonScopedProperties.add("action");
    this.nonScopedProperties.add("doReduceToCollection");
}

util.inherits(MapReduceToCollBase, MapReduceBase);

MapReduceToCollBase.prototype.action = function() {
    // Descendants should override this only ...
    throw new Error("Not implemented!");
};

MapReduceToCollBase.prototype.doReduce = function(callContext, options) {
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
        options.out[this.action()] = result;
    }
    else if (result instanceof Collection) {
        options.out[this.action()] = result.collectionName;
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

    callContext.activity.doReduceToCollection.call(this, callContext, options);
};

MapReduceToCollBase.prototype.doReduceToCollection = function(callContext, options) {
    callContext.fail(new Error("Not implemented!"));
};

module.exports = MapReduceToCollBase;
