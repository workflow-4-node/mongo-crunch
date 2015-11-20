"use strict";
let Bluebird = require("bluebird");
let async = Bluebird.coroutine;
let misc = require("./misc");
let debug = require("debug")("mongo-crunch:collGC");
require("date-utils");

let rex = /@(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/;

let collGC = {
    collect: async(function *(db) {
        yield misc.deleteCollections(db, function(collName) {
            let result = rex.exec(collName);
            if (result) {
                let year = +result[1];
                let month = +result[2];
                let day = +result[3];
                let hour = +result[4];
                let minute = +result[5];
                let sec = +result[6];
                let ttlDate = new Date(Date.UTC(year, month - 1, day, hour, minute, sec));
                let now = new Date();
                if (now.isAfter(ttlDate)) {
                    debug(`Deleting collection '${collName}' because its TTL ${ttlDate} has been elapsed.`);
                    return true;
                }
            }
            return false;
        });
    })
};

module.exports = collGC;