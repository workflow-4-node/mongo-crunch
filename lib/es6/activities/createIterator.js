"use strict";
let _ = require("lodash");
let UnitOfWork = require("./unitOfWork");
let Collection = require("mongodb").Collection;
let Bluebird = require("bluebird");

function IterateObj(obj) {
    this._obj = obj;
}

IterateObj.prototype.next = function (cb) {
    if (!_.isNull(this._obj)) {
        let o = this._obj;
        this._obj = null;
        cb(null, o);
    }
    else {
        cb(null, null);
    }
};

function IterateArray(array) {
    this._array = array;
    this._index = 0;
}

IterateArray.prototype.next = function (cb) {
    if (this._index < this._array.length) {
        cb(null, this._array[this._index++]);
    }
    else {
        cb(null, null);
    }
};

function IterateCursor(scope, cursor) {
    this._scope = scope;
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
                            UnitOfWork.unregisterOpenedCursor(self._scope, self._cursor);
                        }
                    }
                    catch (err2) {
                        cb(err2);
                        return;
                    }
                }
                cb(err, result);
            });
    }
    else {
        var reported = false;
        let installHandlers = function () {
            if (!self._on) {
                self._cursor.on("data", dataHandler);
                self._cursor.on("error", errorHandler);
                self._cursor.on("end", endHandler);
                self._on = true;
            }
        };
        let uninstallHandlers = function () {
            self._cursor.removeListener("data", dataHandler);
            self._cursor.removeListener("error", errorHandler);
            self._cursor.removeListener("end", endHandler);
        };
        let registerEnd = function(result) {
            if (!reported) {
                try {
                    if (_.isFunction(self._cursor.close)) {
                        self._cursor.close();
                        UnitOfWork.unregisterOpenedCursor(self._scope, self._cursor);
                    }
                    self._end = result;
                }
                finally {
                    uninstallHandlers();
                    reported = true;
                }
            }
        };
        var dataHandler = function (result) {
            self._cursor.pause();
            cb(null, result);
        };
        var errorHandler = function (err) {
            registerEnd(err);
        };
        var endHandler = function () {
            registerEnd(true);
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

function createIterator(scope, obj) {
    let it;
    if (obj) {
        if (obj instanceof Collection) {
            it = new IterateCursor(scope, obj.find());
        }
        else if (_.isFunction(obj.next) || _.isFunction(obj.nextObject)) {
            it = new IterateCursor(scope, obj);
        }
        else if (_.isArray(obj)) {
            it = new IterateArray(obj);
        }
        else {
            it = new IterateObj(obj);
        }
    }
    else {
        if (_.isUndefined(obj)) {
            throw new TypeError("Argument value of 'obj' expected.");
        }
        it = {
            next: function (cb) {
                cb(null, null);
            }
        };
    }
    return Bluebird.promisifyAll(it);
}

module.exports = createIterator;