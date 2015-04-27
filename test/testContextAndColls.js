"use strict";
/* global describe,it */
var ActivityExecutionEngine = require("../deps/workflow-4-node").activities.ActivityExecutionEngine;
var Collection = require("mongodb").Collection;
var _ = require("lodash");
var assert = require("assert");
var path = require("path");

describe("MongoDBContext", function () {
    it("should open a connection as default", function (done) {
        this.timeout(3000);

        var engine = new ActivityExecutionEngine({
            "@require": path.join(__dirname, "../lib/activities"),
            block: [
                {
                    mongoDBContext: {
                        connections: process.env.MONGO_URL,
                        body: {
                            block: {
                                coll1: {
                                    collectionRef: {
                                        name: "coll1",
                                        mustExists: true
                                    }
                                },
                                coll2: {
                                    collectionRef: {
                                        name: "coll2",
                                        mustExists: false,
                                        deleteOnExit: true
                                    }
                                },
                                tmp: {
                                    tempCollectionRef: {
                                        namePrefix: "foo"
                                    }
                                },
                                args: [
                                    {
                                        func: {
                                            code: function () {
                                                var coll1 = this.get("coll1");
                                                var coll2 = this.get("coll2");
                                                var tmp = this.get("tmp");

                                                assert(coll1 instanceof Collection);
                                                assert(coll1.collectionName === "coll1");
                                                assert(coll2 instanceof Collection);
                                                assert(coll2.collectionName === "coll2");
                                                assert(tmp instanceof Collection);
                                                assert(_.startsWith(tmp.collectionName, "foo"));
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

        engine.invoke().nodeify(done);
    });
});