"use strict";
"use strict";
var es = "es6";
try {
  eval("(function *(){})");
} catch (err) {
  es = "es5";
}
var util = require("util");
var wf4node = require("workflow-4-node");
var Composite = wf4node.activities.Composite;
var path = require("path");
var _ = require("lodash");
var Activity = wf4node.activities.Activity;
function Collect() {
  Composite.call(this);
  this.source = null;
  this.target = null;
  this.pipeline = null;
  this.map = null;
  this.reduce = null;
  this.finalize = null;
  this.condition = null;
  this.scope = null;
  this.pre = null;
  this.reserved("post", null);
  this.codeProperties.add("map");
  this.codeProperties.add("reduce");
  this.codeProperties.add("finalize");
}
util.inherits(Collect, Composite);
Collect.prototype.createImplementation = function() {
  return {
    "@require": path.join(__dirname, "../../../../lib/" + es + "/activities"),
    "@block": {
      collectRoot: "= $parent",
      args: [{"@if": {
          condition: "= collectRoot.pipeline",
          then: {"@if": {
              condition: "= typeof this.get('collectRoot').get('target') !== 'string'",
              then: {"@insert": {
                  collection: "= collectRoot.target",
                  documents: {"@aggregate": {
                      collection: "= collectRoot.source",
                      pipeline: "= collectRoot.pipeline"
                    }}
                }},
              else: {"@aggregate": {
                  collection: "= collectRoot.source",
                  pipeline: "= collectRoot.pipeline"
                }}
            }},
          else: {"@insert": {
              collection: "= collectRoot.target",
              documents: {"@inlineMR": {
                  query: "= collectRoot.condition",
                  collection: "= collectRoot.source",
                  map: "= collectRoot.map",
                  reduce: "= collectRoot.reduce",
                  finalize: "= collectRoot.finalize",
                  scope: "= collectRoot.scope"
                }}
            }}
        }}]
    }
  };
};
Collect.prototype.varsDeclared = function(callContext, args) {
  if (this.get("source") === this.get("target")) {
    throw new Error("Source and Target Collections must be different!");
  }
  var pipeline = this.get("pipeline");
  var map = this.get("map");
  var reduce = this.get("reduce");
  var finalize = this.get("finalize") || undefined;
  if (pipeline) {
    callContext.activity._setupAggregation.call(this, callContext, pipeline);
  } else if ((_.isFunction(map) || _.isString(map)) && (_.isFunction(reduce) || _.isString(reduce))) {
    callContext.activity._setupMapReduce.call(this, callContext, map, reduce, finalize);
  } else {
    throw new Error("Operation parameters expected.");
  }
  Composite.prototype.varsDeclared.call(this, callContext, args);
};
Collect.prototype._setupAggregation = function(callContext, pipeline) {
  if (!_.isArray(pipeline)) {
    throw new Error("Pipeline is not an array.");
  }
  pipeline = _.cloneDeep(pipeline);
  var condition = this.get("condition");
  if (!_.isUndefined(condition)) {
    if (_.isPlainObject(condition)) {
      pipeline.splice(0, 0, {$match: condition});
    }
  }
  var target = this.get("target");
  if (_.isString(target)) {
    pipeline.push({$out: target});
  }
  if (!pipeline.length) {
    throw new Error("Pipeline is empty.");
  }
  this.set("pipeline", pipeline);
};
Collect.prototype._setupMapReduce = function(callContext, map, reduce, finalize) {
  if (!_.isUndefined(finalize)) {
    if (!(_.isFunction(finalize) || _.isString(finalize))) {
      throw new TypeError("Property value of 'finalize' is not a function.");
    }
  }
};
Collect.prototype.implementationCompleted = function(callContext, reason, result) {
  if (reason !== Activity.states.complete) {
    callContext.end(reason, result);
    return;
  }
  var post = this.get("post");
  if (post instanceof Activity) {
    callContext.schedule(post, "_allEnd");
  } else {
    Composite.prototype.implementationCompleted.call(this, callContext, reason, result);
  }
};
Collect.prototype._allEnd = function(callContext, reason, result) {
  callContext.end(reason, result);
};
module.exports = Collect;
//# sourceMappingURL=data:application/json;base64,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LENBQUMsTUFBSyxDQUFDLENBQUM7QUFDM0IsS0FBSSxJQUFHLFdBQWEsU0FBTyxDQUFHO0FBQzFCLGNBQVUsU0FBUyxBQUFDLENBQUMsSUFBRyxDQUFHLFVBQVEsQ0FBQyxDQUFDO0VBQ3pDLEtBQ0s7QUFDRCxZQUFRLFVBQVUsd0JBQXdCLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBRyxZQUFVLENBQUcsT0FBSyxDQUFHLE9BQUssQ0FBQyxDQUFDO0VBQ3ZGO0FBQUEsQUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLFFBQVEsRUFBSSxVQUFVLFdBQVUsQ0FBRyxDQUFBLE1BQUssQ0FBRyxDQUFBLE1BQUssQ0FBRztBQUMvRCxZQUFVLElBQUksQUFBQyxDQUFDLE1BQUssQ0FBRyxPQUFLLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBRUQsS0FBSyxRQUFRLEVBQUksUUFBTSxDQUFDO0FBQ3hCIiwiZmlsZSI6ImNvbWlzc2lvbi9hY3Rpdml0aWVzL2NvbGxlY3QuanMiLCJzb3VyY2VSb290IjoiZXhhbXBsZXMvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZXMgPSBcImVzNlwiO1xyXG50cnkgeyBldmFsKFwiKGZ1bmN0aW9uICooKXt9KVwiKTsgfSBjYXRjaCAoZXJyKSB7IGVzID0gXCJlczVcIjsgfVxyXG5cclxubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxubGV0IHdmNG5vZGUgPSByZXF1aXJlKFwid29ya2Zsb3ctNC1ub2RlXCIpO1xyXG5sZXQgQ29tcG9zaXRlID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkNvbXBvc2l0ZTtcclxubGV0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xyXG5sZXQgQWN0aXZpdHkgPSB3ZjRub2RlLmFjdGl2aXRpZXMuQWN0aXZpdHk7XHJcblxyXG5mdW5jdGlvbiBDb2xsZWN0KCkge1xyXG4gICAgQ29tcG9zaXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5zb3VyY2UgPSBudWxsO1xyXG4gICAgdGhpcy50YXJnZXQgPSBudWxsO1xyXG4gICAgdGhpcy5waXBlbGluZSA9IG51bGw7XHJcbiAgICB0aGlzLm1hcCA9IG51bGw7XHJcbiAgICB0aGlzLnJlZHVjZSA9IG51bGw7XHJcbiAgICB0aGlzLmZpbmFsaXplID0gbnVsbDtcclxuICAgIHRoaXMuY29uZGl0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuc2NvcGUgPSBudWxsO1xyXG4gICAgdGhpcy5wcmUgPSBudWxsO1xyXG4gICAgdGhpcy5yZXNlcnZlZChcInBvc3RcIiwgbnVsbCk7IC8vIEl0IGRvbid0IHJ1biBiZWZvcmUgaW1wbGVtZW50YXRpb24gZG9lcy5cclxuICAgIHRoaXMuY29kZVByb3BlcnRpZXMuYWRkKFwibWFwXCIpO1xyXG4gICAgdGhpcy5jb2RlUHJvcGVydGllcy5hZGQoXCJyZWR1Y2VcIik7XHJcbiAgICB0aGlzLmNvZGVQcm9wZXJ0aWVzLmFkZChcImZpbmFsaXplXCIpO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKENvbGxlY3QsIENvbXBvc2l0ZSk7XHJcblxyXG5Db2xsZWN0LnByb3RvdHlwZS5jcmVhdGVJbXBsZW1lbnRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgXCJAcmVxdWlyZVwiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uLy4uLy4uL2xpYi9cIiArIGVzICsgXCIvYWN0aXZpdGllc1wiKSxcclxuICAgICAgICBcIkBibG9ja1wiOiB7XHJcbiAgICAgICAgICAgIGNvbGxlY3RSb290OiBcIj0gJHBhcmVudFwiLFxyXG4gICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAaWZcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb246IFwiPSBjb2xsZWN0Um9vdC5waXBlbGluZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkBpZlwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uOiBcIj0gdHlwZW9mIHRoaXMuZ2V0KCdjb2xsZWN0Um9vdCcpLmdldCgndGFyZ2V0JykgIT09ICdzdHJpbmcnXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkBpbnNlcnRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogXCI9IGNvbGxlY3RSb290LnRhcmdldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJAYWdncmVnYXRlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogXCI9IGNvbGxlY3RSb290LnNvdXJjZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZTogXCI9IGNvbGxlY3RSb290LnBpcGVsaW5lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJAYWdncmVnYXRlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IFwiPSBjb2xsZWN0Um9vdC5zb3VyY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lOiBcIj0gY29sbGVjdFJvb3QucGlwZWxpbmVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkBpbnNlcnRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IFwiPSBjb2xsZWN0Um9vdC50YXJnZXRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJAaW5saW5lTVJcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnk6IFwiPSBjb2xsZWN0Um9vdC5jb25kaXRpb25cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IFwiPSBjb2xsZWN0Um9vdC5zb3VyY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogXCI9IGNvbGxlY3RSb290Lm1hcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkdWNlOiBcIj0gY29sbGVjdFJvb3QucmVkdWNlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbGl6ZTogXCI9IGNvbGxlY3RSb290LmZpbmFsaXplXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZTogXCI9IGNvbGxlY3RSb290LnNjb3BlXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5Db2xsZWN0LnByb3RvdHlwZS52YXJzRGVjbGFyZWQgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGFyZ3MpIHtcclxuICAgIGlmICh0aGlzLmdldChcInNvdXJjZVwiKSA9PT0gdGhpcy5nZXQoXCJ0YXJnZXRcIikpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTb3VyY2UgYW5kIFRhcmdldCBDb2xsZWN0aW9ucyBtdXN0IGJlIGRpZmZlcmVudCFcIik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHBpcGVsaW5lID0gdGhpcy5nZXQoXCJwaXBlbGluZVwiKTtcclxuICAgIGxldCBtYXAgPSB0aGlzLmdldChcIm1hcFwiKTtcclxuICAgIGxldCByZWR1Y2UgPSB0aGlzLmdldChcInJlZHVjZVwiKTtcclxuICAgIGxldCBmaW5hbGl6ZSA9IHRoaXMuZ2V0KFwiZmluYWxpemVcIikgfHwgdW5kZWZpbmVkO1xyXG4gICAgaWYgKHBpcGVsaW5lKSB7XHJcbiAgICAgICAgY2FsbENvbnRleHQuYWN0aXZpdHkuX3NldHVwQWdncmVnYXRpb24uY2FsbCh0aGlzLCBjYWxsQ29udGV4dCwgcGlwZWxpbmUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoKF8uaXNGdW5jdGlvbihtYXApIHx8IF8uaXNTdHJpbmcobWFwKSkgJiYgKF8uaXNGdW5jdGlvbihyZWR1Y2UpIHx8IF8uaXNTdHJpbmcocmVkdWNlKSkpIHtcclxuICAgICAgICBjYWxsQ29udGV4dC5hY3Rpdml0eS5fc2V0dXBNYXBSZWR1Y2UuY2FsbCh0aGlzLCBjYWxsQ29udGV4dCwgbWFwLCByZWR1Y2UsIGZpbmFsaXplKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZXJhdGlvbiBwYXJhbWV0ZXJzIGV4cGVjdGVkLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBDb21wb3NpdGUucHJvdG90eXBlLnZhcnNEZWNsYXJlZC5jYWxsKHRoaXMsIGNhbGxDb250ZXh0LCBhcmdzKTtcclxufTtcclxuXHJcbkNvbGxlY3QucHJvdG90eXBlLl9zZXR1cEFnZ3JlZ2F0aW9uID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCBwaXBlbGluZSkge1xyXG4gICAgaWYgKCFfLmlzQXJyYXkocGlwZWxpbmUpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGlwZWxpbmUgaXMgbm90IGFuIGFycmF5LlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwaXBlbGluZSA9IF8uY2xvbmVEZWVwKHBpcGVsaW5lKTtcclxuXHJcbiAgICAvLyBDb25kaXRpb246XHJcbiAgICBsZXQgY29uZGl0aW9uID0gdGhpcy5nZXQoXCJjb25kaXRpb25cIik7XHJcbiAgICBpZiAoIV8uaXNVbmRlZmluZWQoY29uZGl0aW9uKSkge1xyXG4gICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoY29uZGl0aW9uKSkge1xyXG4gICAgICAgICAgICBwaXBlbGluZS5zcGxpY2UoMCwgMCwge1xyXG4gICAgICAgICAgICAgICAgJG1hdGNoOiBjb25kaXRpb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE91dFxyXG4gICAgbGV0IHRhcmdldCA9IHRoaXMuZ2V0KFwidGFyZ2V0XCIpO1xyXG4gICAgaWYgKF8uaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgIHBpcGVsaW5lLnB1c2goeyAkb3V0OiB0YXJnZXQgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFwaXBlbGluZS5sZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQaXBlbGluZSBpcyBlbXB0eS5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZXQoXCJwaXBlbGluZVwiLCBwaXBlbGluZSk7XHJcbn07XHJcblxyXG5Db2xsZWN0LnByb3RvdHlwZS5fc2V0dXBNYXBSZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIG1hcCwgcmVkdWNlLCBmaW5hbGl6ZSkge1xyXG4gICAgaWYgKCFfLmlzVW5kZWZpbmVkKGZpbmFsaXplKSkge1xyXG4gICAgICAgIGlmICghKF8uaXNGdW5jdGlvbihmaW5hbGl6ZSkgfHwgXy5pc1N0cmluZyhmaW5hbGl6ZSkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcm9wZXJ0eSB2YWx1ZSBvZiAnZmluYWxpemUnIGlzIG5vdCBhIGZ1bmN0aW9uLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5Db2xsZWN0LnByb3RvdHlwZS5pbXBsZW1lbnRhdGlvbkNvbXBsZXRlZCA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCwgcmVhc29uLCByZXN1bHQpIHtcclxuICAgIGlmIChyZWFzb24gIT09IEFjdGl2aXR5LnN0YXRlcy5jb21wbGV0ZSkge1xyXG4gICAgICAgIGNhbGxDb250ZXh0LmVuZChyZWFzb24sIHJlc3VsdCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBwb3N0ID0gdGhpcy5nZXQoXCJwb3N0XCIpO1xyXG4gICAgaWYgKHBvc3QgaW5zdGFuY2VvZiBBY3Rpdml0eSkge1xyXG4gICAgICAgIGNhbGxDb250ZXh0LnNjaGVkdWxlKHBvc3QsIFwiX2FsbEVuZFwiKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIENvbXBvc2l0ZS5wcm90b3R5cGUuaW1wbGVtZW50YXRpb25Db21wbGV0ZWQuY2FsbCh0aGlzLCBjYWxsQ29udGV4dCwgcmVhc29uLCByZXN1bHQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQ29sbGVjdC5wcm90b3R5cGUuX2FsbEVuZCA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCwgcmVhc29uLCByZXN1bHQpIHtcclxuICAgIGNhbGxDb250ZXh0LmVuZChyZWFzb24sIHJlc3VsdCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3Q7XHJcbiJdfQ==
