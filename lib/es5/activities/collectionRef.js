"use strict";
"use strict";
var wf4node = require("../../../deps/workflow-4-node");
var util = require("util");
var Activity = wf4node.activities.Activity;
var Bluebird = require("bluebird");
var MongoDbContext = require("./mongodbContext");
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
      var $__3 = true;
      var $__4 = false;
      var $__5 = undefined;
      try {
        for (var $__1 = void 0,
            $__0 = (indexes)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
          var idx = $__1.value;
          {
            result.push(toIndex(idx));
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
    } else if (_.isPlainObject(indexes)) {
      result.push(toIndex(indexes));
    }
    return result;
  }
  Bluebird.coroutine($traceurRuntime.initGeneratorFunction(function $__7() {
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
    }, $__7, this);
  }))();
};
module.exports = CollectionRef;
//# sourceMappingURL=data:application/json;base64,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QUFNLEVBQUksQ0FBQSxDQWdITyxjQUFhLEdBQUssRUFBQyxPQUFNLENBaEhkLFVBQXdDLENBQUM7QUFDaEUsaUJBQUk7O0FBZ0hRLGdCQUFJLEFBQUMsRUFBQyxzQ0FBc0MsRUFBQyxLQUFHLEVBQUMsNENBQTBDLEVBQUMsQ0FBQzs7Ozs7QUFqSGpILGlCQWtIMEIsQ0FBQSxRQUFPLFVBQVUsQUFBQyxDQUFDLElBQUcsV0FBVyxDQUFHLEtBQUcsQ0FBQyxBQUFDLENBQUMsRUFBQyxDQUFHLEVBQUUsQ0FBQSxDQUFHLFdBQVMsQ0FBRSxDQUFDLENBbEhsRTs7QUFBdkIsZUFBRyxXQUFXLEFBQUMsRUFBQyxDQUFBOzs7O0FBcUhBLGVBQUksWUFBVyxDQUFHO0FBQ2QsMkJBQWEsMEJBQTBCLEFBQUMsQ0FBQyxJQUFHLENBQUcsS0FBRyxDQUFDLENBQUM7WUFDeEQ7QUFBQTs7O0FBR0osZ0JBQUksQUFBQyxFQUFDLGlCQUFpQixFQUFDLEtBQUcsRUFBQyxtQkFBaUIsRUFBQyxDQUFDO0FBQy9DLHNCQUFVLFNBQVMsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDOzs7O0FBM0h0QyxlQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7Ozs7QUFDQyxlQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7QUFDYixlQUFHLGlCQUFpQixBQUFDLEVBQUMsQ0FBQztBQUN2QixjQUFvQixDQUFBLElBQUcsZ0JBQWdCLENBQUM7Ozs7QUEySDFDLHNCQUFVLEtBQUssQUFBQyxDQUFDLENBQUEsQ0FBQyxDQUFDOzs7O0FBOUgvQixpQkFBTyxDQUFBLElBQUcsSUFBSSxBQUFDLEVBQUMsQ0FBQTs7QUFDbUIsSUFDL0IsT0FBNkIsS0FBRyxDQUFDLENBQUM7RUE4SGxDLENBaEltRCxDQWdJbEQsQUFBQyxFQUFDLENBQUM7QUFDUixDQUFDO0FBRUQsS0FBSyxRQUFRLEVBQUksY0FBWSxDQUFDO0FBQzlCIiwiZmlsZSI6ImFjdGl2aXRpZXMvY29sbGVjdGlvblJlZi5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5sZXQgd2Y0bm9kZSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9kZXBzL3dvcmtmbG93LTQtbm9kZVwiKTtcclxubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XHJcbmxldCBNb25nb0RiQ29udGV4dCA9IHJlcXVpcmUoXCIuL21vbmdvZGJDb250ZXh0XCIpO1xyXG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XHJcbmxldCBDb25uZWN0ZWQgPSByZXF1aXJlKFwiLi9jb25uZWN0ZWRcIik7XHJcbmxldCBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm1vbmdvLWNydW5jaDpDb2xsZWN0aW9uUmVmXCIpO1xyXG5cclxuZnVuY3Rpb24gQ29sbGVjdGlvblJlZiAoKSB7XHJcbiAgICBDb25uZWN0ZWQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBudWxsO1xyXG4gICAgdGhpcy5tdXN0RXhpc3RzID0gdHJ1ZTtcclxuICAgIHRoaXMuZGVsZXRlT25FeGl0ID0gZmFsc2U7XHJcbiAgICB0aGlzLmNsZWFyQmVmb3JlVXNlID0gZmFsc2U7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBudWxsO1xyXG4gICAgdGhpcy5pbmRleGVzID0gbnVsbDtcclxufVxyXG5cclxudXRpbC5pbmhlcml0cyhDb2xsZWN0aW9uUmVmLCBDb25uZWN0ZWQpO1xyXG5cclxuQ29sbGVjdGlvblJlZi5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCBhcmdzKSB7XHJcbiAgICBsZXQgc2VsZiA9IHRoaXM7XHJcbiAgICBsZXQgbmFtZSA9IHNlbGYuZ2V0KFwibmFtZVwiKTtcclxuICAgIGxldCBtdXN0RXhpc3RzID0gc2VsZi5nZXQoXCJtdXN0RXhpc3RzXCIpO1xyXG4gICAgbGV0IGRlbGV0ZU9uRXhpdCA9IHNlbGYuZ2V0KFwiZGVsZXRlT25FeGl0XCIpO1xyXG4gICAgbGV0IGNsZWFyQmVmb3JlVXNlID0gc2VsZi5nZXQoXCJjbGVhckJlZm9yZVVzZVwiKTtcclxuICAgIGxldCBvcHRpb25zID0gc2VsZi5nZXQoXCJvcHRpb25zXCIpO1xyXG4gICAgbGV0IGluZGV4ZXMgPSBzZWxmLmdldChcImluZGV4ZXNcIik7XHJcblxyXG4gICAgZGVidWcoYCR7bmFtZX0gcnVubmluZywgbXVzdEV4aXN0czogJHttdXN0RXhpc3RzfSwgZGVsZXRlT25FeGl0OiAke2RlbGV0ZU9uRXhpdH0sIGNsZWFyQmVmb3JlVXNlOiAke2NsZWFyQmVmb3JlVXNlfWApO1xyXG4gICAgZGVidWcoYG9wdGlvbnM6ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfWApO1xyXG4gICAgZGVidWcoYGluZGV4ZXM6ICR7dXRpbC5pbnNwZWN0KGluZGV4ZXMpfWApO1xyXG5cclxuICAgIGlmICghXy5pc1N0cmluZyhuYW1lKSB8fCAhbmFtZSkge1xyXG4gICAgICAgIGNhbGxDb250ZXh0LmZhaWwobmV3IEVycm9yKFwiQWN0aXZpdHkgYXJndW1lbnQgXFxcIm5hbWVcXFwiIGlzIG51bGwgb3IgZW1wdHkuXCIpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0SW5kZXhlcyAoKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRvSW5kZXggKGlkeCkge1xyXG4gICAgICAgICAgICBsZXQgaWR4TmFtZSA9IGlkeC5uYW1lO1xyXG4gICAgICAgICAgICBsZXQgZmllbGRPclNwZWMgPSBpZHguZmllbGRPclNwZWM7XHJcbiAgICAgICAgICAgIGxldCBpZHhPcHRpb25zID0gaWR4Lm9wdGlvbnMgfHwgeyB3OiBcIm1ham9yaXR5XCIgfTtcclxuICAgICAgICAgICAgaWYgKCFfLmlzU3RyaW5nKGlkeE5hbWUpIHx8ICFmaWVsZE9yU3BlYykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbmRleCBzcGVjaWZpY2F0aW9uOiBcIiArIEpTT04uc3RyaW5naWZ5KGlkeCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBpZHhOYW1lLFxyXG4gICAgICAgICAgICAgICAgZmllbGRPclNwZWM6IGZpZWxkT3JTcGVjLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogaWR4T3B0aW9uc1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGlmIChfLmlzQXJyYXkoaW5kZXhlcykpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaWR4IG9mIGluZGV4ZXMpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRvSW5kZXgoaWR4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KGluZGV4ZXMpKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRvSW5kZXgoaW5kZXhlcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBCbHVlYmlyZC5jb3JvdXRpbmUoZnVuY3Rpb24qICgpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgZGIgPSBjYWxsQ29udGV4dC5hY3Rpdml0eS5nZXREYihzZWxmKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBmaXJzdFNlZW4gPSBNb25nb0RiQ29udGV4dC5pc0ZpcnN0U2VlbkNvbGxlY3Rpb24oc2VsZiwgZGIsIG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGRyb3BwZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGRlbGV0ZU9uRXhpdCAmJiBmaXJzdFNlZW4gJiYgIW11c3RFeGlzdHMpIHtcclxuICAgICAgICAgICAgICAgIGRlYnVnKGAnJHtuYW1lfScgaXMgYSB0ZW1wb3JhcnkgY29sbGVjdGlvbiB0aGF0IG11c3QgZHJvcHBlZCBvbiBleGl0LiBEcm9wcGluZy5gKTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgQmx1ZWJpcmQucHJvbWlzaWZ5KGRiLmRyb3BDb2xsZWN0aW9uLCBkYikobmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYCcke25hbWV9JyBkcm9wcGVkYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKChlLm5hbWUgPT09IFwiTW9uZ29FcnJvclwiICYmIGUubWVzc2FnZSA9PT0gXCJucyBub3QgZm91bmRcIikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGAnJHtuYW1lfScgZG9lc24ndCBleGlzdHMgd2hlbiByZWZlcmVuY2VkIGZpcnN0LmApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZHJvcHBlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBvcHRzID0gXy5pc09iamVjdChvcHRpb25zKSA/IF8uY2xvbmUob3B0aW9ucykgOiB7IHc6IFwibWFqb3JpdHlcIiB9O1xyXG4gICAgICAgICAgICBpZiAobXVzdEV4aXN0cykge1xyXG4gICAgICAgICAgICAgICAgZGVidWcoXCJBZGRpbmcgc3RyaWN0IG9wdGlvbi5cIik7XHJcbiAgICAgICAgICAgICAgICBvcHRzLnN0cmljdCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVidWcoYEdldHRpbmcgJyR7bmFtZX0nIGNvbGxlY3Rpb24ncyByZWZlcmVuY2UgZnJvbSBEYi5gKTtcclxuICAgICAgICAgICAgbGV0IGNvbGwgPSB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoZGIuY29sbGVjdGlvbiwgZGIpKG5hbWUsIG9wdHMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZpcnN0U2Vlbikge1xyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4RGVmcyA9IGdldEluZGV4ZXMoKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleERlZnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYEVuc3VyaW5nICR7aW5kZXhEZWZzLmxlbmd0aH0gaW5kZXhlcy5gKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGV4RGVmcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXhEZWYgPSBpbmRleERlZnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBFbnN1cmluZyBpbmRleCAke3V0aWwuaW5zcGVjdChpbmRleERlZil9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIEJsdWViaXJkLnByb21pc2lmeShjb2xsLmVuc3VyZUluZGV4LCBjb2xsKShpbmRleERlZi5uYW1lLCBpbmRleERlZi5maWVsZE9yU3BlYywgaW5kZXhEZWYub3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjbGVhckJlZm9yZVVzZSAmJiAhZHJvcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDYWxsaW5nICdkZWxldGVNYW55JyBpbiBjb2xsZWN0aW9uICcke25hbWV9JyBiZWNhdXNlICdjbGVhckJlZm9yZVVzZScgb3B0aW9uIGlzIHNldC5gKTtcclxuICAgICAgICAgICAgICAgICAgICB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoY29sbC5kZWxldGVNYW55LCBjb2xsKSh7fSwgeyB3OiBcIm1ham9yaXR5XCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlbGV0ZU9uRXhpdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIE1vbmdvRGJDb250ZXh0LmFkZENvbGxlY3Rpb25Ub1JlY3ljbGVCaW4oc2VsZiwgY29sbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlYnVnKGBDb2xsZWN0aW9uUmVmICcke25hbWV9JyBydW4gY29tcGxldGVkLmApO1xyXG4gICAgICAgICAgICBjYWxsQ29udGV4dC5jb21wbGV0ZShjb2xsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChlKTtcclxuICAgICAgICB9XHJcbiAgICB9KSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uUmVmO1xyXG4iXX0=
