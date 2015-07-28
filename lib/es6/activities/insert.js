"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Modify = require("./modify");
let Activity = wf4node.activities.Activity;
let debug = require("debug")("mongo-crunch:Insert");
let Bluebird = require("bluebird");
let p = Bluebird.promisify;
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");
let Collection = require("mongodb").Collection;
let createIterator = require("./createIterator");

function Insert() {
    Modify.call(this);

    this.documents = null;
}

util.inherits(Insert, Modify);

Insert.prototype.doWork = function (callContext) {
    debug("Scheduling documents.");
    callContext.schedule(this.documents, "_documentsGot");
};

Insert.prototype._documentsGot = function (callContext, reason, result) {
    let self = this;
    if (reason === Activity.states.complete) {
        if (result) {
            let coll = this.getCollection.call(this);
            let options = this.getOptions.call(this);
            let it = createIterator(this, result);
            let bulk = coll.initializeUnorderedBulkOp();
            var count = 0;
            debug("Processing.");
            var process = function() {
                it.next(function (err, docs) {
                    if (err) {
                        debug(`Next failed.\n${err.stack}`);
                        callContext.fail(err);
                    }
                    else if (docs) {
                        debug(`${docs.length} docs got.`);
                        for (let doc of docs) {
                            bulk.insert(doc);
                            count++;
                        }
                        if (count > 1000) {
                            debug("Executing bulk.");
                            bulk.execute(options, function(err2, bwResult) {
                                if (err2) {
                                    debug(`Bulk execute failed.\n${err2.stack}`);
                                    callContext.fail(err2);
                                }
                                else {
                                    debug("Bulk executed.");
                                    count = 0;
                                    process();
                                }
                            });
                        }
                        else {
                            process();
                        }
                    }
                });
            };
            if (!count) {
                callContext.complete();
            }
            else {
                debug("Executing bulk.");
                bulk.execute(options, function(err, bwResult) {
                    if (err) {
                        debug(`Bulk execute failed.\n${err.stack}`);
                        callContext.fail(err);
                    }
                    else {
                        debug("Bulk executed.");
                        callContext.complete();
                    }
                });
            }
        }
        else {
            debug("No documents, ending.");
            callContext.end(reason);
        }
    }
    else {
        callContext.end(reason, result);
    }
};

module.exports = Insert;