"use strict";
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let pro = Bluebird.promisify;
let createIterator = require("./createIterator");
let config = require("../config");

let misc = {
    flattenMRResult: function(scope, collection) {
        return misc.subDocumentToRoot(scope, collection, "value");
    },
    subDocumentToRoot: async(function*(scope, collection, path) {
        let q = {};
        q[path] = { $exists: true };
        let fields = { _id: 0 };
        fields[path] = 1;
        let aDoc = yield pro(collection.findOne, collection)(q, fields);
        if (aDoc) {
            aDoc = aDoc[path];
            let project = { __originalId: "$_id" };
            let pipeline = [{ $match: q }, { $project: project }];
            for (let key in aDoc) {
                project[key] = "$" + path + "." + key;
            }
            let it = createIterator(scope, collection.aggregate(pipeline, { allowDiskUse: true }));
            let bulk = Bluebird.promisifyAll(collection.initializeOrderedBulkOp({ w: "majority" }));
            let docs;
            let count = 0;
            while (docs = (yield it.nextAsync())) {
                for (let doc of docs) {
                    let originalId = doc.__originalId;
                    delete doc.__originalId;
                    bulk.find({ _id: originalId }).replaceOne(doc);
                    count++;
                }
                if (count >= config.bulkSize) {
                    yield bulk.executeAsync();
                    bulk = Bluebird.promisifyAll(collection.initializeOrderedBulkOp());
                    count = 0;
                }
            }
            if (count) {
                yield bulk.executeAsync();
            }
        }
    })
};

module.exports = misc;