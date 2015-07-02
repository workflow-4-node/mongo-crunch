"use strict";

var es = "es6";
try { eval("(function *(){})"); } catch (err) { es = "es5"; }

let wf4node = require("../../../deps/workflow-4-node");
let activities = wf4node.activities;
let ActivityExecutionEngine = activities.ActivityExecutionEngine;
let path = require("path");
let util = require("util");
let _ = require("lodash");

let wf = {
    "@require": [
        path.join(__dirname, "../../../lib/" + es + "/activities"),
        path.join(__dirname, "activities")
    ],
    "@mongoDBContext": {
        connections: process.env.MONGO_URL,
        args: {
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
                itemisedCommission2: {
                    "@collectionRef": {
                        name: "itemisedCommission2",
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
                        name: "ruleList",
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
                    { "@console": "Transactions generated." },
                    // Compute commission:
                    //{
                    //    // Stripes
                    //    "@eachDocument": {
                    //        querify: true,
                    //        varName: "rule",
                    //        documents: {
                    //            "@find": {
                    //                collection: "= ruleList",
                    //                query: {
                    //                    $or: [
                    //                        { "commission.value": { $exists: true } },
                    //                        { "commission.calculate": { $exists: true } }
                    //                    ]
                    //                }
                    //            }
                    //        },
                    //        args: {
                    //            "@block": [
                    //                {
                    //                    "@collect": {
                    //                        source: "= transactions",
                    //                        target: "= itemisedCommission",
                    //                        condition: "= rule.condition",
                    //                        pipeline: [
                    //                            {
                    //                                $project: {
                    //                                    "@merge": [
                    //                                        {
                    //                                            _id: 0,
                    //                                            agentID: "$itemID01",
                    //                                            ruleID: {
                    //                                                $literal: "= rule._id"
                    //                                            },
                    //                                            commissionValue: {
                    //                                                "@switch": [
                    //                                                    {
                    //                                                        "@when": {
                    //                                                            condition: "= rule.commission.value",
                    //                                                            args: {
                    //                                                                $literal: "= rule.commission.value"
                    //                                                            }
                    //                                                        }
                    //                                                    },
                    //                                                    {
                    //                                                        "@when": {
                    //                                                            condition: "= rule.commission.calculate",
                    //                                                            args: "= rule.commission.calculate"
                    //                                                        }
                    //                                                    }
                    //                                                ]
                    //                                            }
                    //                                        },
                    //                                        {
                    //                                            transactionFields: {
                    //                                                "@merge": [
                    //                                                    {
                    //                                                        ruleID: {
                    //                                                            $literal: "= rule._id"
                    //                                                        },
                    //                                                        transactionID: "$_id"
                    //                                                    },
                    //                                                    "= rule.take"
                    //                                                ]
                    //                                            }
                    //                                        }
                    //                                    ]
                    //                                }
                    //                            }
                    //                        ]
                    //                    }
                    //                }
                    //            ]
                    //        }
                    //    }
                    //},
                    {
                        // Value + compute
                        "@eachDocument": {
                            querify: true,
                            varName: "rule",
                            documents: {
                                "@find": {
                                    collection: "= ruleList",
                                    query: { "commission.fulfilment": { $exists: true } }
                                }
                            },
                            args: {
                                "@eachDocument": {
                                    querify: true,
                                    varName: "plan",
                                    documents: {
                                        "@find": {
                                            collection: "= transactions",
                                            query: "= rule.commission.fulfilment.plan.conditions"
                                        }
                                    },
                                    args: {
                                        "@block": {
                                            planID: "# this.get('plan')[this.get('rule').commission.fulfilment.plan.id]",
                                            planTime: "# this.get('plan')[this.get('rule').commission.fulfilment.plan.time]",
                                            planValue: "# this.get('plan')[this.get('rule').commission.fulfilment.plan.value]",
                                            planAgentID: "# this.get('plan')['itemID01']",
                                            fulfillCond: null,
                                            tmp: {
                                                "@tempCollectionRef": {
                                                    namePrefix: "tmp",
                                                    deleteOnExit: false
                                                }
                                            },
                                            args: [
                                                {
                                                    "@assign": {
                                                        to: "fulfillCond",
                                                        value: {
                                                            "@merge": [
                                                                "= rule.conditions ",
                                                                {
                                                                    itemID01: "= planAgentID"
                                                                },
                                                                {
                                                                    "@obj": ["= rule.commission.fulfilment.id", "= planID"]
                                                                },
                                                                {
                                                                    "@obj": [
                                                                        "= rule.commission.fulfilment.time",
                                                                        {
                                                                            $gte: "= planTime"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    "@collect": {
                                                        source: "= transactions",
                                                        target: "= tmp",
                                                        condition: "= fulfillCond",
                                                        pipeline: [
                                                            {
                                                                $project: {
                                                                    "@merge": [
                                                                        {
                                                                            _id: 0,
                                                                            agentID: "$itemID01",
                                                                            ruleID: {
                                                                                $literal: "= rule._id"
                                                                            },
                                                                            fulfilmentValue: "# '$' + this.get('rule').commission.fulfilment.value",
                                                                            fulfilmentID: "# '$' + this.get('rule').commission.fulfilment.id",
                                                                            planValue: {
                                                                                $literal: "= planValue"
                                                                            }
                                                                        },
                                                                        {
                                                                            transactionFields: {
                                                                                "@merge": [
                                                                                    {
                                                                                        ruleID: {
                                                                                            $literal: "= rule._id"
                                                                                        },
                                                                                        transactionID: "$_id"
                                                                                    },
                                                                                    {
                                                                                        planValue: {
                                                                                            $literal: "= planValue"
                                                                                        }
                                                                                    },
                                                                                    {
                                                                                        "@payFields": "= rule.commission.fulfilment.stripes"
                                                                                    },
                                                                                    "= rule.take"
                                                                                ]
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                $group: {
                                                                    _id: null,
                                                                    agentID: {
                                                                        $first: "$agentID"
                                                                    },
                                                                    ruleID: {
                                                                        $first: "$ruleID"
                                                                    },
                                                                    fulfilmentValue: {
                                                                        $sum: "$fulfilmentValue"
                                                                    },
                                                                    planValue: {
                                                                        $first: "$planValue"
                                                                    },
                                                                    transactionFields: { $push: "$transactionFields" }
                                                                }
                                                            },
                                                            {
                                                                $project: {
                                                                    agentID: 1,
                                                                    ruleID: 1,
                                                                    fulfilmentValue: 1,
                                                                    planValue: 1,
                                                                    percent: {
                                                                        $multiply: [
                                                                            {
                                                                                $divide: ["$fulfilmentValue", "$planValue"]
                                                                            },
                                                                            100
                                                                        ]
                                                                    },
                                                                    transactionFields: 1
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    "@collect": {
                                                        source: "= tmp",
                                                        target: "= itemisedCommission2",
                                                        scope: {
                                                            stripes: "= rule.commission.fulfilment.stripes"
                                                        },
                                                        map: function() {
                                                            var commissionValue = 0;
                                                            for (var i = 0; i < stripes.length; i++) {
                                                                var stripe = stripes[i];
                                                                var from = stripe.from || 0;
                                                                var to = stripe.to || 100000;
                                                                
                                                            }
                                                            emit(this.agentID, this);
                                                        },
                                                        reduce: function(key, values) {
                                                            return values.length ? values[0] : values;
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
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
                                    $unwind: "$transactionFields"
                                },
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