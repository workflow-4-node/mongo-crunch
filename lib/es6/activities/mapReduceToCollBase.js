"use strict";

let MapReduceBase = require("./mapReduceBase");
let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let _ = require("lodash");
let Collection = require("mongodb").Collection;
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let config = require("../config");

function MapReduceToCollBase() {
    MapReduceBase.call(this);

    this.output = null;
    this.nonScopedProperties.add("action");
    this.nonScopedProperties.add("doReduceOutput");
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
    this._coll.mapReduce(this._map, this._reduce, this._options, function (err, collection) {
        if (err) {
            callContext.fail(err);
        }
        else if (self.flatten) {
            let doFlatten = async(function*() {
                let q = { value: { $exists: true } };
                let aDoc = yield Bluebird.promisify(collection.findOne, collection)(q, {
                    fields: {
                        _id: 0,
                        value: 1
                    }
                });
                if (aDoc) {
                    aDoc = aDoc.value;
                    let project = { __originalId: "$_id" };
                    let pipeline = [{ $match: q }, { $project: project }];
                    for (let key in aDoc) {
                        project[key] = "$value." + key;
                    }
                    let cursor = Bluebird.promisifyAll(collection.aggregate(pipeline, { allowDiskUse: true }));
                    let bulk = Bluebird.promisifyAll(collection.initializeOrderedBulkOp({ w: "majority" }));
                    let doc;
                    let count = 0;
                    try {
                        while (doc = (yield cursor.nextAsync())) {
                            let originalId = doc.__originalId;
                            delete doc.__originalId;
                            bulk.find({ _id: originalId }).replaceOne(doc);
                            count++;
                            if (count === config.bulkSize) {
                                yield bulk.executeAsync();
                                bulk = Bluebird.promisifyAll(collection.initializeOrderedBulkOp());
                                count = 0;
                            }
                        }
                    }
                    finally {
                        cursor.close();
                    }
                    if (count) {
                        yield bulk.executeAsync();
                    }
                }
            });
            doFlatten()
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
