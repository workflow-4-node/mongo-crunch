"use strict";

var es = "es6";
try { eval("(function *(){})"); } catch (err) { es = "es5"; }

let util = require("util");
let wf4node = require("../../../../deps/workflow-4-node");
let Composite = wf4node.activities.Composite;
let path = require("path");
let _ = require("lodash");
let Activity = wf4node.activities.Activity;

function Collect() {
    Composite.call(this);

    this.source = null;
    this.target = null;
    this.groupFieldName = null;
    this.groupFieldValue = null;
    this.pipeline = null;
    this.mr = null;
    this.condition = null;
    this.pre = null;
    this.reserved("post", null); // It don't run before implementation does.
}

util.inherits(Collect, Composite);

Collect.prototype.createImplementation = function () {
    return {
        "@require": path.join(__dirname, "../../../../lib/" + es + "/activities"),
        "@block": {
            collectRoot: "= $parent",
            args: [
                {
                    "@if": {
                        condition: "= collectRoot.pipeline",
                        then: {
                            "@if": {
                                condition: "# typeof this.get('target') !== 'string'",
                                then: {
                                    "@insert": {
                                        collection: "= target",
                                        documents: {
                                            "@aggregate": {
                                                collection: "= source",
                                                pipeline: "= collectRoot.pipeline"
                                            }
                                        }
                                    }
                                },
                                else: {
                                    "@aggregate": {
                                        collection: "= source",
                                        pipeline: "= collectRoot.pipeline"
                                    }
                                }
                            }
                        },
                        else: function () {
                            throw new Error("Not supported yet.");
                        }
                    }
                }
            ]
        }
    };
};

Collect.prototype.varsDeclared = function (callContext, args) {
    if (this.get("source") === this.get("target")) {
        throw new Error("Source and Target Collections must be different!");
    }

    let pipeline = this.get("pipeline");
    let mr = this.get("mr");
    if (pipeline) {
        callContext.activity._setupAggregation.call(this, callContext, pipeline);
    }
    else if (mr) {
        callContext.activity._setupMapReduce.call(this, callContext, pipeline);
    }
    else {
        throw new Error("Operation parameters expected.");
    }

    Composite.prototype.varsDeclared.call(this, callContext, args);
};

Collect.prototype._setupAggregation = function (callContext, pipeline) {
    if (!_.isArray(pipeline)) {
        throw new Error("Pipeline is not an array.");
    }

    pipeline = _.cloneDeep(pipeline);

    // Condition:
    let condition = this.get("condition");
    if (!_.isUndefined(condition)) {
        if (_.isPlainObject(condition)) {
            pipeline.splice(0, 0, {
                $match: condition
            });
        }
    }

    // Reshaping
    let groupFieldName = this.get("groupFieldName") || "group";
    let groupFieldValue = this.get("groupFieldValue");
    if (!_.isUndefined(groupFieldValue) && !_.isNull(groupFieldValue) && groupFieldValue !== "") {
        let p = { $project: {} };
        p.$project[groupFieldName] = { $literal: groupFieldValue };
        pipeline.push(p);
    }

    // Out
    let target = this.get("target");
    if (_.isString(target)) {
        pipeline.push({ $out: target });
    }

    if (!pipeline.length) {
        throw new Error("Pipeline is empty.");
    }

    this.set("pipeline", pipeline);
};

Collect.prototype._setupMapReduce = function (callContext, pipeline) {
    throw new Error("Not supported yet.");
};

Collect.prototype.implementationCompleted = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let post = this.get("post");
    if (post instanceof Activity) {
        callContext.schedule(post, "_allEnd");
    }
    else {
        Composite.prototype.implementationCompleted.call(this, callContext, reason, result);
    }
};

Collect.prototype._allEnd = function (callContext, reason, result) {
    callContext.end(reason, result);
};

module.exports = Collect;
