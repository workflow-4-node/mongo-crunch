"use strict";
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let createIterator = require("./createIterator");
let config = require("../config");
let _ = require("lodash");

let misc = {
    flattenMRResult: function(scope, collection) {
        return misc.subDocumentToRoot(scope, collection, "value");
    },
    subDocumentToRoot: async(function*(scope, collection, path) {
        let q = {};
        q[path] = { $exists: true };
        let fields = { _id: 0 };
        fields[path] = 1;
        let aDoc = yield collection.findOne(q, fields);
        if (aDoc) {
            aDoc = aDoc[path];
            let project = { __originalId: "$_id" };
            let pipeline = [{ $match: q }, { $project: project }];
            for (let key in aDoc) {
                if (aDoc.hasOwnProperty(key)) {
                    project[key] = "$" + path + "." + key;
                }
            }
            let it = createIterator(scope, collection.aggregate(pipeline, { allowDiskUse: true }));
            let bulk = collection.initializeOrderedBulkOp({ w: "majority" });
            let doc;
            let count = 0;
            while (doc = (yield it.nextAsync())) {
                let originalId = doc.__originalId;
                delete doc.__originalId;
                bulk.find({ _id: originalId }).replaceOne(doc);
                count++;
                if (count >= config.bulkSize) {
                    yield bulk.execute();
                    bulk = collection.initializeOrderedBulkOp();
                    count = 0;
                }
            }
            if (count) {
                yield bulk.execute();
            }
        }
    }),
    deleteCollections: async(function*(db, shouldBeDeleted) {
        shouldBeDeleted = shouldBeDeleted || _.constant(true);
        let cc = db.listCollections();
        let colls = yield cc.toArray();
        for (let coll of colls) {
            if (!_.startsWith(coll.name, "system.")) {
                if (shouldBeDeleted(coll.name)) {
                    (yield Bluebird.promisify(db.collection, {context: db})(coll.name)).drop();
                }
            }
        }
    })
};

module.exports = misc;