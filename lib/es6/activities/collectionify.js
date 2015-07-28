"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Composite = wf4node.activities.Composite;
let path = require("path");
let Collection = require("mongodb").Collection;
let config = require("../config");

function Collectionify() {
    Composite.call(this);

    this.input = null;
    this.name = null;
    this.connection = "";
    this.indexes = null;
    this.ttl = config.defaultTTL;
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
                                        name: "= this.collectionifyRoot.name ? this.collectionifyRoot : 'collectionified'",
                                        connection: "= this.collectionifyRoot.connection",
                                        indexes: "= this.collectionifyRoot.indexes",
                                        ttl: "= this.collectionifyRoot.ttl"
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