"use strict";

let debug = require("debug")("mongo-crunch:ApplyCursor");
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let createIterator = require("./createIterator");
let _ = require("lodash");
let ValueAccessor = require("./valueAccessor");

function ApplyCursor(pars) {
    this.it = createIterator(pars.scope, pars.cursor);
    this.leftIt = null;
    this.leftC = 0;
    this.pars = pars;
    this.end = false;
    this.accessor = new ValueAccessor();
}

ApplyCursor.prototype.next = function (cb) {
    this._nextImpl().nodeify(cb);
};

ApplyCursor.prototype._nextImpl = async(function*() {
    let next;
    do {
        next = yield this._nextImplInner();
    }
    while (_.isUndefined(next));
    return next;
});

ApplyCursor.prototype._nextImplInner = async(function*() {
    if (this.end) {
        return null;
    }

    if (this.leftIt === null) {
        debug("Left iterator is not present.");
        debug("Stepping on main iterator.");
        if (!this.pars.flat && this.doc && this.doc[this.pars.name].length) {
            debug("Returning grouped document: %j", this.doc);
            let doc = _.clone(this.doc);
            this.doc = null;
            return doc;
        }
        this.doc = yield this.it.nextAsync();
        if (!this.doc) {
            debug("Main iterator completed. End.");
            this.end = true;
            return null;
        }
        this.doc[this.pars.name] = this.pars.flat ? null : [];
        debug("Doc got, making the left query.");
        let leftQuery = this._makeLeftQuery();
        if (_.isPlainObject(leftQuery.pipeline) || _.isArray(leftQuery.pipeline)) {
            if (_.isUndefined(this.pars.options.allowDiskUse)) {
                this.pars.options.allowDiskUse = true;
            }
            debug("Creating cursor for left aggregate pipeline:\n%j", leftQuery.pipeline);
            this.leftIt = createIterator(this.pars.scope, this.pars.collection.aggregate(leftQuery.pipeline, this.pars.options));
        }
        else {
            debug("Creating cursor for left query:\n%j", leftQuery);
            this.leftIt = createIterator(this.pars.scope, this.pars.collection.find(leftQuery, this.pars.options));
        }
        this.leftC = 0;
    }
    debug("Stepping on left.");
    let leftDoc = yield this.leftIt.nextAsync();
    this.leftC++;
    if (!leftDoc) {
        debug("Left doc is null.");
        this.leftIt.close();
        this.leftIt = null;
        if (this.pars.type === "cross") {
            debug("This is a cross apply, so document will not get returned. Returning the next doc.");
            return undefined;
        }
        else if (this.leftC === 1) {
            let doc = _.clone(this.doc);
            debug("Returning:\n%j", doc);
            return doc;
        }
        else {
            debug("Null has been returned before. Returning the next doc.");
            return undefined;
        }
    }
    else {
        if (this.pars.flat) {
            let doc = _.clone(this.doc);
            debug("Left doc got.");
            doc[this.pars.name] = leftDoc;
            debug("Returning:\n%j", doc);
            return doc;
        }
        else {
            debug("Left doc got, adding to group.");
            this.doc[this.pars.name].push(leftDoc);
            debug("Returning the next doc.");
            return undefined;
        }
    }
});

ApplyCursor.prototype._makeLeftQuery = function () {
    debug("Making left query.");
    let self = this;
    let query = this.pars.query;
    let isAggregate = false;
    if (_.isPlainObject(query.pipeline) || _.isArray(query.pipeline)) {
        isAggregate = true;
        if (_.isPlainObject(query.pipeline)) {
            query = query.pipeline.$match;
        }
        else {
            query = _(query.pipeline).filter(function(p) { return !!p.$match; }).first();
        }
    }
    let tasks = this.tasks;
    if (!tasks) {
        tasks = [];
        var transform = function (obj) {
            if (_.isArray(obj)) {
                for (let item of obj) {
                    transform(item);
                }
            }
            else if (_.isPlainObject(obj)) {
                for (let key in obj) {
                    let value = obj[key];
                    if (_.isString(value)) {
                        let trimmed = value.trim();
                        if (trimmed.length > 1 && trimmed[0] === "#") {
                            let expr = value.substr(1).trim();
                            if (expr) {
                                tasks.push(function (doc) {
                                    let newValue = self.accessor.get(doc, expr);
                                    debug("Setting query expression '# %s' to main document value of '%j'.", expr, newValue);
                                    obj[key] = newValue;
                                });
                            }
                        }
                    }
                    else if (_.isPlainObject(value)) {
                        transform(value);
                    }
                }
            }
        };
        transform(query);
        this.tasks = tasks;
    }
    for (let task of tasks) {
        task(this.doc);
    }
    return this.pars.query;
};

ApplyCursor.prototype.toArray = function (cb) {
    let self = this;
    let impl = async(function*() {
        let result = [];
        let doc;
        for (; ;) {
            doc = yield self._nextImpl();
            if (doc) {
                result.push(doc);
            }
            else {
                break;
            }
        }
        return result;
    });
    impl().nodeify(cb);
};

ApplyCursor.prototype.close = function() {
    debug("Closed.");
    if (this.it) {
        this.it.close();
        this.it = null;
    }
    if (this.leftIt) {
        this.leftIt.close();
        this.leftIt = null;
    }
};

module.exports = ApplyCursor;