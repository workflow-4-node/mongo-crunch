"use strict";

let MapReduceBase = require("./mapReduceBase");
let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let _ = require("lodash");
let Collection = require("mongodb").Collection;
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let misc = require("./misc");

function MapReduceToCollBase() {
    MapReduceBase.call(this);

    this.output = null;
    this.nonScopedProperties.add("action");
    this.nonScopedProperties.add("doReduceToCollection");
}

util.inherits(MapReduceToCollBase, MapReduceBase);

Object.defineProperties(MapReduceToCollBase.prototype, {
    action: {
        get: function () {
            // Descendants should override this only ...
            throw new Error("Not implemented!");
        }
    }
});

MapReduceToCollBase.prototype.doReduce = function (callContext, coll, map, reduce, options) {
    this._coll = coll;
    this._map = map;
    this._reduce = reduce;
    this._options = options;
    callContext.schedule(this.output, "_outputGot");
};

MapReduceToCollBase.prototype._outputGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let options = this._options;
    options.out = {};
    if (_.isString(result)) {
        options.out[callContext.activity.action] = result;
    }
    else if (result instanceof Collection) {
        options.out[callContext.activity.action] = result.collectionName;
        options.out.db = result.namespace.substr(0, result.namespace.length - (result.collectionName.length + 1));
    }
    else {
        if (result) {
            callContext.fail(new Error("Invalid output value: " + JSON.stringify(result)));
        }
        else {
            callContext.fail(new Error("Value of output expected."));
        }
        return;
    }

    callContext.activity.doReduceToCollection.call(this, callContext);
};

MapReduceToCollBase.prototype.doReduceToCollection = function (callContext) {
    let self = this;
    self._coll.mapReduce(self._map, self._reduce, self._options, function (err, collection) {
        if (err) {
            callContext.fail(err);
        }
        else if (self.flatten) {
            misc.flattenMRResult(self, collection)
                .then(function () {
                    callContext.complete(collection);
                },
                function (e) {
                    callContext.fail(e);
                });
        }
        else {
            callContext.complete(collection);
        }
    });
};

module.exports = MapReduceToCollBase;
