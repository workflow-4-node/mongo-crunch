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
    if (_.isArray(result) || _.isPlainObject(result)) {
        this._items = result;
    }
    else {
        this._it = createIterator(this, result);
    }
    callContext.activity._doStep.call(this, callContext);
};

EachDocument.prototype._doStep = function (callContext) {
    let self = this;
    debug(`Doing EachDocument step.`);
    let doQuerify = self.querify;
    let forEach = self._forEach;
    let it = self._it;
    let items = self._items;
    if (it) {
        debug("Iterating.");
        it.next(function (err, doc) {
            if (err) {
                debug(`Next failed.\n${err.stack}`);
                callContext.fail(err);
            }
            else if (doc) {
                debug(`Doc got, scheduling body.`);
                if (doQuerify) {
                    doc = querify(doc);
                }
                forEach.items = doc;
                callContext.schedule(forEach, "_completed");
            }
            else {
                debug("Iteration completed.");
                callContext.complete();
            }
        });
    }
    else if (items) {
        debug("Yielding items.");
        delete self._items;
        forEach.items = items;
        callContext.schedule(forEach, "_completed");
    }
    else {
        debug("Yielding completed.");
        callContext.complete();
    }
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