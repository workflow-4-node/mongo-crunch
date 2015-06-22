"use strict";

let wf4node = require("../../../deps/workflow-4-node");
let Activity = wf4node.activities.Activity;
let util = require("util");
let activityMarkup = wf4node.activities.activityMarkup;
let _ = require("lodash");
let fast = require("fast.js");
let Bluebird = require("bluebird");
let MongoClient = require("mongodb").MongoClient;
let StrMap = require("backpack-node").collections.StrMap;
let debug = require("debug")("mongo-crunch:Context");

function MongoDBContext () {
    Activity.call(this);

    this.connections = null;
    this.body = null;
}

util.inherits(MongoDBContext, Activity);

MongoDBContext.prototype.run = function (callContext, args) {
    let self = this;
    let body = self.get("body");
    let connections = self.get("connections");

    debug(`Running connections: ${connections}.`);

    if (!body) {
        debug("There is no body, context completed.");

        callContext.complete();
        return;
    }

    function toConnectionsArray (conns) {

        function toConnection (conn) {
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
                throw new Error("Connection is invalid: " + JSON.stringify(conn));
            }

            if (_.isString(conn.url) && conn.url) {
                return conn;
            }
            throw new Error("Connection is invalid: " + JSON.stringify(conn));
        }

        let result = [];
        if (_.isArray(conns)) {
            fast.forEach(conns, function (c) {
                result.push(toConnection(c));
            });
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
        let processedConns = new StrMap();
        fast.forEach(connsDef, function (conn) {
            if (!processedConns.containsKey(conn.name)) {
                processedConns.add(conn.name, conn);
            }
            else {
                throw new Error("Duplicated connection \"" + conn.name + "\".");
            }
        });

        let tasks = [];
        processedConns.forEachValue(function (conn) {
            debug(`Creating Db for connection ${conn.url}, options ${conn.options}.`);
            tasks.push(Bluebird.promisify(MongoClient.connect)(conn.url, conn.options).then(function (db) {
                debug("Db created.");
                conn.db = db;
            }));
        });

        Bluebird.all(tasks).then(
            function () {
                let newConns = {};
                self.set("connections", newConns);
                self.set("MongoDBContext_CollectionRecycleBin", {});
                self.set("MongoDBContext_OpenedCursors", []);
                self.set("MongoDBContext_SeenCollections", []);
                processedConns.forEach(function (kvp) {
                    newConns[kvp.key] = kvp.value.db;
                });

                debug("Context has been initialized, scheduling body.");
                callContext.schedule(body, "_bodyCompleted");
            },
            function (e) {
                callContext.fail(e);
            });
    }
    catch (e) {
        callContext.fail(e);
    }
};

MongoDBContext.prototype._bodyCompleted = function (callContext, reason, result) {
    let self = this;

    debug(`Context's body completed, reason: ${reason}.`);

    if (reason !== Activity.states.complete) {
        debug("Reason is not complete, resuming call context.");
        callContext.end(reason, result);
        return;
    }

    Bluebird.coroutine(function* () {
        let taskError = null;

        debug("Doing final tasks.");
        try {
            let MongoDBContext_CollectionRecycleBin = self.get("MongoDBContext_CollectionRecycleBin");
            let MongoDBContext_OpenedCursors = self.get("MongoDBContext_OpenedCursors");
            let tasks = [];

            let binVals = _.values(MongoDBContext_CollectionRecycleBin);
            debug(`Collections in recycle bin: ${binVals.length}.`);
            fast.forEach(binVals, function (coll) {
                debug(`Dropping collection: ${coll.collectionName}`);
                tasks.push(Bluebird.promisify(coll.drop, coll)()
                    .then(function() {
                        debug(`Collection '${coll.collectionName}' dropped.`);
                    })
                    .catch(function (e) {
                        if (e.name === "MongoError" && e.message === "ns not found") {
                            debug(`Collection '${coll.collectionName}' doesn't exists.`);
                            return;
                        }
                        debug(`ERROR: Collection '${coll.collectionName}' dropping failed with\n${e.stack}`);
                    }));
            });

            debug(`Cursors to close: ${MongoDBContext_OpenedCursors.length}.`);
            fast.forEach(MongoDBContext_OpenedCursors, function (c, idx) {
                tasks.push(Bluebird.promisify(c.close, c)()
                    .then(function() {
                        debug(`Cursor ${idx}. dropped.`);
                    })
                    .catch(function(e) {
                        debug(`ERROR: Cursor ${idx}. closing failed with\n${e.stack}`);
                    }));
            });

            yield Bluebird.all(tasks);
        }
        catch (e) {
            taskError = e;
        }
        finally {
            self.delete("MongoDBContext_CollectionRecycleBin");
            self.delete("MongoDBContext_OpenedCursors");
            self.delete("MongoDBContext_SeenCollections");

            // Close all dbs:
            let connections = self.get("connections");
            debug(`Closing ${connections.length} connections.`);
            let closeTasks = [];
            fast.forEach(_.values(connections), function (db) {
                debug(`Closing '${db.databaseName}'.`);
                closeTasks.push(Bluebird.promisify(db.close, db)(true)
                    .then(function() {
                        debug(`Db '${db.databaseName}' closed.`);
                    })
                    .catch(function(e) {
                        debug(`ERROR: Closing Db '${db.databaseName}' failed with\n${e.stack}`);
                    }));
            });

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
                callContext.complete();
            }
        }
    })();
};

MongoDBContext.addCollectionToRecycleBin = function (scope, collection) {
    let bin = scope.get("MongoDBContext_CollectionRecycleBin");
    debug(`Adding collection '${collection.collectionName}' to recycle bin.`);
    bin[collection.collectionName] = collection;
    debug(`Recycle bin size is ${_.keys(bin).length}.`);
};

MongoDBContext.registerOpenedCursor = function (scope, cursor) {
    let cursors = scope.get("MongoDBContext_OpenedCursors");
    debug(`Registering a cursor as opened.`);
    cursors.push(cursor);
    debug(`There are ${cursors.length} cursors registered.`);
};

MongoDBContext.unregisterOpenedCursor = function (scope, cursor) {
    debug(`Unregistering opened cursor.`);
    scope.set("MongoDBContext_OpenedCursors", _.without(scope.get("MongoDBContext_OpenedCursors"), cursor));
    debug(`There are ${scope.get("MongoDBContext_OpenedCursors").length} cursors registered.`);
};

MongoDBContext.isFirstSeenCollection = function (scope, db, collectionName) {
    debug(`Determining if '${collectionName}' collection in '${db.databaseName}' db is first seen by the current context.`);
    let colls = scope.get("MongoDBContext_SeenCollections");
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