"use strict";

let wf4node = require("../../../deps/workflow-4-node");
let util = require("util");
let Modify = require("./modify");
let Activity = wf4node.activities.Activity;
let debug = require("debug")("mongo-crunch:Insert");
let Bluebird = require("bluebird");
let p = Bluebird.promisify;
let _ = require("lodash");

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
            let coll = this.get("getCollection").call(this);
            let options = this.get("getOptions").call(this);
            if (_.isArray(result)) {
                if (result.length) {
                    debug(`Inserting ${result.length} documents.`);
                    debug(`Options: ${util.inspect(options)}`);
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
                debug(`Inserting a document: ${util.inspect(result)}`);
                debug(`Options: ${util.inspect(options)}`);
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