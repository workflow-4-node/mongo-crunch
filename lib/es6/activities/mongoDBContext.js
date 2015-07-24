"use strict";

let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let WithBody = wf4node.activities.WithBody;
let util = require("util");
let activityMarkup = wf4node.activities.activityMarkup;
let _ = require("lodash");
let Bluebird = require("bluebird");
let MongoClient = require("mongodb").MongoClient;
let debug = require("debug")("mongo-crunch:Context");

function MongoDBContext() {
    WithBody.call(this);

    this.connections = null;
}

util.inherits(MongoDBContext, WithBody);

MongoDBContext.prototype.run = function (callContext, args) {
    let self = this;
    let connections = self.connections || process.env.MONGO_URL;

    debug(`Running connections: ${connections}.`);

    function toConnectionsArray(conns) {

        function toConnection(conn) {
            if (_.isString(conn)) {
                conn = {
                    name: "default",
                    url: conn,
                    options: null
                };
            }
            else if (_.isObject(conn)) {
                conn = {
                    name: conn.name || "default",
                    url: conn.url,
                    options: conn.options
                };
            }
            else {
                throw new Error("Connection is invalid: " + util.inspect(conn));
            }

            if (_.isString(conn.url) && conn.url) {
                return conn;
            }
            throw new Error("Connection is invalid: " + util.inspect(conn));
        }

        let result = [];
        if (_.isArray(conns)) {
            for (let c of conns) {
                result.push(toConnection(c));
            }
        }
        else {
            result.push(toConnection(conns));
        }
        return result;
    }

    try {
        debug("Parsing connections.");
        let connsDef = toConnectionsArray(connections);
        debug(`There is ${connsDef.length} connection(s) has been defined.`);
        let processedConns = new Map();
        for (let conn of connsDef) {
            if (!processedConns.has(conn.name)) {
                processedConns.set(conn.name, conn);
            }
            else {
                throw new Error("Duplicated connection \"" + conn.name + "\".");
            }
        }

        let tasks = [];
        for (let conn of processedConns.values()) {
            debug(`Creating Db for connection ${conn.url}, options ${conn.options}.`);
            tasks.push(Bluebird.promisify(MongoClient.connect)(conn.url, conn.options).then(function (db) {
                debug("Db created.");
                conn.db = db;
            }));
        }

        Bluebird.all(tasks).then(
            function () {
                let newConns = {};
                self.connections = newConns;
                self.MongoDBContext_CollectionRecycleBin = {};
                self.MongoDBContext_OpenedCursors = [];
                self.MongoDBContext_SeenCollections = [];
                for (let kvp of processedConns.entries()) {
                    newConns[kvp[0]] = kvp[1].db;
                }

                debug("Context has been initialized, scheduling body.");
                WithBody.prototype.run.call(self, callContext, args);
            },
            function (e) {
                callContext.fail(e);
            });
    }
    catch (e) {
        callContext.fail(e);
    }
};

MongoDBContext.prototype.bodyCompleted = function (callContext, reason, result) {
    let self = this;

    debug(`Context's body completed, reason: ${reason}.`);

    Bluebird.coroutine(function* () {
        let taskError = null;

        debug("Doing final tasks.");
        try {
            let MongoDBContext_CollectionRecycleBin = self.MongoDBContext_CollectionRecycleBin;
            let MongoDBContext_OpenedCursors = self.MongoDBContext_OpenedCursors;
            let tasks = [];

            let binVals = _.values(MongoDBContext_CollectionRecycleBin);
            debug(`Collections in recycle bin: ${binVals.length}.`);
            for (let coll of binVals) {
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

            debug(`Cursors to close: ${MongoDBContext_OpenedCursors.length}.`);
            for (let idx = 0; idx < MongoDBContext_OpenedCursors.length; idx++) {
                let c = MongoDBContext_OpenedCursors[idx];
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
            delete self.MongoDBContext_CollectionRecycleBin;
            delete self.MongoDBContext_OpenedCursors;
            delete self.MongoDBContext_SeenCollections;

            // Close all dbs:
            let connections = self.connections;
            let connNames = _.keys(connections);
            debug(`Closing ${connNames.length} connections.`);
            let closeTasks = [];
            for (let connName of connNames) {
                let db = connections[connName];
                debug(`Closing '${db.databaseName}'.`);
                closeTasks.push(Bluebird.promisify(db.close, db)(true)
                    .then(function () {
                        debug(`Db '${db.databaseName}' closed.`);
                    })
                    .catch(function (e) {
                        debug(`ERROR: Closing Db '${db.databaseName}' failed with\n${e.stack}`);
                    }));
            }

            try {
                yield Bluebird.all(closeTasks);
            }
            catch (e) {
                debug("ERROR: Cannot close MongoDB connections, error\n" + e.stack);
            }

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

MongoDBContext.addCollectionToRecycleBin = function (scope, collection) {
    let bin = scope.MongoDBContext_CollectionRecycleBin;
    debug(`Adding collection '${collection.collectionName}' to recycle bin.`);
    bin[collection.collectionName] = collection;
    debug(`Recycle bin size is ${_.keys(bin).length}.`);
};

MongoDBContext.registerOpenedCursor = function (scope, cursor) {
    let cursors = scope.MongoDBContext_OpenedCursors;
    debug(`Registering a cursor as opened.`);
    cursors.push(cursor);
    debug(`There are ${cursors.length} cursors registered.`);
};

MongoDBContext.unregisterOpenedCursor = function (scope, cursor) {
    debug(`Unregistering opened cursor.`);
    scope.MongoDBContext_OpenedCursors = _.without(scope.MongoDBContext_OpenedCursors, cursor);
    debug(`There are ${scope.MongoDBContext_OpenedCursors.length} cursors registered.`);
};

MongoDBContext.isFirstSeenCollection = function (scope, db, collectionName) {
    debug(`Determining if '${collectionName}' collection in '${db.databaseName}' db is first seen by the current context.`);
    let colls = scope.MongoDBContext_SeenCollections;
    let entry = _.first(_.where(colls, { db: db }));
    if (!entry) {
        let collReg = {};
        collReg[collectionName] = true;
        colls.push({
            db: db,
            collections: collReg
        });
        debug("Fist seen.");
        return true;
    }
    if (!entry.collections[collectionName]) {
        entry.collections[collectionName] = true;
        debug("First seen.");
        return true;
    }
    debug("Not first seen.");
    return false;
};

module.exports = MongoDBContext;