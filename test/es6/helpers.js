"use strict";

let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let MongoClient = require("mongodb").MongoClient;
let _ = require("lodash");

let helpers = {
    deleteColls: async(function*() {
        let db = yield MongoClient.connect(process.env.MONGO_URL);
        let cc = db.listCollections();
        let colls = yield cc.toArray();
        for (let coll of colls) {
            if (!_.startsWith(coll.name, "system.")) {
                (yield Bluebird.promisify(db.collection, {context: db})(coll.name)).drop();
            }
        }
    })
};

module.exports = helpers;