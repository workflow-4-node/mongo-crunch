"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let Bluebird = require("bluebird");
let UnitOfWork = require("./unitOfWork");
let _ = require("lodash");
let Connected = require("./connected");
let debug = require("debug")("mongo-crunch:CollectionRef");
let async = Bluebird.coroutine;
require("date-utils");

function CollectionRef() {
    Connected.call(this);

    this.name = null;
    this.mustExists = true;
    this.deleteOnExit = false;
    this.clearBeforeUse = false;
    this.options = null;
    this.indexes = null;
    this.ttl = null;

    this.nonScopedProperties.add("_generateName");
}

util.inherits(CollectionRef, Connected);

CollectionRef.prototype._generateName = function(name, ttl) {
    if (ttl && ttl > 0) {
        let to = new Date();
        to.addMinutes(ttl);
        name += "@" + to.toUTCFormat("YYYYMMDDHHMISS");
    }
    return name;
};

CollectionRef.prototype.doWork = function (callContext) {
    callContext.schedule(
        [
            this.name,
            this.mustExists,
            this.deleteOnExit,
            this.clearBeforeUse,
            this.options,
            this.indexes,
            this.ttl
        ],
        "_varsGot");
};

CollectionRef.prototype._varsGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let self = this;
    let ttl = result[6];
    let name = callContext.activity._generateName(result[0], ttl);
    let mustExists = result[1];
    let deleteOnExit = result[2];
    let clearBeforeUse = result[3];
    let options = result[4];
    let indexes = result[5];

    debug(`${name} running, mustExists: ${mustExists}, deleteOnExit: ${deleteOnExit}, clearBeforeUse: ${clearBeforeUse}`);
    debug(`options: ${util.inspect(options)}`);
    debug(`indexes: ${util.inspect(indexes)}`);

    if (!_.isString(name) || !name) {
        callContext.fail(new Error("Activity argument \"name\" is null or empty."));
        return;
    }

    function getIndexes() {

        function toIndex(idx) {
            let idxName = idx.name;
            let fieldOrSpec = idx.fieldOrSpec;
            let idxOptions = idx.options || { w: "majority" };
            if (!_.isString(idxName) || !fieldOrSpec) {
                throw new Error("Invalid index specification: " + JSON.stringify(idx));
            }
            return {
                name: idxName,
                fieldOrSpec: fieldOrSpec,
                options: idxOptions
            };
        }

        let r = [];
        if (_.isArray(indexes)) {
            for (let idx of indexes) {
                r.push(toIndex(idx));
            }
        }
        else if (_.isPlainObject(indexes)) {
            r.push(toIndex(indexes));
        }

        return r;
    }

    async(function* () {
        try {
            let db = callContext.activity.getDb(self);

            let firstSeen = UnitOfWork.isFirstSeenCollection(self, db, name);

            let dropped = false;
            if (deleteOnExit && firstSeen && !mustExists) {
                debug(`'${name}' is a temporary collection that must dropped on exit. Dropping.`);
                try {
                    yield db.dropCollection(name);
                    debug(`'${name}' dropped`);
                }
                catch (e) {
                    if (!((e.name === "MongoError" && e.message === "ns not found"))) {
                        throw e;
                    }
                    debug(`'${name}' doesn't exists when referenced first.`);
                }
                dropped = true;
            }

            let opts = _.isObject(options) ? _.clone(options) : { w: "majority" };
            if (mustExists) {
                debug("Adding strict option.");
                opts.strict = true;
            }
            debug(`Getting '${name}' collection's reference from Db.`);
            let coll = yield Bluebird.promisify(db.collection, {context: db})(name, opts);

            if (firstSeen) {
                let indexDefs = getIndexes();
                if (indexDefs.length) {
                    debug(`Ensuring ${indexDefs.length} indexes.`);
                    for (let i = 0; i < indexDefs.length; i++) {
                        let indexDef = indexDefs[i];
                        debug(`Ensuring index ${util.inspect(indexDef)}`);
                        yield coll.ensureIndex(indexDef.name, indexDef.fieldOrSpec, indexDef.options);
                    }
                }

                if (deleteOnExit) {
                    UnitOfWork.addCollectionToRecycleBin(self, coll);
                }
            }

            if (clearBeforeUse && !dropped) {
                debug(`Calling 'deleteMany' in collection '${name}' because 'clearBeforeUse' option is set.`);
                yield coll.deleteMany({}, { w: "majority" });
            }

            debug(`CollectionRef '${name}' run completed.`);
            callContext.complete(coll);
        }
        catch (e) {
            callContext.fail(e);
        }
    })();
};

module.exports = CollectionRef;
