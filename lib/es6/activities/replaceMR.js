"use strict";

let MapReduceToCollBase = require("./mapReduceToCollBase");
let util = require ("util");

function ReplaceMR() {
    MapReduceToCollBase.call(this);
}

util.inherits(ReplaceMR, MapReduceToCollBase);

Object.defineProperties(ReplaceMR.prototype, {
    action: {
        value: "replace"
    }
});

module.exports = ReplaceMR;