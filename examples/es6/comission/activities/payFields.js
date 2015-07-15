"use strict";

let util = require("util");
let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let path = require("path");
let _ = require("lodash");

function PayFields() {
    Activity.call(this);
}

util.inherits(PayFields, Activity);

PayFields.prototype.run = function (callContext, args) {
    callContext.schedule(args, "_argsGot");
};

PayFields.prototype._argsGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let arr = [];
    for (let arg of result) {
        for (let stripe of (_.isArray(arg) ? arg : [arg])) {
            if (_.isArray(stripe.payFields)) {
                for (let field of stripe.payFields) {
                    arr.push(field);
                }
            }
            else if (_.isString(stripe.payFields)) {
                arr.push(stripe.payFields);
            }
        }
    }
    arr = _.uniq(arr);
    let obj = {};
    for (let f of arr) {
        obj[f] = "$" + f;
    }
    callContext.complete(obj);
};

module.exports = PayFields;