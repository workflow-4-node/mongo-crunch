"use strict";

let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let WithBody = wf4node.activities.WithBody;
let util = require("util");
let debug = require("debug")("mongo-crunch:UnitOfWork");
let Bluebird = require("bluebird");
let _ = require("lodash");
let async = Bluebird.coroutine;
let errors = wf4node.common.errors;

function UnitOfWork() {
    WithBody.call(this);
    this.nonScopedProperties.add("finalize");
}

util.inherits(UnitOfWork, WithBody);

UnitOfWork.prototype.run = function (callContext, args) {
    this.UnitOfWorkData = {
        collectionRecycleBin: new Map(),
        openedCursors: new Set(),
        seenCollections: new Map()
    };
    debug("Starting.");
    WithBody.prototype.run.call(this, callContext, args);
};

UnitOfWork.prototype.bodyCompleted = function (callContext, reason, result) {
    let self = this;

    debug(`UnitOfWork's body completed, reason: ${reason}.`);

    callContext.activity.finalize.call(this)
        .then(function () {
            callContext.end(reason, result);
        },
        function (e) {
            if (reason === Activity.states.fail) {
                callContext.fail(new errors.AggregateError([result,e]));
            }
            else {
                callContext.fail(e);
            }
        });
};

UnitOfWork.prototype.finalize = async(function*() {
    let taskError = null;

    debug("Doing final tasks.");
    try {
        let collectionRecycleBin = this.UnitOfWorkData.collectionRecycleBin;
        let openedCursors = this.UnitOfWorkData.openedCursors;
        let tasks = [];

        debug(`Collections in recycle bin: ${collectionRecycleBin.size}.`);
        for (let coll of collectionRecycleBin.values()) {
            debug(`Dropping collection: ${coll.collectionName}`);
            tasks.push(coll.drop()
                .then(function () {
                    debug(`Collection '${coll.collectionName}' dropped.`);
                })
                .catch(function (e) {
                    if (e.name === "MongoError" && e.message === "ns not found") {
                        debug(`Collection '${coll.collectionName}' doesn't exists.`);
                        return;
                    }
                    debug(`ERROR: Collection '${coll.collectionName}' dropping failed with\n${e.stack}`);
                }));
        }

        debug(`Cursors to close: ${openedCursors.size}.`);
        var idx = 0;
        for (let c of openedCursors.values()) {
            tasks.push(Bluebird.resolve(c.close())
                .then(function () {
                    debug(`Cursor ${idx}. dropped.`);
                })
                .catch(function (e) {
                    debug(`ERROR: Cursor ${idx}. closing failed with\n${e.stack}`);
                })
                .finally(function () {
                    idx++;
                }));
        }

        yield Bluebird.all(tasks);
    }
    catch (e) {
        debug("ERROR: final tasks failed: " + e.stack);
        throw e;
    }
    finally {
        delete this.UnitOfWorkData;
        debug("Final tasks completed.");
    }
});

UnitOfWork.addCollectionToRecycleBin = function (scope, collection) {
    let bin = scope.UnitOfWorkData.collectionRecycleBin;
    debug(`Adding collection '${collection.collectionName}' to recycle bin.`);
    bin.set(collection.collectionName, collection);
    debug(`Recycle bin size is ${bin.size}.`);
};

UnitOfWork.registerOpenedCursor = function (scope, cursor) {
    let cursors = scope.UnitOfWorkData.openedCursors;
    debug(`Registering a cursor as opened.`);
    cursors.add(cursor);
    debug(`There are ${cursors.size} cursors registered.`);
};

UnitOfWork.unregisterOpenedCursor = function (scope, cursor) {
    debug(`Unregistering opened cursor.`);
    scope.UnitOfWorkData.openedCursors.delete(cursor);
    debug(`There are ${scope.UnitOfWorkData.openedCursors.size} cursors registered.`);
};

UnitOfWork.isFirstSeenCollection = function (scope, db, collectionName) {
    debug(`Determining if '${collectionName}' collection in '${db.databaseName}' db is first seen by the current unit of work.`);
    let colls = scope.UnitOfWorkData.seenCollections;
    let entry = colls.get(db);
    if (!entry) {
        entry = new Set();
        entry.add(collectionName);
        colls.set(db, entry);
        debug("Fist seen.");
        return true;
    }
    if (!entry.has(collectionName)) {
        entry.add(collectionName);
        debug("First seen.");
        return true;
    }
    debug("Not first seen.");
    return false;
};

module.exports = UnitOfWork;
