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
UnitOfWork.prototype.finalize = async($traceurRuntime.initGeneratorFunction(function $__16() {
  var taskError,
      collectionRecycleBin,
      openedCursors,
      tasks,
      $__4,
      $__5,
      $__6,
      $__15,
      $__2,
      $__1,
      idx,
      $__11,
      $__12,
      $__13,
      $__9,
      $__8,
      c,
      $__18,
      $__19,
      $__7,
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
          $__4 = true;
          $__5 = false;
          $__6 = undefined;
          $ctx.state = 36;
          break;
        case 36:
          $ctx.pushTry(18, 19);
          $ctx.state = 21;
          break;
        case 21:
          $__15 = $traceurRuntime.initGeneratorFunction(function $__17() {
            var coll;
            return $traceurRuntime.createGeneratorInstance(function($ctx) {
              while (true)
                switch ($ctx.state) {
                  case 0:
                    coll = $__2.value;
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
            }, $__17, this);
          });
          $ctx.state = 17;
          break;
        case 17:
          $__2 = void 0, $__1 = (collectionRecycleBin.values())[Symbol.iterator]();
          $ctx.state = 15;
          break;
        case 15:
          $ctx.state = (!($__4 = ($__2 = $__1.next()).done)) ? 11 : 13;
          break;
        case 10:
          $__4 = true;
          $ctx.state = 15;
          break;
        case 11:
          $__18 = $ctx.wrapYieldStar($__15()[Symbol.iterator]());
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
          $__7 = $ctx.storedException;
          $ctx.state = 24;
          break;
        case 24:
          $__5 = true;
          $__6 = $__7;
          $ctx.state = 19;
          $ctx.finallyFallThrough = 23;
          break;
        case 19:
          $ctx.popTry();
          $ctx.state = 30;
          break;
        case 30:
          try {
            if (!$__4 && $__1.return != null) {
              $__1.return();
            }
          } finally {
            if ($__5) {
              throw $__6;
            }
          }
          $ctx.state = 28;
          break;
        case 23:
          debug(("Cursors to close: " + openedCursors.size + "."));
          idx = 0;
          $__11 = true;
          $__12 = false;
          $__13 = undefined;
          try {
            for ($__9 = void 0, $__8 = (openedCursors.values())[Symbol.iterator](); !($__11 = ($__9 = $__8.next()).done); $__11 = true) {
              c = $__9.value;
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
  }, $__16, this);
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
//# sourceMappingURL=data:application/json;base64,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QUFJLGVBQWUsY0FBYyxLQUFLLEVBQUMsdUJBQXFCLEVBQUMsQ0FBQztBQUNyRixDQUFDO0FBRUQsU0FBUyxzQkFBc0IsRUFBSSxVQUFVLEtBQUksQ0FBRyxDQUFBLEVBQUMsQ0FBRyxDQUFBLGNBQWEsQ0FBRztBQUNwRSxNQUFJLEFBQUMsRUFBQyxrQkFBa0IsRUFBQyxlQUFhLEVBQUMsb0JBQW1CLEVBQUMsQ0FBQSxFQUFDLGFBQWEsRUFBQyxrREFBZ0QsRUFBQyxDQUFDO0FBQzVILEFBQUksSUFBQSxDQUFBLEtBQUksRUFBSSxDQUFBLEtBQUksZUFBZSxnQkFBZ0IsQ0FBQztBQUNoRCxBQUFJLElBQUEsQ0FBQSxLQUFJLEVBQUksQ0FBQSxLQUFJLElBQUksQUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ3pCLEtBQUksQ0FBQyxLQUFJLENBQUc7QUFDUixRQUFJLEVBQUksSUFBSSxJQUFFLEFBQUMsRUFBQyxDQUFDO0FBQ2pCLFFBQUksSUFBSSxBQUFDLENBQUMsY0FBYSxDQUFDLENBQUM7QUFDekIsUUFBSSxJQUFJLEFBQUMsQ0FBQyxFQUFDLENBQUcsTUFBSSxDQUFDLENBQUM7QUFDcEIsUUFBSSxBQUFDLENBQUMsWUFBVyxDQUFDLENBQUM7QUFDbkIsU0FBTyxLQUFHLENBQUM7RUFDZjtBQUFBLEFBQ0EsS0FBSSxDQUFDLEtBQUksSUFBSSxBQUFDLENBQUMsY0FBYSxDQUFDLENBQUc7QUFDNUIsUUFBSSxJQUFJLEFBQUMsQ0FBQyxjQUFhLENBQUMsQ0FBQztBQUN6QixRQUFJLEFBQUMsQ0FBQyxhQUFZLENBQUMsQ0FBQztBQUNwQixTQUFPLEtBQUcsQ0FBQztFQUNmO0FBQUEsQUFDQSxNQUFJLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hCLE9BQU8sTUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxLQUFLLFFBQVEsRUFBSSxXQUFTLENBQUM7QUFDM0IiLCJmaWxlIjoiYWN0aXZpdGllcy91bml0T2ZXb3JrLmpzIiwic291cmNlUm9vdCI6ImxpYi9lczYiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmxldCB3ZjRub2RlID0gcmVxdWlyZShcIndvcmtmbG93LTQtbm9kZVwiKTtcclxubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5sZXQgV2l0aEJvZHkgPSB3ZjRub2RlLmFjdGl2aXRpZXMuV2l0aEJvZHk7XHJcbmxldCB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XHJcbmxldCBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm1vbmdvLWNydW5jaDpVbml0T2ZXb3JrXCIpO1xyXG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XHJcbmxldCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcclxubGV0IGFzeW5jID0gQmx1ZWJpcmQuY29yb3V0aW5lO1xyXG5sZXQgZXJyb3JzID0gd2Y0bm9kZS5jb21tb24uZXJyb3JzO1xyXG5cclxuZnVuY3Rpb24gVW5pdE9mV29yaygpIHtcclxuICAgIFdpdGhCb2R5LmNhbGwodGhpcyk7XHJcbiAgICB0aGlzLm5vblNjb3BlZFByb3BlcnRpZXMuYWRkKFwiZmluYWxpemVcIik7XHJcbn1cclxuXHJcbnV0aWwuaW5oZXJpdHMoVW5pdE9mV29yaywgV2l0aEJvZHkpO1xyXG5cclxuVW5pdE9mV29yay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCBhcmdzKSB7XHJcbiAgICB0aGlzLlVuaXRPZldvcmtEYXRhID0ge1xyXG4gICAgICAgIGNvbGxlY3Rpb25SZWN5Y2xlQmluOiBuZXcgTWFwKCksXHJcbiAgICAgICAgb3BlbmVkQ3Vyc29yczogbmV3IFNldCgpLFxyXG4gICAgICAgIHNlZW5Db2xsZWN0aW9uczogbmV3IE1hcCgpXHJcbiAgICB9O1xyXG4gICAgZGVidWcoXCJTdGFydGluZy5cIik7XHJcbiAgICBXaXRoQm9keS5wcm90b3R5cGUucnVuLmNhbGwodGhpcywgY2FsbENvbnRleHQsIGFyZ3MpO1xyXG59O1xyXG5cclxuVW5pdE9mV29yay5wcm90b3R5cGUuYm9keUNvbXBsZXRlZCA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCwgcmVhc29uLCByZXN1bHQpIHtcclxuICAgIGxldCBzZWxmID0gdGhpcztcclxuXHJcbiAgICBkZWJ1ZyhgVW5pdE9mV29yaydzIGJvZHkgY29tcGxldGVkLCByZWFzb246ICR7cmVhc29ufS5gKTtcclxuXHJcbiAgICBjYWxsQ29udGV4dC5hY3Rpdml0eS5maW5hbGl6ZS5jYWxsKHRoaXMpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjYWxsQ29udGV4dC5lbmQocmVhc29uLCByZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgaWYgKHJlYXNvbiA9PT0gQWN0aXZpdHkuc3RhdGVzLmZhaWwpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxDb250ZXh0LmZhaWwobmV3IGVycm9ycy5BZ2dyZWdhdGVFcnJvcihbcmVzdWx0LGVdKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsQ29udGV4dC5mYWlsKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn07XHJcblxyXG5Vbml0T2ZXb3JrLnByb3RvdHlwZS5maW5hbGl6ZSA9IGFzeW5jKGZ1bmN0aW9uKigpIHtcclxuICAgIGxldCB0YXNrRXJyb3IgPSBudWxsO1xyXG5cclxuICAgIGRlYnVnKFwiRG9pbmcgZmluYWwgdGFza3MuXCIpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBsZXQgY29sbGVjdGlvblJlY3ljbGVCaW4gPSB0aGlzLlVuaXRPZldvcmtEYXRhLmNvbGxlY3Rpb25SZWN5Y2xlQmluO1xyXG4gICAgICAgIGxldCBvcGVuZWRDdXJzb3JzID0gdGhpcy5Vbml0T2ZXb3JrRGF0YS5vcGVuZWRDdXJzb3JzO1xyXG4gICAgICAgIGxldCB0YXNrcyA9IFtdO1xyXG5cclxuICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvbnMgaW4gcmVjeWNsZSBiaW46ICR7Y29sbGVjdGlvblJlY3ljbGVCaW4uc2l6ZX0uYCk7XHJcbiAgICAgICAgZm9yIChsZXQgY29sbCBvZiBjb2xsZWN0aW9uUmVjeWNsZUJpbi52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBkZWJ1ZyhgRHJvcHBpbmcgY29sbGVjdGlvbjogJHtjb2xsLmNvbGxlY3Rpb25OYW1lfWApO1xyXG4gICAgICAgICAgICB0YXNrcy5wdXNoKGNvbGwuZHJvcCgpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYENvbGxlY3Rpb24gJyR7Y29sbC5jb2xsZWN0aW9uTmFtZX0nIGRyb3BwZWQuYCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUubmFtZSA9PT0gXCJNb25nb0Vycm9yXCIgJiYgZS5tZXNzYWdlID09PSBcIm5zIG5vdCBmb3VuZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDb2xsZWN0aW9uICcke2NvbGwuY29sbGVjdGlvbk5hbWV9JyBkb2Vzbid0IGV4aXN0cy5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRVJST1I6IENvbGxlY3Rpb24gJyR7Y29sbC5jb2xsZWN0aW9uTmFtZX0nIGRyb3BwaW5nIGZhaWxlZCB3aXRoXFxuJHtlLnN0YWNrfWApO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGVidWcoYEN1cnNvcnMgdG8gY2xvc2U6ICR7b3BlbmVkQ3Vyc29ycy5zaXplfS5gKTtcclxuICAgICAgICB2YXIgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKGxldCBjIG9mIG9wZW5lZEN1cnNvcnMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgdGFza3MucHVzaChjLmNsb3NlKClcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ3Vyc29yICR7aWR4fS4gZHJvcHBlZC5gKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRVJST1I6IEN1cnNvciAke2lkeH0uIGNsb3NpbmcgZmFpbGVkIHdpdGhcXG4ke2Uuc3RhY2t9YCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkeCsrO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeWllbGQgQmx1ZWJpcmQuYWxsKHRhc2tzKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgZGVidWcoXCJFUlJPUjogZmluYWwgdGFza3MgZmFpbGVkOiBcIiArIGUuc3RhY2spO1xyXG4gICAgICAgIHRocm93IGU7XHJcbiAgICB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICBkZWxldGUgdGhpcy5Vbml0T2ZXb3JrRGF0YTtcclxuICAgICAgICBkZWJ1ZyhcIkZpbmFsIHRhc2tzIGNvbXBsZXRlZC5cIik7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuVW5pdE9mV29yay5hZGRDb2xsZWN0aW9uVG9SZWN5Y2xlQmluID0gZnVuY3Rpb24gKHNjb3BlLCBjb2xsZWN0aW9uKSB7XHJcbiAgICBsZXQgYmluID0gc2NvcGUuVW5pdE9mV29ya0RhdGEuY29sbGVjdGlvblJlY3ljbGVCaW47XHJcbiAgICBkZWJ1ZyhgQWRkaW5nIGNvbGxlY3Rpb24gJyR7Y29sbGVjdGlvbi5jb2xsZWN0aW9uTmFtZX0nIHRvIHJlY3ljbGUgYmluLmApO1xyXG4gICAgYmluLnNldChjb2xsZWN0aW9uLmNvbGxlY3Rpb25OYW1lLCBjb2xsZWN0aW9uKTtcclxuICAgIGRlYnVnKGBSZWN5Y2xlIGJpbiBzaXplIGlzICR7YmluLnNpemV9LmApO1xyXG59O1xyXG5cclxuVW5pdE9mV29yay5yZWdpc3Rlck9wZW5lZEN1cnNvciA9IGZ1bmN0aW9uIChzY29wZSwgY3Vyc29yKSB7XHJcbiAgICBsZXQgY3Vyc29ycyA9IHNjb3BlLlVuaXRPZldvcmtEYXRhLm9wZW5lZEN1cnNvcnM7XHJcbiAgICBkZWJ1ZyhgUmVnaXN0ZXJpbmcgYSBjdXJzb3IgYXMgb3BlbmVkLmApO1xyXG4gICAgY3Vyc29ycy5hZGQoY3Vyc29yKTtcclxuICAgIGRlYnVnKGBUaGVyZSBhcmUgJHtjdXJzb3JzLnNpemV9IGN1cnNvcnMgcmVnaXN0ZXJlZC5gKTtcclxufTtcclxuXHJcblVuaXRPZldvcmsudW5yZWdpc3Rlck9wZW5lZEN1cnNvciA9IGZ1bmN0aW9uIChzY29wZSwgY3Vyc29yKSB7XHJcbiAgICBkZWJ1ZyhgVW5yZWdpc3RlcmluZyBvcGVuZWQgY3Vyc29yLmApO1xyXG4gICAgc2NvcGUuVW5pdE9mV29ya0RhdGEub3BlbmVkQ3Vyc29ycy5kZWxldGUoY3Vyc29yKTtcclxuICAgIGRlYnVnKGBUaGVyZSBhcmUgJHtzY29wZS5Vbml0T2ZXb3JrRGF0YS5vcGVuZWRDdXJzb3JzLnNpemV9IGN1cnNvcnMgcmVnaXN0ZXJlZC5gKTtcclxufTtcclxuXHJcblVuaXRPZldvcmsuaXNGaXJzdFNlZW5Db2xsZWN0aW9uID0gZnVuY3Rpb24gKHNjb3BlLCBkYiwgY29sbGVjdGlvbk5hbWUpIHtcclxuICAgIGRlYnVnKGBEZXRlcm1pbmluZyBpZiAnJHtjb2xsZWN0aW9uTmFtZX0nIGNvbGxlY3Rpb24gaW4gJyR7ZGIuZGF0YWJhc2VOYW1lfScgZGIgaXMgZmlyc3Qgc2VlbiBieSB0aGUgY3VycmVudCB1bml0IG9mIHdvcmsuYCk7XHJcbiAgICBsZXQgY29sbHMgPSBzY29wZS5Vbml0T2ZXb3JrRGF0YS5zZWVuQ29sbGVjdGlvbnM7XHJcbiAgICBsZXQgZW50cnkgPSBjb2xscy5nZXQoZGIpO1xyXG4gICAgaWYgKCFlbnRyeSkge1xyXG4gICAgICAgIGVudHJ5ID0gbmV3IFNldCgpO1xyXG4gICAgICAgIGVudHJ5LmFkZChjb2xsZWN0aW9uTmFtZSk7XHJcbiAgICAgICAgY29sbHMuc2V0KGRiLCBlbnRyeSk7XHJcbiAgICAgICAgZGVidWcoXCJGaXN0IHNlZW4uXCIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKCFlbnRyeS5oYXMoY29sbGVjdGlvbk5hbWUpKSB7XHJcbiAgICAgICAgZW50cnkuYWRkKGNvbGxlY3Rpb25OYW1lKTtcclxuICAgICAgICBkZWJ1ZyhcIkZpcnN0IHNlZW4uXCIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZGVidWcoXCJOb3QgZmlyc3Qgc2Vlbi5cIik7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXRPZldvcms7XHJcbiJdfQ==
