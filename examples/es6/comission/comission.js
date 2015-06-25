"use strict";

var es = "es6";
try { eval("(function *(){})"); } catch (err) { es = "es5"; }

let wf4node = require("../../../deps/workflow-4-node");
let activities = wf4node.activities;
let ActivityExecutionEngine = activities.ActivityExecutionEngine;
let path = require("path");
let util = require("util");

let wf = {
    "@require": [
        path.join(__dirname, "../../../lib/" + es + "/activities"),
        path.join(__dirname, "activities")
    ],
    mongoDBContext: {
        connections: process.env.MONGO_URL,
        body: {
            block: {
                transactions: {
                    collectionRef: {
                        name: "transactions",
                        clearBeforeUse: true,
                        mustExists: false
                    }
                },
                aggregates: {
                    collectionRef: {
                        name: "aggregates",
                        clearBeforeUse: true,
                        mustExists: false
                    }
                },
                list: {
                    collectionRef: {
                        name: "fixList",
                        mustExists: true
                    }
                },
                args: [
                    {
                        tranGen: {
                            size: 10,
                            collection: "= transactions"
                        }
                    },
                    {
                        eachDocument: {
                            querify: true,
                            documents: {
                                find: {
                                    collection: "= list"
                                }
                            },
                            body: {
                                collect: {
                                    source: "= transactions",
                                    target: "= aggregates",
                                    groupFieldValue: "$itemID02",
                                    pipeline: [
                                        {
                                            $group: {
                                                _id: "$itemID02"
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
};

let engine = new ActivityExecutionEngine(wf);

console.log("Starting.");
engine.invoke()
    .then(function (r) {
        console.log("Done.");
        if (r) {
            console.info("Result:\n" + util.inspect(r));
        }
    },
    function (e) {
        console.error(e.stack);
    });