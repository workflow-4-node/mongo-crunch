"use strict";

let util = require("util");
let Modify = require("./modify");
let Activity = require("../../deps/workflow-4-node").activities.Activity;
let debug = require("debug")("mongo-crunch:Insert");
let Bluebird = require("bluebird");
let p = Bluebird.promisify;

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
    if (reason === Activity.states.complete) {
        if (result) {
            if (_.isArray(result)) {
                if (result.length) {
                    let coll = callContext.activity.getCollection(this);
                    let options = this.getOptions();
                    debug(`Inserting ${result.length} documents.`);
                    debug(`Options: ${options}`);
                    p(coll.insertMany, coll)(result, options)
                        .then(function(r) {
                            debug(`Insert completed. Result: ${r}`);
                            callContext.complete(r);
                        })
                        .catch(function(e) {
                            callContext.fail(e);
                        });
                    return;
                }
            }
            else if (_.isPlainObject(result)) {
                let coll = callContext.activity.getCollection(this);
                let options = this.getOptions();
                debug(`Inserting a document: ${result}`);
                debug(`Options: ${options}`);
                p(coll.insertOne, coll)(result, options)
                    .then(function(r) {
                        debug(`Insert completed. Result: ${r}`);
                        callContext.complete(r);
                    })
                    .catch(function(e) {
                        callContext.fail(e);
                    });
                return;
            }
            else {
                callContext.fail(new Error(`Unknown type of documents property: ${typeof result}.`));
            }
        }
        debug("No documents, ending.");
        callContext.end(reason);
    }
    else {
        callContext.end(reason, result);
    }
};

module.exports = Insert;