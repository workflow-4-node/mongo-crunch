"use strict";

let wf4node = require("../../../deps/workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let _ = require("lodash");

function Fields() {
    Activity.call(this);

    this.flag = 1;
}

util.inherits(Fields, Activity);

Fields.prototype.run = function (callContext, args) {
    callContext.schedule(args, "_argsGot");
};

Fields.prototype._argsGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let fields = {};
    let flag = this.get("flag");
    for (let key of result) {
        if (_.isString(key)) {
            fields[key] = flag;
        }
    }
    console.log(fields);
    callContext.complete(fields);
};

module.exports = Fields;