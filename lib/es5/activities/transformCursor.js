"use strict";
var debug = require("debug")("mongo-crunch:ApplyCursor");
var Bluebird = require("bluebird");
var async = Bluebird.coroutine;
var createIterator = require("./createIterator");
var _ = require("lodash");
function TransformCursor(scope, cursor, transformFunction) {
  this.it = createIterator(scope, cursor);
  this.f = transformFunction;
  this.scope = scope;
}
TransformCursor.prototype.next = function(cb) {
  this._nextImpl().nodeify(cb);
};
TransformCursor.prototype._nextImpl = async($traceurRuntime.initGeneratorFunction(function $__0() {
  var next;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this.it.nextAsync();
        case 2:
          next = $ctx.sent;
          $ctx.state = 4;
          break;
        case 4:
          if (next) {
            next = this.f.call(this.scope, next);
          }
          $ctx.state = 6;
          break;
        case 6:
          $ctx.state = (_.isUndefined(next)) ? 0 : 7;
          break;
        case 7:
          $ctx.returnValue = next;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__0, this);
}));
TransformCursor.prototype.toArray = function(cb) {
  var self = this;
  var impl = async($traceurRuntime.initGeneratorFunction(function $__1() {
    var result,
        doc;
    return $traceurRuntime.createGeneratorInstance(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            result = [];
            $ctx.state = 14;
            break;
          case 14:
            $ctx.state = 2;
            return self._nextImpl();
          case 2:
            doc = $ctx.sent;
            $ctx.state = 4;
            break;
          case 4:
            $ctx.state = (doc) ? 7 : 10;
            break;
          case 7:
            result.push(doc);
            $ctx.state = 14;
            break;
          case 10:
            $ctx.returnValue = result;
            $ctx.state = -2;
            break;
          default:
            return $ctx.end();
        }
    }, $__1, this);
  }));
  impl().nodeify(cb);
};
TransformCursor.prototype.close = function() {
  debug("Closed.");
  if (this.it) {
    this.it.close();
    this.it = null;
  }
};
module.exports = TransformCursor;
//# sourceMappingURL=data:application/json;base64,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TyxDQUFBLElBQUcsSUFBSSxBQUFDLEVBQUMsQ0FBQTs7QUFDbUIsSUFDL0IsT0FBNkIsS0FBRyxDQUFDLENBQUM7RUEyQ2xDLENBN0NtRCxDQTZDbEQsQ0FBQztBQUNGLEtBQUcsQUFBQyxFQUFDLFFBQVEsQUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFFRCxjQUFjLFVBQVUsTUFBTSxFQUFJLFVBQVMsQUFBRCxDQUFHO0FBQ3pDLE1BQUksQUFBQyxDQUFDLFNBQVEsQ0FBQyxDQUFDO0FBQ2hCLEtBQUksSUFBRyxHQUFHLENBQUc7QUFDVCxPQUFHLEdBQUcsTUFBTSxBQUFDLEVBQUMsQ0FBQztBQUNmLE9BQUcsR0FBRyxFQUFJLEtBQUcsQ0FBQztFQUNsQjtBQUFBLEFBQ0osQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLGdCQUFjLENBQUM7QUFBQSIsImZpbGUiOiJhY3Rpdml0aWVzL3RyYW5zZm9ybUN1cnNvci5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5sZXQgZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJtb25nby1jcnVuY2g6QXBwbHlDdXJzb3JcIik7XHJcbmxldCBCbHVlYmlyZCA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcclxubGV0IGFzeW5jID0gQmx1ZWJpcmQuY29yb3V0aW5lO1xyXG5sZXQgY3JlYXRlSXRlcmF0b3IgPSByZXF1aXJlKFwiLi9jcmVhdGVJdGVyYXRvclwiKTtcclxubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xyXG5cclxuZnVuY3Rpb24gVHJhbnNmb3JtQ3Vyc29yKHNjb3BlLCBjdXJzb3IsIHRyYW5zZm9ybUZ1bmN0aW9uKSB7XHJcbiAgICB0aGlzLml0ID0gY3JlYXRlSXRlcmF0b3Ioc2NvcGUsIGN1cnNvcik7XHJcbiAgICB0aGlzLmYgPSB0cmFuc2Zvcm1GdW5jdGlvbjtcclxuICAgIHRoaXMuc2NvcGUgPSBzY29wZTtcclxufVxyXG5cclxuVHJhbnNmb3JtQ3Vyc29yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgICB0aGlzLl9uZXh0SW1wbCgpLm5vZGVpZnkoY2IpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtQ3Vyc29yLnByb3RvdHlwZS5fbmV4dEltcGwgPSBhc3luYyhmdW5jdGlvbiooKSB7XHJcbiAgICBsZXQgbmV4dDtcclxuICAgIGRvIHtcclxuICAgICAgICBuZXh0ID0geWllbGQgdGhpcy5pdC5uZXh0QXN5bmMoKTtcclxuICAgICAgICBpZiAobmV4dCkge1xyXG4gICAgICAgICAgICBuZXh0ID0gdGhpcy5mLmNhbGwodGhpcy5zY29wZSwgbmV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgd2hpbGUgKF8uaXNVbmRlZmluZWQobmV4dCkpO1xyXG4gICAgcmV0dXJuIG5leHQ7XHJcbn0pO1xyXG5cclxuVHJhbnNmb3JtQ3Vyc29yLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgICBsZXQgc2VsZiA9IHRoaXM7XHJcbiAgICBsZXQgaW1wbCA9IGFzeW5jKGZ1bmN0aW9uKigpIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcbiAgICAgICAgbGV0IGRvYztcclxuICAgICAgICBmb3IgKDsgOykge1xyXG4gICAgICAgICAgICBkb2MgPSB5aWVsZCBzZWxmLl9uZXh0SW1wbCgpO1xyXG4gICAgICAgICAgICBpZiAoZG9jKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChkb2MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0pO1xyXG4gICAgaW1wbCgpLm5vZGVpZnkoY2IpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtQ3Vyc29yLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZGVidWcoXCJDbG9zZWQuXCIpO1xyXG4gICAgaWYgKHRoaXMuaXQpIHtcclxuICAgICAgICB0aGlzLml0LmNsb3NlKCk7XHJcbiAgICAgICAgdGhpcy5pdCA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybUN1cnNvcjsiXX0=
