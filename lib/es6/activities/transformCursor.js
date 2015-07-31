"use strict";

let debug = require("debug")("mongo-crunch:ApplyCursor");
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let createIterator = require("./createIterator");
let _ = require("lodash");

function TransformCursor(scope, cursor, transformFunction) {
    this.it = createIterator(scope, cursor);
    this.f = transformFunction;
    this.scope = scope;
}

TransformCursor.prototype.next = function (cb) {
    this._nextImpl().nodeify(cb);
};

TransformCursor.prototype._nextImpl = async(function*() {
    let next;
    do {
        next = yield this.it.nextAsync();
        if (next) {
            next = this.f.call(this.scope, next);
        }
    }
    while (_.isUndefined(next));
    return next;
});

TransformCursor.prototype.toArray = function (cb) {
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

TransformCursor.prototype.close = function() {
    debug("Closed.");
    if (this.it) {
        this.it.close();
        this.it = null;
    }
};

module.exports = TransformCursor;