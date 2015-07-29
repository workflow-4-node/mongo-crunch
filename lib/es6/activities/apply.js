"use strict";

let util = require("util");
let Query = require("./query");
let UnitOfWork = require("./unitOfWork");
let debug = require("debug")("mongo-crunch:Apply");
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let _ = require("lodash");
let Collection = require("mongodb").Collection;
let wf4node = require("workflow-4-node");
let Activity = wf4node.activities.Activity;
let ApplyCursor = require("./applyCursor");

function Apply() {
    Query.call(this);

    this.toArray = false;
    this.transform = null;
    this.nonScopedProperties.add("_apply");
    this.codeProperties.add("transform");
}

util.inherits(Apply, Query);

Apply.prototype.doQuery = function (callContext, query, options) {
    this._query = query;
    this._options = options;
    callContext.schedule(this._args, "_argsGot");
};

Apply.prototype._argsGot = function(callContext, reason, result) {
    if (reason !== Activity.states.complete) {
        callContext.end(reason, result);
        return;
    }

    let self = this;
    let query = this._query;
    let options = this._options;
    let coll = this.getCollection.call(this);
    query = query || {};
    debug("Creating cursor on '%s' for query:\n%j\noptions:\n%j", coll.collectionName, query, options);
    let cursor = coll.find(query, options);
    cursor = callContext.activity._apply.call(this, result, coll, cursor, options);
    if (self.toArray) {
        debug(`Converting cursor to array.`);
        cursor.toArray(function (err, _result) {
            if (err) {
                callContext.fail(err);
            }
            else {
                debug(`_result documents count: ${_result.length}`);
                callContext.complete(_result);
            }
            cursor.close();
        });
    }
    else {
        debug(`Registering cursor in context.`);
        UnitOfWork.registerOpenedcursor(self, cursor);
        callContext.complete(cursor);
    }
};

Apply.prototype._apply = function(operands, coll, cursor, options) {
    if (_.isPlainObject(operands)) {
        operands = [operands];
    }
    if (!operands) {
        return cursor;
    }
    if (!_.isArray(operands)) {
        throw new Error("Operands should be and array or a plain object.");
    }
    options = _.clone(options);
    debug(`Applying ${operands.length} operands to cursor.`);
    for (let i = 0; i < operands.length; i++) {
        let operand = operands[i];
        if (!_.isPlainObject(operand)) {
            throw new Error(`Operand ${i}. should be a plain object.`);
        }
        if (!_.isPlainObject(operand.query)) {
            throw new Error(`Operand ${i}. property of 'query' should be a plain object.`);
        }
        if (!_.isString(operand.name)) {
            throw new Error(`Operand ${i}. property of 'name' should be a string.`);
        }
        let opColl = coll;
        if (operand.collection instanceof Collection) {
            opColl = operand.collection;
        }
        options.fields = operand.fields || undefined;
        let type = operand.type || "outer";
        if (type !== "outer" && type !== "cross") {
            throw new Error(`Operand ${i}. type's value '${type}' is invalid.`);
        }
        let applyPars = {
            scope: this,
            cursor: cursor,
            collection: opColl,
            query: operand.query,
            type: type,
            name: operand.name,
            flat: operand.flat,
            options: options
        };
        debug("Applying operand, collection: '%s', query:\n%j\ntype:%s\nflat:%s\nname:%s\noptions:\n%j",
            applyPars.collection.collectionName,
            applyPars.query,
            applyPars.type,
            applyPars.flat,
            applyPars.name,
            applyPars.options);
        cursor = new ApplyCursor(applyPars);
    }
    return cursor;
};

module.exports = Apply;