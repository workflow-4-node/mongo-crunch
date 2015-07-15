"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Modify = require("./modify");
let Activity = wf4node.activities.Activity;
let debug = require("debug")("mongo-crunch:Insert");
let Bluebird = require("bluebird");
let p = Bluebird.promisify;
let _ = require("lodash");
let MongoDBContext = require("./mongoDBContext");

function Insert() {
    Modify.call(this);

    this.documents = null;
}

util.inherits(Insert, Modify);

Insert.prototype.doWork = function (callContext) {
    debug("Scheduling documents.");
    callContext.schedule(this.get("documents"), "_documentsGot");
};

Insert.prototype._documentsGot = function (callContext, reason, result) {
    let self = this;

    try {
        if (reason === Activity.states.complete) {
            if (result) {
                let coll = this.get("getCollection").call(this);
                let options = this.get("getOptions").call(this);
                if (_.isArray(result)) {
                    if (result.length) {
                        debug(`Inserting ${result.length} documents.`);
                        debug(`Options: ${util.inspect(options)}`);
                        p(coll.insertMany, coll)(result, options)
                            .then(function (r) {
                                debug(`Insert completed. Result: ${r}`);
                                callContext.complete(r);
                            })
                            .catch(function (e) {
                                callContext.fail(e);
                            });
                        return;
                    }
                }
                else if (_.isPlainObject(result)) {
                    debug(`Inserting a document: ${util.inspect(result)}`);
                    debug(`Options: ${util.inspect(options)}`);
                    p(coll.insertOne, coll)(result, options)
                        .then(function (r) {
                            debug(`Insert completed. Result: ${r}`);
                            callContext.complete(r);
                        })
                        .catch(function (e) {
                            callContext.fail(e);
                        });
                    return;
                }
                else if (_.isObject(result) && _.isFunction(result.next)) {
                    debug("Iterating cursor.");
                    var inserting = Bluebird.resolve();
                    var reported = false;
                    result.on("data", function(data) {
                        debug(`Inserting document:\n${util.inspect(data)}`);
                        result.pause();
                        inserting = p(coll.insertOne, coll)(data, options)
                            .then(function (r) {
                                debug(`Insert completed. Result: ${r}`);
                                result.resume();
                            })
                            .catch(function (err) {
                                if (!reported) {
                                    debug(`Insert error.`);
                                    MongoDBContext.unregisterOpenedCursor(self, result);
                                    result.close();
                                    callContext.fail(err);
                                    reported = true;
                                }
                            });
                    });
                    result.on("error", function(err) {
                        if (!reported) {
                            debug(`Cursor error.`);
                            MongoDBContext.unregisterOpenedCursor(self, result);
                            result.close();
                            callContext.fail(err);
                            reported = true;
                        }
                    });
                    result.on("end", function() {
                        inserting.then(function() {
                            if (!reported) {
                                debug(`Cursor end.`);
                                MongoDBContext.unregisterOpenedCursor(self, result);
                                result.close();
                                callContext.complete();
                                reported = true;
                            }
                        });
                    });
                    return;
                }
                else {
                    debug(`Unknown type of documents property: ${util.inspect(result)}.`);
                    callContext.fail(new Error(`Unknown type of documents property: ${typeof result}.`));
                    return;
                }
            }
            debug("No documents, ending.");
            callContext.end(reason);
        }
        else {
            callContext.end(reason, result);
        }
    }
    catch (e) {
        callContext.fail(e);
    }
};

module.exports = Insert;