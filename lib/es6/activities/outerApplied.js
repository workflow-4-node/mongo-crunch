"use strict";

let Applied = require("./applied");
let util = require("util");

function OuterApplied() {
    Applied.call(this);
}

util.inherits(OuterApplied, Applied);

Object.defineProperties(OuterApplied.prototype, {
    type: {
        value: "outer",
        enumerable: true,
        writable: false
    }
});

module.exports = OuterApplied;