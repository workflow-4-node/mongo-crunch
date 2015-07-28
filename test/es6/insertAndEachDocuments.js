"use strict";
/* global describe,it */
var es = "es6";
try {
    eval("(function *(){})");
} catch (err) {
    es = "es5";
}
let wf4node = require("workflow-4-node");
let ActivityExecutionEngine = wf4node.activities.ActivityExecutionEngine;
let _ = require("lodash");
let assert = require("assert");
let path = require("path");
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let config = require("../../lib/" + es + "/config");

describe("Insert and EachDocuments", function () {
    before(function() {
        config.bulkSize = 2;
    });

    after(function() {
        config.bulkSize = 1000;
    });

    it("should get back that was inserted before to a temp collection", function (done) {
        this.timeout(30000);

        var engine = new ActivityExecutionEngine({
            "@require": path.join(__dirname, "../../lib/" + es + "/activities"),
            "@block": [
                {
                    "@mongoDBContext": {
                        connections: process.env.MONGO_URL,
                        args: {
                            "@block": {
                                tmp: {
                                    "@tempCollectionRef": {
                                        name: "foo"
                                    }
                                },
                                v: 0,
                                args: [
                                    {
                                        "@insert": {
                                            collection: "= this.tmp",
                                            documents: {
                                                _id: 1,
                                                text: "Hello"
                                            }
                                        }
                                    },
                                    {
                                        "@insert": {
                                            collection: "= this.tmp",
                                            documents: [
                                                {
                                                    _id: 2,
                                                    text: "World"
                                                },
                                                {
                                                    _id: 3,
                                                    text: "Woot"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        "@eachDocument": {
                                            documents: " = this.tmp",
                                            args: "= this.v += this.document._id"
                                        }
                                    },
                                    "= this.v"
                                ]
                            }
                        }
                    }
                }
            ]
        });

        async(function*() {
            let result = yield engine.invoke();
            assert.equal(1 + 2 + 3, result);
        })().nodeify(done);
    });

    it("should provide possibility to copy collections content", function (done) {
        this.timeout(30000);

        var engine = new ActivityExecutionEngine({
            "@require": path.join(__dirname, "../../lib/" + es + "/activities"),
            "@block": [
                {
                    "@mongoDBContext": {
                        connections: process.env.MONGO_URL,
                        args: {
                            "@block": {
                                tmp1: {
                                    "@tempCollectionRef": {
                                        name: "foo1"
                                    }
                                },
                                tmp2: {
                                    "@tempCollectionRef": {
                                        name: "foo2"
                                    }
                                },
                                tmp3: {
                                    "@tempCollectionRef": {
                                        name: "foo3"
                                    }
                                },
                                v: "",
                                args: [
                                    {
                                        "@insert": {
                                            collection: "= this.tmp1",
                                            documents: [
                                                {
                                                    _id: 1,
                                                    text: "Hello"
                                                },
                                                {
                                                    _id: 2,
                                                    text: "World"
                                                },
                                                {
                                                    _id: 3,
                                                    text: "Woot"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        "@eachDocument": {
                                            documents: " = this.tmp1",
                                            args: [
                                                {
                                                    "@insert": {
                                                        collection: "= this.tmp2",
                                                        documents: "= this.document"
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        "@insert": {
                                            collection: "= this.tmp3",
                                            documents: "= this.tmp2"
                                        }
                                    },
                                    {
                                        "@eachDocument": {
                                            documents: " = this.tmp3",
                                            args: "= this.v += this.document.text"
                                        }
                                    },
                                    "= this.v"
                                ]
                            }
                        }
                    }
                }
            ]
        });

        async(function*() {
            let result = yield engine.invoke();
            assert.equal("HelloWorldWoot", result);
        })().nodeify(done);
    });
});