"use strict";

let wf4node = require("workflow-4-node");
let util = require("util");
let Composite = wf4node.activities.Composite;
let Guid = require("guid");
let path = require("path");
let Collection = require("mongodb").Collection;
let debug = require("debug")("mongo-crunch:TempCollectionRef");

function TempCollectionRef() {
    Composite.call(this);

    this.connection = '';
    this.namePrefix = null;
    this.indexes = null;
    this.name = null;
}

util.inherits(TempCollectionRef, Composite);

TempCollectionRef.prototype.initializeStructure = function() {
    let name = this.namePrefix;
    name = name ? name + "_tmp_" : "tmp_";
    name += Guid.create().toString();
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