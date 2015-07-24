"use strict";

let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let UnitOfWork = require("./unitOfWork");
let util = require("util");
let activityMarkup = wf4node.activities.activityMarkup;
let _ = require("lodash");
let Bluebird = require("bluebird");
let MongoClient = require("mongodb").MongoClient;
let debug = require("debug")("mongo-crunch:MongoDBContext");

function MongoDBContext() {
    UnitOfWork.call(this);

    this.connections = null;
}

util.inherits(MongoDBContext, UnitOfWork);

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

                for (let kvp of processedConns.entries()) {
                    newConns[kvp[0]] = kvp[1].db;
                }

                debug("Context has been initialized, scheduling body.");
                UnitOfWork.prototype.run.call(self, callContext, args);
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

    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    Bluebird.coroutine(function* () {
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

        debug("MongoDB context end.");
        callContext.end(reason, result);
    })();
};

module.exports = MongoDBContext;