"use strict";
"use strict";
var util = require("util");
var Activity = require("../../deps/workflow-4-node").activities.Activity;
var Bluebird = require("bluebird");
var MongoDbContext = require("./mongodbContext");
var fast = require("fast.js");
var _ = require("lodash");
var Connected = require("./connected");
var debug = require("debug")("mongo-crunch:CollectionRef");
function CollectionRef() {
  Connected.call(this);
  this.name = null;
  this.mustExists = true;
  this.deleteOnExit = false;
  this.clearBeforeUse = false;
  this.options = null;
  this.indexes = null;
}
util.inherits(CollectionRef, Connected);
CollectionRef.prototype.run = function(callContext, args) {
  var self = this;
  var name = self.get("name");
  var mustExists = self.get("mustExists");
  var deleteOnExit = self.get("deleteOnExit");
  var clearBeforeUse = self.get("clearBeforeUse");
  var options = self.get("options");
  var indexes = self.get("indexes");
  debug((name + " running, mustExists: " + mustExists + ", deleteOnExit: " + deleteOnExit + ", clearBeforeUse: " + clearBeforeUse));
  debug(("options: " + util.inspect(options)));
  debug(("indexes: " + util.inspect(indexes)));
  if (!_.isString(name) || !name) {
    callContext.fail(new Error("Activity argument \"name\" is null or empty."));
    return ;
  }
  function getIndexes() {
    function toIndex(idx) {
      var idxName = idx.name;
      var fieldOrSpec = idx.fieldOrSpec;
      var idxOptions = idx.options || {w: "majority"};
      if (!_.isString(idxName) || !fieldOrSpec) {
        throw new Error("Invalid index specification: " + JSON.stringify(idx));
      }
      return {
        name: idxName,
        fieldOrSpec: fieldOrSpec,
        options: idxOptions
      };
    }
    var result = [];
    if (_.isArray(indexes)) {
      fast.forEach(indexes, function(idx) {
        result.push(toIndex(idx));
      });
    } else if (_.isPlainObject(indexes)) {
      result.push(toIndex(indexes));
    }
    return result;
  }
  Bluebird.coroutine($traceurRuntime.initGeneratorFunction(function $__0() {
    var db,
        firstSeen,
        dropped,
        opts,
        coll,
        indexDefs,
        i,
        indexDef,
        e;
    return $traceurRuntime.createGeneratorInstance(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            $ctx.pushTry(55, null);
            $ctx.state = 58;
            break;
          case 58:
            db = callContext.activity.getDb(self);
            firstSeen = MongoDbContext.isFirstSeenCollection(self, db, name);
            dropped = false;
            $ctx.state = 50;
            break;
          case 50:
            $ctx.state = (deleteOnExit && firstSeen && !mustExists) ? 16 : 19;
            break;
          case 16:
            debug(("'" + name + "' is a temporary collection that must dropped on exit. Dropping."));
            $ctx.state = 17;
            break;
          case 17:
            $ctx.pushTry(7, null);
            $ctx.state = 10;
            break;
          case 10:
            $ctx.state = 2;
            return Bluebird.promisify(db.dropCollection, db)(name);
          case 2:
            $ctx.maybeThrow();
            $ctx.state = 4;
            break;
          case 4:
            debug(("'" + name + "' dropped"));
            $ctx.state = 6;
            break;
          case 6:
            $ctx.popTry();
            $ctx.state = 12;
            break;
          case 7:
            $ctx.popTry();
            $ctx.maybeUncatchable();
            e = $ctx.storedException;
            $ctx.state = 13;
            break;
          case 13:
            if (!((e.name === "MongoError" && e.message === "ns not found"))) {
              throw e;
            }
            debug(("'" + name + "' doesn't exists when referenced first."));
            $ctx.state = 12;
            break;
          case 12:
            dropped = true;
            $ctx.state = 19;
            break;
          case 19:
            opts = _.isObject(options) ? _.clone(options) : {w: "majority"};
            if (mustExists) {
              debug("Adding strict option.");
              opts.strict = true;
            }
            debug(("Getting '" + name + "' collection's reference from Db."));
            $ctx.state = 52;
            break;
          case 52:
            $ctx.state = 22;
            return Bluebird.promisify(db.collection, db)(name, opts);
          case 22:
            coll = $ctx.sent;
            $ctx.state = 24;
            break;
          case 24:
            $ctx.state = (firstSeen) ? 44 : 47;
            break;
          case 44:
            indexDefs = getIndexes();
            $ctx.state = 45;
            break;
          case 45:
            $ctx.state = (indexDefs.length) ? 34 : 31;
            break;
          case 34:
            debug(("Ensuring " + indexDefs.length + " indexes."));
            $ctx.state = 35;
            break;
          case 35:
            i = 0;
            $ctx.state = 33;
            break;
          case 33:
            $ctx.state = (i < indexDefs.length) ? 29 : 31;
            break;
          case 28:
            i++;
            $ctx.state = 33;
            break;
          case 29:
            indexDef = indexDefs[i];
            debug(("Ensuring index " + util.inspect(indexDef)));
            $ctx.state = 30;
            break;
          case 30:
            $ctx.state = 26;
            return Bluebird.promisify(coll.ensureIndex, coll)(indexDef.name, indexDef.fieldOrSpec, indexDef.options);
          case 26:
            $ctx.maybeThrow();
            $ctx.state = 28;
            break;
          case 31:
            $ctx.state = (clearBeforeUse && !dropped) ? 41 : 40;
            break;
          case 41:
            debug(("Calling 'deleteMany' in collection '" + name + "' because 'clearBeforeUse' option is set."));
            $ctx.state = 42;
            break;
          case 42:
            $ctx.state = 38;
            return Bluebird.promisify(coll.deleteMany, coll)({}, {w: "majority"});
          case 38:
            $ctx.maybeThrow();
            $ctx.state = 40;
            break;
          case 40:
            if (deleteOnExit) {
              MongoDbContext.addCollectionToRecycleBin(self, coll);
            }
            $ctx.state = 47;
            break;
          case 47:
            debug(("CollectionRef '" + name + "' run completed."));
            callContext.complete(coll);
            $ctx.state = 54;
            break;
          case 54:
            $ctx.popTry();
            $ctx.state = -2;
            break;
          case 55:
            $ctx.popTry();
            $ctx.maybeUncatchable();
            e = $ctx.storedException;
            $ctx.state = 61;
            break;
          case 61:
            callContext.fail(e);
            $ctx.state = -2;
            break;
          default:
            return $ctx.end();
        }
    }, $__0, this);
  }))();
};
module.exports = CollectionRef;
//# sourceMappingURL=data:application/json;base64,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Q0FBQzs7OztBQUNDLGVBQUcsT0FBTyxBQUFDLEVBQUMsQ0FBQztBQUNiLGVBQUcsaUJBQWlCLEFBQUMsRUFBQyxDQUFDO0FBQ3ZCLGNBQW9CLENBQUEsSUFBRyxnQkFBZ0IsQ0FBQzs7OztBQTJIMUMsc0JBQVUsS0FBSyxBQUFDLENBQUMsQ0FBQSxDQUFDLENBQUM7Ozs7QUE5SC9CLGlCQUFPLENBQUEsSUFBRyxJQUFJLEFBQUMsRUFBQyxDQUFBOztBQUNtQixJQUMvQixPQUE2QixLQUFHLENBQUMsQ0FBQztFQThIbEMsQ0FoSW1ELENBZ0lsRCxBQUFDLEVBQUMsQ0FBQztBQUNSLENBQUM7QUFFRCxLQUFLLFFBQVEsRUFBSSxjQUFZLENBQUM7QUFDOUIiLCJmaWxlIjoiYWN0aXZpdGllcy9jb2xsZWN0aW9uUmVmLmpzIiwic291cmNlUm9vdCI6IkM6L0dJVC9tb25nby1jcnVuY2gvbGliLyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxubGV0IEFjdGl2aXR5ID0gcmVxdWlyZShcIi4uLy4uL2RlcHMvd29ya2Zsb3ctNC1ub2RlXCIpLmFjdGl2aXRpZXMuQWN0aXZpdHk7XHJcbmxldCBCbHVlYmlyZCA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcclxubGV0IE1vbmdvRGJDb250ZXh0ID0gcmVxdWlyZShcIi4vbW9uZ29kYkNvbnRleHRcIik7XHJcbmxldCBmYXN0ID0gcmVxdWlyZShcImZhc3QuanNcIik7XHJcbmxldCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcclxubGV0IENvbm5lY3RlZCA9IHJlcXVpcmUoXCIuL2Nvbm5lY3RlZFwiKTtcclxubGV0IGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwibW9uZ28tY3J1bmNoOkNvbGxlY3Rpb25SZWZcIik7XHJcblxyXG5mdW5jdGlvbiBDb2xsZWN0aW9uUmVmICgpIHtcclxuICAgIENvbm5lY3RlZC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubmFtZSA9IG51bGw7XHJcbiAgICB0aGlzLm11c3RFeGlzdHMgPSB0cnVlO1xyXG4gICAgdGhpcy5kZWxldGVPbkV4aXQgPSBmYWxzZTtcclxuICAgIHRoaXMuY2xlYXJCZWZvcmVVc2UgPSBmYWxzZTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG51bGw7XHJcbiAgICB0aGlzLmluZGV4ZXMgPSBudWxsO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKENvbGxlY3Rpb25SZWYsIENvbm5lY3RlZCk7XHJcblxyXG5Db2xsZWN0aW9uUmVmLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGFyZ3MpIHtcclxuICAgIGxldCBzZWxmID0gdGhpcztcclxuICAgIGxldCBuYW1lID0gc2VsZi5nZXQoXCJuYW1lXCIpO1xyXG4gICAgbGV0IG11c3RFeGlzdHMgPSBzZWxmLmdldChcIm11c3RFeGlzdHNcIik7XHJcbiAgICBsZXQgZGVsZXRlT25FeGl0ID0gc2VsZi5nZXQoXCJkZWxldGVPbkV4aXRcIik7XHJcbiAgICBsZXQgY2xlYXJCZWZvcmVVc2UgPSBzZWxmLmdldChcImNsZWFyQmVmb3JlVXNlXCIpO1xyXG4gICAgbGV0IG9wdGlvbnMgPSBzZWxmLmdldChcIm9wdGlvbnNcIik7XHJcbiAgICBsZXQgaW5kZXhlcyA9IHNlbGYuZ2V0KFwiaW5kZXhlc1wiKTtcclxuXHJcbiAgICBkZWJ1ZyhgJHtuYW1lfSBydW5uaW5nLCBtdXN0RXhpc3RzOiAke211c3RFeGlzdHN9LCBkZWxldGVPbkV4aXQ6ICR7ZGVsZXRlT25FeGl0fSwgY2xlYXJCZWZvcmVVc2U6ICR7Y2xlYXJCZWZvcmVVc2V9YCk7XHJcbiAgICBkZWJ1Zyhgb3B0aW9uczogJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9YCk7XHJcbiAgICBkZWJ1ZyhgaW5kZXhlczogJHt1dGlsLmluc3BlY3QoaW5kZXhlcyl9YCk7XHJcblxyXG4gICAgaWYgKCFfLmlzU3RyaW5nKG5hbWUpIHx8ICFuYW1lKSB7XHJcbiAgICAgICAgY2FsbENvbnRleHQuZmFpbChuZXcgRXJyb3IoXCJBY3Rpdml0eSBhcmd1bWVudCBcXFwibmFtZVxcXCIgaXMgbnVsbCBvciBlbXB0eS5cIikpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRJbmRleGVzICgpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9JbmRleCAoaWR4KSB7XHJcbiAgICAgICAgICAgIGxldCBpZHhOYW1lID0gaWR4Lm5hbWU7XHJcbiAgICAgICAgICAgIGxldCBmaWVsZE9yU3BlYyA9IGlkeC5maWVsZE9yU3BlYztcclxuICAgICAgICAgICAgbGV0IGlkeE9wdGlvbnMgPSBpZHgub3B0aW9ucyB8fCB7IHc6IFwibWFqb3JpdHlcIiB9O1xyXG4gICAgICAgICAgICBpZiAoIV8uaXNTdHJpbmcoaWR4TmFtZSkgfHwgIWZpZWxkT3JTcGVjKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGluZGV4IHNwZWNpZmljYXRpb246IFwiICsgSlNPTi5zdHJpbmdpZnkoaWR4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGlkeE5hbWUsXHJcbiAgICAgICAgICAgICAgICBmaWVsZE9yU3BlYzogZmllbGRPclNwZWMsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBpZHhPcHRpb25zXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShpbmRleGVzKSkge1xyXG4gICAgICAgICAgICBmYXN0LmZvckVhY2goaW5kZXhlcywgZnVuY3Rpb24gKGlkeCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godG9JbmRleChpZHgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKF8uaXNQbGFpbk9iamVjdChpbmRleGVzKSkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0b0luZGV4KGluZGV4ZXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgQmx1ZWJpcmQuY29yb3V0aW5lKGZ1bmN0aW9uKiAoKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGRiID0gY2FsbENvbnRleHQuYWN0aXZpdHkuZ2V0RGIoc2VsZik7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmlyc3RTZWVuID0gTW9uZ29EYkNvbnRleHQuaXNGaXJzdFNlZW5Db2xsZWN0aW9uKHNlbGYsIGRiLCBuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBkcm9wcGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChkZWxldGVPbkV4aXQgJiYgZmlyc3RTZWVuICYmICFtdXN0RXhpc3RzKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhgJyR7bmFtZX0nIGlzIGEgdGVtcG9yYXJ5IGNvbGxlY3Rpb24gdGhhdCBtdXN0IGRyb3BwZWQgb24gZXhpdC4gRHJvcHBpbmcuYCk7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIEJsdWViaXJkLnByb21pc2lmeShkYi5kcm9wQ29sbGVjdGlvbiwgZGIpKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGAnJHtuYW1lfScgZHJvcHBlZGApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISgoZS5uYW1lID09PSBcIk1vbmdvRXJyb3JcIiAmJiBlLm1lc3NhZ2UgPT09IFwibnMgbm90IGZvdW5kXCIpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgJyR7bmFtZX0nIGRvZXNuJ3QgZXhpc3RzIHdoZW4gcmVmZXJlbmNlZCBmaXJzdC5gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRyb3BwZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgb3B0cyA9IF8uaXNPYmplY3Qob3B0aW9ucykgPyBfLmNsb25lKG9wdGlvbnMpIDogeyB3OiBcIm1ham9yaXR5XCIgfTtcclxuICAgICAgICAgICAgaWYgKG11c3RFeGlzdHMpIHtcclxuICAgICAgICAgICAgICAgIGRlYnVnKFwiQWRkaW5nIHN0cmljdCBvcHRpb24uXCIpO1xyXG4gICAgICAgICAgICAgICAgb3B0cy5zdHJpY3QgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlYnVnKGBHZXR0aW5nICcke25hbWV9JyBjb2xsZWN0aW9uJ3MgcmVmZXJlbmNlIGZyb20gRGIuYCk7XHJcbiAgICAgICAgICAgIGxldCBjb2xsID0geWllbGQgQmx1ZWJpcmQucHJvbWlzaWZ5KGRiLmNvbGxlY3Rpb24sIGRiKShuYW1lLCBvcHRzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFNlZW4pIHtcclxuICAgICAgICAgICAgICAgIGxldCBpbmRleERlZnMgPSBnZXRJbmRleGVzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhEZWZzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBFbnN1cmluZyAke2luZGV4RGVmcy5sZW5ndGh9IGluZGV4ZXMuYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmRleERlZnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGluZGV4RGVmID0gaW5kZXhEZWZzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRW5zdXJpbmcgaW5kZXggJHt1dGlsLmluc3BlY3QoaW5kZXhEZWYpfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoY29sbC5lbnN1cmVJbmRleCwgY29sbCkoaW5kZXhEZWYubmFtZSwgaW5kZXhEZWYuZmllbGRPclNwZWMsIGluZGV4RGVmLm9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2xlYXJCZWZvcmVVc2UgJiYgIWRyb3BwZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgQ2FsbGluZyAnZGVsZXRlTWFueScgaW4gY29sbGVjdGlvbiAnJHtuYW1lfScgYmVjYXVzZSAnY2xlYXJCZWZvcmVVc2UnIG9wdGlvbiBpcyBzZXQuYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgQmx1ZWJpcmQucHJvbWlzaWZ5KGNvbGwuZGVsZXRlTWFueSwgY29sbCkoe30sIHsgdzogXCJtYWpvcml0eVwiIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkZWxldGVPbkV4aXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBNb25nb0RiQ29udGV4dC5hZGRDb2xsZWN0aW9uVG9SZWN5Y2xlQmluKHNlbGYsIGNvbGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvblJlZiAnJHtuYW1lfScgcnVuIGNvbXBsZXRlZC5gKTtcclxuICAgICAgICAgICAgY2FsbENvbnRleHQuY29tcGxldGUoY29sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNhbGxDb250ZXh0LmZhaWwoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvblJlZjtcclxuIl19
