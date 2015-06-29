"use strict";

let wf4node = require("../../../deps/workflow-4-node");
let util = require("util");
let Activity = wf4node.activities.Activity;
let ForEach = wf4node.activities.ForEach;
let debug = require("debug")("mongo-crunch:EachDocument");
let _ = require("lodash");
let MongoDBContext = require("./mongoDBContext");

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
    this.body = null;
    this.querify = false;
    this._forEach = null;
}

util.inherits(EachDocument, Activity);

EachDocument.prototype.initializeStructure = function () {
    this._forEach = new ForEach();
    this._forEach.varName = this.varName;
    this._forEach.args = this.args;
    this.args = null;
    console.log("initializeStructure");
};

EachDocument.prototype.createScopePart = function () {
    return Activity.prototype.createScopePart.call(this);
};

EachDocument.prototype._getScopeKeys = function () {
    let keys = Activity.prototype._getScopeKeys.call(this);
    console.log(keys);
    console.log(_.keys(this));
    return keys;
};

EachDocument.prototype.run = function (callContext, args) {
    callContext.schedule(this.get("documents"), "_documentsGot");
};

EachDocument.prototype._documentsGot = function (callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    this.set("_todo", result);
    callContext.activity._doStep.call(this, callContext);
};

EachDocument.prototype._doStep = function (callContext) {
    let self = this;
    debug(`Doing EachDocument step.`);
    let todo = self.get("_todo");
    let doQuerify = self.get("querify");
    let forEach = self.get("_forEach");
    if (_.isArray(todo) || _.isPlainObject(todo)) {
        debug("Scheduling internal forEach.");
        todo = _.isArray(todo) ? todo : [todo];
        if (doQuerify) {
            todo = todo.map(querify);
        }
        forEach.items = todo;
        callContext.schedule(forEach, "_completed");
    }
    else if (_.isObject(todo) && _.isFunction(todo.next)) {
        debug("Iterating cursor.");
        let args = this.set("_args", forEach.args);
        todo.next(function (err, doc) {
            if (err) {
                debug(`Next failed.\n${e.stack}`);
                MongoDBContext.unregisterOpenedCursor(self, todo);
                todo.close();
                callContext.fail(err);
            }
            else if (doc) {
                if (doQuerify) {
                    doc = querify(doc);
                }
                debug(`Document got:\n${util.inspect(doc)}`);
                self.set(self.get("varName"), doc);
                debug("Scheduling body.");
                callContext.schedule(args, "_completed");
            }
            else {
                debug("Cursor iteration completed.");
                MongoDBContext.unregisterOpenedCursor(self, todo);
                todo.close();
                callContext.complete();
            }
        });
    }
    else {
        debug(`Unknown type of documents: ${util.inspect(todo)}.`);
        throw new TypeError(`Unknown type of documents: ${typeof todo}.`);
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