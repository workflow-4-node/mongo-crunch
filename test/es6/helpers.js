"use strict";

let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let pro = Bluebird.promisify;
let MongoClient = Bluebird.promisifyAll(require("mongodb").MongoClient);
let _ = require("lodash");

let helpers = {
    deleteColls: async(function*() {
        let db = yield pro(MongoClient.connect, MongoClient)(process.env.MONGO_URL);
        let cc = db.listCollections();
        let colls = yield pro(cc.toArray, cc)();
        for (let coll of colls) {
            if (!_.startsWith(coll.name, "system.")) {
                yield db.collection(coll.name).drop();
            }
        }
    })
};

module.exports = helpers;