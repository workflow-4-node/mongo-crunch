"use strict";

let Applied = require("./applied");
let util = require("util");

function CrossApplied() {
    Applied.call(this);
}

util.inherits(CrossApplied, Applied);

Object.defineProperties(CrossApplied.prototype, {
    type: {
        value: "cross",
        enumerable: true,
        writable: false
    }
});

module.exports = CrossApplied;