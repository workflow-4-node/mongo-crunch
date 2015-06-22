"use strict";

let CollectionOp = require("./collectionOp");
let util = require("util");
let _ = require("lodash");

function Modify() {
    CollectionOp.call(this);
    this.options = null;
}

util.inherits(Modify, CollectionOp);

Modify.prototype.getOptions = function() {
    let options = this.get("options");
    if (_.isPlainObject(options) && _.isUndefined(options.w)) {
        options.w = "majority";
    }
    return options;
};

module.exports = Modify;
