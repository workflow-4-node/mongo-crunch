"use strict";

var es = "es6";
try { eval("(function *(){})"); } catch (err) { es = "es5"; }

let util = require("util");
let wf4node = require("workflow-4-node");
let Composite = wf4node.activities.Composite;
let path = require("path");
let _ = require("lodash");
let Activity = wf4node.activities.Activity;

function Collect() {
    Composite.call(this);

    this.source = null;
    this.target = null;
    this.pipeline = null;
    this.map = null;
    this.reduce = null;
    this.finalize = null;
    this.condition = null;
    this.scope = null;
    this.pre = null;
    this.reserved("post", null); // It don't run before implementation does.
    this.codeProperties.add("map");
    this.codeProperties.add("reduce");
    this.codeProperties.add("finalize");
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
                                condition: "= typeof this.get('collectRoot').get('target') !== 'string'",
                                then: {
                                    "@insert": {
                                        collection: "= collectRoot.target",
                                        documents: {
                                            "@aggregate": {
                                                collection: "= collectRoot.source",
                                                pipeline: "= collectRoot.pipeline"
                                            }
                                        }
                                    }
                                },
                                else: {
                                    "@aggregate": {
                                        collection: "= collectRoot.source",
                                        pipeline: "= collectRoot.pipeline"
                                    }
                                }
                            }
                        },
                        else: {
                            "@insert": {
                                collection: "= collectRoot.target",
                                documents: {
                                    "@inlineMR": {
                                        query: "= collectRoot.condition",
                                        collection: "= collectRoot.source",
                                        map: "= collectRoot.map",
                                        reduce: "= collectRoot.reduce",
                                        finalize: "= collectRoot.finalize",
                                        scope: "= collectRoot.scope"
                                    }
                                }
                            }
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
    let map = this.get("map");
    let reduce = this.get("reduce");
    let finalize = this.get("finalize") || undefined;
    if (pipeline) {
        callContext.activity._setupAggregation.call(this, callContext, pipeline);
    }
    else if ((_.isFunction(map) || _.isString(map)) && (_.isFunction(reduce) || _.isString(reduce))) {
        callContext.activity._setupMapReduce.call(this, callContext, map, reduce, finalize);
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

Collect.prototype._setupMapReduce = function (callContext, map, reduce, finalize) {
    if (!_.isUndefined(finalize)) {
        if (!(_.isFunction(finalize) || _.isString(finalize))) {
            throw new TypeError("Property value of 'finalize' is not a function.");
        }
    }
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
