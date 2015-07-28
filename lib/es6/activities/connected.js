"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let Db = require("mongodb").Db;
let debug = require("debug")("mongo-crunch:Connected");

function Connected() {
    Activity.call(this);

    this.connection = "";
    this.nonScopedProperties.add("getDb");
    this.nonScopedProperties.add("doWork");
}

util.inherits(Connected, Activity);

Connected.prototype.run = function(callContext, args) {
    callContext.schedule(this.connection, "_connectionGot");
};

Connected.prototype._connectionGot = function(callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    this.connection = result;
    callContext.activity.doWork.call(this, callContext);
};

Connected.prototype.doWork = function(callContext){
    callContext.fail(new Error("Not implemented."));
};

Connected.prototype.getDb = function (scope) {
    let connections = scope.connections;
    let connection = scope.connection || "default";

    debug(`Getting Db for connection: ${connection}.`);

    let result = connections[connection];
    if (!(result instanceof Db)) {
        throw new Error("MongoDB connection '" + connection + "' doesn't exists.");
    }

    debug(`Db '${result.databaseName}' found.`);
    return result;
};

module.exports = Connected;
