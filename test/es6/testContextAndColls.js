"use strict";
/* global describe,it */
var wf4node = require("workflow-4-node");
var ActivityExecutionEngine = wf4node.activities.ActivityExecutionEngine;
var _ = require("lodash");
var assert = require("assert");
var path = require("path");
var Bluebird = require("bluebird");
var async = Bluebird.coroutine;
var Collection = require("mongodb").Collection;
var MongoClient = Bluebird.promisifyAll(require("mongodb").MongoClient);

var es = "es6";
try {
    eval("(function *(){})");
} catch (err) {
    es = "es5";
}

describe("MongoDBContext", function () {
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
                                        namePrefix: "foo"
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
                                                assert(coll1.collectionName === "coll1");
                                                assert(coll2 instanceof Collection);
                                                assert(coll2.collectionName === "coll2");
                                                assert(tmp instanceof Collection);
                                                assert(_.startsWith(tmp.collectionName, "~foo"));
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
            var db = yield Bluebird.promisify(MongoClient.connect, MongoClient)(process.env.MONGO_URL);
            var coll1 = yield Bluebird.promisify(db.collection, db)("coll1");
            yield Bluebird.promisify(coll1.deleteMany, coll1)({}, { w: 1 });
            yield Bluebird.promisify(coll1.insert, coll1)([
                {
                    name: "Bubu",
                    score: 1
                },
                {
                    name: "Zuzu",
                    score: 7
                }], { w: 1 });

            yield engine.invoke();

            var cc = db.listCollections();
            var colls = yield Bluebird.promisify(cc.toArray, cc)();
            assert.equal(_.where(colls, { name: "coll2" }).length, 0);
            assert.equal(colls.filter(function(c) { return _.startsWith(c.name, "foo_tmp_"); }).length, 0);

            yield Bluebird.promisify(coll1.drop, coll1)();
            try {
                yield engine.invoke();
                assert(false);
            }
            catch (e) {
                assert(/does not exist/.test(e.message));
            }
            cc = db.listCollections();
            colls = yield Bluebird.promisify(cc.toArray, cc)();
            assert.equal(colls.length, 1);

        })().nodeify(done);
    });
});