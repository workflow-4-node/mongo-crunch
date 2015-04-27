var util = require('util');
var Activity = require('workflow-4-node').activities.Activity;
var Promise = require('bluebird');
var MongoDbContext = require('./mongodbContext');
var fast = require('fast.js');
var _ = require('lodash');
var Connected = require('./connected');

function CollectionRef() {
    Connected.call(this);

    this.name = null;
    this.mustExists = true;
    this.deleteOnExit = false;
    this.clearBeforeUse = false;
    this.options = null;
    this.indexes = null;
}

util.inherits(CollectionRef, Connected);

CollectionRef.prototype.run = function(callContext, args) {
    var self = this;
    var name = self.get('name');
    var mustExists = self.get('mustExists');
    var deleteOnExit = self.get('deleteOnExit');
    var clearBeforeUse = self.get('clearBeforeUse');
    var options = self.get('options');
    var indexes = self.get('indexes');

    if (!_.isString(name) || !name) {
        callContext.fail(new Error('Activity argument \'name\' is null or empty.'));
        return;
    }

    function getIndexes() {

        function toIndex(idx) {
            var name = idx.name;
            var fieldOrSpec = idx.fieldOrSpec;
            var options = idx.options || { w: 1 };
            if (!_.isString(name) || !fieldOrSpec) {
                throw new Error('Invalid index specification: ' + JSON.stringify(idx));
            }
            return {
                name: name,
                fieldOrSpec: fieldOrSpec,
                options: options
            };
        }

        var result = [];
        if (_.isArray(indexes)) {
            fast.forEach(indexes, function (idx) {
                result.push(toIndex(idx));
            });
        }
        else if (_.isPlainObject(indexes)) {
            result.push(toIndex(indexes));
        }

        return result;
    }

    var doIt = Promise.coroutine(function* () {
        try {
            var db = callContext.activity.getDb(self);

            var opts = _.isObject(options) ? _.clone(options) : { w: 1 };
            if (mustExists) opts.strict = true;
            var coll = yield Promise.promisify(db.createCollection, db)(name, opts);

            // Ensure Indexes:
            var indexDefs = getIndexes();
            for (var i = 0; i < indexDefs.length; i++) {
                var indexDef = indexDefs[i];
                yield Promise.promisify(coll.ensureIndex, coll)(indexDef.name, indexDef.fieldOrSpec, indexDef.options);
            }

            if (clearBeforeUse) yield Promise.promisify(coll.removeMany, coll)({}, {w: 1});
            if (deleteOnExit) MongoDbContext.addCollectionToRecycleBin(self, coll);

            callContext.complete(coll);
        }
        catch (e) {
            callContext.fail(e);
        }
    });

    doIt();
}

module.exports = CollectionRef;
