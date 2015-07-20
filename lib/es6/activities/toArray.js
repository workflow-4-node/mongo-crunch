"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Composite = wf4node.activities.Composite;
let path = require("path");
let Collection = require("mongodb").Collection;

function ToArray() {
    Composite.call(this);

    this.documents = null;
}

util.inherits(ToArray, Composite);

ToArray.prototype.createImplementation = function() {
    return {
        "@require": __dirname,
        "@block": {
            root: "= $parent",
            result: [],
            args: [
                {
                    "@eachDocument": {
                        documents: "= root.documents",
                        args: function() {
                            this.get("result").push(this.get("document"));
                        }
                    }
                },
                "= result"
            ]
        }
    };
};

module.exports = ToArray;