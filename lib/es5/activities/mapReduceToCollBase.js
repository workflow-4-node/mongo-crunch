"use strict";
"use strict";
var MapReduceBase = require("./mapReduceBase");
var wf4node = require("workflow-4-node");
var util = require("util");
var Activity = wf4node.activities.Activity;
var _ = require("lodash");
var Collection = require("mongodb").Collection;
var Bluebird = require("bluebird");
var async = Bluebird.coroutine;
var misc = require("./misc");
function MapReduceToCollBase() {
  MapReduceBase.call(this);
  this.output = null;
  this.nonScopedProperties.add("action");
  this.nonScopedProperties.add("doReduceToCollection");
}
util.inherits(MapReduceToCollBase, MapReduceBase);
Object.defineProperties(MapReduceToCollBase.prototype, {action: {get: function() {
      throw new Error("Not implemented!");
    }}});
MapReduceToCollBase.prototype.doReduce = function(callContext, coll, map, reduce, options) {
  this._coll = coll;
  this._map = map;
  this._reduce = reduce;
  this._options = options;
  callContext.schedule(this.output, "_outputGot");
};
MapReduceToCollBase.prototype._outputGot = function(callContext, reason, result) {
  if (reason !== Activity.states.complete) {
    callContext.end(reason, result);
    return;
  }
  var options = this._options;
  options.out = {};
  if (_.isString(result)) {
    options.out[callContext.activity.action] = result;
  } else if (result instanceof Collection) {
    options.out[callContext.activity.action] = result.collectionName;
    options.out.db = result.namespace.substr(0, result.namespace.length - (result.collectionName.length + 1));
  } else {
    if (result) {
      callContext.fail(new Error("Invalid output value: " + JSON.stringify(result)));
    } else {
      callContext.fail(new Error("Value of output expected."));
    }
    return;
  }
  callContext.activity.doReduceToCollection.call(this, callContext);
};
MapReduceToCollBase.prototype.doReduceToCollection = function(callContext) {
  var self = this;
  self._coll.mapReduce(self._map, self._reduce, self._options, function(err, collection) {
    if (err) {
      callContext.fail(err);
    } else if (self.flatten) {
      misc.flattenMRResult(self, collection).then(function() {
        callContext.complete(collection);
      }, function(e) {
        callContext.fail(e);
      });
    } else {
      callContext.complete(collection);
    }
  });
};
module.exports = MapReduceToCollBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hcFJlZHVjZVRvQ29sbEJhc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxXQUFXLENBQUM7QUFFWixBQUFJLEVBQUEsQ0FBQSxhQUFZLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFDO0FBQzlDLEFBQUksRUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLGlCQUFnQixDQUFDLENBQUM7QUFDeEMsQUFBSSxFQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsTUFBSyxDQUFDLENBQUM7QUFDMUIsQUFBSSxFQUFBLENBQUEsUUFBTyxFQUFJLENBQUEsT0FBTSxXQUFXLFNBQVMsQ0FBQztBQUMxQyxBQUFJLEVBQUEsQ0FBQSxDQUFBLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxRQUFPLENBQUMsQ0FBQztBQUN6QixBQUFJLEVBQUEsQ0FBQSxVQUFTLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxTQUFRLENBQUMsV0FBVyxDQUFDO0FBQzlDLEFBQUksRUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO0FBQ2xDLEFBQUksRUFBQSxDQUFBLEtBQUksRUFBSSxDQUFBLFFBQU8sVUFBVSxDQUFDO0FBQzlCLEFBQUksRUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFFBQU8sQ0FBQyxDQUFDO0FBRTVCLE9BQVMsb0JBQWtCLENBQUUsQUFBRCxDQUFHO0FBQzNCLGNBQVksS0FBSyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUM7QUFFeEIsS0FBRyxPQUFPLEVBQUksS0FBRyxDQUFDO0FBQ2xCLEtBQUcsb0JBQW9CLElBQUksQUFBQyxDQUFDLFFBQU8sQ0FBQyxDQUFDO0FBQ3RDLEtBQUcsb0JBQW9CLElBQUksQUFBQyxDQUFDLHNCQUFxQixDQUFDLENBQUM7QUFDeEQ7QUFBQSxBQUVBLEdBQUcsU0FBUyxBQUFDLENBQUMsbUJBQWtCLENBQUcsY0FBWSxDQUFDLENBQUM7QUFFakQsS0FBSyxpQkFBaUIsQUFBQyxDQUFDLG1CQUFrQixVQUFVLENBQUcsRUFDbkQsTUFBSyxDQUFHLEVBQ0osR0FBRSxDQUFHLFVBQVUsQUFBRCxDQUFHO0FBRWIsVUFBTSxJQUFJLE1BQUksQUFBQyxDQUFDLGtCQUFpQixDQUFDLENBQUM7SUFDdkMsQ0FDSixDQUNKLENBQUMsQ0FBQztBQUVGLGtCQUFrQixVQUFVLFNBQVMsRUFBSSxVQUFVLFdBQVUsQ0FBRyxDQUFBLElBQUcsQ0FBRyxDQUFBLEdBQUUsQ0FBRyxDQUFBLE1BQUssQ0FBRyxDQUFBLE9BQU0sQ0FBRztBQUN4RixLQUFHLE1BQU0sRUFBSSxLQUFHLENBQUM7QUFDakIsS0FBRyxLQUFLLEVBQUksSUFBRSxDQUFDO0FBQ2YsS0FBRyxRQUFRLEVBQUksT0FBSyxDQUFDO0FBQ3JCLEtBQUcsU0FBUyxFQUFJLFFBQU0sQ0FBQztBQUN2QixZQUFVLFNBQVMsQUFBQyxDQUFDLElBQUcsT0FBTyxDQUFHLGFBQVcsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRCxrQkFBa0IsVUFBVSxXQUFXLEVBQUksVUFBVSxXQUFVLENBQUcsQ0FBQSxNQUFLLENBQUcsQ0FBQSxNQUFLLENBQUc7QUFDOUUsS0FBSSxNQUFLLElBQU0sQ0FBQSxRQUFPLE9BQU8sU0FBUyxDQUFHO0FBQ3JDLGNBQVUsSUFBSSxBQUFDLENBQUMsTUFBSyxDQUFHLE9BQUssQ0FBQyxDQUFDO0FBQy9CLFVBQU07RUFDVjtBQUFBLEFBRUksSUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLElBQUcsU0FBUyxDQUFDO0FBQzNCLFFBQU0sSUFBSSxFQUFJLEdBQUMsQ0FBQztBQUNoQixLQUFJLENBQUEsU0FBUyxBQUFDLENBQUMsTUFBSyxDQUFDLENBQUc7QUFDcEIsVUFBTSxJQUFJLENBQUUsV0FBVSxTQUFTLE9BQU8sQ0FBQyxFQUFJLE9BQUssQ0FBQztFQUNyRCxLQUNLLEtBQUksTUFBSyxXQUFhLFdBQVMsQ0FBRztBQUNuQyxVQUFNLElBQUksQ0FBRSxXQUFVLFNBQVMsT0FBTyxDQUFDLEVBQUksQ0FBQSxNQUFLLGVBQWUsQ0FBQztBQUNoRSxVQUFNLElBQUksR0FBRyxFQUFJLENBQUEsTUFBSyxVQUFVLE9BQU8sQUFBQyxDQUFDLENBQUEsQ0FBRyxDQUFBLE1BQUssVUFBVSxPQUFPLEVBQUksRUFBQyxNQUFLLGVBQWUsT0FBTyxFQUFJLEVBQUEsQ0FBQyxDQUFDLENBQUM7RUFDN0csS0FDSztBQUNELE9BQUksTUFBSyxDQUFHO0FBQ1IsZ0JBQVUsS0FBSyxBQUFDLENBQUMsR0FBSSxNQUFJLEFBQUMsQ0FBQyx3QkFBdUIsRUFBSSxDQUFBLElBQUcsVUFBVSxBQUFDLENBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xGLEtBQ0s7QUFDRCxnQkFBVSxLQUFLLEFBQUMsQ0FBQyxHQUFJLE1BQUksQUFBQyxDQUFDLDJCQUEwQixDQUFDLENBQUMsQ0FBQztJQUM1RDtBQUFBLEFBQ0EsVUFBTTtFQUNWO0FBQUEsQUFFQSxZQUFVLFNBQVMscUJBQXFCLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBRyxZQUFVLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRUQsa0JBQWtCLFVBQVUscUJBQXFCLEVBQUksVUFBVSxXQUFVLENBQUc7QUFDeEUsQUFBSSxJQUFBLENBQUEsSUFBRyxFQUFJLEtBQUcsQ0FBQztBQUNmLEtBQUcsTUFBTSxVQUFVLEFBQUMsQ0FBQyxJQUFHLEtBQUssQ0FBRyxDQUFBLElBQUcsUUFBUSxDQUFHLENBQUEsSUFBRyxTQUFTLENBQUcsVUFBVSxHQUFFLENBQUcsQ0FBQSxVQUFTLENBQUc7QUFDcEYsT0FBSSxHQUFFLENBQUc7QUFDTCxnQkFBVSxLQUFLLEFBQUMsQ0FBQyxHQUFFLENBQUMsQ0FBQztJQUN6QixLQUNLLEtBQUksSUFBRyxRQUFRLENBQUc7QUFDbkIsU0FBRyxnQkFBZ0IsQUFBQyxDQUFDLElBQUcsQ0FBRyxXQUFTLENBQUMsS0FDN0IsQUFBQyxDQUFDLFNBQVUsQUFBRCxDQUFHO0FBQ2Qsa0JBQVUsU0FBUyxBQUFDLENBQUMsVUFBUyxDQUFDLENBQUM7TUFDcEMsQ0FDQSxVQUFVLENBQUEsQ0FBRztBQUNULGtCQUFVLEtBQUssQUFBQyxDQUFDLENBQUEsQ0FBQyxDQUFDO01BQ3ZCLENBQUMsQ0FBQztJQUNWLEtBQ0s7QUFDRCxnQkFBVSxTQUFTLEFBQUMsQ0FBQyxVQUFTLENBQUMsQ0FBQztJQUNwQztBQUFBLEVBQ0osQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLG9CQUFrQixDQUFDO0FBQ3BDIiwiZmlsZSI6ImFjdGl2aXRpZXMvbWFwUmVkdWNlVG9Db2xsQmFzZS5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5sZXQgTWFwUmVkdWNlQmFzZSA9IHJlcXVpcmUoXCIuL21hcFJlZHVjZUJhc2VcIik7XHJcbmxldCB3ZjRub2RlID0gcmVxdWlyZShcIndvcmtmbG93LTQtbm9kZVwiKTtcclxubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxubGV0IEFjdGl2aXR5ID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XHJcbmxldCBDb2xsZWN0aW9uID0gcmVxdWlyZShcIm1vbmdvZGJcIikuQ29sbGVjdGlvbjtcclxubGV0IEJsdWViaXJkID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xyXG5sZXQgYXN5bmMgPSBCbHVlYmlyZC5jb3JvdXRpbmU7XHJcbmxldCBtaXNjID0gcmVxdWlyZShcIi4vbWlzY1wiKTtcclxuXHJcbmZ1bmN0aW9uIE1hcFJlZHVjZVRvQ29sbEJhc2UoKSB7XHJcbiAgICBNYXBSZWR1Y2VCYXNlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5vdXRwdXQgPSBudWxsO1xyXG4gICAgdGhpcy5ub25TY29wZWRQcm9wZXJ0aWVzLmFkZChcImFjdGlvblwiKTtcclxuICAgIHRoaXMubm9uU2NvcGVkUHJvcGVydGllcy5hZGQoXCJkb1JlZHVjZVRvQ29sbGVjdGlvblwiKTtcclxufVxyXG5cclxudXRpbC5pbmhlcml0cyhNYXBSZWR1Y2VUb0NvbGxCYXNlLCBNYXBSZWR1Y2VCYXNlKTtcclxuXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKE1hcFJlZHVjZVRvQ29sbEJhc2UucHJvdG90eXBlLCB7XHJcbiAgICBhY3Rpb246IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gRGVzY2VuZGFudHMgc2hvdWxkIG92ZXJyaWRlIHRoaXMgb25seSAuLi5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkIVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuTWFwUmVkdWNlVG9Db2xsQmFzZS5wcm90b3R5cGUuZG9SZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGNvbGwsIG1hcCwgcmVkdWNlLCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLl9jb2xsID0gY29sbDtcclxuICAgIHRoaXMuX21hcCA9IG1hcDtcclxuICAgIHRoaXMuX3JlZHVjZSA9IHJlZHVjZTtcclxuICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgY2FsbENvbnRleHQuc2NoZWR1bGUodGhpcy5vdXRwdXQsIFwiX291dHB1dEdvdFwiKTtcclxufTtcclxuXHJcbk1hcFJlZHVjZVRvQ29sbEJhc2UucHJvdG90eXBlLl9vdXRwdXRHb3QgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIHJlYXNvbiwgcmVzdWx0KSB7XHJcbiAgICBpZiAocmVhc29uICE9PSBBY3Rpdml0eS5zdGF0ZXMuY29tcGxldGUpIHtcclxuICAgICAgICBjYWxsQ29udGV4dC5lbmQocmVhc29uLCByZXN1bHQpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgb3B0aW9ucyA9IHRoaXMuX29wdGlvbnM7XHJcbiAgICBvcHRpb25zLm91dCA9IHt9O1xyXG4gICAgaWYgKF8uaXNTdHJpbmcocmVzdWx0KSkge1xyXG4gICAgICAgIG9wdGlvbnMub3V0W2NhbGxDb250ZXh0LmFjdGl2aXR5LmFjdGlvbl0gPSByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgb3B0aW9ucy5vdXRbY2FsbENvbnRleHQuYWN0aXZpdHkuYWN0aW9uXSA9IHJlc3VsdC5jb2xsZWN0aW9uTmFtZTtcclxuICAgICAgICBvcHRpb25zLm91dC5kYiA9IHJlc3VsdC5uYW1lc3BhY2Uuc3Vic3RyKDAsIHJlc3VsdC5uYW1lc3BhY2UubGVuZ3RoIC0gKHJlc3VsdC5jb2xsZWN0aW9uTmFtZS5sZW5ndGggKyAxKSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgIGNhbGxDb250ZXh0LmZhaWwobmV3IEVycm9yKFwiSW52YWxpZCBvdXRwdXQgdmFsdWU6IFwiICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChuZXcgRXJyb3IoXCJWYWx1ZSBvZiBvdXRwdXQgZXhwZWN0ZWQuXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGxDb250ZXh0LmFjdGl2aXR5LmRvUmVkdWNlVG9Db2xsZWN0aW9uLmNhbGwodGhpcywgY2FsbENvbnRleHQpO1xyXG59O1xyXG5cclxuTWFwUmVkdWNlVG9Db2xsQmFzZS5wcm90b3R5cGUuZG9SZWR1Y2VUb0NvbGxlY3Rpb24gPSBmdW5jdGlvbiAoY2FsbENvbnRleHQpIHtcclxuICAgIGxldCBzZWxmID0gdGhpcztcclxuICAgIHNlbGYuX2NvbGwubWFwUmVkdWNlKHNlbGYuX21hcCwgc2VsZi5fcmVkdWNlLCBzZWxmLl9vcHRpb25zLCBmdW5jdGlvbiAoZXJyLCBjb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICBjYWxsQ29udGV4dC5mYWlsKGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNlbGYuZmxhdHRlbikge1xyXG4gICAgICAgICAgICBtaXNjLmZsYXR0ZW5NUlJlc3VsdChzZWxmLCBjb2xsZWN0aW9uKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxDb250ZXh0LmNvbXBsZXRlKGNvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY2FsbENvbnRleHQuY29tcGxldGUoY29sbGVjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcFJlZHVjZVRvQ29sbEJhc2U7XHJcbiJdfQ==
