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
    describe("Using 'find'", function() {
        describe("Cross Apply", function () {
            it("should do a flat cross apply", function (done) {
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
                                                query: {
                                                    num: {
                                                        $gt: 0
                                                    }
                                                },
                                                args: {
                                                    "@crossApplied": {
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

            it("should do a grouped cross apply", function (done) {
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
                                                    "@crossApplied": {
                                                        name: "other",
                                                        collection: "= this.otherStuff",
                                                        flat: false,
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
                    assert(_.isArray(doc.other));
                    assert.equal(doc.other.length, 1);
                    assert.equal(doc.other[0].str, "Hello");
                    assert(doc.other[0].bool);
                })().nodeify(done);
            });
        });

        describe("Outer Apply", function () {
            it("should do a flat outer apply", function (done) {
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
                                                    "@outerApplied": {
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

            it("should do a grouped outer apply", function (done) {
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
                                        no: 2,
                                        args: {
                                            "@apply": {
                                                collection: "= this.stuff",
                                                toArray: true,
                                                args: {
                                                    "@outerApplied": {
                                                        name: "other",
                                                        collection: "= this.otherStuff",
                                                        flat: false,
                                                        query: {
                                                            str: "# text.value",
                                                            bool: {
                                                                $ne: false
                                                            }
                                                        }
                                                    }
                                                },
                                                transform: function (doc) {
                                                    if (doc.num !== this.no) {
                                                        doc.other2 = doc.other;
                                                        delete doc.other;
                                                        return doc;
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
                    assert.equal(result.length, 2);
                    let doc = result[0];
                    assert.equal(doc._id, 1);
                    assert.equal(doc.num, 1);
                    assert(_.isArray(doc.other2));
                    assert.equal(doc.other2.length, 2);
                    assert.equal(doc.text.value, "Hello");
                    assert.equal(doc.other2[0].str, "Hello");
                    assert(doc.other2[0].bool);
                    assert.equal(doc.other2[0]._id, 1);
                    assert.equal(doc.other2[1].str, "Hello");
                    assert(doc.other2[1].bool);
                    assert.equal(doc.other2[1]._id, 4);
                    let sum = 0;
                    for (let item of result.slice(1)) {
                        assert(_.isArray(item.other2));
                        assert.equal(item.other2.length, 0);
                        sum += item.num;
                    }
                    assert.equal(sum, 3);
                })().nodeify(done);
            });
        });
    });

    describe("Using 'aggregate'", function() {
        describe("Cross Apply", function () {
            it("should do a flat cross apply", function (done) {
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
                                                query: {
                                                    pipeline: {
                                                        $match: {
                                                            num: {
                                                                $gt: 0
                                                            }
                                                        }
                                                    }
                                                },
                                                args: {
                                                    "@crossApplied": {
                                                        name: "other",
                                                        collection: "= this.otherStuff",
                                                        query: {
                                                            pipeline: [
                                                                {
                                                                    $match: {
                                                                        str: "# text.value",
                                                                        bool: {
                                                                            $ne: false
                                                                        }
                                                                    }
                                                                }
                                                            ]
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

            it("should do a grouped cross apply", function (done) {
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
                                                    "@crossApplied": {
                                                        name: "other",
                                                        collection: "= this.otherStuff",
                                                        flat: false,
                                                        query: {
                                                            pipeline: [
                                                                {
                                                                    $match: {
                                                                        str: "# text.value",
                                                                        bool: {
                                                                            $ne: false
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    $project: {
                                                                        _id: 0,
                                                                        str2: "$str",
                                                                        bool2: "$bool"
                                                                    }
                                                                }
                                                            ]
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
                    assert(_.isArray(doc.other));
                    assert.equal(doc.other.length, 1);
                    assert.equal(doc.other[0].str2, "Hello");
                    assert(doc.other[0].bool2);
                })().nodeify(done);
            });
        });

        describe("Outer Apply", function () {
            it("should do a flat outer apply", function (done) {
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
                                                query: {
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                num: {
                                                                    $lt: 100
                                                                }
                                                            }
                                                        }
                                                    ]
                                                },
                                                args: {
                                                    "@outerApplied": {
                                                        name: "other",
                                                        collection: "= this.otherStuff",
                                                        query: {
                                                            pipeline: [
                                                                {
                                                                    $match: {
                                                                        str: "# text.value",
                                                                        bool: {
                                                                            $ne: false
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    $project: {
                                                                        str: "$str",
                                                                        bool: "$bool"
                                                                    }
                                                                }
                                                            ]
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

            it("should do a grouped outer apply", function (done) {
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
                                        no: 2,
                                        args: {
                                            "@apply": {
                                                collection: "= this.stuff",
                                                toArray: true,
                                                args: {
                                                    "@outerApplied": {
                                                        name: "other",
                                                        collection: "= this.otherStuff",
                                                        flat: false,
                                                        query: {
                                                            pipeline: [
                                                                {
                                                                    $match: {
                                                                        str: "# text.value",
                                                                        bool: {
                                                                            $ne: false
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    $project: {
                                                                        _id: 0,
                                                                        str: "$str",
                                                                        bool2: "$bool"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                transform: function (doc) {
                                                    if (doc.num !== this.no) {
                                                        doc.other2 = doc.other;
                                                        delete doc.other;
                                                        return doc;
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
                    assert.equal(result.length, 2);
                    let doc = result[0];
                    assert.equal(doc._id, 1);
                    assert.equal(doc.num, 1);
                    assert(_.isArray(doc.other2));
                    assert.equal(doc.other2.length, 2);
                    assert.equal(doc.text.value, "Hello");
                    assert.equal(doc.other2[0].str, "Hello");
                    assert(doc.other2[0].bool2);
                    assert.deepEqual(doc.other2[0]._id, undefined);
                    assert.equal(doc.other2[1].str, "Hello");
                    assert(doc.other2[1].bool2);
                    assert.deepEqual(doc.other2[1]._id, undefined);
                    let sum = 0;
                    for (let item of result.slice(1)) {
                        assert(_.isArray(item.other2));
                        assert.equal(item.other2.length, 0);
                        sum += item.num;
                    }
                    assert.equal(sum, 3);
                })().nodeify(done);
            });
        });
    });
});