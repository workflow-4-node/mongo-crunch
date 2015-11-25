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
                tasks.push(Bluebird.resolve(c.close()).then(function() {
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
//# sourceMappingURL=data:application/json;base64,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RUFBSSxXQUFTLENBQUM7QUFDM0IiLCJmaWxlIjoiYWN0aXZpdGllcy91bml0T2ZXb3JrLmpzIiwic291cmNlUm9vdCI6ImxpYi9lczYiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxubGV0IHdmNG5vZGUgPSByZXF1aXJlKFwid29ya2Zsb3ctNC1ub2RlXCIpO1xubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xubGV0IFdpdGhCb2R5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLldpdGhCb2R5O1xubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcbmxldCBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm1vbmdvLWNydW5jaDpVbml0T2ZXb3JrXCIpO1xubGV0IEJsdWViaXJkID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xubGV0IGFzeW5jID0gQmx1ZWJpcmQuY29yb3V0aW5lO1xubGV0IGVycm9ycyA9IHdmNG5vZGUuY29tbW9uLmVycm9ycztcblxuZnVuY3Rpb24gVW5pdE9mV29yaygpIHtcbiAgICBXaXRoQm9keS5jYWxsKHRoaXMpO1xuICAgIHRoaXMubm9uU2NvcGVkUHJvcGVydGllcy5hZGQoXCJmaW5hbGl6ZVwiKTtcbn1cblxudXRpbC5pbmhlcml0cyhVbml0T2ZXb3JrLCBXaXRoQm9keSk7XG5cblVuaXRPZldvcmsucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCwgYXJncykge1xuICAgIHRoaXMuVW5pdE9mV29ya0RhdGEgPSB7XG4gICAgICAgIGNvbGxlY3Rpb25SZWN5Y2xlQmluOiBuZXcgTWFwKCksXG4gICAgICAgIG9wZW5lZEN1cnNvcnM6IG5ldyBTZXQoKSxcbiAgICAgICAgc2VlbkNvbGxlY3Rpb25zOiBuZXcgTWFwKClcbiAgICB9O1xuICAgIGRlYnVnKFwiU3RhcnRpbmcuXCIpO1xuICAgIFdpdGhCb2R5LnByb3RvdHlwZS5ydW4uY2FsbCh0aGlzLCBjYWxsQ29udGV4dCwgYXJncyk7XG59O1xuXG5Vbml0T2ZXb3JrLnByb3RvdHlwZS5ib2R5Q29tcGxldGVkID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCByZWFzb24sIHJlc3VsdCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGRlYnVnKGBVbml0T2ZXb3JrJ3MgYm9keSBjb21wbGV0ZWQsIHJlYXNvbjogJHtyZWFzb259LmApO1xuXG4gICAgY2FsbENvbnRleHQuYWN0aXZpdHkuZmluYWxpemUuY2FsbCh0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsQ29udGV4dC5lbmQocmVhc29uLCByZXN1bHQpO1xuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKHJlYXNvbiA9PT0gQWN0aXZpdHkuc3RhdGVzLmZhaWwpIHtcbiAgICAgICAgICAgICAgICBjYWxsQ29udGV4dC5mYWlsKG5ldyBlcnJvcnMuQWdncmVnYXRlRXJyb3IoW3Jlc3VsdCxlXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG59O1xuXG5Vbml0T2ZXb3JrLnByb3RvdHlwZS5maW5hbGl6ZSA9IGFzeW5jKGZ1bmN0aW9uKigpIHtcbiAgICBsZXQgdGFza0Vycm9yID0gbnVsbDtcblxuICAgIGRlYnVnKFwiRG9pbmcgZmluYWwgdGFza3MuXCIpO1xuICAgIHRyeSB7XG4gICAgICAgIGxldCBjb2xsZWN0aW9uUmVjeWNsZUJpbiA9IHRoaXMuVW5pdE9mV29ya0RhdGEuY29sbGVjdGlvblJlY3ljbGVCaW47XG4gICAgICAgIGxldCBvcGVuZWRDdXJzb3JzID0gdGhpcy5Vbml0T2ZXb3JrRGF0YS5vcGVuZWRDdXJzb3JzO1xuICAgICAgICBsZXQgdGFza3MgPSBbXTtcblxuICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvbnMgaW4gcmVjeWNsZSBiaW46ICR7Y29sbGVjdGlvblJlY3ljbGVCaW4uc2l6ZX0uYCk7XG4gICAgICAgIGZvciAobGV0IGNvbGwgb2YgY29sbGVjdGlvblJlY3ljbGVCaW4udmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGRlYnVnKGBEcm9wcGluZyBjb2xsZWN0aW9uOiAke2NvbGwuY29sbGVjdGlvbk5hbWV9YCk7XG4gICAgICAgICAgICB0YXNrcy5wdXNoKGNvbGwuZHJvcCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvbiAnJHtjb2xsLmNvbGxlY3Rpb25OYW1lfScgZHJvcHBlZC5gKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5uYW1lID09PSBcIk1vbmdvRXJyb3JcIiAmJiBlLm1lc3NhZ2UgPT09IFwibnMgbm90IGZvdW5kXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDb2xsZWN0aW9uICcke2NvbGwuY29sbGVjdGlvbk5hbWV9JyBkb2Vzbid0IGV4aXN0cy5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRVJST1I6IENvbGxlY3Rpb24gJyR7Y29sbC5jb2xsZWN0aW9uTmFtZX0nIGRyb3BwaW5nIGZhaWxlZCB3aXRoXFxuJHtlLnN0YWNrfWApO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKGBDdXJzb3JzIHRvIGNsb3NlOiAke29wZW5lZEN1cnNvcnMuc2l6ZX0uYCk7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICBmb3IgKGxldCBjIG9mIG9wZW5lZEN1cnNvcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHRhc2tzLnB1c2goQmx1ZWJpcmQucmVzb2x2ZShjLmNsb3NlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ3Vyc29yICR7aWR4fS4gZHJvcHBlZC5gKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRVJST1I6IEN1cnNvciAke2lkeH0uIGNsb3NpbmcgZmFpbGVkIHdpdGhcXG4ke2Uuc3RhY2t9YCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlkeCsrO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHlpZWxkIEJsdWViaXJkLmFsbCh0YXNrcyk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGRlYnVnKFwiRVJST1I6IGZpbmFsIHRhc2tzIGZhaWxlZDogXCIgKyBlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLlVuaXRPZldvcmtEYXRhO1xuICAgICAgICBkZWJ1ZyhcIkZpbmFsIHRhc2tzIGNvbXBsZXRlZC5cIik7XG4gICAgfVxufSk7XG5cblVuaXRPZldvcmsuYWRkQ29sbGVjdGlvblRvUmVjeWNsZUJpbiA9IGZ1bmN0aW9uIChzY29wZSwgY29sbGVjdGlvbikge1xuICAgIGxldCBiaW4gPSBzY29wZS5Vbml0T2ZXb3JrRGF0YS5jb2xsZWN0aW9uUmVjeWNsZUJpbjtcbiAgICBkZWJ1ZyhgQWRkaW5nIGNvbGxlY3Rpb24gJyR7Y29sbGVjdGlvbi5jb2xsZWN0aW9uTmFtZX0nIHRvIHJlY3ljbGUgYmluLmApO1xuICAgIGJpbi5zZXQoY29sbGVjdGlvbi5jb2xsZWN0aW9uTmFtZSwgY29sbGVjdGlvbik7XG4gICAgZGVidWcoYFJlY3ljbGUgYmluIHNpemUgaXMgJHtiaW4uc2l6ZX0uYCk7XG59O1xuXG5Vbml0T2ZXb3JrLnJlZ2lzdGVyT3BlbmVkQ3Vyc29yID0gZnVuY3Rpb24gKHNjb3BlLCBjdXJzb3IpIHtcbiAgICBsZXQgY3Vyc29ycyA9IHNjb3BlLlVuaXRPZldvcmtEYXRhLm9wZW5lZEN1cnNvcnM7XG4gICAgZGVidWcoYFJlZ2lzdGVyaW5nIGEgY3Vyc29yIGFzIG9wZW5lZC5gKTtcbiAgICBjdXJzb3JzLmFkZChjdXJzb3IpO1xuICAgIGRlYnVnKGBUaGVyZSBhcmUgJHtjdXJzb3JzLnNpemV9IGN1cnNvcnMgcmVnaXN0ZXJlZC5gKTtcbn07XG5cblVuaXRPZldvcmsudW5yZWdpc3Rlck9wZW5lZEN1cnNvciA9IGZ1bmN0aW9uIChzY29wZSwgY3Vyc29yKSB7XG4gICAgZGVidWcoYFVucmVnaXN0ZXJpbmcgb3BlbmVkIGN1cnNvci5gKTtcbiAgICBzY29wZS5Vbml0T2ZXb3JrRGF0YS5vcGVuZWRDdXJzb3JzLmRlbGV0ZShjdXJzb3IpO1xuICAgIGRlYnVnKGBUaGVyZSBhcmUgJHtzY29wZS5Vbml0T2ZXb3JrRGF0YS5vcGVuZWRDdXJzb3JzLnNpemV9IGN1cnNvcnMgcmVnaXN0ZXJlZC5gKTtcbn07XG5cblVuaXRPZldvcmsuaXNGaXJzdFNlZW5Db2xsZWN0aW9uID0gZnVuY3Rpb24gKHNjb3BlLCBkYiwgY29sbGVjdGlvbk5hbWUpIHtcbiAgICBkZWJ1ZyhgRGV0ZXJtaW5pbmcgaWYgJyR7Y29sbGVjdGlvbk5hbWV9JyBjb2xsZWN0aW9uIGluICcke2RiLmRhdGFiYXNlTmFtZX0nIGRiIGlzIGZpcnN0IHNlZW4gYnkgdGhlIGN1cnJlbnQgdW5pdCBvZiB3b3JrLmApO1xuICAgIGxldCBjb2xscyA9IHNjb3BlLlVuaXRPZldvcmtEYXRhLnNlZW5Db2xsZWN0aW9ucztcbiAgICBsZXQgZW50cnkgPSBjb2xscy5nZXQoZGIpO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgZW50cnkgPSBuZXcgU2V0KCk7XG4gICAgICAgIGVudHJ5LmFkZChjb2xsZWN0aW9uTmFtZSk7XG4gICAgICAgIGNvbGxzLnNldChkYiwgZW50cnkpO1xuICAgICAgICBkZWJ1ZyhcIkZpc3Qgc2Vlbi5cIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIWVudHJ5Lmhhcyhjb2xsZWN0aW9uTmFtZSkpIHtcbiAgICAgICAgZW50cnkuYWRkKGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgICAgZGVidWcoXCJGaXJzdCBzZWVuLlwiKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGRlYnVnKFwiTm90IGZpcnN0IHNlZW4uXCIpO1xuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVW5pdE9mV29yaztcbiJdfQ==
