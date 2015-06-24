"use strict";

var es = "es6";
try { eval("(function *(){})"); } catch (err) { es = "es5"; }

let util = require("util");
let wf4node = require("../../../../deps/workflow-4-node");
let Composite = wf4node.activities.Composite;
let path = require("path");

/*
Általánosan a rendszerrõl feltételzzük, hogy a tranzakciók 100 adatot tartalmaznak,
1 ID típusú adatot 9 természetes azonosítót (lehet külsõ kulcs de most csak bigint),
40-30-20 karakter - valós szám illetve dátum értéket.
A tranzakciók és a beállítások száma és elõállítása még megbeszélendõ, de kb.
A természetes azonosítók értéke 1 sé 10000 közötti véletlen szám minden természetes azonosító esetén.
Karakterek B+ termékkódok. számok pozitív véletlenek, dátumok 2010.01.01 és 2014.12.31 közöttiek.
Beállítások lista vagy intervallum. Lista elemszáma 1 és 100 közötti, tartalma a kódértékek listája.
Intervallum esetén a létrehozott tranzakciók alapján kb a 80% a a tranzakcióknak essen bele a létrehozott intervallumokba.
*/

function TranGen() {
    Composite.call(this);
    this.reserved("collName", "transactions");
    this.reserved("size", 1000);
}

util.inherits(TranGen, Composite);

TranGen.prototype.createImplementation = function () {
    return {
        "@require": path.join(__dirname, "../../../../lib/" + es + "/activities"),
        block: {
            coll: {
                collectionRef: {
                    name: "= collName",
                    clearBeforeUse: true,
                    mustExists: false
                }
            },
            args: [
                {
                    for: {
                        from: 0,
                        to: "= size",
                        body: {
                            insert: {
                                collection: "= coll",
                                documents: {
                                    poo: 5
                                }
                            }
                        }
                    }
                }
            ]
        }
    };
};

module.exports = TranGen;