"use strict";

let MapReduceToCollBase = require("./mapReduceToCollBase");
let util = require ("util");

function ReduceMR() {
    MapReduceToCollBase.call(this);
}

util.inherits(ReduceMR, MapReduceToCollBase);

Object.defineProperties(ReduceMR.prototype, {
    action: {
        value: "reduce"
    }
});

module.exports = ReduceMR;