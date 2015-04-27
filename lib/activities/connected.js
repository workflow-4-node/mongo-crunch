var util = require('util');
var Activity = require('workflow-4-node').activities.Activity;
var Db = require('mongodb').Db;

function Connected() {
    Activity.call(this);

    this.connection = '';
    this.nonScopedProperties.add('getDb');
}

util.inherits(Connected, Activity);

Connected.prototype.getDb = function (scope) {
    var connections = scope.get('connections');
    var connection = scope.get('connection') || 'default';

    var result = connections[connection];
    if (!(result instanceof Db)) throw new Error('MongoDB connection \'' + connection + '\' doesn\'t exists.');
    return result;
}

module.exports = Connected;
