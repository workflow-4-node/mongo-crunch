"use strict";

let _ = require("lodash");

function ValueAccessor() {
    this._cache = new Map();
}

ValueAccessor.prototype.get = function(obj, path) {
    if (!_.isObject(obj)) {
        throw new TypeError("Argument 'obj' is not an object.");
    }

    if (!_.isString(path)) {
        throw new TypeError("Argument 'path' is not a string.");
    }

    path = path.replace(/\.$\./g, "[0]").trim();

    if (!path) {
        throw new Error("Value of argument 'path' expected.");
    }

    let parser = this._cache.get(path);
    if (!parser) {
        this._cache.set(path, parser = this._createParser(path));
    }

    return parser.call(obj);
};

ValueAccessor.prototype._createParser = function(path) {
    if (path.indexOf("this") !== 0) {
        if (path[0] === "[") {
            path = "this" + path;
        }
        else {
            path = "this." + path;
        }
    }

    return new Function("return " + path + ";");
};

module.exports = ValueAccessor;