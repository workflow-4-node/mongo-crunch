"use strict";
var util = require('util');
var Activity = require("../../deps/workflow-4-node").activities.Activity;
var CollectionOp = require('./collectionOp');
var _ = require('lodash');
function MapReduceBase() {
  CollectionOp.call(this);
  this.map = null;
  this.reduce = null;
  this.finalize = null;
  this.query = null;
  this.sort = null;
  this.limit = null;
  this.scope = null;
  this.sharded = true;
  this.nonAtomic = false;
  this.codeProperties.add('map');
  this.codeProperties.add('reduce');
  this.codeProperties.add('finalize');
  this.nonScopedProperties.add('map');
  this.nonScopedProperties.add('reduce');
  this.nonScopedProperties.add('finalize');
  this.nonScopedProperties.add('doReduce');
  this.nonScopedProperties.add('sharded');
  this.nonScopedProperties.add('nonAtomic');
}
util.inherits(CollectionOp, Activity);
MapReduceBase.prototype.doWork = function(callContext) {
  callContext.schedule(this.get('query'), this.get('sort'), this.get('limit'), this.get('scope'), '_parsGot');
};
MapReduceBase.prototype._parsGot = function(callContext, reason, result) {
  if (reason !== Activity.states.complete) {
    callContext.end(reason, result);
    return ;
  }
  if (!_.isFunction(this.map) && !_.isString(this.map))
    throw new TypeError("Map function is not a function.");
  if (!_.isFunction(this.reduce) && !_.isString(this.reduce))
    throw new TypeError("Reduce function is not a function.");
  if (this.finalize) {
    if (!_.isFunction(this.finalize) && !_.isString(this.finalize))
      throw new TypeError("Finalize function is not a function.");
  }
  var query = result[0];
  var sort = result[1];
  var limit = result[2];
  var scope = result[3];
  callContext.activity.doReduce.call(this, callContext, {
    query: query,
    sort: sort,
    limit: limit,
    scope: scope,
    out: {
      sharded: this.sharded,
      nonAtomic: this.nonAtomic
    }
  });
};
MapReduceBase.prototype.doReduce = function(callContext, options) {
  callContext.fail(new Error("Not implemented"));
};
module.exports = MapReduceBase;
//# sourceMappingURL=data:application/json;base64,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QUFBQyxDQUFDLGlCQUFnQixDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFBO0FBRUEsS0FBSyxRQUFRLEVBQUksY0FBWSxDQUFDO0FBQzlCIiwiZmlsZSI6ImFjdGl2aXRpZXMvbWFwUmVkdWNlQmFzZS5qcyIsInNvdXJjZVJvb3QiOiJDOi9HSVQvbW9uZ28tY3J1bmNoL2xpYi8iLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZShcIi4uLy4uL2RlcHMvd29ya2Zsb3ctNC1ub2RlXCIpLmFjdGl2aXRpZXMuQWN0aXZpdHk7XHJcbnZhciBDb2xsZWN0aW9uT3AgPSByZXF1aXJlKCcuL2NvbGxlY3Rpb25PcCcpO1xyXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFwUmVkdWNlQmFzZSgpIHtcclxuICAgIENvbGxlY3Rpb25PcC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubWFwID0gbnVsbDtcclxuICAgIHRoaXMucmVkdWNlID0gbnVsbDtcclxuICAgIHRoaXMuZmluYWxpemUgPSBudWxsO1xyXG4gICAgdGhpcy5xdWVyeSA9IG51bGw7XHJcbiAgICB0aGlzLnNvcnQgPSBudWxsO1xyXG4gICAgdGhpcy5saW1pdCA9IG51bGw7XHJcbiAgICB0aGlzLnNjb3BlID0gbnVsbDtcclxuICAgIHRoaXMuc2hhcmRlZCA9IHRydWU7XHJcbiAgICB0aGlzLm5vbkF0b21pYyA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuY29kZVByb3BlcnRpZXMuYWRkKCdtYXAnKTtcclxuICAgIHRoaXMuY29kZVByb3BlcnRpZXMuYWRkKCdyZWR1Y2UnKTtcclxuICAgIHRoaXMuY29kZVByb3BlcnRpZXMuYWRkKCdmaW5hbGl6ZScpO1xyXG4gICAgdGhpcy5ub25TY29wZWRQcm9wZXJ0aWVzLmFkZCgnbWFwJyk7XHJcbiAgICB0aGlzLm5vblNjb3BlZFByb3BlcnRpZXMuYWRkKCdyZWR1Y2UnKTtcclxuICAgIHRoaXMubm9uU2NvcGVkUHJvcGVydGllcy5hZGQoJ2ZpbmFsaXplJyk7XHJcbiAgICB0aGlzLm5vblNjb3BlZFByb3BlcnRpZXMuYWRkKCdkb1JlZHVjZScpO1xyXG4gICAgdGhpcy5ub25TY29wZWRQcm9wZXJ0aWVzLmFkZCgnc2hhcmRlZCcpO1xyXG4gICAgdGhpcy5ub25TY29wZWRQcm9wZXJ0aWVzLmFkZCgnbm9uQXRvbWljJyk7XHJcbn1cclxuXHJcbnV0aWwuaW5oZXJpdHMoQ29sbGVjdGlvbk9wLCBBY3Rpdml0eSk7XHJcblxyXG5NYXBSZWR1Y2VCYXNlLnByb3RvdHlwZS5kb1dvcmsgPSBmdW5jdGlvbihjYWxsQ29udGV4dCkge1xyXG4gICAgY2FsbENvbnRleHQuc2NoZWR1bGUoXHJcbiAgICAgICAgdGhpcy5nZXQoJ3F1ZXJ5JyksXHJcbiAgICAgICAgdGhpcy5nZXQoJ3NvcnQnKSxcclxuICAgICAgICB0aGlzLmdldCgnbGltaXQnKSxcclxuICAgICAgICB0aGlzLmdldCgnc2NvcGUnKSxcclxuICAgICAgICAnX3BhcnNHb3QnXHJcbiAgICApO1xyXG59XHJcblxyXG5NYXBSZWR1Y2VCYXNlLnByb3RvdHlwZS5fcGFyc0dvdCA9IGZ1bmN0aW9uKGNhbGxDb250ZXh0LCByZWFzb24sIHJlc3VsdCkge1xyXG4gICAgaWYgKHJlYXNvbiAhPT0gQWN0aXZpdHkuc3RhdGVzLmNvbXBsZXRlKSB7XHJcbiAgICAgICAgY2FsbENvbnRleHQuZW5kKHJlYXNvbiwgcmVzdWx0KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFfLmlzRnVuY3Rpb24odGhpcy5tYXApICYmICFfLmlzU3RyaW5nKHRoaXMubWFwKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk1hcCBmdW5jdGlvbiBpcyBub3QgYSBmdW5jdGlvbi5cIik7XHJcbiAgICBpZiAoIV8uaXNGdW5jdGlvbih0aGlzLnJlZHVjZSkgJiYgIV8uaXNTdHJpbmcodGhpcy5yZWR1Y2UpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUmVkdWNlIGZ1bmN0aW9uIGlzIG5vdCBhIGZ1bmN0aW9uLlwiKTtcclxuICAgIGlmICh0aGlzLmZpbmFsaXplKSB7XHJcbiAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24odGhpcy5maW5hbGl6ZSkgJiYgIV8uaXNTdHJpbmcodGhpcy5maW5hbGl6ZSkpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGaW5hbGl6ZSBmdW5jdGlvbiBpcyBub3QgYSBmdW5jdGlvbi5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHF1ZXJ5ID0gcmVzdWx0WzBdO1xyXG4gICAgdmFyIHNvcnQgPSByZXN1bHRbMV07XHJcbiAgICB2YXIgbGltaXQgPSByZXN1bHRbMl07XHJcbiAgICB2YXIgc2NvcGUgPSByZXN1bHRbM107XHJcblxyXG4gICAgY2FsbENvbnRleHQuYWN0aXZpdHkuZG9SZWR1Y2UuY2FsbCh0aGlzLCBjYWxsQ29udGV4dCxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcclxuICAgICAgICAgICAgc29ydDogc29ydCxcclxuICAgICAgICAgICAgbGltaXQ6IGxpbWl0LFxyXG4gICAgICAgICAgICBzY29wZTogc2NvcGUsXHJcbiAgICAgICAgICAgIG91dDogeyBzaGFyZGVkOiB0aGlzLnNoYXJkZWQsIG5vbkF0b21pYzogdGhpcy5ub25BdG9taWMgfVxyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5NYXBSZWR1Y2VCYXNlLnByb3RvdHlwZS5kb1JlZHVjZSA9IGZ1bmN0aW9uKGNhbGxDb250ZXh0LCBvcHRpb25zKSB7XHJcbiAgICBjYWxsQ29udGV4dC5mYWlsKG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFwUmVkdWNlQmFzZTtcclxuIl19
