"use strict";
"use strict";
var wf4node = require("workflow-4-node");
var Activity = wf4node.activities.Activity;
var UnitOfWork = require("./unitOfWork");
var util = require("util");
var activityMarkup = wf4node.activities.activityMarkup;
var _ = require("lodash");
var Bluebird = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var debug = require("debug")("mongo-crunch:MongoDBContext");
var async = Bluebird.coroutine;
var collGC = require("./collGC");
function MongoDBContext() {
  UnitOfWork.call(this);
  this.connections = null;
}
util.inherits(MongoDBContext, UnitOfWork);
MongoDBContext.prototype.run = function(callContext, args) {
  var self = this;
  var connections = self.connections || process.env.MONGO_URL;
  debug(("Running connections: " + connections + "."));
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
        throw new Error("Connection is invalid: " + util.inspect(conn));
      }
      if (_.isString(conn.url) && conn.url) {
        return conn;
      }
      throw new Error("Connection is invalid: " + util.inspect(conn));
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
    var processedConns = new Map();
    var $__3 = true;
    var $__4 = false;
    var $__5 = undefined;
    try {
      for (var $__1 = void 0,
          $__0 = (connsDef)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
        var conn = $__1.value;
        {
          if (!processedConns.has(conn.name)) {
            processedConns.set(conn.name, conn);
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
    var $__10 = true;
    var $__11 = false;
    var $__12 = undefined;
    try {
      var $__21 = function() {
        var conn = $__8.value;
        {
          debug(("Creating Db for connection " + conn.url + ", options " + conn.options + "."));
          tasks.push(MongoClient.connect(conn.url, conn.options).then(function(db) {
            debug("Db created.");
            conn.db = db;
          }));
        }
      };
      for (var $__8 = void 0,
          $__7 = (processedConns.values())[$traceurRuntime.toProperty(Symbol.iterator)](); !($__10 = ($__8 = $__7.next()).done); $__10 = true) {
        $__21();
      }
    } catch ($__13) {
      $__11 = true;
      $__12 = $__13;
    } finally {
      try {
        if (!$__10 && $__7.return != null) {
          $__7.return();
        }
      } finally {
        if ($__11) {
          throw $__12;
        }
      }
    }
    Bluebird.all(tasks).then(function() {
      var newConns = {};
      self.connections = newConns;
      var $__17 = true;
      var $__18 = false;
      var $__19 = undefined;
      try {
        var $__22 = function() {
          var kvp = $__15.value;
          {
            newConns[kvp[0]] = kvp[1].db;
            debug(("Collecting garbage of '" + kvp[0] + "'."));
            collGC.collect(kvp[1].db).then(function() {
              debug(("Collecting garbage of '" + kvp[0] + "' completed."));
            }, function(e) {
              debug(("Collecting garbage of '" + kvp[0] + "' failed. Error:\n" + e.stack));
            });
          }
        };
        for (var $__15 = void 0,
            $__14 = (processedConns.entries())[$traceurRuntime.toProperty(Symbol.iterator)](); !($__17 = ($__15 = $__14.next()).done); $__17 = true) {
          $__22();
        }
      } catch ($__20) {
        $__18 = true;
        $__19 = $__20;
      } finally {
        try {
          if (!$__17 && $__14.return != null) {
            $__14.return();
          }
        } finally {
          if ($__18) {
            throw $__19;
          }
        }
      }
      debug("Context has been initialized, scheduling body.");
      UnitOfWork.prototype.run.call(self, callContext, args);
    }, function(e) {
      callContext.fail(e);
    });
  } catch (e) {
    callContext.fail(e);
  }
};
MongoDBContext.prototype.finalize = async($traceurRuntime.initGeneratorFunction(function $__24() {
  var connections,
      connNames,
      closeTasks,
      $__3,
      $__4,
      $__5,
      $__23,
      $__1,
      $__0,
      $__26,
      $__27,
      $__6,
      e;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.pushTry(null, 53);
          $ctx.state = 55;
          break;
        case 55:
          $ctx.state = 2;
          return UnitOfWork.prototype.finalize.call(this);
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 53;
          $ctx.finallyFallThrough = -2;
          break;
        case 53:
          $ctx.popTry();
          $ctx.state = 57;
          break;
        case 57:
          connections = this.connections;
          connNames = _.keys(connections);
          debug(("Closing " + connNames.length + " connections."));
          closeTasks = [];
          $__3 = true;
          $__4 = false;
          $__5 = undefined;
          $ctx.state = 49;
          break;
        case 49:
          $ctx.pushTry(22, 23);
          $ctx.state = 25;
          break;
        case 25:
          $__23 = $traceurRuntime.initGeneratorFunction(function $__25() {
            var connName,
                db;
            return $traceurRuntime.createGeneratorInstance(function($ctx) {
              while (true)
                switch ($ctx.state) {
                  case 0:
                    connName = $__1.value;
                    {
                      db = connections[connName];
                      debug(("Closing '" + db.databaseName + "'."));
                      closeTasks.push(db.close(true).then(function() {
                        debug(("Db '" + db.databaseName + "' closed."));
                      }).catch(function(e) {
                        debug(("ERROR: Closing Db '" + db.databaseName + "' failed with\n" + e.stack));
                      }));
                    }
                    $ctx.state = -2;
                    break;
                  default:
                    return $ctx.end();
                }
            }, $__25, this);
          });
          $ctx.state = 21;
          break;
        case 21:
          $__1 = void 0, $__0 = (connNames)[$traceurRuntime.toProperty(Symbol.iterator)]();
          $ctx.state = 19;
          break;
        case 19:
          $ctx.state = (!($__3 = ($__1 = $__0.next()).done)) ? 15 : 17;
          break;
        case 14:
          $__3 = true;
          $ctx.state = 19;
          break;
        case 15:
          $__26 = $ctx.wrapYieldStar($__23()[Symbol.iterator]());
          $ctx.sent = void 0;
          $ctx.action = 'next';
          $ctx.state = 16;
          break;
        case 16:
          $__27 = $__26[$ctx.action]($ctx.sentIgnoreThrow);
          $ctx.state = 13;
          break;
        case 13:
          $ctx.state = ($__27.done) ? 7 : 6;
          break;
        case 7:
          $ctx.sent = $__27.value;
          $ctx.state = 14;
          break;
        case 6:
          $ctx.state = 16;
          return $__27.value;
        case 17:
          $ctx.popTry();
          $ctx.state = 27;
          break;
        case 22:
          $ctx.popTry();
          $ctx.maybeUncatchable();
          $__6 = $ctx.storedException;
          $ctx.state = 28;
          break;
        case 28:
          $__4 = true;
          $__5 = $__6;
          $ctx.state = 27;
          break;
        case 23:
          $ctx.popTry();
          $ctx.state = 34;
          break;
        case 34:
          try {
            if (!$__3 && $__0.return != null) {
              $__0.return();
            }
          } finally {
            if ($__4) {
              throw $__5;
            }
          }
          $ctx.state = 32;
          break;
        case 27:
          $ctx.pushTry(39, null);
          $ctx.state = 42;
          break;
        case 42:
          $ctx.state = 36;
          return Bluebird.all(closeTasks);
        case 36:
          $ctx.maybeThrow();
          $ctx.state = 38;
          break;
        case 38:
          $ctx.popTry();
          $ctx.state = 44;
          break;
        case 39:
          $ctx.popTry();
          $ctx.maybeUncatchable();
          e = $ctx.storedException;
          $ctx.state = 45;
          break;
        case 45:
          debug("ERROR: Cannot close MongoDB connections, error\n" + e.stack);
          $ctx.state = 44;
          break;
        case 44:
          debug("MongoDB context end.");
          $ctx.state = 51;
          break;
        case 51:
          $ctx.state = $ctx.finallyFallThrough;
          break;
        default:
          return $ctx.end();
      }
  }, $__24, this);
}));
module.exports = MongoDBContext;
//# sourceMappingURL=data:application/json;base64,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LENBQUM7QUFDdkIsZUFBb0IsQ0FBQSxJQUFHLGdCQUFnQixDQUFDOzs7O0FBSTVDLGVBQW9CLEtBQUcsQ0FBQztBQUN4QixvQkFBb0MsQ0FBQzs7OztBQVIvQyxhQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7Ozs7QUFVSCxZQUFJO0FBQ0YsZUFBSSxLQUFpQixHQUFLLENBQUEsV0FBdUIsR0FBSyxLQUFHLENBQUc7QUFDMUQsd0JBQXdCLEFBQUMsRUFBQyxDQUFDO1lBQzdCO0FBQUEsVUFDRixDQUFFLE9BQVE7QUFDUixvQkFBd0I7QUFDdEIsd0JBQXdCO1lBQzFCO0FBQUEsVUFDRjtBQUFBOzs7QUFsQlYsYUFBRyxRQUFRLEFBQUMsVUFFaUIsQ0FBQzs7Ozs7ZUE0SVosQ0FBQSxRQUFPLElBQUksQUFBQyxDQUFDLFVBQVMsQ0FBQzs7QUE5SXpDLGFBQUcsV0FBVyxBQUFDLEVBQUMsQ0FBQTs7OztBQUFoQixhQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7Ozs7QUFDQyxhQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7QUFDYixhQUFHLGlCQUFpQixBQUFDLEVBQUMsQ0FBQztBQUN2QixZQUFvQixDQUFBLElBQUcsZ0JBQWdCLENBQUM7Ozs7QUE4STFDLGNBQUksQUFBQyxDQUFDLGtEQUFpRCxFQUFJLENBQUEsQ0FBQSxNQUFNLENBQUMsQ0FBQzs7OztBQUd2RSxjQUFJLEFBQUMsQ0FBQyxzQkFBcUIsQ0FBQyxDQUFDOzs7O0FBbkpmLGFBQUcsTUFBTSxFQUFJLENBQUEsSUFBRyxtQkFBbUIsQ0FBQztBQUNwQyxlQUFLOztBQUYzQixlQUFPLENBQUEsSUFBRyxJQUFJLEFBQUMsRUFBQyxDQUFBOztBQUNtQixFQUMvQixRQUE2QixLQUFHLENBQUMsQ0FBQztBQW9KdEMsQ0F0SnVELENBc0p0RCxDQUFDO0FBRUYsS0FBSyxRQUFRLEVBQUksZUFBYSxDQUFDO0FBQUEiLCJmaWxlIjoiYWN0aXZpdGllcy9tb25nb0RCQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmxldCB3ZjRub2RlID0gcmVxdWlyZShcIndvcmtmbG93LTQtbm9kZVwiKTtcbmxldCBBY3Rpdml0eSA9IHdmNG5vZGUuYWN0aXZpdGllcy5BY3Rpdml0eTtcbmxldCBVbml0T2ZXb3JrID0gcmVxdWlyZShcIi4vdW5pdE9mV29ya1wiKTtcbmxldCB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XG5sZXQgYWN0aXZpdHlNYXJrdXAgPSB3ZjRub2RlLmFjdGl2aXRpZXMuYWN0aXZpdHlNYXJrdXA7XG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XG5sZXQgTW9uZ29DbGllbnQgPSByZXF1aXJlKFwibW9uZ29kYlwiKS5Nb25nb0NsaWVudDtcbmxldCBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm1vbmdvLWNydW5jaDpNb25nb0RCQ29udGV4dFwiKTtcbmxldCBhc3luYyA9IEJsdWViaXJkLmNvcm91dGluZTtcbmxldCBjb2xsR0MgPSByZXF1aXJlKFwiLi9jb2xsR0NcIik7XG5cbmZ1bmN0aW9uIE1vbmdvREJDb250ZXh0KCkge1xuICAgIFVuaXRPZldvcmsuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBudWxsO1xufVxuXG51dGlsLmluaGVyaXRzKE1vbmdvREJDb250ZXh0LCBVbml0T2ZXb3JrKTtcblxuTW9uZ29EQkNvbnRleHQucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCwgYXJncykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgY29ubmVjdGlvbnMgPSBzZWxmLmNvbm5lY3Rpb25zIHx8IHByb2Nlc3MuZW52Lk1PTkdPX1VSTDtcblxuICAgIGRlYnVnKGBSdW5uaW5nIGNvbm5lY3Rpb25zOiAke2Nvbm5lY3Rpb25zfS5gKTtcblxuICAgIGZ1bmN0aW9uIHRvQ29ubmVjdGlvbnNBcnJheShjb25ucykge1xuXG4gICAgICAgIGZ1bmN0aW9uIHRvQ29ubmVjdGlvbihjb25uKSB7XG4gICAgICAgICAgICBpZiAoXy5pc1N0cmluZyhjb25uKSkge1xuICAgICAgICAgICAgICAgIGNvbm4gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVmYXVsdFwiLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IGNvbm4sXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoXy5pc09iamVjdChjb25uKSkge1xuICAgICAgICAgICAgICAgIGNvbm4gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGNvbm4ubmFtZSB8fCBcImRlZmF1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBjb25uLnVybCxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogY29ubi5vcHRpb25zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gaXMgaW52YWxpZDogXCIgKyB1dGlsLmluc3BlY3QoY29ubikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5pc1N0cmluZyhjb25uLnVybCkgJiYgY29ubi51cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29ubjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gaXMgaW52YWxpZDogXCIgKyB1dGlsLmluc3BlY3QoY29ubikpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAoXy5pc0FycmF5KGNvbm5zKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgYyBvZiBjb25ucykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRvQ29ubmVjdGlvbihjKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh0b0Nvbm5lY3Rpb24oY29ubnMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGRlYnVnKFwiUGFyc2luZyBjb25uZWN0aW9ucy5cIik7XG4gICAgICAgIGxldCBjb25uc0RlZiA9IHRvQ29ubmVjdGlvbnNBcnJheShjb25uZWN0aW9ucyk7XG4gICAgICAgIGRlYnVnKGBUaGVyZSBpcyAke2Nvbm5zRGVmLmxlbmd0aH0gY29ubmVjdGlvbihzKSBoYXMgYmVlbiBkZWZpbmVkLmApO1xuICAgICAgICBsZXQgcHJvY2Vzc2VkQ29ubnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvciAobGV0IGNvbm4gb2YgY29ubnNEZWYpIHtcbiAgICAgICAgICAgIGlmICghcHJvY2Vzc2VkQ29ubnMuaGFzKGNvbm4ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzZWRDb25ucy5zZXQoY29ubi5uYW1lLCBjb25uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZWQgY29ubmVjdGlvbiBcXFwiXCIgKyBjb25uLm5hbWUgKyBcIlxcXCIuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRhc2tzID0gW107XG4gICAgICAgIGZvciAobGV0IGNvbm4gb2YgcHJvY2Vzc2VkQ29ubnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGRlYnVnKGBDcmVhdGluZyBEYiBmb3IgY29ubmVjdGlvbiAke2Nvbm4udXJsfSwgb3B0aW9ucyAke2Nvbm4ub3B0aW9uc30uYCk7XG4gICAgICAgICAgICB0YXNrcy5wdXNoKE1vbmdvQ2xpZW50LmNvbm5lY3QoY29ubi51cmwsIGNvbm4ub3B0aW9ucykudGhlbihmdW5jdGlvbiAoZGIpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZyhcIkRiIGNyZWF0ZWQuXCIpO1xuICAgICAgICAgICAgICAgIGNvbm4uZGIgPSBkYjtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEJsdWViaXJkLmFsbCh0YXNrcykudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3Q29ubnMgPSB7fTtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbm5lY3Rpb25zID0gbmV3Q29ubnM7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrdnAgb2YgcHJvY2Vzc2VkQ29ubnMuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0Nvbm5zW2t2cFswXV0gPSBrdnBbMV0uZGI7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDb2xsZWN0aW5nIGdhcmJhZ2Ugb2YgJyR7a3ZwWzBdfScuYCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxHQy5jb2xsZWN0KGt2cFsxXS5kYilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDb2xsZWN0aW5nIGdhcmJhZ2Ugb2YgJyR7a3ZwWzBdfScgY29tcGxldGVkLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGluZyBnYXJiYWdlIG9mICcke2t2cFswXX0nIGZhaWxlZC4gRXJyb3I6XFxuJHtlLnN0YWNrfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGVidWcoXCJDb250ZXh0IGhhcyBiZWVuIGluaXRpYWxpemVkLCBzY2hlZHVsaW5nIGJvZHkuXCIpO1xuICAgICAgICAgICAgICAgIFVuaXRPZldvcmsucHJvdG90eXBlLnJ1bi5jYWxsKHNlbGYsIGNhbGxDb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGNhbGxDb250ZXh0LmZhaWwoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FsbENvbnRleHQuZmFpbChlKTtcbiAgICB9XG59O1xuXG5Nb25nb0RCQ29udGV4dC5wcm90b3R5cGUuZmluYWxpemUgPSBhc3luYyhmdW5jdGlvbiooKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgeWllbGQgVW5pdE9mV29yay5wcm90b3R5cGUuZmluYWxpemUuY2FsbCh0aGlzKTtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIC8vIENsb3NlIGFsbCBkYnM6XG4gICAgICAgIGxldCBjb25uZWN0aW9ucyA9IHRoaXMuY29ubmVjdGlvbnM7XG4gICAgICAgIGxldCBjb25uTmFtZXMgPSBfLmtleXMoY29ubmVjdGlvbnMpO1xuICAgICAgICBkZWJ1ZyhgQ2xvc2luZyAke2Nvbm5OYW1lcy5sZW5ndGh9IGNvbm5lY3Rpb25zLmApO1xuICAgICAgICBsZXQgY2xvc2VUYXNrcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBjb25uTmFtZSBvZiBjb25uTmFtZXMpIHtcbiAgICAgICAgICAgIGxldCBkYiA9IGNvbm5lY3Rpb25zW2Nvbm5OYW1lXTtcbiAgICAgICAgICAgIGRlYnVnKGBDbG9zaW5nICcke2RiLmRhdGFiYXNlTmFtZX0nLmApO1xuICAgICAgICAgICAgY2xvc2VUYXNrcy5wdXNoKGRiLmNsb3NlKHRydWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRGIgJyR7ZGIuZGF0YWJhc2VOYW1lfScgY2xvc2VkLmApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBFUlJPUjogQ2xvc2luZyBEYiAnJHtkYi5kYXRhYmFzZU5hbWV9JyBmYWlsZWQgd2l0aFxcbiR7ZS5zdGFja31gKTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgeWllbGQgQmx1ZWJpcmQuYWxsKGNsb3NlVGFza3MpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIkVSUk9SOiBDYW5ub3QgY2xvc2UgTW9uZ29EQiBjb25uZWN0aW9ucywgZXJyb3JcXG5cIiArIGUuc3RhY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVidWcoXCJNb25nb0RCIGNvbnRleHQgZW5kLlwiKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb25nb0RCQ29udGV4dDsiXX0=
