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
    "@mongoDBContext": {
        connections: process.env.MONGO_URL,
        body: {
            "@block": {
                // Collections:
                transactions: {
                    "@collectionRef": {
                        name: "transactions",
                        clearBeforeUse: true,
                        mustExists: false
                    }
                },
                itemisedCommission: {
                    "@collectionRef": {
                        name: "itemisedCommission",
                        clearBeforeUse: true,
                        mustExists: false
                    }
                },
                aggregatedCommission: {
                    "@collectionRef": {
                        name: "aggregatedCommission",
                        clearBeforeUse: true,
                        mustExists: false
                    }
                },
                fullCommission: {
                    "@collectionRef": {
                        name: "fullCommission",
                        clearBeforeUse: true,
                        mustExists: false
                    }
                },
                ruleList: {
                    "@collectionRef": {
                        name: "fixRuleList",
                        mustExists: true
                    }
                },
                // Steps:
                args: [
                    // Generate transactions:
                    {
                        "@tranGen": {
                            size: 1000,
                            collection: "= transactions"
                        }
                    },
                    // Compute commission:
                    {
                        "@eachDocument": {
                            querify: true,
                            varName: "rule",
                            documents: {
                                "@find": {
                                    collection: "= ruleList"
                                }
                            },
                            body: {
                                "@block": [
                                    {
                                        "@collect": {
                                            source: "= transactions",
                                            target: "= itemisedCommission",
                                            condition: "# _.omit(this.get('rule'), ['_id', 'value', 'take'])",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        "@merge": [
                                                            {
                                                                _id: 0,
                                                                agentID: "$itemID01",
                                                                ruleID: {
                                                                    $literal: "# this.get('rule')._id"
                                                                },
                                                                commissionValue: {
                                                                    $literal: "# this.get('rule').value"
                                                                }
                                                            },
                                                            {
                                                                transactionFields: {
                                                                    "@merge": [
                                                                        {
                                                                            transactionID: "$_id"
                                                                        },
                                                                        "# this.get('rule').take"
                                                                    ]
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    // Aggregate per agent per rule
                    {
                        "@collect": {
                            source: "= itemisedCommission",
                            target: "= aggregatedCommission",
                            pipeline: [
                                {
                                    $group: {
                                        _id: { agentID: "$agentID", ruleID: "$ruleID" },
                                        commissionValue: { $sum: "$commissionValue" },
                                        transactionFields: { $push: "$transactionFields" }
                                    }
                                }
                            ]
                        }
                    },
                    // Aggregate per agent
                    {
                        "@collect": {
                            source: "= aggregatedCommission",
                            target: "= fullCommission",
                            pipeline: [
                                {
                                    $group: {
                                        _id: "$_id.agentID",
                                        commissionValue: { $sum: "$commissionValue" },
                                        transactionFields: { $push: "$transactionFields" }
                                    }
                                }
                            ]
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