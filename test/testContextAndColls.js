var ActivityExecutionEngine = require('workflow-4-node').activities.ActivityExecutionEngine;
var Collection = require('mongodb').Collection;
var _ = require('lodash');
var assert = require('assert');

describe('MongoDBContext', function () {
    it('should open a connection as default', function (done) {
        this.timeout(3000);

        var engine = new ActivityExecutionEngine({
            '@require': 'lib/activities',
            block: [
                {
                    mongoDBContext: {
                        connections: process.env.CONN,
                        body: {
                            block: {
                                coll1: {
                                    collectionRef: {
                                        name: 'coll1',
                                        mustExists: false
                                    }
                                },
                                coll2: {
                                    collectionRef: {
                                        name: 'coll2',
                                        mustExists: false,
                                        deleteOnSave: true
                                    }
                                },
                                tmp: {
                                    tempCollectionRef: {
                                        namePrefix: 'foo'
                                    }
                                },
                                args: [
                                    {
                                        func: {
                                            code: function () {
                                                var coll1 = this.get('coll1');
                                                var coll2 = this.get('coll2');
                                                var tmp = this.get('tmp');

                                                assert(coll1 instanceof Collection);
                                                assert(coll1.collectionName === 'coll1');
                                                assert(coll2 instanceof Collection);
                                                assert(coll2.collectionName === 'coll2');
                                                assert(tmp instanceof Collection);
                                                assert(_.startsWith(tmp.collectionName, "foo"));
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        });

        engine.invoke().then(function () {

        }).nodeify(done);
    });
});