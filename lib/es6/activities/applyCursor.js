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
    while(_.isUndefined(next));
    return next;
});

ApplyCursor.prototype._nextImplInner = async(function*() {
    if (this.end) {
        return null;
    }

    if (this.leftIt === null) {
        debug("Left iterator is not present.");
        debug("Stepping on main iterator.");
        this.doc = yield this.it.nextAsync();
        if (!this.doc) {
            debug("Main iterator completed. End.");
            this.end = true;
            return null;
        }
        debug("Doc got, making the left query.");
        let leftQuery = this._makeLeftQuery();
        debug("Creating cursor for left query:\n%j", leftQuery);
        this.leftIt = createIterator(this.pars.scope, this.pars.collection.find(leftQuery, this.pars.options));
        this.leftC = 0;
    }
    debug("Stepping on left.");
    let leftDoc = yield this.leftIt.nextAsync();
    this.leftC++;
    if (!leftDoc) {
        debug("Left doc is null.");
        this.leftIt = null;
        if (this.pars.type === "cross") {
            debug("This is a cross apply, so document will not get returned. Returning the next doc.");
            return undefined;
        }
        else if (this.leftC === 1) {
            let doc = _.clone(this.doc);
            doc[this.pars.name] = null;
            debug("Returning:\n%j", doc);
            return doc;
        }
        else {
            debug("Null has been returned before. Returning the next doc.");
            return undefined;
        }
    }
    else {
        let doc = _.clone(this.doc);
        debug("Left doc got.");
        doc[this.pars.name] = leftDoc;
        debug("Returning:\n%j", doc);
        return doc;
    }
});

ApplyCursor.prototype._makeLeftQuery = function() {
    debug("Making left query.");
    let self = this;
    let query = this.pars.query;
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
    return query;
};

ApplyCursor.prototype.toArray = function (cb) {
    let self = this;
    let impl = async(function*() {
        let result = [];
        let doc;
        while (doc = (yield self._nextImpl())) {
            result.push(doc);
        }
        return result;
    });
    impl().nodeify(cb);
};

ApplyCursor.prototype.close = _.noop;

module.exports = ApplyCursor;