"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Composite = wf4node.activities.Composite;
let path = require("path");
let Collection = require("mongodb").Collection;
let debug = require("debug")("mongo-crunch:TempCollectionRef");
let uuid = require("node-uuid");
require("date-utils");
let config = require("../config");

function TempCollectionRef() {
    Composite.call(this);

    this.connection = "";
    this.indexes = null;
    this.name = null;
    this.ttl = config.defaultTTL;
}

util.inherits(TempCollectionRef, Composite);

TempCollectionRef.prototype.createImplementation = function () {
    return {
        "@require": path.join(__dirname, "collectionRef"),
        "@block": {
            tmpCR: "= this.$parent",
            args: [
                {
                    "@collectionRef": {
                        connection: "= this.tmpCR.collection",
                        name: function () {
                            let name = this.tmpCR.name;
                            name = name ? ("~" + name + "_") : "~";
                            name += uuid.v4();
                            return name;
                        },
                        indexes: "= this.tmpCR.indexes",
                        ttl: "= this.tmpCR.ttl",
                        clearBeforeUse: true,
                        deleteOnExit: true,
                        mustExists: false
                    }
                }
            ]
        }
    };
};

module.exports = TempCollectionRef;