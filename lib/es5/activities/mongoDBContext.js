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
      var $__4 = true;
      var $__5 = false;
      var $__6 = undefined;
      try {
        for (var $__2 = void 0,
            $__1 = (conns)[Symbol.iterator](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
          var c = $__2.value;
          {
            result.push(toConnection(c));
          }
        }
      } catch ($__7) {
        $__5 = true;
        $__6 = $__7;
      } finally {
        try {
          if (!$__4 && $__1.return != null) {
            $__1.return();
          }
        } finally {
          if ($__5) {
            throw $__6;
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
    var $__4 = true;
    var $__5 = false;
    var $__6 = undefined;
    try {
      for (var $__2 = void 0,
          $__1 = (connsDef)[Symbol.iterator](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
        var conn = $__2.value;
        {
          if (!processedConns.has(conn.name)) {
            processedConns.set(conn.name, conn);
          } else {
            throw new Error("Duplicated connection \"" + conn.name + "\".");
          }
        }
      }
    } catch ($__7) {
      $__5 = true;
      $__6 = $__7;
    } finally {
      try {
        if (!$__4 && $__1.return != null) {
          $__1.return();
        }
      } finally {
        if ($__5) {
          throw $__6;
        }
      }
    }
    var tasks = [];
    var $__11 = true;
    var $__12 = false;
    var $__13 = undefined;
    try {
      var $__22 = function() {
        var conn = $__9.value;
        {
          debug(("Creating Db for connection " + conn.url + ", options " + conn.options + "."));
          tasks.push(MongoClient.connect(conn.url, conn.options).then(function(db) {
            debug("Db created.");
            conn.db = db;
          }));
        }
      };
      for (var $__9 = void 0,
          $__8 = (processedConns.values())[Symbol.iterator](); !($__11 = ($__9 = $__8.next()).done); $__11 = true) {
        $__22();
      }
    } catch ($__14) {
      $__12 = true;
      $__13 = $__14;
    } finally {
      try {
        if (!$__11 && $__8.return != null) {
          $__8.return();
        }
      } finally {
        if ($__12) {
          throw $__13;
        }
      }
    }
    Bluebird.all(tasks).then(function() {
      var newConns = {};
      self.connections = newConns;
      var $__18 = true;
      var $__19 = false;
      var $__20 = undefined;
      try {
        var $__23 = function() {
          var kvp = $__16.value;
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
        for (var $__16 = void 0,
            $__15 = (processedConns.entries())[Symbol.iterator](); !($__18 = ($__16 = $__15.next()).done); $__18 = true) {
          $__23();
        }
      } catch ($__21) {
        $__19 = true;
        $__20 = $__21;
      } finally {
        try {
          if (!$__18 && $__15.return != null) {
            $__15.return();
          }
        } finally {
          if ($__19) {
            throw $__20;
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
MongoDBContext.prototype.finalize = async($traceurRuntime.initGeneratorFunction(function $__25() {
  var connections,
      connNames,
      closeTasks,
      $__4,
      $__5,
      $__6,
      $__24,
      $__2,
      $__1,
      $__27,
      $__28,
      $__7,
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
          $__4 = true;
          $__5 = false;
          $__6 = undefined;
          $ctx.state = 49;
          break;
        case 49:
          $ctx.pushTry(22, 23);
          $ctx.state = 25;
          break;
        case 25:
          $__24 = $traceurRuntime.initGeneratorFunction(function $__26() {
            var connName,
                db;
            return $traceurRuntime.createGeneratorInstance(function($ctx) {
              while (true)
                switch ($ctx.state) {
                  case 0:
                    connName = $__2.value;
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
            }, $__26, this);
          });
          $ctx.state = 21;
          break;
        case 21:
          $__2 = void 0, $__1 = (connNames)[Symbol.iterator]();
          $ctx.state = 19;
          break;
        case 19:
          $ctx.state = (!($__4 = ($__2 = $__1.next()).done)) ? 15 : 17;
          break;
        case 14:
          $__4 = true;
          $ctx.state = 19;
          break;
        case 15:
          $__27 = $ctx.wrapYieldStar($__24()[Symbol.iterator]());
          $ctx.sent = void 0;
          $ctx.action = 'next';
          $ctx.state = 16;
          break;
        case 16:
          $__28 = $__27[$ctx.action]($ctx.sentIgnoreThrow);
          $ctx.state = 13;
          break;
        case 13:
          $ctx.state = ($__28.done) ? 7 : 6;
          break;
        case 7:
          $ctx.sent = $__28.value;
          $ctx.state = 14;
          break;
        case 6:
          $ctx.state = 16;
          return $__28.value;
        case 17:
          $ctx.popTry();
          $ctx.state = 27;
          break;
        case 22:
          $ctx.popTry();
          $ctx.maybeUncatchable();
          $__7 = $ctx.storedException;
          $ctx.state = 28;
          break;
        case 28:
          $__5 = true;
          $__6 = $__7;
          $ctx.state = 27;
          break;
        case 23:
          $ctx.popTry();
          $ctx.state = 34;
          break;
        case 34:
          try {
            if (!$__4 && $__1.return != null) {
              $__1.return();
            }
          } finally {
            if ($__5) {
              throw $__6;
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
  }, $__25, this);
}));
module.exports = MongoDBContext;
//# sourceMappingURL=data:application/json;base64,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LEdBQUssQ0FBQSxXQUF1QixHQUFLLEtBQUcsQ0FBRztBQUMxRCx3QkFBd0IsQUFBQyxFQUFDLENBQUM7WUFDN0I7QUFBQSxVQUNGLENBQUUsT0FBUTtBQUNSLG9CQUF3QjtBQUN0Qix3QkFBd0I7WUFDMUI7QUFBQSxVQUNGO0FBQUE7OztBQWxCVixhQUFHLFFBQVEsQUFBQyxVQUVpQixDQUFDOzs7OztlQTRJWixDQUFBLFFBQU8sSUFBSSxBQUFDLENBQUMsVUFBUyxDQUFDOztBQTlJekMsYUFBRyxXQUFXLEFBQUMsRUFBQyxDQUFBOzs7O0FBQWhCLGFBQUcsT0FBTyxBQUFDLEVBQUMsQ0FBQzs7OztBQUNDLGFBQUcsT0FBTyxBQUFDLEVBQUMsQ0FBQztBQUNiLGFBQUcsaUJBQWlCLEFBQUMsRUFBQyxDQUFDO0FBQ3ZCLFlBQW9CLENBQUEsSUFBRyxnQkFBZ0IsQ0FBQzs7OztBQThJMUMsY0FBSSxBQUFDLENBQUMsa0RBQWlELEVBQUksQ0FBQSxDQUFBLE1BQU0sQ0FBQyxDQUFDOzs7O0FBR3ZFLGNBQUksQUFBQyxDQUFDLHNCQUFxQixDQUFDLENBQUM7Ozs7QUFuSmYsYUFBRyxNQUFNLEVBQUksQ0FBQSxJQUFHLG1CQUFtQixDQUFDO0FBQ3BDLGVBQUs7O0FBRjNCLGVBQU8sQ0FBQSxJQUFHLElBQUksQUFBQyxFQUFDLENBQUE7O0FBQ21CLEVBQy9CLFFBQTZCLEtBQUcsQ0FBQyxDQUFDO0FBb0p0QyxDQXRKdUQsQ0FzSnRELENBQUM7QUFFRixLQUFLLFFBQVEsRUFBSSxlQUFhLENBQUM7QUFBQSIsImZpbGUiOiJhY3Rpdml0aWVzL21vbmdvREJDb250ZXh0LmpzIiwic291cmNlUm9vdCI6ImxpYi9lczYiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmxldCB3ZjRub2RlID0gcmVxdWlyZShcIndvcmtmbG93LTQtbm9kZVwiKTtcclxubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5sZXQgVW5pdE9mV29yayA9IHJlcXVpcmUoXCIuL3VuaXRPZldvcmtcIik7XHJcbmxldCB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XHJcbmxldCBhY3Rpdml0eU1hcmt1cCA9IHdmNG5vZGUuYWN0aXZpdGllcy5hY3Rpdml0eU1hcmt1cDtcclxubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xyXG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XHJcbmxldCBNb25nb0NsaWVudCA9IHJlcXVpcmUoXCJtb25nb2RiXCIpLk1vbmdvQ2xpZW50O1xyXG5sZXQgZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJtb25nby1jcnVuY2g6TW9uZ29EQkNvbnRleHRcIik7XHJcbmxldCBhc3luYyA9IEJsdWViaXJkLmNvcm91dGluZTtcclxubGV0IGNvbGxHQyA9IHJlcXVpcmUoXCIuL2NvbGxHQ1wiKTtcclxuXHJcbmZ1bmN0aW9uIE1vbmdvREJDb250ZXh0KCkge1xyXG4gICAgVW5pdE9mV29yay5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBudWxsO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKE1vbmdvREJDb250ZXh0LCBVbml0T2ZXb3JrKTtcclxuXHJcbk1vbmdvREJDb250ZXh0LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGFyZ3MpIHtcclxuICAgIGxldCBzZWxmID0gdGhpcztcclxuICAgIGxldCBjb25uZWN0aW9ucyA9IHNlbGYuY29ubmVjdGlvbnMgfHwgcHJvY2Vzcy5lbnYuTU9OR09fVVJMO1xyXG5cclxuICAgIGRlYnVnKGBSdW5uaW5nIGNvbm5lY3Rpb25zOiAke2Nvbm5lY3Rpb25zfS5gKTtcclxuXHJcbiAgICBmdW5jdGlvbiB0b0Nvbm5lY3Rpb25zQXJyYXkoY29ubnMpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9Db25uZWN0aW9uKGNvbm4pIHtcclxuICAgICAgICAgICAgaWYgKF8uaXNTdHJpbmcoY29ubikpIHtcclxuICAgICAgICAgICAgICAgIGNvbm4gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBjb25uLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IG51bGxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoXy5pc09iamVjdChjb25uKSkge1xyXG4gICAgICAgICAgICAgICAgY29ubiA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjb25uLm5hbWUgfHwgXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBjb25uLnVybCxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBjb25uLm9wdGlvbnNcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGludmFsaWQ6IFwiICsgdXRpbC5pbnNwZWN0KGNvbm4pKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNTdHJpbmcoY29ubi51cmwpICYmIGNvbm4udXJsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29ubjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGludmFsaWQ6IFwiICsgdXRpbC5pbnNwZWN0KGNvbm4pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcclxuICAgICAgICBpZiAoXy5pc0FycmF5KGNvbm5zKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjIG9mIGNvbm5zKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh0b0Nvbm5lY3Rpb24oYykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0b0Nvbm5lY3Rpb24oY29ubnMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGRlYnVnKFwiUGFyc2luZyBjb25uZWN0aW9ucy5cIik7XHJcbiAgICAgICAgbGV0IGNvbm5zRGVmID0gdG9Db25uZWN0aW9uc0FycmF5KGNvbm5lY3Rpb25zKTtcclxuICAgICAgICBkZWJ1ZyhgVGhlcmUgaXMgJHtjb25uc0RlZi5sZW5ndGh9IGNvbm5lY3Rpb24ocykgaGFzIGJlZW4gZGVmaW5lZC5gKTtcclxuICAgICAgICBsZXQgcHJvY2Vzc2VkQ29ubnMgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgZm9yIChsZXQgY29ubiBvZiBjb25uc0RlZikge1xyXG4gICAgICAgICAgICBpZiAoIXByb2Nlc3NlZENvbm5zLmhhcyhjb25uLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzZWRDb25ucy5zZXQoY29ubi5uYW1lLCBjb25uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZWQgY29ubmVjdGlvbiBcXFwiXCIgKyBjb25uLm5hbWUgKyBcIlxcXCIuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGFza3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBjb25uIG9mIHByb2Nlc3NlZENvbm5zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIGRlYnVnKGBDcmVhdGluZyBEYiBmb3IgY29ubmVjdGlvbiAke2Nvbm4udXJsfSwgb3B0aW9ucyAke2Nvbm4ub3B0aW9uc30uYCk7XHJcbiAgICAgICAgICAgIHRhc2tzLnB1c2goTW9uZ29DbGllbnQuY29ubmVjdChjb25uLnVybCwgY29ubi5vcHRpb25zKS50aGVuKGZ1bmN0aW9uIChkYikge1xyXG4gICAgICAgICAgICAgICAgZGVidWcoXCJEYiBjcmVhdGVkLlwiKTtcclxuICAgICAgICAgICAgICAgIGNvbm4uZGIgPSBkYjtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgQmx1ZWJpcmQuYWxsKHRhc2tzKS50aGVuKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3Q29ubnMgPSB7fTtcclxuICAgICAgICAgICAgICAgIHNlbGYuY29ubmVjdGlvbnMgPSBuZXdDb25ucztcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrdnAgb2YgcHJvY2Vzc2VkQ29ubnMuZW50cmllcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3Q29ubnNba3ZwWzBdXSA9IGt2cFsxXS5kYjtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGluZyBnYXJiYWdlIG9mICcke2t2cFswXX0nLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbGxHQy5jb2xsZWN0KGt2cFsxXS5kYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGluZyBnYXJiYWdlIG9mICcke2t2cFswXX0nIGNvbXBsZXRlZC5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYENvbGxlY3RpbmcgZ2FyYmFnZSBvZiAnJHtrdnBbMF19JyBmYWlsZWQuIEVycm9yOlxcbiR7ZS5zdGFja31gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZGVidWcoXCJDb250ZXh0IGhhcyBiZWVuIGluaXRpYWxpemVkLCBzY2hlZHVsaW5nIGJvZHkuXCIpO1xyXG4gICAgICAgICAgICAgICAgVW5pdE9mV29yay5wcm90b3R5cGUucnVuLmNhbGwoc2VsZiwgY2FsbENvbnRleHQsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNhbGxDb250ZXh0LmZhaWwoZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Nb25nb0RCQ29udGV4dC5wcm90b3R5cGUuZmluYWxpemUgPSBhc3luYyhmdW5jdGlvbiooKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHlpZWxkIFVuaXRPZldvcmsucHJvdG90eXBlLmZpbmFsaXplLmNhbGwodGhpcyk7XHJcbiAgICB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICAvLyBDbG9zZSBhbGwgZGJzOlxyXG4gICAgICAgIGxldCBjb25uZWN0aW9ucyA9IHRoaXMuY29ubmVjdGlvbnM7XHJcbiAgICAgICAgbGV0IGNvbm5OYW1lcyA9IF8ua2V5cyhjb25uZWN0aW9ucyk7XHJcbiAgICAgICAgZGVidWcoYENsb3NpbmcgJHtjb25uTmFtZXMubGVuZ3RofSBjb25uZWN0aW9ucy5gKTtcclxuICAgICAgICBsZXQgY2xvc2VUYXNrcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGNvbm5OYW1lIG9mIGNvbm5OYW1lcykge1xyXG4gICAgICAgICAgICBsZXQgZGIgPSBjb25uZWN0aW9uc1tjb25uTmFtZV07XHJcbiAgICAgICAgICAgIGRlYnVnKGBDbG9zaW5nICcke2RiLmRhdGFiYXNlTmFtZX0nLmApO1xyXG4gICAgICAgICAgICBjbG9zZVRhc2tzLnB1c2goZGIuY2xvc2UodHJ1ZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRGIgJyR7ZGIuZGF0YWJhc2VOYW1lfScgY2xvc2VkLmApO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBFUlJPUjogQ2xvc2luZyBEYiAnJHtkYi5kYXRhYmFzZU5hbWV9JyBmYWlsZWQgd2l0aFxcbiR7ZS5zdGFja31gKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHlpZWxkIEJsdWViaXJkLmFsbChjbG9zZVRhc2tzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgZGVidWcoXCJFUlJPUjogQ2Fubm90IGNsb3NlIE1vbmdvREIgY29ubmVjdGlvbnMsIGVycm9yXFxuXCIgKyBlLnN0YWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRlYnVnKFwiTW9uZ29EQiBjb250ZXh0IGVuZC5cIik7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb25nb0RCQ29udGV4dDsiXX0=
