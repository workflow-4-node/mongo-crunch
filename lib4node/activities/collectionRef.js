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
      var idxOptions = idx.options || {w: 1};
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
            opts = _.isObject(options) ? _.clone(options) : {w: 1};
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
            return Bluebird.promisify(coll.deleteMany, coll)({}, {w: 1});
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
//# sourceMappingURL=data:application/json;base64,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Q0FBQzs7OztBQUNDLGVBQUcsT0FBTyxBQUFDLEVBQUMsQ0FBQztBQUNiLGVBQUcsaUJBQWlCLEFBQUMsRUFBQyxDQUFDO0FBQ3ZCLGNBQW9CLENBQUEsSUFBRyxnQkFBZ0IsQ0FBQzs7OztBQTJIMUMsc0JBQVUsS0FBSyxBQUFDLENBQUMsQ0FBQSxDQUFDLENBQUM7Ozs7QUE5SC9CLGlCQUFPLENBQUEsSUFBRyxJQUFJLEFBQUMsRUFBQyxDQUFBOztBQUNtQixJQUMvQixPQUE2QixLQUFHLENBQUMsQ0FBQztFQThIbEMsQ0FoSW1ELENBZ0lsRCxBQUFDLEVBQUMsQ0FBQztBQUNSLENBQUM7QUFFRCxLQUFLLFFBQVEsRUFBSSxjQUFZLENBQUM7QUFDOUIiLCJmaWxlIjoiYWN0aXZpdGllcy9jb2xsZWN0aW9uUmVmLmpzIiwic291cmNlUm9vdCI6IkM6L0dJVC9tb25nby1jcnVuY2gvbGliLyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZShcIi4uLy4uL2RlcHMvd29ya2Zsb3ctNC1ub2RlXCIpLmFjdGl2aXRpZXMuQWN0aXZpdHk7XHJcbnZhciBCbHVlYmlyZCA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcclxudmFyIE1vbmdvRGJDb250ZXh0ID0gcmVxdWlyZShcIi4vbW9uZ29kYkNvbnRleHRcIik7XHJcbnZhciBmYXN0ID0gcmVxdWlyZShcImZhc3QuanNcIik7XHJcbnZhciBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcclxudmFyIENvbm5lY3RlZCA9IHJlcXVpcmUoXCIuL2Nvbm5lY3RlZFwiKTtcclxudmFyIGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwibW9uZ28tY3J1bmNoOkNvbGxlY3Rpb25SZWZcIik7XHJcblxyXG5mdW5jdGlvbiBDb2xsZWN0aW9uUmVmICgpIHtcclxuICAgIENvbm5lY3RlZC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubmFtZSA9IG51bGw7XHJcbiAgICB0aGlzLm11c3RFeGlzdHMgPSB0cnVlO1xyXG4gICAgdGhpcy5kZWxldGVPbkV4aXQgPSBmYWxzZTtcclxuICAgIHRoaXMuY2xlYXJCZWZvcmVVc2UgPSBmYWxzZTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG51bGw7XHJcbiAgICB0aGlzLmluZGV4ZXMgPSBudWxsO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKENvbGxlY3Rpb25SZWYsIENvbm5lY3RlZCk7XHJcblxyXG5Db2xsZWN0aW9uUmVmLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGFyZ3MpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBuYW1lID0gc2VsZi5nZXQoXCJuYW1lXCIpO1xyXG4gICAgdmFyIG11c3RFeGlzdHMgPSBzZWxmLmdldChcIm11c3RFeGlzdHNcIik7XHJcbiAgICB2YXIgZGVsZXRlT25FeGl0ID0gc2VsZi5nZXQoXCJkZWxldGVPbkV4aXRcIik7XHJcbiAgICB2YXIgY2xlYXJCZWZvcmVVc2UgPSBzZWxmLmdldChcImNsZWFyQmVmb3JlVXNlXCIpO1xyXG4gICAgdmFyIG9wdGlvbnMgPSBzZWxmLmdldChcIm9wdGlvbnNcIik7XHJcbiAgICB2YXIgaW5kZXhlcyA9IHNlbGYuZ2V0KFwiaW5kZXhlc1wiKTtcclxuXHJcbiAgICBkZWJ1ZyhgJHtuYW1lfSBydW5uaW5nLCBtdXN0RXhpc3RzOiAke211c3RFeGlzdHN9LCBkZWxldGVPbkV4aXQ6ICR7ZGVsZXRlT25FeGl0fSwgY2xlYXJCZWZvcmVVc2U6ICR7Y2xlYXJCZWZvcmVVc2V9YCk7XHJcbiAgICBkZWJ1Zyhgb3B0aW9uczogJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9YCk7XHJcbiAgICBkZWJ1ZyhgaW5kZXhlczogJHt1dGlsLmluc3BlY3QoaW5kZXhlcyl9YCk7XHJcblxyXG4gICAgaWYgKCFfLmlzU3RyaW5nKG5hbWUpIHx8ICFuYW1lKSB7XHJcbiAgICAgICAgY2FsbENvbnRleHQuZmFpbChuZXcgRXJyb3IoXCJBY3Rpdml0eSBhcmd1bWVudCBcXFwibmFtZVxcXCIgaXMgbnVsbCBvciBlbXB0eS5cIikpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRJbmRleGVzICgpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9JbmRleCAoaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBpZHhOYW1lID0gaWR4Lm5hbWU7XHJcbiAgICAgICAgICAgIHZhciBmaWVsZE9yU3BlYyA9IGlkeC5maWVsZE9yU3BlYztcclxuICAgICAgICAgICAgdmFyIGlkeE9wdGlvbnMgPSBpZHgub3B0aW9ucyB8fCB7IHc6IDEgfTtcclxuICAgICAgICAgICAgaWYgKCFfLmlzU3RyaW5nKGlkeE5hbWUpIHx8ICFmaWVsZE9yU3BlYykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbmRleCBzcGVjaWZpY2F0aW9uOiBcIiArIEpTT04uc3RyaW5naWZ5KGlkeCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBpZHhOYW1lLFxyXG4gICAgICAgICAgICAgICAgZmllbGRPclNwZWM6IGZpZWxkT3JTcGVjLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogaWR4T3B0aW9uc1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGlmIChfLmlzQXJyYXkoaW5kZXhlcykpIHtcclxuICAgICAgICAgICAgZmFzdC5mb3JFYWNoKGluZGV4ZXMsIGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRvSW5kZXgoaWR4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QoaW5kZXhlcykpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2godG9JbmRleChpbmRleGVzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIEJsdWViaXJkLmNvcm91dGluZShmdW5jdGlvbiogKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBkYiA9IGNhbGxDb250ZXh0LmFjdGl2aXR5LmdldERiKHNlbGYpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpcnN0U2VlbiA9IE1vbmdvRGJDb250ZXh0LmlzRmlyc3RTZWVuQ29sbGVjdGlvbihzZWxmLCBkYiwgbmFtZSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZHJvcHBlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoZGVsZXRlT25FeGl0ICYmIGZpcnN0U2VlbiAmJiAhbXVzdEV4aXN0cykge1xyXG4gICAgICAgICAgICAgICAgZGVidWcoYCcke25hbWV9JyBpcyBhIHRlbXBvcmFyeSBjb2xsZWN0aW9uIHRoYXQgbXVzdCBkcm9wcGVkIG9uIGV4aXQuIERyb3BwaW5nLmApO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoZGIuZHJvcENvbGxlY3Rpb24sIGRiKShuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgJyR7bmFtZX0nIGRyb3BwZWRgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoKGUubmFtZSA9PT0gXCJNb25nb0Vycm9yXCIgJiYgZS5tZXNzYWdlID09PSBcIm5zIG5vdCBmb3VuZFwiKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYCcke25hbWV9JyBkb2Vzbid0IGV4aXN0cyB3aGVuIHJlZmVyZW5jZWQgZmlyc3QuYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkcm9wcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG9wdHMgPSBfLmlzT2JqZWN0KG9wdGlvbnMpID8gXy5jbG9uZShvcHRpb25zKSA6IHsgdzogMSB9O1xyXG4gICAgICAgICAgICBpZiAobXVzdEV4aXN0cykge1xyXG4gICAgICAgICAgICAgICAgZGVidWcoXCJBZGRpbmcgc3RyaWN0IG9wdGlvbi5cIik7XHJcbiAgICAgICAgICAgICAgICBvcHRzLnN0cmljdCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVidWcoYEdldHRpbmcgJyR7bmFtZX0nIGNvbGxlY3Rpb24ncyByZWZlcmVuY2UgZnJvbSBEYi5gKTtcclxuICAgICAgICAgICAgdmFyIGNvbGwgPSB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoZGIuY29sbGVjdGlvbiwgZGIpKG5hbWUsIG9wdHMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZpcnN0U2Vlbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4RGVmcyA9IGdldEluZGV4ZXMoKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleERlZnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYEVuc3VyaW5nICR7aW5kZXhEZWZzLmxlbmd0aH0gaW5kZXhlcy5gKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4RGVmcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhEZWYgPSBpbmRleERlZnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBFbnN1cmluZyBpbmRleCAke3V0aWwuaW5zcGVjdChpbmRleERlZil9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIEJsdWViaXJkLnByb21pc2lmeShjb2xsLmVuc3VyZUluZGV4LCBjb2xsKShpbmRleERlZi5uYW1lLCBpbmRleERlZi5maWVsZE9yU3BlYywgaW5kZXhEZWYub3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjbGVhckJlZm9yZVVzZSAmJiAhZHJvcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBDYWxsaW5nICdkZWxldGVNYW55JyBpbiBjb2xsZWN0aW9uICcke25hbWV9JyBiZWNhdXNlICdjbGVhckJlZm9yZVVzZScgb3B0aW9uIGlzIHNldC5gKTtcclxuICAgICAgICAgICAgICAgICAgICB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoY29sbC5kZWxldGVNYW55LCBjb2xsKSh7fSwgeyB3OiAxIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkZWxldGVPbkV4aXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBNb25nb0RiQ29udGV4dC5hZGRDb2xsZWN0aW9uVG9SZWN5Y2xlQmluKHNlbGYsIGNvbGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWJ1ZyhgQ29sbGVjdGlvblJlZiAnJHtuYW1lfScgcnVuIGNvbXBsZXRlZC5gKTtcclxuICAgICAgICAgICAgY2FsbENvbnRleHQuY29tcGxldGUoY29sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNhbGxDb250ZXh0LmZhaWwoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvblJlZjtcclxuIl19
