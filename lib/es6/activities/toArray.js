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
            root: "= this.$parent",
            result: [],
            args: [
                {
                    "@eachDocument": {
                        documents: "= this.root.documents",
                        args: function() {
                            this.result.push(this.document);
                        }
                    }
                },
                "= this.result"
            ]
        }
    };
};

module.exports = ToArray;