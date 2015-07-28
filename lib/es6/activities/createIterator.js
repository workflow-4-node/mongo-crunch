"use strict";
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");
let Collection = require("mongodb").Collection;

function IterateObj(obj) {
    this._obj = obj;
}

IterateObj.prototype.next = function(cb) {
    if (!_.isNull(this._obj)) {
        let o = this._obj;
        this._obj = null;
        cb(null, _.isArray(o) ? o : [o]);
    }
    else {
        cb(null, null);
    }
};

function IterateCursor(owner, cursor) {
    this._owner = owner;
    this._cursor = cursor;
    this._next = this._cursor.next || this._cursor.nextObject;
}

IterateCursor.prototype.next = function(cb) {
    let self = this;
    if (this._next) {
        this._next.call(this._cursor,
            function (err, result) {
                if (err || !result) {
                    try {
                        if (_.isFunction(self._cursor.close)) {
                            self._cursor.close();
                            UnitOfWork.unregisterOpenedCursor(self._owner, self._cursor);
                        }
                    }
                    catch (err2) {
                        cb(err2);
                        return;
                    }
                }
                cb(err, (_.isNull(result) || _.isArray(result)) ? result : [result]);
            });
    }
    else {
        var reported = false;
        this._cursor.on("data", function(result) {
            self._cursor.pause();
            cb(null, _.isArray(result) ? result : [result]);
        });
        this._cursor.on("error", function(err) {
            if (!reported) {
                UnitOfWork.unregisterOpenedCursor(self._owner, self._cursor);
                cb(err);
                reported = true;
            }
        });
        this._cursor.on("end", function() {
            if (!reported) {
                if (_.isFunction(self._cursor.close)) {
                    self._cursor.close();
                    UnitOfWork.unregisterOpenedCursor(self._owner, self._cursor);
                }
                cb(null, null);
                reported = true;
            }
        });
    }
};

function createIterator(owner, obj) {
    if (!_.isUndefined(obj)) {
        if (obj instanceof Collection) {
            return new IterateCursor(obj.find());
        }
        else if (_.isFunction(obj.next) || _.isFunction(obj.nextObject)) {
            return new IterateCursor(owner, obj);
        }
        else {
            return new IterateObj(obj);
        }
    }
    else {
        return {
            next: function(cb) {
                cb(null, null);
            }
        };
    }
}

module.exports = createIterator;