"use strict";

var Activity = require("../../deps/workflow-4-node").activities.Activity;
var util = require("util");
var activityMarkup = require("../../deps/workflow-4-node").activities.activityMarkup;
var _ = require("lodash");
var fast = require("fast.js");
var Bluebird = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var StrMap = require("backpack-node").collections.StrMap;

function MongoDBContext() {
    Activity.call(this);

    this.connections = null;
    this.body = null;
}

util.inherits(MongoDBContext, Activity);

MongoDBContext.prototype.run = function (callContext, args) {

    var self = this;
    var body = self.get("body");
    var connections = self.get("connections");

    if (!body) {
        callContext.complete();
        return;
    }

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
                throw new Error("Connection is invalid: " + JSON.stringify(conn));
            }

            if (_.isString(conn.url) && conn.url) {
                return conn;
            }
            throw new Error("Connection is invalid: " + JSON.stringify(conn));
        }

        var result = [];
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
        var connsDef = toConnectionsArray(connections);
        var processedConns = new StrMap();
        fast.forEach(connsDef, function (conn) {
            if (!processedConns.containsKey(conn.name)) {
                processedConns.add(conn.name, conn);
            }
            else {
                throw new Error("Duplicated connection \"" + conn.name + "\".");
            }
        });

        var tasks = [];
        processedConns.forEachValue(function (conn) {
            tasks.push(Bluebird.promisify(MongoClient.connect)(conn.url, conn.options).then(function (db) {
                conn.db = db;
            }));
        });

        Bluebird.all(tasks).then(
            function () {
                var newConns = {};
                self.set("connections", newConns);
                self.set("MongoDBContext_CollectionRecycleBin", {});
                self.set("MongoDBContext_OpenedCursors", []);
                self.set("MongoDBContext_SeenCollections", []);
                processedConns.forEach(function(kvp) {
                    newConns[kvp.key] = kvp.value.db;
                });
                // Continue:
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
    var self = this;

    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    Bluebird.coroutine(function* () {
        var taskError = null;
        var cursorCloseFails = 0;

        // Do final tasks
        try {
            var MongoDBContext_CollectionRecycleBin = self.get("MongoDBContext_CollectionRecycleBin");
            var MongoDBContext_OpenedCursors = self.get("MongoDBContext_OpenedCursors");
            var tasks = [];

            fast.forEach(_.values(MongoDBContext_CollectionRecycleBin), function (coll) {
                tasks.push(Bluebird.promisify(coll.drop, coll)().catch(function(e) {
                    if (e.name === "MongoError" && e.message === "ns not found") {
                        return;
                    }
                    throw e;
                }));
            });

            fast.forEach(MongoDBContext_OpenedCursors, function(c) {
                tasks.push(Bluebird.coroutine(function*() {
                    try {
                        yield Bluebird.promisify(c.close, c)();
                    }
                    catch (e) {
                        cursorCloseFails++;
                    }
                }));
            });

            yield Bluebird.all(tasks);
        }
        catch(e) {
            taskError = e;
        }

        finally {
            self.delete("MongoDBContext_CollectionRecycleBin");

            // Close all dbs:
            var connections = self.get("connections");
            var closeTasks = [];
            fast.forEach(_.values(connections), function (db) {
                closeTasks.push(Bluebird.promisify(db.close, db)(true));
            });

            try {
                yield Bluebird.all(closeTasks);
            }
            catch (e) {
                console.warn("Cannot close MongoDB connection: " + e.stack);
            }

            if (cursorCloseFails) {
                console.warn("Cannot close all opened cursors. Number of failed attempts: " + cursorCloseFails + ".");
            }

            if (taskError) {
                callContext.fail(taskError);
            }
            else {
                callContext.complete();
            }
        }
    })();
};

MongoDBContext.addCollectionToRecycleBin = function (scope, collection) {
    scope.get("MongoDBContext_CollectionRecycleBin")[collection.collectionName] = collection;
};

MongoDBContext.registerOpenedCursor = function (scope, cursor) {
    scope.get("MongoDBContext_OpenedCursors").push(cursor);
};

MongoDBContext.unregisterOpenedCursor = function (scope, cursor) {
    scope.set("MongoDBContext_OpenedCursors", _.without(scope.get("MongoDBContext_OpenedCursors"), cursor));
};

MongoDBContext.isFirstSeenCollection = function(scope, db, collectionName) {
    var colls = scope.get("MongoDBContext_SeenCollections");
    var entry = _.first(_.where(colls, { db: db }));
    if (!entry) {
        var collReg = {};
        collReg[collectionName] = true;
        colls.push({
            db: db,
            collections: collReg
        });
        return true;
    }
    if (!entry.collections[collectionName]) {
        entry.collections[collectionName] = true;
        return true;
    }
    return false;
};

module.exports = MongoDBContext;