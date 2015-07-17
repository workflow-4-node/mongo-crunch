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

Collectionify.prototype.createImplementation = function() {
    return {
        "@require": __dirname,
        "@block": {
            root: "= $parent",
            args: [
                {
                    "@if": {
                        condition: function() {
                            return this.get("root").get("input") instanceof Collection;
                        },
                        then: "= root.input",
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
                                            collection: "= tmp",
                                            documents: "= root.input"
                                        }
                                    },
                                    "= tmp"
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