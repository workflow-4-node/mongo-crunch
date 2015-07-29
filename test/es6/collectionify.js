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

describe("Collectionify", function () {
    it("should allow to query a simple array", function (done) {
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
                                ],
                                v: [],
                                args: [
                                    {
                                        "@eachDocument": {
                                            documents: {
                                                "@find": {
                                                    collection: "= this.stuff",
                                                    query: {
                                                        text: { $in: [ "World", "Woot" ] }
                                                    }
                                                }
                                            },
                                            args: function() {
                                                this.v.push(this.document);
                                            }
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
            assert(_.isArray(result));
            assert.equal(result.length, 2);
            assert.equal(_(result).map(function(i) { return i._id; }).sum(), 2 + 3);
        })().nodeify(done);
    });
});