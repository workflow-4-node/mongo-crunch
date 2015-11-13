"use strict";
"use strict";
var wf4node = require("workflow-4-node");
var Activity = wf4node.activities.Activity;
var WithBody = wf4node.activities.WithBody;
var util = require("util");
var debug = require("debug")("mongo-crunch:UnitOfWork");
var Bluebird = require("bluebird");
var _ = require("lodash");
var async = Bluebird.coroutine;
var errors = wf4node.common.errors;
function UnitOfWork() {
  WithBody.call(this);
  this.nonScopedProperties.add("finalize");
}
util.inherits(UnitOfWork, WithBody);
UnitOfWork.prototype.run = function(callContext, args) {
  this.UnitOfWorkData = {
    collectionRecycleBin: new Map(),
    openedCursors: new Set(),
    seenCollections: new Map()
  };
  debug("Starting.");
  WithBody.prototype.run.call(this, callContext, args);
};
UnitOfWork.prototype.bodyCompleted = function(callContext, reason, result) {
  var self = this;
  debug(("UnitOfWork's body completed, reason: " + reason + "."));
  callContext.activity.finalize.call(this).then(function() {
    callContext.end(reason, result);
  }, function(e) {
    if (reason === Activity.states.fail) {
      callContext.fail(new errors.AggregateError([result, e]));
    } else {
      callContext.fail(e);
    }
  });
};
UnitOfWork.prototype.finalize = async($traceurRuntime.initGeneratorFunction(function $__15() {
  var taskError,
      collectionRecycleBin,
      openedCursors,
      tasks,
      $__3,
      $__4,
      $__5,
      $__14,
      $__1,
      $__0,
      idx,
      $__10,
      $__11,
      $__12,
      $__8,
      $__7,
      c,
      $__17,
      $__18,
      $__6,
      e;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          taskError = null;
          debug("Doing final tasks.");
          $ctx.state = 53;
          break;
        case 53:
          $ctx.pushTry(39, 40);
          $ctx.state = 42;
          break;
        case 42:
          collectionRecycleBin = this.UnitOfWorkData.collectionRecycleBin;
          openedCursors = this.UnitOfWorkData.openedCursors;
          tasks = [];
          debug(("Collections in recycle bin: " + collectionRecycleBin.size + "."));
          $__3 = true;
          $__4 = false;
          $__5 = undefined;
          $ctx.state = 36;
          break;
        case 36:
          $ctx.pushTry(18, 19);
          $ctx.state = 21;
          break;
        case 21:
          $__14 = $traceurRuntime.initGeneratorFunction(function $__16() {
            var coll;
            return $traceurRuntime.createGeneratorInstance(function($ctx) {
              while (true)
                switch ($ctx.state) {
                  case 0:
                    coll = $__1.value;
                    {
                      debug(("Dropping collection: " + coll.collectionName));
                      tasks.push(coll.drop().then(function() {
                        debug(("Collection '" + coll.collectionName + "' dropped."));
                      }).catch(function(e) {
                        if (e.name === "MongoError" && e.message === "ns not found") {
                          debug(("Collection '" + coll.collectionName + "' doesn't exists."));
                          return;
                        }
                        debug(("ERROR: Collection '" + coll.collectionName + "' dropping failed with\n" + e.stack));
                      }));
                    }
                    $ctx.state = -2;
                    break;
                  default:
                    return $ctx.end();
                }
            }, $__16, this);
          });
          $ctx.state = 17;
          break;
        case 17:
          $__1 = void 0, $__0 = (collectionRecycleBin.values())[$traceurRuntime.toProperty(Symbol.iterator)]();
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
          $__17 = $ctx.wrapYieldStar($__14()[Symbol.iterator]());
          $ctx.sent = void 0;
          $ctx.action = 'next';
          $ctx.state = 12;
          break;
        case 12:
          $__18 = $__17[$ctx.action]($ctx.sentIgnoreThrow);
          $ctx.state = 9;
          break;
        case 9:
          $ctx.state = ($__18.done) ? 3 : 2;
          break;
        case 3:
          $ctx.sent = $__18.value;
          $ctx.state = 10;
          break;
        case 2:
          $ctx.state = 12;
          return $__18.value;
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
          debug(("Cursors to close: " + openedCursors.size + "."));
          idx = 0;
          $__10 = true;
          $__11 = false;
          $__12 = undefined;
          try {
            for ($__8 = void 0, $__7 = (openedCursors.values())[$traceurRuntime.toProperty(Symbol.iterator)](); !($__10 = ($__8 = $__7.next()).done); $__10 = true) {
              c = $__8.value;
              {
                tasks.push(c.close().then(function() {
                  debug(("Cursor " + idx + ". dropped."));
                }).catch(function(e) {
                  debug(("ERROR: Cursor " + idx + ". closing failed with\n" + e.stack));
                }).finally(function() {
                  idx++;
                }));
              }
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
          $ctx.state = 38;
          break;
        case 38:
          $ctx.state = 32;
          return Bluebird.all(tasks);
        case 32:
          $ctx.maybeThrow();
          $ctx.state = 34;
          break;
        case 34:
          $ctx.popTry();
          $ctx.state = 40;
          $ctx.finallyFallThrough = -2;
          break;
        case 39:
          $ctx.popTry();
          $ctx.maybeUncatchable();
          e = $ctx.storedException;
          $ctx.state = 45;
          break;
        case 45:
          debug("ERROR: final tasks failed: " + e.stack);
          throw e;
          $ctx.state = 40;
          $ctx.finallyFallThrough = -2;
          break;
        case 40:
          $ctx.popTry();
          $ctx.state = 51;
          break;
        case 51:
          delete this.UnitOfWorkData;
          debug("Final tasks completed.");
          $ctx.state = 49;
          break;
        case 49:
          $ctx.state = $ctx.finallyFallThrough;
          break;
        case 28:
          switch ($ctx.finallyFallThrough) {
            case 53:
            case 42:
            case 36:
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
            case 38:
            case 32:
            case 34:
            case 39:
            case 45:
              $ctx.state = $ctx.finallyFallThrough;
              $ctx.finallyFallThrough = -1;
              break;
            default:
              $ctx.state = 40;
              break;
          }
          break;
        default:
          return $ctx.end();
      }
  }, $__15, this);
}));
UnitOfWork.addCollectionToRecycleBin = function(scope, collection) {
  var bin = scope.UnitOfWorkData.collectionRecycleBin;
  debug(("Adding collection '" + collection.collectionName + "' to recycle bin."));
  bin.set(collection.collectionName, collection);
  debug(("Recycle bin size is " + bin.size + "."));
};
UnitOfWork.registerOpenedCursor = function(scope, cursor) {
  var cursors = scope.UnitOfWorkData.openedCursors;
  debug("Registering a cursor as opened.");
  cursors.add(cursor);
  debug(("There are " + cursors.size + " cursors registered."));
};
UnitOfWork.unregisterOpenedCursor = function(scope, cursor) {
  debug("Unregistering opened cursor.");
  scope.UnitOfWorkData.openedCursors.delete(cursor);
  debug(("There are " + scope.UnitOfWorkData.openedCursors.size + " cursors registered."));
};
UnitOfWork.isFirstSeenCollection = function(scope, db, collectionName) {
  debug(("Determining if '" + collectionName + "' collection in '" + db.databaseName + "' db is first seen by the current unit of work."));
  var colls = scope.UnitOfWorkData.seenCollections;
  var entry = colls.get(db);
  if (!entry) {
    entry = new Set();
    entry.add(collectionName);
    colls.set(db, entry);
    debug("Fist seen.");
    return true;
  }
  if (!entry.has(collectionName)) {
    entry.add(collectionName);
    debug("First seen.");
    return true;
  }
  debug("Not first seen.");
  return false;
};
module.exports = UnitOfWork;
//# sourceMappingURL=data:application/json;base64,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ZSI6ImFjdGl2aXRpZXMvdW5pdE9mV29yay5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmxldCB3ZjRub2RlID0gcmVxdWlyZShcIndvcmtmbG93LTQtbm9kZVwiKTtcbmxldCBBY3Rpdml0eSA9IHdmNG5vZGUuYWN0aXZpdGllcy5BY3Rpdml0eTtcbmxldCBXaXRoQm9keSA9IHdmNG5vZGUuYWN0aXZpdGllcy5XaXRoQm9keTtcbmxldCB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XG5sZXQgZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJtb25nby1jcnVuY2g6VW5pdE9mV29ya1wiKTtcbmxldCBCbHVlYmlyZCA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcbmxldCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcbmxldCBhc3luYyA9IEJsdWViaXJkLmNvcm91dGluZTtcbmxldCBlcnJvcnMgPSB3ZjRub2RlLmNvbW1vbi5lcnJvcnM7XG5cbmZ1bmN0aW9uIFVuaXRPZldvcmsoKSB7XG4gICAgV2l0aEJvZHkuY2FsbCh0aGlzKTtcbiAgICB0aGlzLm5vblNjb3BlZFByb3BlcnRpZXMuYWRkKFwiZmluYWxpemVcIik7XG59XG5cbnV0aWwuaW5oZXJpdHMoVW5pdE9mV29yaywgV2l0aEJvZHkpO1xuXG5Vbml0T2ZXb3JrLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGFyZ3MpIHtcbiAgICB0aGlzLlVuaXRPZldvcmtEYXRhID0ge1xuICAgICAgICBjb2xsZWN0aW9uUmVjeWNsZUJpbjogbmV3IE1hcCgpLFxuICAgICAgICBvcGVuZWRDdXJzb3JzOiBuZXcgU2V0KCksXG4gICAgICAgIHNlZW5Db2xsZWN0aW9uczogbmV3IE1hcCgpXG4gICAgfTtcbiAgICBkZWJ1ZyhcIlN0YXJ0aW5nLlwiKTtcbiAgICBXaXRoQm9keS5wcm90b3R5cGUucnVuLmNhbGwodGhpcywgY2FsbENvbnRleHQsIGFyZ3MpO1xufTtcblxuVW5pdE9mV29yay5wcm90b3R5cGUuYm9keUNvbXBsZXRlZCA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCwgcmVhc29uLCByZXN1bHQpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBkZWJ1ZyhgVW5pdE9mV29yaydzIGJvZHkgY29tcGxldGVkLCByZWFzb246ICR7cmVhc29ufS5gKTtcblxuICAgIGNhbGxDb250ZXh0LmFjdGl2aXR5LmZpbmFsaXplLmNhbGwodGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbENvbnRleHQuZW5kKHJlYXNvbiwgcmVzdWx0KTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChyZWFzb24gPT09IEFjdGl2aXR5LnN0YXRlcy5mYWlsKSB7XG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChuZXcgZXJyb3JzLkFnZ3JlZ2F0ZUVycm9yKFtyZXN1bHQsZV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxDb250ZXh0LmZhaWwoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufTtcblxuVW5pdE9mV29yay5wcm90b3R5cGUuZmluYWxpemUgPSBhc3luYyhmdW5jdGlvbiooKSB7XG4gICAgbGV0IHRhc2tFcnJvciA9IG51bGw7XG5cbiAgICBkZWJ1ZyhcIkRvaW5nIGZpbmFsIHRhc2tzLlwiKTtcbiAgICB0cnkge1xuICAgICAgICBsZXQgY29sbGVjdGlvblJlY3ljbGVCaW4gPSB0aGlzLlVuaXRPZldvcmtEYXRhLmNvbGxlY3Rpb25SZWN5Y2xlQmluO1xuICAgICAgICBsZXQgb3BlbmVkQ3Vyc29ycyA9IHRoaXMuVW5pdE9mV29ya0RhdGEub3BlbmVkQ3Vyc29ycztcbiAgICAgICAgbGV0IHRhc2tzID0gW107XG5cbiAgICAgICAgZGVidWcoYENvbGxlY3Rpb25zIGluIHJlY3ljbGUgYmluOiAke2NvbGxlY3Rpb25SZWN5Y2xlQmluLnNpemV9LmApO1xuICAgICAgICBmb3IgKGxldCBjb2xsIG9mIGNvbGxlY3Rpb25SZWN5Y2xlQmluLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBkZWJ1ZyhgRHJvcHBpbmcgY29sbGVjdGlvbjogJHtjb2xsLmNvbGxlY3Rpb25OYW1lfWApO1xuICAgICAgICAgICAgdGFza3MucHVzaChjb2xsLmRyb3AoKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYENvbGxlY3Rpb24gJyR7Y29sbC5jb2xsZWN0aW9uTmFtZX0nIGRyb3BwZWQuYCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUubmFtZSA9PT0gXCJNb25nb0Vycm9yXCIgJiYgZS5tZXNzYWdlID09PSBcIm5zIG5vdCBmb3VuZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvbiAnJHtjb2xsLmNvbGxlY3Rpb25OYW1lfScgZG9lc24ndCBleGlzdHMuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYEVSUk9SOiBDb2xsZWN0aW9uICcke2NvbGwuY29sbGVjdGlvbk5hbWV9JyBkcm9wcGluZyBmYWlsZWQgd2l0aFxcbiR7ZS5zdGFja31gKTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1ZyhgQ3Vyc29ycyB0byBjbG9zZTogJHtvcGVuZWRDdXJzb3JzLnNpemV9LmApO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgYyBvZiBvcGVuZWRDdXJzb3JzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICB0YXNrcy5wdXNoKGMuY2xvc2UoKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYEN1cnNvciAke2lkeH0uIGRyb3BwZWQuYCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYEVSUk9SOiBDdXJzb3IgJHtpZHh9LiBjbG9zaW5nIGZhaWxlZCB3aXRoXFxuJHtlLnN0YWNrfWApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZHgrKztcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICB5aWVsZCBCbHVlYmlyZC5hbGwodGFza3MpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBkZWJ1ZyhcIkVSUk9SOiBmaW5hbCB0YXNrcyBmYWlsZWQ6IFwiICsgZS5zdGFjayk7XG4gICAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBkZWxldGUgdGhpcy5Vbml0T2ZXb3JrRGF0YTtcbiAgICAgICAgZGVidWcoXCJGaW5hbCB0YXNrcyBjb21wbGV0ZWQuXCIpO1xuICAgIH1cbn0pO1xuXG5Vbml0T2ZXb3JrLmFkZENvbGxlY3Rpb25Ub1JlY3ljbGVCaW4gPSBmdW5jdGlvbiAoc2NvcGUsIGNvbGxlY3Rpb24pIHtcbiAgICBsZXQgYmluID0gc2NvcGUuVW5pdE9mV29ya0RhdGEuY29sbGVjdGlvblJlY3ljbGVCaW47XG4gICAgZGVidWcoYEFkZGluZyBjb2xsZWN0aW9uICcke2NvbGxlY3Rpb24uY29sbGVjdGlvbk5hbWV9JyB0byByZWN5Y2xlIGJpbi5gKTtcbiAgICBiaW4uc2V0KGNvbGxlY3Rpb24uY29sbGVjdGlvbk5hbWUsIGNvbGxlY3Rpb24pO1xuICAgIGRlYnVnKGBSZWN5Y2xlIGJpbiBzaXplIGlzICR7YmluLnNpemV9LmApO1xufTtcblxuVW5pdE9mV29yay5yZWdpc3Rlck9wZW5lZEN1cnNvciA9IGZ1bmN0aW9uIChzY29wZSwgY3Vyc29yKSB7XG4gICAgbGV0IGN1cnNvcnMgPSBzY29wZS5Vbml0T2ZXb3JrRGF0YS5vcGVuZWRDdXJzb3JzO1xuICAgIGRlYnVnKGBSZWdpc3RlcmluZyBhIGN1cnNvciBhcyBvcGVuZWQuYCk7XG4gICAgY3Vyc29ycy5hZGQoY3Vyc29yKTtcbiAgICBkZWJ1ZyhgVGhlcmUgYXJlICR7Y3Vyc29ycy5zaXplfSBjdXJzb3JzIHJlZ2lzdGVyZWQuYCk7XG59O1xuXG5Vbml0T2ZXb3JrLnVucmVnaXN0ZXJPcGVuZWRDdXJzb3IgPSBmdW5jdGlvbiAoc2NvcGUsIGN1cnNvcikge1xuICAgIGRlYnVnKGBVbnJlZ2lzdGVyaW5nIG9wZW5lZCBjdXJzb3IuYCk7XG4gICAgc2NvcGUuVW5pdE9mV29ya0RhdGEub3BlbmVkQ3Vyc29ycy5kZWxldGUoY3Vyc29yKTtcbiAgICBkZWJ1ZyhgVGhlcmUgYXJlICR7c2NvcGUuVW5pdE9mV29ya0RhdGEub3BlbmVkQ3Vyc29ycy5zaXplfSBjdXJzb3JzIHJlZ2lzdGVyZWQuYCk7XG59O1xuXG5Vbml0T2ZXb3JrLmlzRmlyc3RTZWVuQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChzY29wZSwgZGIsIGNvbGxlY3Rpb25OYW1lKSB7XG4gICAgZGVidWcoYERldGVybWluaW5nIGlmICcke2NvbGxlY3Rpb25OYW1lfScgY29sbGVjdGlvbiBpbiAnJHtkYi5kYXRhYmFzZU5hbWV9JyBkYiBpcyBmaXJzdCBzZWVuIGJ5IHRoZSBjdXJyZW50IHVuaXQgb2Ygd29yay5gKTtcbiAgICBsZXQgY29sbHMgPSBzY29wZS5Vbml0T2ZXb3JrRGF0YS5zZWVuQ29sbGVjdGlvbnM7XG4gICAgbGV0IGVudHJ5ID0gY29sbHMuZ2V0KGRiKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICAgIGVudHJ5ID0gbmV3IFNldCgpO1xuICAgICAgICBlbnRyeS5hZGQoY29sbGVjdGlvbk5hbWUpO1xuICAgICAgICBjb2xscy5zZXQoZGIsIGVudHJ5KTtcbiAgICAgICAgZGVidWcoXCJGaXN0IHNlZW4uXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCFlbnRyeS5oYXMoY29sbGVjdGlvbk5hbWUpKSB7XG4gICAgICAgIGVudHJ5LmFkZChjb2xsZWN0aW9uTmFtZSk7XG4gICAgICAgIGRlYnVnKFwiRmlyc3Qgc2Vlbi5cIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBkZWJ1ZyhcIk5vdCBmaXJzdCBzZWVuLlwiKTtcbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXRPZldvcms7XG4iXX0=
