"use strict";

let MapReduceToCollBase = require("./mapReduceToCollBase");
let util = require ("util");

function MergeMR() {
    MapReduceToCollBase.call(this);
    this.flatten = false;
}

util.inherits(MergeMR, MapReduceToCollBase);

Object.defineProperties(MergeMR.prototype, {
    action: {
        value: "merge"
    }
});

module.exports = MergeMR;