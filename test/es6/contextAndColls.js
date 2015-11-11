"use strict";
/* global describe,it */
let wf4node = require("workflow-4-node");
let ActivityExecutionEngine = wf4node.activities.ActivityExecutionEngine;
let _ = require("lodash");
let assert = require("assert");
let path = require("path");
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let Collection = require("mongodb").Collection;
let MongoClient = require("mongodb").MongoClient;
let helpers = require("./helpers");

var es = "es6";
try {
    eval("(function *(){})");
} catch (err) {
    es = "es5";
}

describe("MongoDBContext", function () {
    beforeEach(function (done) {
        helpers.deleteColls().nodeify(done);
    });

    it("should open a connection as default, and use some collections", function (done) {
        this.timeout(3000);

        var engine = new ActivityExecutionEngine({
            "@require": path.join(__dirname, "../../lib/" + es + "/activities"),
            "@block": [
                {
                    "@mongoDBContext": {
                        connections: process.env.MONGO_URL,
                        args: {
                            "@block": {
                                coll1: {
                                    "@collectionRef": {
                                        name: "coll1",
                                        mustExists: true
                                    }
                                },
                                coll2: {
                                    "@collectionRef": {
                                        name: "coll2",
                                        mustExists: false,
                                        deleteOnExit: true
                                    }
                                },
                                tmp: {
                                    "@tempCollectionRef": {
                                        name: "foo"
                                    }
                                },
                                args: [
                                    {
                                        "@func": {
                                            code: function () {
                                                let coll1 = this.coll1;
                                                let coll2 = this.coll2;
                                                let tmp = this.tmp;

                                                assert(coll1 instanceof Collection);
                                                assert.equal(coll1.collectionName, "coll1");
                                                assert(coll2 instanceof Collection);
                                                assert.equal(coll2.collectionName, "coll2");
                                                assert(tmp instanceof Collection);
                                                assert(_.startsWith(tmp.collectionName, "~foo"), `${tmp.collectionName} is not starts with '~foo'`);
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        });

        async(function*() {
            let db = yield MongoClient.connect(process.env.MONGO_URL);
            let coll1 = yield Bluebird.promisify(db.collection, {context: db})("coll1");
            yield coll1.deleteMany({}, {w: 1});
            yield coll1.insert([
                {
                    name: "Bubu",
                    score: 1
                },
                {
                    name: "Zuzu",
                    score: 7
                }], {w: 1});

            yield engine.invoke();

            let cc = db.listCollections();
            let colls = yield cc.toArray();
            assert.equal(_.where(colls, {name: "coll2"}).length, 0);
            assert.equal(colls.filter(function (c) {
                return _.startsWith(c.name, "~foo");
            }).length, 0);

            yield coll1.drop();
            try {
                yield engine.invoke();
                assert(false);
            }
            catch (e) {
                assert(/does not exist/.test(e.message));
            }
            cc = db.listCollections();
            colls = yield cc.toArray();
            assert.equal(colls.length, 0);

        })().nodeify(done);
    });
});