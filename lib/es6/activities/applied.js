"use strict";

let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let CollectionOp = require("./collectionOp");
let util = require("util");

function Applied() {
    CollectionOp.call(this);
    this.query = null;
    this.fields = null;
    this.name = null;
    this.flat = true;
}

util.inherits(Applied, CollectionOp);

Object.defineProperties(Applied.prototype, {
    collectionify: {
        value: true,
        enumerable: false
    },
    type: {
        get: function() {
            throw new Error("Not implemented.");
        },
        enumerable: false
    }
});

Applied.prototype.doWork = function (callContext) {
    callContext.schedule([this.query, this.fields, this.type, this.name, this.flat], "_parsGot");
};

Applied.prototype._parsGot = function (callContext, reason, result) {
    if (reason === Activity.states.complete) {
        let pars = {
            collection: this.getCollection.call(this, false), // Can be null
            query: result[0],
            fields: result[1],
            type: result[2],
            name: result[3],
            flat: result[4]
        };
        callContext.complete(pars);
    }
    else {
        callContext.end(reason, result);
    }
};

module.exports = Applied;