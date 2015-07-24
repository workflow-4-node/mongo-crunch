"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Composite = wf4node.activities.Composite;
let path = require("path");
let Collection = require("mongodb").Collection;
let debug = require("debug")("mongo-crunch:TempCollectionRef");
let uuid = require("node-uuid");
require("date-utils");

function TempCollectionRef() {
    Composite.call(this);

    this.connection = "";
    this.namePrefix = null;
    this.indexes = null;
    this.name = null;
    this.ttl = 60;
}

util.inherits(TempCollectionRef, Composite);

TempCollectionRef.prototype.initializeStructure = function() {
    let name = this.namePrefix;
    name = name ? "~" + name + "_"  : "~";
    name += uuid.v4();
    let to = new Date();
    to.addMinutes(this.ttl);
    name += "_" + to.toFormat("YYYY-MM-DD-HH-MI-SS");
    this.name = name;
};

TempCollectionRef.prototype.createImplementation = function() {
    return {
        "@require": path.join(__dirname, "collectionRef"),
        "@collectionRef": {
            connection: this.connection,
            name: this.name,
            indexes: this.indexes,
            clearBeforeUse: true,
            deleteOnExit: true,
            mustExists: false
        }
    };
};

module.exports = TempCollectionRef;