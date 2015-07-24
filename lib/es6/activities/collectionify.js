"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Composite = wf4node.activities.Composite;
let path = require("path");
let Collection = require("mongodb").Collection;

function Collectionify() {
    Composite.call(this);

    this.input = null;
}

util.inherits(Collectionify, Composite);

Collectionify.prototype.createImplementation = function () {
    return {
        "@require": __dirname,
        "@block": {
            collectionifyRoot: "= this.$parent",
            args: [
                {
                    "@if": {
                        condition: {
                            "@func": {
                                args: ["= this.collectionifyRoot.input"],
                                code: function (input) {
                                    return input instanceof Collection;
                                }
                            }
                        },
                        then: "= this.collectionifyRoot.input",
                        else: {
                            "@block": {
                                tmp: {
                                    "@tempCollectionRef": {
                                        namePrefix: "collectionified"
                                    }
                                },
                                args: [
                                    {
                                        "@insert": {
                                            collection: "= this.tmp",
                                            documents: "= this.collectionifyRoot.input"
                                        }
                                    },
                                    "= this.tmp"
                                ]
                            }
                        }
                    }
                }
            ]
        }
    };
};

module.exports = Collectionify;