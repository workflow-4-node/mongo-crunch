"use strict";
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");
let Collection = require("mongodb").Collection;

function IterateObj(obj) {
    this._obj = obj;
}

IterateObj.prototype.next = function (cb) {
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
    if (!(this._next = this._cursor.nextObject || this._cursor.next)) {
        this._cursor.pause();
    }
    this._on = false;
}

IterateCursor.prototype.next = function (cb) {
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
        let installHandlers = function () {
            if (!self._on) {
                self._cursor.on("data", dh);
                self._cursor.on("error", errh);
                self._cursor.on("end", endh);
                self._on = true;
            }
        };
        let uninstallHandlers = function () {
            self._cursor.removeListener("data", dh);
            self._cursor.removeListener("error", errh);
            self._cursor.removeListener("end", endh);
        };
        var dh = function (result) {
            self._cursor.pause();
            cb(null, _.isArray(result) ? result : [result]);
        };
        var errh = function (err) {
            if (!reported) {
                try {
                    UnitOfWork.unregisterOpenedCursor(self._owner, self._cursor);
                    self._end = err;
                }
                finally {
                    uninstallHandlers();
                    reported = true;
                }
            }
        };
        var endh = function () {
            if (!reported) {
                try {
                    if (_.isFunction(self._cursor.close)) {
                        self._cursor.close();
                        UnitOfWork.unregisterOpenedCursor(self._owner, self._cursor);
                    }
                    self._end = true;
                }
                finally {
                    uninstallHandlers();
                    reported = true;
                }
            }
        };
        if (self._end) {
            if (_.isObject(self._end)) {
                cb(self._end, null);
            }
            else {
                cb(null, null);
            }
        }
        else {
            installHandlers();
            this._cursor.resume();
        }
    }
};

function createIterator(owner, obj) {
    if (obj) {
        if (obj instanceof Collection) {
            return new IterateCursor(owner, obj.find());
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
            next: function (cb) {
                cb(null, null);
            }
        };
    }
}

module.exports = createIterator;