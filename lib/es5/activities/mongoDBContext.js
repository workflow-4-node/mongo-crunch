"use strict";
"use strict";
var wf4node = require("../../../deps/workflow-4-node");
var Activity = wf4node.activities.Activity;
var util = require("util");
var activityMarkup = wf4node.activities.activityMarkup;
var _ = require("lodash");
var Bluebird = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var StrMap = require("backpack-node").collections.StrMap;
var debug = require("debug")("mongo-crunch:Context");
function MongoDBContext() {
  Activity.call(this);
  this.connections = null;
  this.body = null;
}
util.inherits(MongoDBContext, Activity);
MongoDBContext.prototype.run = function(callContext, args) {
  var self = this;
  var body = self.get("body");
  var connections = self.get("connections");
  debug(("Running connections: " + connections + "."));
  if (!body) {
    debug("There is no body, context completed.");
    callContext.complete();
    return ;
  }
  function toConnectionsArray(conns) {
    function toConnection(conn) {
      if (_.isString(conn)) {
        conn = {
          name: "default",
          url: conn,
          options: null
        };
      } else if (_.isObject(conn)) {
        conn = {
          name: conn.name || "default",
          url: conn.url,
          options: conn.options
        };
      } else {
        throw new Error("Connection is invalid: " + JSON.stringify(conn));
      }
      if (_.isString(conn.url) && conn.url) {
        return conn;
      }
      throw new Error("Connection is invalid: " + JSON.stringify(conn));
    }
    var result = [];
    if (_.isArray(conns)) {
      var $__3 = true;
      var $__4 = false;
      var $__5 = undefined;
      try {
        for (var $__1 = void 0,
            $__0 = (conns)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
          var c = $__1.value;
          {
            result.push(toConnection(c));
          }
        }
      } catch ($__6) {
        $__4 = true;
        $__5 = $__6;
      } finally {
        try {
          if (!$__3 && $__0.return != null) {
            $__0.return();
          }
        } finally {
          if ($__4) {
            throw $__5;
          }
        }
      }
    } else {
      result.push(toConnection(conns));
    }
    return result;
  }
  try {
    debug("Parsing connections.");
    var connsDef = toConnectionsArray(connections);
    debug(("There is " + connsDef.length + " connection(s) has been defined."));
    var processedConns = new StrMap();
    var $__3 = true;
    var $__4 = false;
    var $__5 = undefined;
    try {
      for (var $__1 = void 0,
          $__0 = (connsDef)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
        var conn = $__1.value;
        {
          if (!processedConns.containsKey(conn.name)) {
            processedConns.add(conn.name, conn);
          } else {
            throw new Error("Duplicated connection \"" + conn.name + "\".");
          }
        }
      }
    } catch ($__6) {
      $__4 = true;
      $__5 = $__6;
    } finally {
      try {
        if (!$__3 && $__0.return != null) {
          $__0.return();
        }
      } finally {
        if ($__4) {
          throw $__5;
        }
      }
    }
    var tasks = [];
    processedConns.forEachValue(function(conn) {
      debug(("Creating Db for connection " + conn.url + ", options " + conn.options + "."));
      tasks.push(Bluebird.promisify(MongoClient.connect)(conn.url, conn.options).then(function(db) {
        debug("Db created.");
        conn.db = db;
      }));
    });
    Bluebird.all(tasks).then(function() {
      var newConns = {};
      self.set("connections", newConns);
      self.set("MongoDBContext_CollectionRecycleBin", {});
      self.set("MongoDBContext_OpenedCursors", []);
      self.set("MongoDBContext_SeenCollections", []);
      processedConns.forEach(function(kvp) {
        newConns[kvp.key] = kvp.value.db;
      });
      debug("Context has been initialized, scheduling body.");
      callContext.schedule(body, "_bodyCompleted");
    }, function(e) {
      callContext.fail(e);
    });
  } catch (e) {
    callContext.fail(e);
  }
};
MongoDBContext.prototype._bodyCompleted = function(callContext, reason, result) {
  var self = this;
  debug(("Context's body completed, reason: " + reason + "."));
  if (reason !== Activity.states.complete) {
    debug("Reason is not complete, resuming call context.");
    callContext.end(reason, result);
    return ;
  }
  Bluebird.coroutine($traceurRuntime.initGeneratorFunction(function $__10() {
    var taskError,
        MongoDBContext_CollectionRecycleBin,
        MongoDBContext_OpenedCursors,
        tasks,
        binVals,
        $__3,
        $__4,
        $__5,
        $__7,
        $__1,
        $__0,
        $__8,
        idx,
        connections,
        closeTasks,
        $__9,
        $__14,
        $__15,
        $__16,
        $__17,
        db,
        $__18,
        $__19,
        $__6,
        $__20,
        $__21,
        $__22,
        $__23,
        e;
    return $traceurRuntime.createGeneratorInstance(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            taskError = null;
            debug("Doing final tasks.");
            $ctx.state = 105;
            break;
          case 105:
            $ctx.pushTry(93, 94);
            $ctx.state = 96;
            break;
          case 96:
            MongoDBContext_CollectionRecycleBin = self.get("MongoDBContext_CollectionRecycleBin");
            MongoDBContext_OpenedCursors = self.get("MongoDBContext_OpenedCursors");
            tasks = [];
            binVals = _.values(MongoDBContext_CollectionRecycleBin);
            debug(("Collections in recycle bin: " + binVals.length + "."));
            $__3 = true;
            $__4 = false;
            $__5 = undefined;
            $ctx.state = 51;
            break;
          case 51:
            $ctx.pushTry(18, 19);
            $ctx.state = 21;
            break;
          case 21:
            $__7 = $traceurRuntime.initGeneratorFunction(function $__11() {
              var coll;
              return $traceurRuntime.createGeneratorInstance(function($ctx) {
                while (true)
                  switch ($ctx.state) {
                    case 0:
                      coll = $__1.value;
                      {
                        debug(("Dropping collection: " + coll.collectionName));
                        tasks.push(Bluebird.promisify(coll.drop, coll)().then(function() {
                          debug(("Collection '" + coll.collectionName + "' dropped."));
                        }).catch(function(e) {
                          if (e.name === "MongoError" && e.message === "ns not found") {
                            debug(("Collection '" + coll.collectionName + "' doesn't exists."));
                            return ;
                          }
                          debug(("ERROR: Collection '" + coll.collectionName + "' dropping failed with\n" + e.stack));
                        }));
                      }
                      $ctx.state = -2;
                      break;
                    default:
                      return $ctx.end();
                  }
              }, $__11, this);
            });
            $ctx.state = 17;
            break;
          case 17:
            $__1 = void 0, $__0 = (binVals)[$traceurRuntime.toProperty(Symbol.iterator)]();
            $ctx.state = 15;
            break;
          case 15:
            $ctx.state = (!($__3 = ($__1 = $__0.next()).done)) ? 11 : 13;
            break;
          case 10:
            $__3 = true;
            $ctx.state = 15;
            break;
          case 11:
            $__18 = $ctx.wrapYieldStar($__7()[Symbol.iterator]());
            $ctx.sent = void 0;
            $ctx.action = 'next';
            $ctx.state = 12;
            break;
          case 12:
            $__19 = $__18[$ctx.action]($ctx.sentIgnoreThrow);
            $ctx.state = 9;
            break;
          case 9:
            $ctx.state = ($__19.done) ? 3 : 2;
            break;
          case 3:
            $ctx.sent = $__19.value;
            $ctx.state = 10;
            break;
          case 2:
            $ctx.state = 12;
            return $__19.value;
          case 13:
            $ctx.popTry();
            $ctx.state = 19;
            $ctx.finallyFallThrough = 23;
            break;
          case 18:
            $ctx.popTry();
            $ctx.maybeUncatchable();
            $__6 = $ctx.storedException;
            $ctx.state = 24;
            break;
          case 24:
            $__4 = true;
            $__5 = $__6;
            $ctx.state = 19;
            $ctx.finallyFallThrough = 23;
            break;
          case 19:
            $ctx.popTry();
            $ctx.state = 30;
            break;
          case 30:
            try {
              if (!$__3 && $__0.return != null) {
                $__0.return();
              }
            } finally {
              if ($__4) {
                throw $__5;
              }
            }
            $ctx.state = 28;
            break;
          case 23:
            debug(("Cursors to close: " + MongoDBContext_OpenedCursors.length + "."));
            $__8 = $traceurRuntime.initGeneratorFunction(function $__12(idx) {
              var c;
              return $traceurRuntime.createGeneratorInstance(function($ctx) {
                while (true)
                  switch ($ctx.state) {
                    case 0:
                      c = MongoDBContext_OpenedCursors[idx];
                      tasks.push(Bluebird.promisify(c.close, c)().then(function() {
                        debug(("Cursor " + idx + ". dropped."));
                      }).catch(function(e) {
                        debug(("ERROR: Cursor " + idx + ". closing failed with\n" + e.stack));
                      }));
                      $ctx.state = -2;
                      break;
                    default:
                      return $ctx.end();
                  }
              }, $__12, this);
            });
            $ctx.state = 53;
            break;
          case 53:
            idx = 0;
            $ctx.state = 45;
            break;
          case 45:
            $ctx.state = (idx < MongoDBContext_OpenedCursors.length) ? 41 : 43;
            break;
          case 40:
            idx++;
            $ctx.state = 45;
            break;
          case 41:
            $__20 = $ctx.wrapYieldStar($__8(idx)[Symbol.iterator]());
            $ctx.sent = void 0;
            $ctx.action = 'next';
            $ctx.state = 42;
            break;
          case 42:
            $__21 = $__20[$ctx.action]($ctx.sentIgnoreThrow);
            $ctx.state = 39;
            break;
          case 39:
            $ctx.state = ($__21.done) ? 33 : 32;
            break;
          case 33:
            $ctx.sent = $__21.value;
            $ctx.state = 40;
            break;
          case 32:
            $ctx.state = 42;
            return $__21.value;
          case 43:
            $ctx.state = 47;
            return Bluebird.all(tasks);
          case 47:
            $ctx.maybeThrow();
            $ctx.state = 49;
            break;
          case 49:
            $ctx.popTry();
            $ctx.state = 94;
            $ctx.finallyFallThrough = -2;
            break;
          case 93:
            $ctx.popTry();
            $ctx.maybeUncatchable();
            e = $ctx.storedException;
            $ctx.state = 99;
            break;
          case 99:
            taskError = e;
            $ctx.state = 94;
            $ctx.finallyFallThrough = -2;
            break;
          case 94:
            $ctx.popTry();
            $ctx.state = 103;
            break;
          case 103:
            self.delete("MongoDBContext_CollectionRecycleBin");
            self.delete("MongoDBContext_OpenedCursors");
            self.delete("MongoDBContext_SeenCollections");
            connections = self.get("connections");
            debug(("Closing " + connections.length + " connections."));
            closeTasks = [];
            $__9 = $traceurRuntime.initGeneratorFunction(function $__13(db) {
              return $traceurRuntime.createGeneratorInstance(function($ctx) {
                while (true)
                  switch ($ctx.state) {
                    case 0:
                      debug(("Closing '" + db.databaseName + "'."));
                      closeTasks.push(Bluebird.promisify(db.close, db)(true).then(function() {
                        debug(("Db '" + db.databaseName + "' closed."));
                      }).catch(function(e) {
                        debug(("ERROR: Closing Db '" + db.databaseName + "' failed with\n" + e.stack));
                      }));
                      $ctx.state = -2;
                      break;
                    default:
                      return $ctx.end();
                  }
              }, $__13, this);
            });
            $ctx.state = 90;
            break;
          case 90:
            $__14 = [];
            $__15 = connections;
            for ($__16 in $__15)
              $__14.push($__16);
            $ctx.state = 75;
            break;
          case 75:
            $__17 = 0;
            $ctx.state = 73;
            break;
          case 73:
            $ctx.state = ($__17 < $__14.length) ? 69 : 71;
            break;
          case 63:
            $__17++;
            $ctx.state = 73;
            break;
          case 69:
            db = $__14[$__17];
            $ctx.state = 70;
            break;
          case 70:
            $ctx.state = (!(db in $__15)) ? 63 : 67;
            break;
          case 67:
            $__22 = $ctx.wrapYieldStar($__9(db)[Symbol.iterator]());
            $ctx.sent = void 0;
            $ctx.action = 'next';
            $ctx.state = 65;
            break;
          case 65:
            $__23 = $__22[$ctx.action]($ctx.sentIgnoreThrow);
            $ctx.state = 62;
            break;
          case 62:
            $ctx.state = ($__23.done) ? 56 : 55;
            break;
          case 56:
            $ctx.sent = $__23.value;
            $ctx.state = 63;
            break;
          case 55:
            $ctx.state = 65;
            return $__23.value;
          case 71:
            $ctx.pushTry(80, null);
            $ctx.state = 83;
            break;
          case 83:
            $ctx.state = 77;
            return Bluebird.all(closeTasks);
          case 77:
            $ctx.maybeThrow();
            $ctx.state = 79;
            break;
          case 79:
            $ctx.popTry();
            $ctx.state = 85;
            break;
          case 80:
            $ctx.popTry();
            $ctx.maybeUncatchable();
            e = $ctx.storedException;
            $ctx.state = 86;
            break;
          case 86:
            debug("ERROR: Cannot close MongoDB connections, error\n" + e.stack);
            $ctx.state = 85;
            break;
          case 85:
            if (taskError) {
              debug("ERROR: final tasks failed. Reporting error to call context.");
              callContext.fail(taskError);
            } else {
              debug("Final tasks completed.");
              callContext.complete();
            }
            $ctx.state = 92;
            break;
          case 92:
            $ctx.state = $ctx.finallyFallThrough;
            break;
          case 28:
            switch ($ctx.finallyFallThrough) {
              case 105:
              case 96:
              case 51:
              case 21:
              case 17:
              case 15:
              case 10:
              case 11:
              case 12:
              case 9:
              case 3:
              case 4:
              case 2:
              case 13:
              case 18:
              case 24:
              case 19:
              case 30:
              case 28:
              case 23:
              case 53:
              case 45:
              case 40:
              case 41:
              case 42:
              case 39:
              case 33:
              case 34:
              case 32:
              case 43:
              case 47:
              case 49:
              case 93:
              case 99:
                $ctx.state = $ctx.finallyFallThrough;
                $ctx.finallyFallThrough = -1;
                break;
              default:
                $ctx.state = 94;
                break;
            }
            break;
          default:
            return $ctx.end();
        }
    }, $__10, this);
  }))();
};
MongoDBContext.addCollectionToRecycleBin = function(scope, collection) {
  var bin = scope.get("MongoDBContext_CollectionRecycleBin");
  debug(("Adding collection '" + collection.collectionName + "' to recycle bin."));
  bin[collection.collectionName] = collection;
  debug(("Recycle bin size is " + _.keys(bin).length + "."));
};
MongoDBContext.registerOpenedCursor = function(scope, cursor) {
  var cursors = scope.get("MongoDBContext_OpenedCursors");
  debug("Registering a cursor as opened.");
  cursors.push(cursor);
  debug(("There are " + cursors.length + " cursors registered."));
};
MongoDBContext.unregisterOpenedCursor = function(scope, cursor) {
  debug("Unregistering opened cursor.");
  scope.set("MongoDBContext_OpenedCursors", _.without(scope.get("MongoDBContext_OpenedCursors"), cursor));
  debug(("There are " + scope.get("MongoDBContext_OpenedCursors").length + " cursors registered."));
};
MongoDBContext.isFirstSeenCollection = function(scope, db, collectionName) {
  debug(("Determining if '" + collectionName + "' collection in '" + db.databaseName + "' db is first seen by the current context."));
  var colls = scope.get("MongoDBContext_SeenCollections");
  var entry = _.first(_.where(colls, {db: db}));
  if (!entry) {
    var collReg = {};
    collReg[collectionName] = true;
    colls.push({
      db: db,
      collections: collReg
    });
    debug("Fist seen.");
    return true;
  }
  if (!entry.collections[collectionName]) {
    entry.collections[collectionName] = true;
    debug("First seen.");
    return true;
  }
  debug("Not first seen.");
  return false;
};
module.exports = MongoDBContext;
//# sourceMappingURL=data:application/json;base64,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QUFHO0FBQ1IsQUFBSSxNQUFBLENBQUEsT0FBTSxFQUFJLEdBQUMsQ0FBQztBQUNoQixVQUFNLENBQUUsY0FBYSxDQUFDLEVBQUksS0FBRyxDQUFDO0FBQzlCLFFBQUksS0FBSyxBQUFDLENBQUM7QUFDUCxPQUFDLENBQUcsR0FBQztBQUNMLGdCQUFVLENBQUcsUUFBTTtBQUFBLElBQ3ZCLENBQUMsQ0FBQztBQUNGLFFBQUksQUFBQyxDQUFDLFlBQVcsQ0FBQyxDQUFDO0FBQ25CLFNBQU8sS0FBRyxDQUFDO0VBQ2Y7QUFBQSxBQUNBLEtBQUksQ0FBQyxLQUFJLFlBQVksQ0FBRSxjQUFhLENBQUMsQ0FBRztBQUNwQyxRQUFJLFlBQVksQ0FBRSxjQUFhLENBQUMsRUFBSSxLQUFHLENBQUM7QUFDeEMsUUFBSSxBQUFDLENBQUMsYUFBWSxDQUFDLENBQUM7QUFDcEIsU0FBTyxLQUFHLENBQUM7RUFDZjtBQUFBLEFBQ0EsTUFBSSxBQUFDLENBQUMsaUJBQWdCLENBQUMsQ0FBQztBQUN4QixPQUFPLE1BQUksQ0FBQztBQUNoQixDQUFDO0FBRUQsS0FBSyxRQUFRLEVBQUksZUFBYSxDQUFDO0FBQUEiLCJmaWxlIjoiYWN0aXZpdGllcy9tb25nb0RCQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5sZXQgd2Y0bm9kZSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9kZXBzL3dvcmtmbG93LTQtbm9kZVwiKTtcclxubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5sZXQgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xyXG5sZXQgYWN0aXZpdHlNYXJrdXAgPSB3ZjRub2RlLmFjdGl2aXRpZXMuYWN0aXZpdHlNYXJrdXA7XHJcbmxldCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcclxubGV0IEJsdWViaXJkID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xyXG5sZXQgTW9uZ29DbGllbnQgPSByZXF1aXJlKFwibW9uZ29kYlwiKS5Nb25nb0NsaWVudDtcclxubGV0IFN0ck1hcCA9IHJlcXVpcmUoXCJiYWNrcGFjay1ub2RlXCIpLmNvbGxlY3Rpb25zLlN0ck1hcDtcclxubGV0IGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwibW9uZ28tY3J1bmNoOkNvbnRleHRcIik7XHJcblxyXG5mdW5jdGlvbiBNb25nb0RCQ29udGV4dCgpIHtcclxuICAgIEFjdGl2aXR5LmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IG51bGw7XHJcbiAgICB0aGlzLmJvZHkgPSBudWxsO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKE1vbmdvREJDb250ZXh0LCBBY3Rpdml0eSk7XHJcblxyXG5Nb25nb0RCQ29udGV4dC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCBhcmdzKSB7XHJcbiAgICBsZXQgc2VsZiA9IHRoaXM7XHJcbiAgICBsZXQgYm9keSA9IHNlbGYuZ2V0KFwiYm9keVwiKTtcclxuICAgIGxldCBjb25uZWN0aW9ucyA9IHNlbGYuZ2V0KFwiY29ubmVjdGlvbnNcIik7XHJcblxyXG4gICAgZGVidWcoYFJ1bm5pbmcgY29ubmVjdGlvbnM6ICR7Y29ubmVjdGlvbnN9LmApO1xyXG5cclxuICAgIGlmICghYm9keSkge1xyXG4gICAgICAgIGRlYnVnKFwiVGhlcmUgaXMgbm8gYm9keSwgY29udGV4dCBjb21wbGV0ZWQuXCIpO1xyXG5cclxuICAgICAgICBjYWxsQ29udGV4dC5jb21wbGV0ZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0b0Nvbm5lY3Rpb25zQXJyYXkoY29ubnMpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9Db25uZWN0aW9uKGNvbm4pIHtcclxuICAgICAgICAgICAgaWYgKF8uaXNTdHJpbmcoY29ubikpIHtcclxuICAgICAgICAgICAgICAgIGNvbm4gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBjb25uLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IG51bGxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoXy5pc09iamVjdChjb25uKSkge1xyXG4gICAgICAgICAgICAgICAgY29ubiA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjb25uLm5hbWUgfHwgXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBjb25uLnVybCxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBjb25uLm9wdGlvbnNcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGludmFsaWQ6IFwiICsgSlNPTi5zdHJpbmdpZnkoY29ubikpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc1N0cmluZyhjb25uLnVybCkgJiYgY29ubi51cmwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gaXMgaW52YWxpZDogXCIgKyBKU09OLnN0cmluZ2lmeShjb25uKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShjb25ucykpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgYyBvZiBjb25ucykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godG9Db25uZWN0aW9uKGMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2godG9Db25uZWN0aW9uKGNvbm5zKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBkZWJ1ZyhcIlBhcnNpbmcgY29ubmVjdGlvbnMuXCIpO1xyXG4gICAgICAgIGxldCBjb25uc0RlZiA9IHRvQ29ubmVjdGlvbnNBcnJheShjb25uZWN0aW9ucyk7XHJcbiAgICAgICAgZGVidWcoYFRoZXJlIGlzICR7Y29ubnNEZWYubGVuZ3RofSBjb25uZWN0aW9uKHMpIGhhcyBiZWVuIGRlZmluZWQuYCk7XHJcbiAgICAgICAgbGV0IHByb2Nlc3NlZENvbm5zID0gbmV3IFN0ck1hcCgpO1xyXG4gICAgICAgIGZvciAobGV0IGNvbm4gb2YgY29ubnNEZWYpIHtcclxuICAgICAgICAgICAgaWYgKCFwcm9jZXNzZWRDb25ucy5jb250YWluc0tleShjb25uLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzZWRDb25ucy5hZGQoY29ubi5uYW1lLCBjb25uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZWQgY29ubmVjdGlvbiBcXFwiXCIgKyBjb25uLm5hbWUgKyBcIlxcXCIuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGFza3MgPSBbXTtcclxuICAgICAgICBwcm9jZXNzZWRDb25ucy5mb3JFYWNoVmFsdWUoZnVuY3Rpb24gKGNvbm4pIHtcclxuICAgICAgICAgICAgZGVidWcoYENyZWF0aW5nIERiIGZvciBjb25uZWN0aW9uICR7Y29ubi51cmx9LCBvcHRpb25zICR7Y29ubi5vcHRpb25zfS5gKTtcclxuICAgICAgICAgICAgdGFza3MucHVzaChCbHVlYmlyZC5wcm9taXNpZnkoTW9uZ29DbGllbnQuY29ubmVjdCkoY29ubi51cmwsIGNvbm4ub3B0aW9ucykudGhlbihmdW5jdGlvbiAoZGIpIHtcclxuICAgICAgICAgICAgICAgIGRlYnVnKFwiRGIgY3JlYXRlZC5cIik7XHJcbiAgICAgICAgICAgICAgICBjb25uLmRiID0gZGI7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgQmx1ZWJpcmQuYWxsKHRhc2tzKS50aGVuKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3Q29ubnMgPSB7fTtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0KFwiY29ubmVjdGlvbnNcIiwgbmV3Q29ubnMpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXQoXCJNb25nb0RCQ29udGV4dF9Db2xsZWN0aW9uUmVjeWNsZUJpblwiLCB7fSk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldChcIk1vbmdvREJDb250ZXh0X09wZW5lZEN1cnNvcnNcIiwgW10pO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXQoXCJNb25nb0RCQ29udGV4dF9TZWVuQ29sbGVjdGlvbnNcIiwgW10pO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2VkQ29ubnMuZm9yRWFjaChmdW5jdGlvbiAoa3ZwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3Q29ubnNba3ZwLmtleV0gPSBrdnAudmFsdWUuZGI7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhcIkNvbnRleHQgaGFzIGJlZW4gaW5pdGlhbGl6ZWQsIHNjaGVkdWxpbmcgYm9keS5cIik7XHJcbiAgICAgICAgICAgICAgICBjYWxsQ29udGV4dC5zY2hlZHVsZShib2R5LCBcIl9ib2R5Q29tcGxldGVkXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNhbGxDb250ZXh0LmZhaWwoZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Nb25nb0RCQ29udGV4dC5wcm90b3R5cGUuX2JvZHlDb21wbGV0ZWQgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIHJlYXNvbiwgcmVzdWx0KSB7XHJcbiAgICBsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZGVidWcoYENvbnRleHQncyBib2R5IGNvbXBsZXRlZCwgcmVhc29uOiAke3JlYXNvbn0uYCk7XHJcblxyXG4gICAgaWYgKHJlYXNvbiAhPT0gQWN0aXZpdHkuc3RhdGVzLmNvbXBsZXRlKSB7XHJcbiAgICAgICAgZGVidWcoXCJSZWFzb24gaXMgbm90IGNvbXBsZXRlLCByZXN1bWluZyBjYWxsIGNvbnRleHQuXCIpO1xyXG4gICAgICAgIGNhbGxDb250ZXh0LmVuZChyZWFzb24sIHJlc3VsdCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIEJsdWViaXJkLmNvcm91dGluZShmdW5jdGlvbiogKCkge1xyXG4gICAgICAgIGxldCB0YXNrRXJyb3IgPSBudWxsO1xyXG5cclxuICAgICAgICBkZWJ1ZyhcIkRvaW5nIGZpbmFsIHRhc2tzLlwiKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgTW9uZ29EQkNvbnRleHRfQ29sbGVjdGlvblJlY3ljbGVCaW4gPSBzZWxmLmdldChcIk1vbmdvREJDb250ZXh0X0NvbGxlY3Rpb25SZWN5Y2xlQmluXCIpO1xyXG4gICAgICAgICAgICBsZXQgTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29ycyA9IHNlbGYuZ2V0KFwiTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1wiKTtcclxuICAgICAgICAgICAgbGV0IHRhc2tzID0gW107XHJcblxyXG4gICAgICAgICAgICBsZXQgYmluVmFscyA9IF8udmFsdWVzKE1vbmdvREJDb250ZXh0X0NvbGxlY3Rpb25SZWN5Y2xlQmluKTtcclxuICAgICAgICAgICAgZGVidWcoYENvbGxlY3Rpb25zIGluIHJlY3ljbGUgYmluOiAke2JpblZhbHMubGVuZ3RofS5gKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgY29sbCBvZiBiaW5WYWxzKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhgRHJvcHBpbmcgY29sbGVjdGlvbjogJHtjb2xsLmNvbGxlY3Rpb25OYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgdGFza3MucHVzaChCbHVlYmlyZC5wcm9taXNpZnkoY29sbC5kcm9wLCBjb2xsKSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvbiAnJHtjb2xsLmNvbGxlY3Rpb25OYW1lfScgZHJvcHBlZC5gKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYW1lID09PSBcIk1vbmdvRXJyb3JcIiAmJiBlLm1lc3NhZ2UgPT09IFwibnMgbm90IGZvdW5kXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDb2xsZWN0aW9uICcke2NvbGwuY29sbGVjdGlvbk5hbWV9JyBkb2Vzbid0IGV4aXN0cy5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRVJST1I6IENvbGxlY3Rpb24gJyR7Y29sbC5jb2xsZWN0aW9uTmFtZX0nIGRyb3BwaW5nIGZhaWxlZCB3aXRoXFxuJHtlLnN0YWNrfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGVidWcoYEN1cnNvcnMgdG8gY2xvc2U6ICR7TW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29ycy5sZW5ndGh9LmApO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBNb25nb0RCQ29udGV4dF9PcGVuZWRDdXJzb3JzLmxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBjID0gTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgdGFza3MucHVzaChCbHVlYmlyZC5wcm9taXNpZnkoYy5jbG9zZSwgYykoKVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYEN1cnNvciAke2lkeH0uIGRyb3BwZWQuYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYEVSUk9SOiBDdXJzb3IgJHtpZHh9LiBjbG9zaW5nIGZhaWxlZCB3aXRoXFxuJHtlLnN0YWNrfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgeWllbGQgQmx1ZWJpcmQuYWxsKHRhc2tzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdGFza0Vycm9yID0gZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGVsZXRlKFwiTW9uZ29EQkNvbnRleHRfQ29sbGVjdGlvblJlY3ljbGVCaW5cIik7XHJcbiAgICAgICAgICAgIHNlbGYuZGVsZXRlKFwiTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1wiKTtcclxuICAgICAgICAgICAgc2VsZi5kZWxldGUoXCJNb25nb0RCQ29udGV4dF9TZWVuQ29sbGVjdGlvbnNcIik7XHJcblxyXG4gICAgICAgICAgICAvLyBDbG9zZSBhbGwgZGJzOlxyXG4gICAgICAgICAgICBsZXQgY29ubmVjdGlvbnMgPSBzZWxmLmdldChcImNvbm5lY3Rpb25zXCIpO1xyXG4gICAgICAgICAgICBkZWJ1ZyhgQ2xvc2luZyAke2Nvbm5lY3Rpb25zLmxlbmd0aH0gY29ubmVjdGlvbnMuYCk7XHJcbiAgICAgICAgICAgIGxldCBjbG9zZVRhc2tzID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGRiIGluIGNvbm5lY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhgQ2xvc2luZyAnJHtkYi5kYXRhYmFzZU5hbWV9Jy5gKTtcclxuICAgICAgICAgICAgICAgIGNsb3NlVGFza3MucHVzaChCbHVlYmlyZC5wcm9taXNpZnkoZGIuY2xvc2UsIGRiKSh0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYERiICcke2RiLmRhdGFiYXNlTmFtZX0nIGNsb3NlZC5gKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRVJST1I6IENsb3NpbmcgRGIgJyR7ZGIuZGF0YWJhc2VOYW1lfScgZmFpbGVkIHdpdGhcXG4ke2Uuc3RhY2t9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgeWllbGQgQmx1ZWJpcmQuYWxsKGNsb3NlVGFza3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhcIkVSUk9SOiBDYW5ub3QgY2xvc2UgTW9uZ29EQiBjb25uZWN0aW9ucywgZXJyb3JcXG5cIiArIGUuc3RhY2spO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGFza0Vycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhcIkVSUk9SOiBmaW5hbCB0YXNrcyBmYWlsZWQuIFJlcG9ydGluZyBlcnJvciB0byBjYWxsIGNvbnRleHQuXCIpO1xyXG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbCh0YXNrRXJyb3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGVidWcoXCJGaW5hbCB0YXNrcyBjb21wbGV0ZWQuXCIpO1xyXG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pKCk7XHJcbn07XHJcblxyXG5Nb25nb0RCQ29udGV4dC5hZGRDb2xsZWN0aW9uVG9SZWN5Y2xlQmluID0gZnVuY3Rpb24gKHNjb3BlLCBjb2xsZWN0aW9uKSB7XHJcbiAgICBsZXQgYmluID0gc2NvcGUuZ2V0KFwiTW9uZ29EQkNvbnRleHRfQ29sbGVjdGlvblJlY3ljbGVCaW5cIik7XHJcbiAgICBkZWJ1ZyhgQWRkaW5nIGNvbGxlY3Rpb24gJyR7Y29sbGVjdGlvbi5jb2xsZWN0aW9uTmFtZX0nIHRvIHJlY3ljbGUgYmluLmApO1xyXG4gICAgYmluW2NvbGxlY3Rpb24uY29sbGVjdGlvbk5hbWVdID0gY29sbGVjdGlvbjtcclxuICAgIGRlYnVnKGBSZWN5Y2xlIGJpbiBzaXplIGlzICR7Xy5rZXlzKGJpbikubGVuZ3RofS5gKTtcclxufTtcclxuXHJcbk1vbmdvREJDb250ZXh0LnJlZ2lzdGVyT3BlbmVkQ3Vyc29yID0gZnVuY3Rpb24gKHNjb3BlLCBjdXJzb3IpIHtcclxuICAgIGxldCBjdXJzb3JzID0gc2NvcGUuZ2V0KFwiTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1wiKTtcclxuICAgIGRlYnVnKGBSZWdpc3RlcmluZyBhIGN1cnNvciBhcyBvcGVuZWQuYCk7XHJcbiAgICBjdXJzb3JzLnB1c2goY3Vyc29yKTtcclxuICAgIGRlYnVnKGBUaGVyZSBhcmUgJHtjdXJzb3JzLmxlbmd0aH0gY3Vyc29ycyByZWdpc3RlcmVkLmApO1xyXG59O1xyXG5cclxuTW9uZ29EQkNvbnRleHQudW5yZWdpc3Rlck9wZW5lZEN1cnNvciA9IGZ1bmN0aW9uIChzY29wZSwgY3Vyc29yKSB7XHJcbiAgICBkZWJ1ZyhgVW5yZWdpc3RlcmluZyBvcGVuZWQgY3Vyc29yLmApO1xyXG4gICAgc2NvcGUuc2V0KFwiTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1wiLCBfLndpdGhvdXQoc2NvcGUuZ2V0KFwiTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1wiKSwgY3Vyc29yKSk7XHJcbiAgICBkZWJ1ZyhgVGhlcmUgYXJlICR7c2NvcGUuZ2V0KFwiTW9uZ29EQkNvbnRleHRfT3BlbmVkQ3Vyc29yc1wiKS5sZW5ndGh9IGN1cnNvcnMgcmVnaXN0ZXJlZC5gKTtcclxufTtcclxuXHJcbk1vbmdvREJDb250ZXh0LmlzRmlyc3RTZWVuQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChzY29wZSwgZGIsIGNvbGxlY3Rpb25OYW1lKSB7XHJcbiAgICBkZWJ1ZyhgRGV0ZXJtaW5pbmcgaWYgJyR7Y29sbGVjdGlvbk5hbWV9JyBjb2xsZWN0aW9uIGluICcke2RiLmRhdGFiYXNlTmFtZX0nIGRiIGlzIGZpcnN0IHNlZW4gYnkgdGhlIGN1cnJlbnQgY29udGV4dC5gKTtcclxuICAgIGxldCBjb2xscyA9IHNjb3BlLmdldChcIk1vbmdvREJDb250ZXh0X1NlZW5Db2xsZWN0aW9uc1wiKTtcclxuICAgIGxldCBlbnRyeSA9IF8uZmlyc3QoXy53aGVyZShjb2xscywgeyBkYjogZGIgfSkpO1xyXG4gICAgaWYgKCFlbnRyeSkge1xyXG4gICAgICAgIGxldCBjb2xsUmVnID0ge307XHJcbiAgICAgICAgY29sbFJlZ1tjb2xsZWN0aW9uTmFtZV0gPSB0cnVlO1xyXG4gICAgICAgIGNvbGxzLnB1c2goe1xyXG4gICAgICAgICAgICBkYjogZGIsXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb25zOiBjb2xsUmVnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGVidWcoXCJGaXN0IHNlZW4uXCIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKCFlbnRyeS5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0pIHtcclxuICAgICAgICBlbnRyeS5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0gPSB0cnVlO1xyXG4gICAgICAgIGRlYnVnKFwiRmlyc3Qgc2Vlbi5cIik7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBkZWJ1ZyhcIk5vdCBmaXJzdCBzZWVuLlwiKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9uZ29EQkNvbnRleHQ7Il19
