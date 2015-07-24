"use strict";

let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let WithBody = wf4node.activities.WithBody;
let util = require("util");
let debug = require("debug")("mongo-crunch:UnitOfWork");
let Bluebird = require("bluebird");
let _ = require("lodash");

function UnitOfWork() {
    WithBody.call(this);
}

util.inherits(UnitOfWork, WithBody);

UnitOfWork.prototype.run = function (callContext, args) {
    this.UnitOfWorkData = {
        collectionRecycleBin: new Map(),
        openedCursors: [],
        seenCollections: new Map()
    };
    debug("Starting.");
    WithBody.prototype.run.call(this, callContext, args);
};

UnitOfWork.prototype.bodyCompleted = function (callContext, reason, result) {
    let self = this;

    debug(`UnitOfWork's body completed, reason: ${reason}.`);

    Bluebird.coroutine(function* () {
        let taskError = null;

        debug("Doing final tasks.");
        try {
            let collectionRecycleBin = self.UnitOfWorkData.collectionRecycleBin;
            let openedCursors = self.UnitOfWorkData.openedCursors;
            let tasks = [];

            debug(`Collections in recycle bin: ${collectionRecycleBin.size}.`);
            for (let coll of collectionRecycleBin.values()) {
                debug(`Dropping collection: ${coll.collectionName}`);
                tasks.push(Bluebird.promisify(coll.drop, coll)()
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

            debug(`Cursors to close: ${openedCursors.length}.`);
            for (let idx = 0; idx < openedCursors.length; idx++) {
                let c = openedCursors[idx];
                tasks.push(Bluebird.promisify(c.close, c)()
                    .then(function () {
                        debug(`Cursor ${idx}. dropped.`);
                    })
                    .catch(function (e) {
                        debug(`ERROR: Cursor ${idx}. closing failed with\n${e.stack}`);
                    }));
            }

            yield Bluebird.all(tasks);
        }
        catch (e) {
            taskError = e;
        }
        finally {
            delete self.UnitOfWorkData;

            if (taskError) {
                debug("ERROR: final tasks failed. Reporting error to call context.");
                callContext.fail(taskError);
            }
            else {
                debug("Final tasks completed.");
                callContext.end(reason, result);
            }
        }
    })();
};

UnitOfWork.addCollectionToRecycleBin = function (scope, collection) {
    let bin = scope.UnitOfWorkData.collectionRecycleBin;
    debug(`Adding collection '${collection.collectionName}' to recycle bin.`);
    bin.set(collection.collectionName, collection);
    debug(`Recycle bin size is ${bin.size}.`);
};

UnitOfWork.registerOpenedCursor = function (scope, cursor) {
    let cursors = scope.UnitOfWorkData.openedCursors;
    debug(`Registering a cursor as opened.`);
    cursors.push(cursor);
    debug(`There are ${cursors.length} cursors registered.`);
};

UnitOfWork.unregisterOpenedCursor = function (scope, cursor) {
    debug(`Unregistering opened cursor.`);
    scope.UnitOfWorkData.openedCursors = _.without(scope.UnitOfWorkData.openedCursors, cursor);
    debug(`There are ${scope.UnitOfWorkData.openedCursors.length} cursors registered.`);
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
