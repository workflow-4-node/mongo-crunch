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

describe("Apply", function () {
    describe("Cross Apply", function () {
        it("should do a simple cross apply", function (done) {
            this.timeout(30000);

            var engine = new ActivityExecutionEngine({
                "@require": path.join(__dirname, "../../lib/" + es + "/activities"),
                "@block": [
                    {
                        "@mongoDBContext": {
                            connections: process.env.MONGO_URL,
                            args: {
                                "@block": {
                                    stuff: [
                                        {
                                            _id: 1,
                                            text: {
                                                value: "Hello"
                                            },
                                            num: 1
                                        },
                                        {
                                            _id: 2,
                                            text: {
                                                value: "World"
                                            },
                                            num: 2
                                        },
                                        {
                                            _id: 3,
                                            text: {
                                                value: "Woot"
                                            },
                                            num: 3
                                        }
                                    ],
                                    otherStuff: [
                                        {
                                            _id: 1,
                                            str: "Hello",
                                            bool: true
                                        },
                                        {
                                            _id: 2,
                                            str: "World",
                                            bool: false
                                        },
                                        {
                                            _id: 3,
                                            str: "Klow",
                                            bool: false
                                        }
                                    ],
                                    args: {
                                        "@apply": {
                                            collection: "= this.stuff",
                                            toArray: true,
                                            args: {
                                                "@applied": {
                                                    name: "other",
                                                    collection: "= this.otherStuff",
                                                    query: {
                                                        str: "# text.value",
                                                        bool: {
                                                            $ne: false
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            async(function*() {
                let result = yield engine.invoke();
                assert(_.isArray(result));
                assert.equal(result.length, 1);
                let doc = result[0];
                assert.equal(doc._id, 1);
                assert.equal(doc.num, 1);
                assert.equal(doc.text.value, "Hello");
                assert.equal(doc.other.str, "Hello");
                assert(doc.other.bool);
            })().nodeify(done);
        });
    });

    describe("Outer Apply", function () {
        it("should do a simple outer apply", function (done) {
            this.timeout(30000);

            var engine = new ActivityExecutionEngine({
                "@require": path.join(__dirname, "../../lib/" + es + "/activities"),
                "@block": [
                    {
                        "@mongoDBContext": {
                            connections: process.env.MONGO_URL,
                            args: {
                                "@block": {
                                    stuff: [
                                        {
                                            _id: 1,
                                            text: {
                                                value: "Hello"
                                            },
                                            num: 1
                                        },
                                        {
                                            _id: 2,
                                            text: {
                                                value: "World"
                                            },
                                            num: 2
                                        },
                                        {
                                            _id: 3,
                                            text: {
                                                value: "Woot"
                                            },
                                            num: 3
                                        }
                                    ],
                                    otherStuff: [
                                        {
                                            _id: 1,
                                            str: "Hello",
                                            bool: true
                                        },
                                        {
                                            _id: 2,
                                            str: "World",
                                            bool: false
                                        },
                                        {
                                            _id: 3,
                                            str: "Klow",
                                            bool: false
                                        },
                                        {
                                            _id: 4,
                                            str: "Hello",
                                            bool: true
                                        }
                                    ],
                                    args: {
                                        "@apply": {
                                            collection: "= this.stuff",
                                            toArray: true,
                                            args: {
                                                "@applied": {
                                                    name: "other",
                                                    collection: "= this.otherStuff",
                                                    type: "outer",
                                                    query: {
                                                        str: "# text.value",
                                                        bool: {
                                                            $ne: false
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            async(function*() {
                let result = yield engine.invoke();
                assert(_.isArray(result));
                assert.equal(result.length, 4);
                let doc = result[0];
                assert.equal(doc._id, 1);
                assert.equal(doc.num, 1);
                assert.equal(doc.text.value, "Hello");
                assert.equal(doc.other.str, "Hello");
                assert(doc.other.bool);
                assert.equal(doc.other._id, 1);
                doc = result[1];
                assert.equal(doc._id, 1);
                assert.equal(doc.num, 1);
                assert.equal(doc.text.value, "Hello");
                assert.equal(doc.other.str, "Hello");
                assert(doc.other.bool);
                assert.equal(doc.other._id, 4);
                let sum = 0;
                for (let item of result.slice(2)) {
                    assert.deepEqual(item.other, null);
                    sum += item.num;
                }
                assert.equal(sum, 2 + 3);
            })().nodeify(done);
        });
    });
});