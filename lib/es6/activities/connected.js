"use strict";

let wf4node = require("../../../deps/workflow-4-node");
let util = require('util');
let Activity = wf4node.activities.Activity;
let Db = require('mongodb').Db;
let debug = require("debug")("mongo-crunch:Connected");

function Connected() {
    Activity.call(this);

    this.connection = '';
    this.nonScopedProperties.add('getDb');
}

util.inherits(Connected, Activity);

Connected.prototype.getDb = function (scope) {
    let connections = scope.get('connections');
    let connection = scope.get('connection') || 'default';

    debug(`Getting Db for connection: ${connection}.`);

    let result = connections[connection];
    if (!(result instanceof Db)) {
        throw new Error('MongoDB connection \'' + connection + '\' doesn\'t exists.');
    }

    debug(`Db '${result.databaseName}' found.`);
    return result;
};

module.exports = Connected;
