"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let ForEach = wf4node.activities.ForEach;
let debug = require("debug")("mongo-crunch:EachDocument");
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");
let Collection = require("mongodb").Collection;
let createIterator = require("./createIterator");

function querify(doc) {
    if (_.isArray(doc)) {
        return doc.map(querify);
    }
    else if (_.isPlainObject(doc)) {
        let result = {};
        for (let key in doc) {
            if (key[0] === "~" || key[0] === "`" || key[0] === "!") {
                result["$" + key.substr(1)] = querify(doc[key]);
            }
            else {
                result[key] = querify(doc[key]);
            }
        }
        return result;
    }
    else {
        return doc;
    }
}

function EachDocument() {
    Activity.call(this);

    this.varName = "document";
    this.documents = null;
    this.querify = false;
    this.parallel = true;
    this._forEach = null;
}

util.inherits(EachDocument, Activity);

EachDocument.prototype.initializeStructure = function () {
    this._forEach = new ForEach();
    this._forEach.varName = this.varName;
    this._forEach.args = this.args;
    this._forEach.parallel = this.parallel;
    this.args = null;
};

EachDocument.prototype.run = function (callContext, args) {
    callContext.schedule(this.documents, "_documentsGot");
};

EachDocument.prototype._documentsGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }
    this._todo = result;
    callContext.activity._doStep.call(this, callContext);
};

EachDocument.prototype._doStep = function (callContext) {
    let self = this;
    let todo = self._todo;
    debug(`Doing EachDocument step.`);
    let doQuerify = self.querify;
    let forEach = self._forEach;
    let it = createIterator(this, todo);
    debug("Iterating.");
    it.next(function (err, docs) {
        if (err) {
            debug(`Next failed.\n${err.stack}`);
            callContext.fail(err);
        }
        else if (docs) {
            debug(`${docs.length} docs got, scheduling body.`);
            if (doQuerify) {
                docs = querify(docs);
            }
            self[self.varName] = docs;
            forEach.items = docs;
            callContext.schedule(forEach, "_completed");
        }
        else {
            debug("Iteration completed.");
            callContext.complete();
        }
    });
};

EachDocument.prototype._completed = function (callContext, reason, result) {
    if (reason === Activity.states.complete) {
        callContext.activity._doStep.call(this, callContext, result);
    }
    else {
        callContext.end(reason, result);
    }
};

module.exports = EachDocument;