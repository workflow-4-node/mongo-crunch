var util = require("util");
var Composite = require("../../deps/workflow-4-node").activities.Composite;
var Guid = require("guid");
var path = require("path");

function TempCollectionRef() {
    Composite.call(this);

    this.namePrefix = null;
    this.deleteOnExit = true;
    this.indexes = null;
    this.clearBeforeUse = true;
}

util.inherits(TempCollectionRef, Composite);

TempCollectionRef.prototype.createImplementation = function() {
    var name = this.namePrefix;
    name = name ? name + "_tmp_" : "tmp_";
    name += Guid.create().toString();

    return {
        "@require": path.join(__dirname, "collectionRef"),
        collectionRef: {
            name: name,
            indexes: this.indexes,
            clearBeforeUse: this.clearBeforeUse,
            deleteOnExit: this.deleteOnExit,
            mustExists: false
        }
    };
};

module.exports = TempCollectionRef;