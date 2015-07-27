"use strict";
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");

function IterateObj(obj) {
    this._obj = obj;
}

IterateObj.prototype.next = function(cb) {
    if (!_.isNull(this._obj)) {
        let o = this._obj;
        this._obj = null;
        cb(null, o);
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
    this._next.call(this._cursor,
        function(err, doc) {
            if (err || !doc) {
                try {
                    if (_.isFunction(self._cursor.close)) {
                        self._cursor.close();
                        UnitOfWork.unregisterOpenedCursor.call(self._owner, self._cursor);
                    }
                }
                catch (err2) {
                    cb(err2);
                    return;
                }
            }
            cb(err, doc);
        });
};

function createIterator(owner, obj) {
    if (!_.isUndefined(obj)) {
        if (_.isFunction(obj.next) || _.isFunction(obj.nextObject)) {
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