"use strict";

var es = "es6";
try { eval("(function *(){})"); } catch (err) { es = "es5"; }

let wf4node = require("../../../deps/workflow-4-node");
let activities = wf4node.activities;
let ActivityExecutionEngine = activities.ActivityExecutionEngine;
let path = require("path");
let util = require("util");

let wf = {
    "@require": [
        path.join(__dirname, "../../../lib/" + es + "/activities"),
        path.join(__dirname, "activities")
    ],
    mongoDBContext: {
        connections: process.env.MONGO_URL,
        body: {
            tranGen: {}
        }
    }
};

let engine = new ActivityExecutionEngine(wf);

console.log("Starting.");
engine.invoke()
    .then(function (r) {
        console.log("Done.");
        if (r) {
            console.info("Result:\n" + util.inspect(r));
        }
    },
    function (e) {
        console.error(e.stack);
    });