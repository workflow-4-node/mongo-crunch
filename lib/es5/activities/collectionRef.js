"use strict";
"use strict";
var wf4node = require("../../../deps/workflow-4-node");
var util = require("util");
var Activity = wf4node.activities.Activity;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbGxlY3Rpb25SZWYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxXQUFXLENBQUM7QUFFWixBQUFJLEVBQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQywrQkFBOEIsQ0FBQyxDQUFDO0FBQ3RELEFBQUksRUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLE1BQUssQ0FBQyxDQUFDO0FBQzFCLEFBQUksRUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLE9BQU0sV0FBVyxTQUFTLENBQUM7QUFDMUMsQUFBSSxFQUFBLENBQUEsUUFBTyxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsVUFBUyxDQUFDLENBQUM7QUFDbEMsQUFBSSxFQUFBLENBQUEsY0FBYSxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsa0JBQWlCLENBQUMsQ0FBQztBQUNoRCxBQUFJLEVBQUEsQ0FBQSxJQUFHLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxTQUFRLENBQUMsQ0FBQztBQUM3QixBQUFJLEVBQUEsQ0FBQSxDQUFBLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxRQUFPLENBQUMsQ0FBQztBQUN6QixBQUFJLEVBQUEsQ0FBQSxTQUFRLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxhQUFZLENBQUMsQ0FBQztBQUN0QyxBQUFJLEVBQUEsQ0FBQSxLQUFJLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxPQUFNLENBQUMsQUFBQyxDQUFDLDRCQUEyQixDQUFDLENBQUM7QUFFMUQsT0FBUyxjQUFZLENBQUcsQUFBRCxDQUFHO0FBQ3RCLFVBQVEsS0FBSyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUM7QUFFcEIsS0FBRyxLQUFLLEVBQUksS0FBRyxDQUFDO0FBQ2hCLEtBQUcsV0FBVyxFQUFJLEtBQUcsQ0FBQztBQUN0QixLQUFHLGFBQWEsRUFBSSxNQUFJLENBQUM7QUFDekIsS0FBRyxlQUFlLEVBQUksTUFBSSxDQUFDO0FBQzNCLEtBQUcsUUFBUSxFQUFJLEtBQUcsQ0FBQztBQUNuQixLQUFHLFFBQVEsRUFBSSxLQUFHLENBQUM7QUFDdkI7QUFBQSxBQUVBLEdBQUcsU0FBUyxBQUFDLENBQUMsYUFBWSxDQUFHLFVBQVEsQ0FBQyxDQUFDO0FBRXZDLFlBQVksVUFBVSxJQUFJLEVBQUksVUFBVSxXQUFVLENBQUcsQ0FBQSxJQUFHO0FBQ3BELEFBQUksSUFBQSxDQUFBLElBQUcsRUFBSSxLQUFHLENBQUM7QUFDZixBQUFJLElBQUEsQ0FBQSxJQUFHLEVBQUksQ0FBQSxJQUFHLElBQUksQUFBQyxDQUFDLE1BQUssQ0FBQyxDQUFDO0FBQzNCLEFBQUksSUFBQSxDQUFBLFVBQVMsRUFBSSxDQUFBLElBQUcsSUFBSSxBQUFDLENBQUMsWUFBVyxDQUFDLENBQUM7QUFDdkMsQUFBSSxJQUFBLENBQUEsWUFBVyxFQUFJLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxjQUFhLENBQUMsQ0FBQztBQUMzQyxBQUFJLElBQUEsQ0FBQSxjQUFhLEVBQUksQ0FBQSxJQUFHLElBQUksQUFBQyxDQUFDLGdCQUFlLENBQUMsQ0FBQztBQUMvQyxBQUFJLElBQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxJQUFHLElBQUksQUFBQyxDQUFDLFNBQVEsQ0FBQyxDQUFDO0FBQ2pDLEFBQUksSUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLElBQUcsSUFBSSxBQUFDLENBQUMsU0FBUSxDQUFDLENBQUM7QUFFakMsTUFBSSxBQUFDLEVBQUksSUFBRyxFQUFDLHlCQUF3QixFQUFDLFdBQVMsRUFBQyxtQkFBa0IsRUFBQyxhQUFXLEVBQUMscUJBQW9CLEVBQUMsZUFBYSxFQUFHLENBQUM7QUFDckgsTUFBSSxBQUFDLEVBQUMsV0FBVyxFQUFDLENBQUEsSUFBRyxRQUFRLEFBQUMsQ0FBQyxPQUFNLENBQUMsRUFBRyxDQUFDO0FBQzFDLE1BQUksQUFBQyxFQUFDLFdBQVcsRUFBQyxDQUFBLElBQUcsUUFBUSxBQUFDLENBQUMsT0FBTSxDQUFDLEVBQUcsQ0FBQztBQUUxQyxLQUFJLENBQUMsQ0FBQSxTQUFTLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQSxFQUFLLEVBQUMsSUFBRyxDQUFHO0FBQzVCLGNBQVUsS0FBSyxBQUFDLENBQUMsR0FBSSxNQUFJLEFBQUMsQ0FBQyw4Q0FBNkMsQ0FBQyxDQUFDLENBQUM7QUFDM0UsV0FBTTtFQUNWO0FBQUEsQUFFQSxTQUFTLFdBQVMsQ0FBRyxBQUFELENBQUc7QUFFbkIsV0FBUyxRQUFNLENBQUcsR0FBRSxDQUFHO0FBQ25CLEFBQUksUUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLEdBQUUsS0FBSyxDQUFDO0FBQ3RCLEFBQUksUUFBQSxDQUFBLFdBQVUsRUFBSSxDQUFBLEdBQUUsWUFBWSxDQUFDO0FBQ2pDLEFBQUksUUFBQSxDQUFBLFVBQVMsRUFBSSxDQUFBLEdBQUUsUUFBUSxHQUFLLEVBQUUsQ0FBQSxDQUFHLFdBQVMsQ0FBRSxDQUFDO0FBQ2pELFNBQUksQ0FBQyxDQUFBLFNBQVMsQUFBQyxDQUFDLE9BQU0sQ0FBQyxDQUFBLEVBQUssRUFBQyxXQUFVLENBQUc7QUFDdEMsWUFBTSxJQUFJLE1BQUksQUFBQyxDQUFDLCtCQUE4QixFQUFJLENBQUEsSUFBRyxVQUFVLEFBQUMsQ0FBQyxHQUFFLENBQUMsQ0FBQyxDQUFDO01BQzFFO0FBQUEsQUFDQSxXQUFPO0FBQ0gsV0FBRyxDQUFHLFFBQU07QUFDWixrQkFBVSxDQUFHLFlBQVU7QUFDdkIsY0FBTSxDQUFHLFdBQVM7QUFBQSxNQUN0QixDQUFDO0lBQ0w7QUFBQSxBQUVJLE1BQUEsQ0FBQSxNQUFLLEVBQUksR0FBQyxDQUFDO0FBQ2YsT0FBSSxDQUFBLFFBQVEsQUFBQyxDQUFDLE9BQU0sQ0FBQyxDQUFHO0FBQ3BCLFNBQUcsUUFBUSxBQUFDLENBQUMsT0FBTSxDQUFHLFVBQVUsR0FBRSxDQUFHO0FBQ2pDLGFBQUssS0FBSyxBQUFDLENBQUMsT0FBTSxBQUFDLENBQUMsR0FBRSxDQUFDLENBQUMsQ0FBQztNQUM3QixDQUFDLENBQUM7SUFDTixLQUNLLEtBQUksQ0FBQSxjQUFjLEFBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBRztBQUMvQixXQUFLLEtBQUssQUFBQyxDQUFDLE9BQU0sQUFBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUM7SUFDakM7QUFBQSxBQUVBLFNBQU8sT0FBSyxDQUFDO0VBQ2pCO0FBQUEsQUFFQSxTQUFPLFVBQVUsQUFBQyxDQXhFdEIsZUFBYyxzQkFBc0IsQUFBQyxDQXdFZCxjQUFXLEFBQUQ7Ozs7Ozs7Ozs7QUF4RWpDLFNBQU8sQ0FBUCxlQUFjLHdCQUF3QixBQUFkLENBQXhCLFNBQVMsSUFBRyxDQUFHO0FBQ1QsWUFBTyxJQUFHOzs7QUFEaEIsZUFBRyxRQUFRLEFBQUMsVUFFaUIsQ0FBQzs7OztlQXdFVCxDQUFBLFdBQVUsU0FBUyxNQUFNLEFBQUMsQ0FBQyxJQUFHLENBQUM7c0JBRXhCLENBQUEsY0FBYSxzQkFBc0IsQUFBQyxDQUFDLElBQUcsQ0FBRyxHQUFDLENBQUcsS0FBRyxDQUFDO29CQUVyRCxNQUFJOzs7O0FBOUU5QixlQUFHLE1BQU0sRUFBSSxDQUFBLENBK0VHLFlBQVcsR0FBSyxVQUFRLENBQUEsRUFBSyxFQUFDLFVBQVMsQ0EvRXhCLFVBQXdDLENBQUM7QUFDaEUsaUJBQUk7O0FBK0VJLGdCQUFJLEFBQUMsRUFBQyxHQUFHLEVBQUMsS0FBRyxFQUFDLG1FQUFpRSxFQUFDLENBQUM7Ozs7QUFoRmpHLGVBQUcsUUFBUSxBQUFDLFNBRWlCLENBQUM7Ozs7O0FBRjlCLGlCQWtGMEIsQ0FBQSxRQUFPLFVBQVUsQUFBQyxDQUFDLEVBQUMsZUFBZSxDQUFHLEdBQUMsQ0FBQyxBQUFDLENBQUMsSUFBRyxDQUFDLENBbEZqRDs7QUFBdkIsZUFBRyxXQUFXLEFBQUMsRUFBQyxDQUFBOzs7O0FBbUZJLGdCQUFJLEFBQUMsRUFBQyxHQUFHLEVBQUMsS0FBRyxFQUFDLFlBQVUsRUFBQyxDQUFDOzs7O0FBbkY5QyxlQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7Ozs7QUFDQyxlQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7QUFDYixlQUFHLGlCQUFpQixBQUFDLEVBQUMsQ0FBQztBQUN2QixjQUFvQixDQUFBLElBQUcsZ0JBQWdCLENBQUM7Ozs7QUFtRmxDLGVBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxLQUFLLElBQU0sYUFBVyxDQUFBLEVBQUssQ0FBQSxDQUFBLFFBQVEsSUFBTSxlQUFhLENBQUMsQ0FBQyxDQUFHO0FBQzlELGtCQUFNLEVBQUEsQ0FBQztZQUNYO0FBQUEsQUFDQSxnQkFBSSxBQUFDLEVBQUMsR0FBRyxFQUFDLEtBQUcsRUFBQywwQ0FBd0MsRUFBQyxDQUFDOzs7O0FBRTVELGtCQUFNLEVBQUksS0FBRyxDQUFDOzs7O2lCQUdQLENBQUEsQ0FBQSxTQUFTLEFBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQSxDQUFJLENBQUEsQ0FBQSxNQUFNLEFBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQSxDQUFJLEVBQUUsQ0FBQSxDQUFHLFdBQVMsQ0FBRTtBQUNwRSxlQUFJLFVBQVMsQ0FBRztBQUNaLGtCQUFJLEFBQUMsQ0FBQyx1QkFBc0IsQ0FBQyxDQUFDO0FBQzlCLGlCQUFHLE9BQU8sRUFBSSxLQUFHLENBQUM7WUFDdEI7QUFBQSxBQUNBLGdCQUFJLEFBQUMsRUFBQyxXQUFXLEVBQUMsS0FBRyxFQUFDLG9DQUFrQyxFQUFDLENBQUM7Ozs7O0FBbkd0RSxpQkFvRzZCLENBQUEsUUFBTyxVQUFVLEFBQUMsQ0FBQyxFQUFDLFdBQVcsQ0FBRyxHQUFDLENBQUMsQUFBQyxDQUFDLElBQUcsQ0FBRyxLQUFHLENBQUMsQ0FwR3REOztpQkFBdkIsQ0FBQSxJQUFHLEtBQUs7Ozs7QUFBUixlQUFHLE1BQU0sRUFBSSxDQUFBLENBc0dHLFNBQVEsQ0F0R08sVUFBd0MsQ0FBQztBQUNoRSxpQkFBSTs7c0JBc0dvQixDQUFBLFVBQVMsQUFBQyxFQUFDOzs7O0FBdkczQyxlQUFHLE1BQU0sRUFBSSxDQUFBLENBd0dPLFNBQVEsT0FBTyxDQXhHSixVQUF3QyxDQUFDO0FBQ2hFLGlCQUFJOztBQXdHUSxnQkFBSSxBQUFDLEVBQUMsV0FBVyxFQUFDLENBQUEsU0FBUSxPQUFPLEVBQUMsWUFBVSxFQUFDLENBQUM7Ozs7Y0FDakMsRUFBQTs7OztBQTFHakMsZUFBRyxNQUFNLEVBQUksQ0FBQSxDQTBHdUIsQ0FBQSxFQUFJLENBQUEsU0FBUSxPQUFPLENBMUd4QixVQUF3QyxDQUFDO0FBQ2hFLGlCQUFJOztBQXlHOEMsWUFBQSxFQUFFOzs7O3FCQUNyQixDQUFBLFNBQVEsQ0FBRSxDQUFBLENBQUM7QUFDMUIsZ0JBQUksQUFBQyxFQUFDLGlCQUFpQixFQUFDLENBQUEsSUFBRyxRQUFRLEFBQUMsQ0FBQyxRQUFPLENBQUMsRUFBRyxDQUFDOzs7OztBQTVHekUsaUJBNkc4QixDQUFBLFFBQU8sVUFBVSxBQUFDLENBQUMsSUFBRyxZQUFZLENBQUcsS0FBRyxDQUFDLEFBQUMsQ0FBQyxRQUFPLEtBQUssQ0FBRyxDQUFBLFFBQU8sWUFBWSxDQUFHLENBQUEsUUFBTyxRQUFRLENBQUMsQ0E3R3ZHOztBQUF2QixlQUFHLFdBQVcsQUFBQyxFQUFDLENBQUE7Ozs7QUFBaEIsZUFBRyxNQUFNLEVBQUksQ0FBQSxDQWlITyxjQUFhLEdBQUssRUFBQyxPQUFNLENBakhkLFVBQXdDLENBQUM7QUFDaEUsaUJBQUk7O0FBaUhRLGdCQUFJLEFBQUMsRUFBQyxzQ0FBc0MsRUFBQyxLQUFHLEVBQUMsNENBQTBDLEVBQUMsQ0FBQzs7Ozs7QUFsSGpILGlCQW1IMEIsQ0FBQSxRQUFPLFVBQVUsQUFBQyxDQUFDLElBQUcsV0FBVyxDQUFHLEtBQUcsQ0FBQyxBQUFDLENBQUMsRUFBQyxDQUFHLEVBQUUsQ0FBQSxDQUFHLFdBQVMsQ0FBRSxDQUFDLENBbkhsRTs7QUFBdkIsZUFBRyxXQUFXLEFBQUMsRUFBQyxDQUFBOzs7O0FBc0hBLGVBQUksWUFBVyxDQUFHO0FBQ2QsMkJBQWEsMEJBQTBCLEFBQUMsQ0FBQyxJQUFHLENBQUcsS0FBRyxDQUFDLENBQUM7WUFDeEQ7QUFBQTs7O0FBR0osZ0JBQUksQUFBQyxFQUFDLGlCQUFpQixFQUFDLEtBQUcsRUFBQyxtQkFBaUIsRUFBQyxDQUFDO0FBQy9DLHNCQUFVLFNBQVMsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDOzs7O0FBNUh0QyxlQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7Ozs7QUFDQyxlQUFHLE9BQU8sQUFBQyxFQUFDLENBQUM7QUFDYixlQUFHLGlCQUFpQixBQUFDLEVBQUMsQ0FBQztBQUN2QixjQUFvQixDQUFBLElBQUcsZ0JBQWdCLENBQUM7Ozs7QUE0SDFDLHNCQUFVLEtBQUssQUFBQyxDQUFDLENBQUEsQ0FBQyxDQUFDOzs7O0FBL0gvQixpQkFBTyxDQUFBLElBQUcsSUFBSSxBQUFDLEVBQUMsQ0FBQTs7QUFDbUIsSUFDL0IsT0FBNkIsS0FBRyxDQUFDLENBQUM7RUErSGxDLENBakltRCxDQWlJbEQsQUFBQyxFQUFDLENBQUM7QUFDUixDQUFDO0FBRUQsS0FBSyxRQUFRLEVBQUksY0FBWSxDQUFDO0FBQzlCIiwiZmlsZSI6ImFjdGl2aXRpZXMvY29sbGVjdGlvblJlZi5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5sZXQgd2Y0bm9kZSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9kZXBzL3dvcmtmbG93LTQtbm9kZVwiKTtcclxubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XHJcbmxldCBNb25nb0RiQ29udGV4dCA9IHJlcXVpcmUoXCIuL21vbmdvZGJDb250ZXh0XCIpO1xyXG5sZXQgZmFzdCA9IHJlcXVpcmUoXCJmYXN0LmpzXCIpO1xyXG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XHJcbmxldCBDb25uZWN0ZWQgPSByZXF1aXJlKFwiLi9jb25uZWN0ZWRcIik7XHJcbmxldCBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm1vbmdvLWNydW5jaDpDb2xsZWN0aW9uUmVmXCIpO1xyXG5cclxuZnVuY3Rpb24gQ29sbGVjdGlvblJlZiAoKSB7XHJcbiAgICBDb25uZWN0ZWQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBudWxsO1xyXG4gICAgdGhpcy5tdXN0RXhpc3RzID0gdHJ1ZTtcclxuICAgIHRoaXMuZGVsZXRlT25FeGl0ID0gZmFsc2U7XHJcbiAgICB0aGlzLmNsZWFyQmVmb3JlVXNlID0gZmFsc2U7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBudWxsO1xyXG4gICAgdGhpcy5pbmRleGVzID0gbnVsbDtcclxufVxyXG5cclxudXRpbC5pbmhlcml0cyhDb2xsZWN0aW9uUmVmLCBDb25uZWN0ZWQpO1xyXG5cclxuQ29sbGVjdGlvblJlZi5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCBhcmdzKSB7XHJcbiAgICBsZXQgc2VsZiA9IHRoaXM7XHJcbiAgICBsZXQgbmFtZSA9IHNlbGYuZ2V0KFwibmFtZVwiKTtcclxuICAgIGxldCBtdXN0RXhpc3RzID0gc2VsZi5nZXQoXCJtdXN0RXhpc3RzXCIpO1xyXG4gICAgbGV0IGRlbGV0ZU9uRXhpdCA9IHNlbGYuZ2V0KFwiZGVsZXRlT25FeGl0XCIpO1xyXG4gICAgbGV0IGNsZWFyQmVmb3JlVXNlID0gc2VsZi5nZXQoXCJjbGVhckJlZm9yZVVzZVwiKTtcclxuICAgIGxldCBvcHRpb25zID0gc2VsZi5nZXQoXCJvcHRpb25zXCIpO1xyXG4gICAgbGV0IGluZGV4ZXMgPSBzZWxmLmdldChcImluZGV4ZXNcIik7XHJcblxyXG4gICAgZGVidWcoYCR7bmFtZX0gcnVubmluZywgbXVzdEV4aXN0czogJHttdXN0RXhpc3RzfSwgZGVsZXRlT25FeGl0OiAke2RlbGV0ZU9uRXhpdH0sIGNsZWFyQmVmb3JlVXNlOiAke2NsZWFyQmVmb3JlVXNlfWApO1xyXG4gICAgZGVidWcoYG9wdGlvbnM6ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfWApO1xyXG4gICAgZGVidWcoYGluZGV4ZXM6ICR7dXRpbC5pbnNwZWN0KGluZGV4ZXMpfWApO1xyXG5cclxuICAgIGlmICghXy5pc1N0cmluZyhuYW1lKSB8fCAhbmFtZSkge1xyXG4gICAgICAgIGNhbGxDb250ZXh0LmZhaWwobmV3IEVycm9yKFwiQWN0aXZpdHkgYXJndW1lbnQgXFxcIm5hbWVcXFwiIGlzIG51bGwgb3IgZW1wdHkuXCIpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0SW5kZXhlcyAoKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRvSW5kZXggKGlkeCkge1xyXG4gICAgICAgICAgICBsZXQgaWR4TmFtZSA9IGlkeC5uYW1lO1xyXG4gICAgICAgICAgICBsZXQgZmllbGRPclNwZWMgPSBpZHguZmllbGRPclNwZWM7XHJcbiAgICAgICAgICAgIGxldCBpZHhPcHRpb25zID0gaWR4Lm9wdGlvbnMgfHwgeyB3OiBcIm1ham9yaXR5XCIgfTtcclxuICAgICAgICAgICAgaWYgKCFfLmlzU3RyaW5nKGlkeE5hbWUpIHx8ICFmaWVsZE9yU3BlYykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbmRleCBzcGVjaWZpY2F0aW9uOiBcIiArIEpTT04uc3RyaW5naWZ5KGlkeCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBpZHhOYW1lLFxyXG4gICAgICAgICAgICAgICAgZmllbGRPclNwZWM6IGZpZWxkT3JTcGVjLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogaWR4T3B0aW9uc1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGlmIChfLmlzQXJyYXkoaW5kZXhlcykpIHtcclxuICAgICAgICAgICAgZmFzdC5mb3JFYWNoKGluZGV4ZXMsIGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRvSW5kZXgoaWR4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QoaW5kZXhlcykpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2godG9JbmRleChpbmRleGVzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIEJsdWViaXJkLmNvcm91dGluZShmdW5jdGlvbiogKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCBkYiA9IGNhbGxDb250ZXh0LmFjdGl2aXR5LmdldERiKHNlbGYpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpcnN0U2VlbiA9IE1vbmdvRGJDb250ZXh0LmlzRmlyc3RTZWVuQ29sbGVjdGlvbihzZWxmLCBkYiwgbmFtZSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZHJvcHBlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoZGVsZXRlT25FeGl0ICYmIGZpcnN0U2VlbiAmJiAhbXVzdEV4aXN0cykge1xyXG4gICAgICAgICAgICAgICAgZGVidWcoYCcke25hbWV9JyBpcyBhIHRlbXBvcmFyeSBjb2xsZWN0aW9uIHRoYXQgbXVzdCBkcm9wcGVkIG9uIGV4aXQuIERyb3BwaW5nLmApO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoZGIuZHJvcENvbGxlY3Rpb24sIGRiKShuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgJyR7bmFtZX0nIGRyb3BwZWRgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoKGUubmFtZSA9PT0gXCJNb25nb0Vycm9yXCIgJiYgZS5tZXNzYWdlID09PSBcIm5zIG5vdCBmb3VuZFwiKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYCcke25hbWV9JyBkb2Vzbid0IGV4aXN0cyB3aGVuIHJlZmVyZW5jZWQgZmlyc3QuYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkcm9wcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG9wdHMgPSBfLmlzT2JqZWN0KG9wdGlvbnMpID8gXy5jbG9uZShvcHRpb25zKSA6IHsgdzogXCJtYWpvcml0eVwiIH07XHJcbiAgICAgICAgICAgIGlmIChtdXN0RXhpc3RzKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1ZyhcIkFkZGluZyBzdHJpY3Qgb3B0aW9uLlwiKTtcclxuICAgICAgICAgICAgICAgIG9wdHMuc3RyaWN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWJ1ZyhgR2V0dGluZyAnJHtuYW1lfScgY29sbGVjdGlvbidzIHJlZmVyZW5jZSBmcm9tIERiLmApO1xyXG4gICAgICAgICAgICBsZXQgY29sbCA9IHlpZWxkIEJsdWViaXJkLnByb21pc2lmeShkYi5jb2xsZWN0aW9uLCBkYikobmFtZSwgb3B0cyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlyc3RTZWVuKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXhEZWZzID0gZ2V0SW5kZXhlcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4RGVmcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgRW5zdXJpbmcgJHtpbmRleERlZnMubGVuZ3RofSBpbmRleGVzLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kZXhEZWZzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbmRleERlZiA9IGluZGV4RGVmc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYEVuc3VyaW5nIGluZGV4ICR7dXRpbC5pbnNwZWN0KGluZGV4RGVmKX1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWllbGQgQmx1ZWJpcmQucHJvbWlzaWZ5KGNvbGwuZW5zdXJlSW5kZXgsIGNvbGwpKGluZGV4RGVmLm5hbWUsIGluZGV4RGVmLmZpZWxkT3JTcGVjLCBpbmRleERlZi5vcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNsZWFyQmVmb3JlVXNlICYmICFkcm9wcGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYENhbGxpbmcgJ2RlbGV0ZU1hbnknIGluIGNvbGxlY3Rpb24gJyR7bmFtZX0nIGJlY2F1c2UgJ2NsZWFyQmVmb3JlVXNlJyBvcHRpb24gaXMgc2V0LmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIEJsdWViaXJkLnByb21pc2lmeShjb2xsLmRlbGV0ZU1hbnksIGNvbGwpKHt9LCB7IHc6IFwibWFqb3JpdHlcIiB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGVsZXRlT25FeGl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgTW9uZ29EYkNvbnRleHQuYWRkQ29sbGVjdGlvblRvUmVjeWNsZUJpbihzZWxmLCBjb2xsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGVidWcoYENvbGxlY3Rpb25SZWYgJyR7bmFtZX0nIHJ1biBjb21wbGV0ZWQuYCk7XHJcbiAgICAgICAgICAgIGNhbGxDb250ZXh0LmNvbXBsZXRlKGNvbGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjYWxsQ29udGV4dC5mYWlsKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3Rpb25SZWY7XHJcbiJdfQ==
