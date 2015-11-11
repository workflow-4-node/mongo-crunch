"use strict";
var debug = require("debug")("mongo-crunch:ApplyCursor");
var Bluebird = require("bluebird");
var async = Bluebird.coroutine;
var createIterator = require("./createIterator");
var _ = require("lodash");
var ValueAccessor = require("./valueAccessor");
function ApplyCursor(pars) {
  this.it = createIterator(pars.scope, pars.cursor);
  this.leftIt = null;
  this.leftC = 0;
  this.pars = pars;
  this.end = false;
  this.accessor = new ValueAccessor();
}
ApplyCursor.prototype.next = function(cb) {
  this._nextImpl().nodeify(cb);
};
ApplyCursor.prototype._nextImpl = async($traceurRuntime.initGeneratorFunction(function $__10() {
  var next;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._nextImplInner();
        case 2:
          next = $ctx.sent;
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = (_.isUndefined(next)) ? 0 : 5;
          break;
        case 5:
          $ctx.returnValue = next;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__10, this);
}));
ApplyCursor.prototype._nextImplInner = async($traceurRuntime.initGeneratorFunction(function $__11() {
  var doc,
      leftQuery,
      leftDoc,
      doc$__7,
      doc$__8;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = (this.end) ? 1 : 2;
          break;
        case 1:
          $ctx.returnValue = null;
          $ctx.state = -2;
          break;
        case 2:
          $ctx.state = (this.leftIt === null) ? 18 : 21;
          break;
        case 18:
          debug("Left iterator is not present.");
          debug("Stepping on main iterator.");
          $ctx.state = 19;
          break;
        case 19:
          $ctx.state = (!this.pars.flat && this.doc && this.doc[this.pars.name].length) ? 6 : 5;
          break;
        case 6:
          debug("Returning grouped document: %j", this.doc);
          doc = _.clone(this.doc);
          this.doc = null;
          $ctx.state = 7;
          break;
        case 7:
          $ctx.returnValue = doc;
          $ctx.state = -2;
          break;
        case 5:
          $ctx.state = 10;
          return this.it.nextAsync();
        case 10:
          this.doc = $ctx.sent;
          $ctx.state = 12;
          break;
        case 12:
          $ctx.state = (!this.doc) ? 15 : 14;
          break;
        case 15:
          debug("Main iterator completed. End.");
          this.end = true;
          $ctx.state = 16;
          break;
        case 16:
          $ctx.returnValue = null;
          $ctx.state = -2;
          break;
        case 14:
          this.doc[this.pars.name] = this.pars.flat ? null : [];
          debug("Doc got, making the left query.");
          leftQuery = this._makeLeftQuery();
          if (_.isPlainObject(leftQuery.pipeline) || _.isArray(leftQuery.pipeline)) {
            if (_.isUndefined(this.pars.options.allowDiskUse)) {
              this.pars.options.allowDiskUse = true;
            }
            debug("Creating cursor for left aggregate pipeline:\n%j", leftQuery.pipeline);
            this.leftIt = createIterator(this.pars.scope, this.pars.collection.aggregate(leftQuery.pipeline, this.pars.options));
          } else {
            debug("Creating cursor for left query:\n%j", leftQuery);
            this.leftIt = createIterator(this.pars.scope, this.pars.collection.find(leftQuery, this.pars.options));
          }
          this.leftC = 0;
          $ctx.state = 21;
          break;
        case 21:
          debug("Stepping on left.");
          $ctx.state = 54;
          break;
        case 54:
          $ctx.state = 24;
          return this.leftIt.nextAsync();
        case 24:
          leftDoc = $ctx.sent;
          $ctx.state = 26;
          break;
        case 26:
          this.leftC++;
          $ctx.state = 56;
          break;
        case 56:
          $ctx.state = (!leftDoc) ? 41 : 51;
          break;
        case 41:
          debug("Left doc is null.");
          this.leftIt.close();
          this.leftIt = null;
          $ctx.state = 42;
          break;
        case 42:
          $ctx.state = (this.pars.type === "cross") ? 29 : 39;
          break;
        case 29:
          debug("This is a cross apply, so document will not get returned. Returning the next doc.");
          $ctx.state = 30;
          break;
        case 30:
          $ctx.state = -2;
          break;
        case 39:
          $ctx.state = (this.leftC === 1) ? 33 : 37;
          break;
        case 33:
          doc$__7 = _.clone(this.doc);
          debug("Returning:\n%j", doc$__7);
          $ctx.state = 34;
          break;
        case 34:
          $ctx.returnValue = doc$__7;
          $ctx.state = -2;
          break;
        case 37:
          debug("Null has been returned before. Returning the next doc.");
          $ctx.state = 38;
          break;
        case 38:
          $ctx.state = -2;
          break;
        case 51:
          $ctx.state = (this.pars.flat) ? 45 : 49;
          break;
        case 45:
          doc$__8 = _.clone(this.doc);
          debug("Left doc got.");
          doc$__8[this.pars.name] = leftDoc;
          debug("Returning:\n%j", doc$__8);
          $ctx.state = 46;
          break;
        case 46:
          $ctx.returnValue = doc$__8;
          $ctx.state = -2;
          break;
        case 49:
          debug("Left doc got, adding to group.");
          this.doc[this.pars.name].push(leftDoc);
          debug("Returning the next doc.");
          $ctx.state = 50;
          break;
        case 50:
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__11, this);
}));
ApplyCursor.prototype._makeLeftQuery = function() {
  debug("Making left query.");
  var self = this;
  var query = this.pars.query;
  var isAggregate = false;
  if (_.isPlainObject(query.pipeline) || _.isArray(query.pipeline)) {
    isAggregate = true;
    if (_.isPlainObject(query.pipeline)) {
      query = query.pipeline.$match;
    } else {
      query = _(query.pipeline).filter(function(p) {
        return !!p.$match;
      }).first();
    }
  }
  var tasks = this.tasks;
  if (!tasks) {
    tasks = [];
    var transform = function(obj) {
      if (_.isArray(obj)) {
        var $__3 = true;
        var $__4 = false;
        var $__5 = undefined;
        try {
          for (var $__1 = void 0,
              $__0 = (obj)[Symbol.iterator](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
            var item = $__1.value;
            {
              transform(item);
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
      } else if (_.isPlainObject(obj)) {
        var $__9 = function(key) {
          var value = obj[key];
          if (_.isString(value)) {
            var trimmed = value.trim();
            if (trimmed.length > 1 && trimmed[0] === "#") {
              var expr = value.substr(1).trim();
              if (expr) {
                tasks.push(function(doc) {
                  var newValue = self.accessor.get(doc, expr);
                  debug("Setting query expression '# %s' to main document value of '%j'.", expr, newValue);
                  obj[key] = newValue;
                });
              }
            }
          } else if (_.isPlainObject(value)) {
            transform(value);
          }
        };
        for (var key in obj) {
          $__9(key);
        }
      }
    };
    transform(query);
    this.tasks = tasks;
  }
  var $__3 = true;
  var $__4 = false;
  var $__5 = undefined;
  try {
    for (var $__1 = void 0,
        $__0 = (tasks)[Symbol.iterator](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
      var task = $__1.value;
      {
        task(this.doc);
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
  return this.pars.query;
};
ApplyCursor.prototype.toArray = function(cb) {
  var self = this;
  var impl = async($traceurRuntime.initGeneratorFunction(function $__12() {
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
    }, $__12, this);
  }));
  impl().nodeify(cb);
};
ApplyCursor.prototype.close = function() {
  debug("Closed.");
  if (this.it) {
    this.it.close();
    this.it = null;
  }
  if (this.leftIt) {
    this.leftIt.close();
    this.leftIt = null;
  }
};
module.exports = ApplyCursor;
//# sourceMappingURL=data:application/json;base64,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LE1BQUksQUFBQyxDQUFDLFNBQVEsQ0FBQyxDQUFDO0FBQ2hCLEtBQUksSUFBRyxHQUFHLENBQUc7QUFDVCxPQUFHLEdBQUcsTUFBTSxBQUFDLEVBQUMsQ0FBQztBQUNmLE9BQUcsR0FBRyxFQUFJLEtBQUcsQ0FBQztFQUNsQjtBQUFBLEFBQ0EsS0FBSSxJQUFHLE9BQU8sQ0FBRztBQUNiLE9BQUcsT0FBTyxNQUFNLEFBQUMsRUFBQyxDQUFDO0FBQ25CLE9BQUcsT0FBTyxFQUFJLEtBQUcsQ0FBQztFQUN0QjtBQUFBLEFBQ0osQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLFlBQVUsQ0FBQztBQUFBIiwiZmlsZSI6ImFjdGl2aXRpZXMvYXBwbHlDdXJzb3IuanMiLCJzb3VyY2VSb290IjoibGliL2VzNiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxubGV0IGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwibW9uZ28tY3J1bmNoOkFwcGx5Q3Vyc29yXCIpO1xyXG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XHJcbmxldCBhc3luYyA9IEJsdWViaXJkLmNvcm91dGluZTtcclxubGV0IGNyZWF0ZUl0ZXJhdG9yID0gcmVxdWlyZShcIi4vY3JlYXRlSXRlcmF0b3JcIik7XHJcbmxldCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcclxubGV0IFZhbHVlQWNjZXNzb3IgPSByZXF1aXJlKFwiLi92YWx1ZUFjY2Vzc29yXCIpO1xyXG5cclxuZnVuY3Rpb24gQXBwbHlDdXJzb3IocGFycykge1xyXG4gICAgdGhpcy5pdCA9IGNyZWF0ZUl0ZXJhdG9yKHBhcnMuc2NvcGUsIHBhcnMuY3Vyc29yKTtcclxuICAgIHRoaXMubGVmdEl0ID0gbnVsbDtcclxuICAgIHRoaXMubGVmdEMgPSAwO1xyXG4gICAgdGhpcy5wYXJzID0gcGFycztcclxuICAgIHRoaXMuZW5kID0gZmFsc2U7XHJcbiAgICB0aGlzLmFjY2Vzc29yID0gbmV3IFZhbHVlQWNjZXNzb3IoKTtcclxufVxyXG5cclxuQXBwbHlDdXJzb3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoY2IpIHtcclxuICAgIHRoaXMuX25leHRJbXBsKCkubm9kZWlmeShjYik7XHJcbn07XHJcblxyXG5BcHBseUN1cnNvci5wcm90b3R5cGUuX25leHRJbXBsID0gYXN5bmMoZnVuY3Rpb24qKCkge1xyXG4gICAgbGV0IG5leHQ7XHJcbiAgICBkbyB7XHJcbiAgICAgICAgbmV4dCA9IHlpZWxkIHRoaXMuX25leHRJbXBsSW5uZXIoKTtcclxuICAgIH1cclxuICAgIHdoaWxlIChfLmlzVW5kZWZpbmVkKG5leHQpKTtcclxuICAgIHJldHVybiBuZXh0O1xyXG59KTtcclxuXHJcbkFwcGx5Q3Vyc29yLnByb3RvdHlwZS5fbmV4dEltcGxJbm5lciA9IGFzeW5jKGZ1bmN0aW9uKigpIHtcclxuICAgIGlmICh0aGlzLmVuZCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmxlZnRJdCA9PT0gbnVsbCkge1xyXG4gICAgICAgIGRlYnVnKFwiTGVmdCBpdGVyYXRvciBpcyBub3QgcHJlc2VudC5cIik7XHJcbiAgICAgICAgZGVidWcoXCJTdGVwcGluZyBvbiBtYWluIGl0ZXJhdG9yLlwiKTtcclxuICAgICAgICBpZiAoIXRoaXMucGFycy5mbGF0ICYmIHRoaXMuZG9jICYmIHRoaXMuZG9jW3RoaXMucGFycy5uYW1lXS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgZGVidWcoXCJSZXR1cm5pbmcgZ3JvdXBlZCBkb2N1bWVudDogJWpcIiwgdGhpcy5kb2MpO1xyXG4gICAgICAgICAgICBsZXQgZG9jID0gXy5jbG9uZSh0aGlzLmRvYyk7XHJcbiAgICAgICAgICAgIHRoaXMuZG9jID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuIGRvYztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kb2MgPSB5aWVsZCB0aGlzLml0Lm5leHRBc3luYygpO1xyXG4gICAgICAgIGlmICghdGhpcy5kb2MpIHtcclxuICAgICAgICAgICAgZGVidWcoXCJNYWluIGl0ZXJhdG9yIGNvbXBsZXRlZC4gRW5kLlwiKTtcclxuICAgICAgICAgICAgdGhpcy5lbmQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kb2NbdGhpcy5wYXJzLm5hbWVdID0gdGhpcy5wYXJzLmZsYXQgPyBudWxsIDogW107XHJcbiAgICAgICAgZGVidWcoXCJEb2MgZ290LCBtYWtpbmcgdGhlIGxlZnQgcXVlcnkuXCIpO1xyXG4gICAgICAgIGxldCBsZWZ0UXVlcnkgPSB0aGlzLl9tYWtlTGVmdFF1ZXJ5KCk7XHJcbiAgICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChsZWZ0UXVlcnkucGlwZWxpbmUpIHx8IF8uaXNBcnJheShsZWZ0UXVlcnkucGlwZWxpbmUpKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmlzVW5kZWZpbmVkKHRoaXMucGFycy5vcHRpb25zLmFsbG93RGlza1VzZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFycy5vcHRpb25zLmFsbG93RGlza1VzZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVidWcoXCJDcmVhdGluZyBjdXJzb3IgZm9yIGxlZnQgYWdncmVnYXRlIHBpcGVsaW5lOlxcbiVqXCIsIGxlZnRRdWVyeS5waXBlbGluZSk7XHJcbiAgICAgICAgICAgIHRoaXMubGVmdEl0ID0gY3JlYXRlSXRlcmF0b3IodGhpcy5wYXJzLnNjb3BlLCB0aGlzLnBhcnMuY29sbGVjdGlvbi5hZ2dyZWdhdGUobGVmdFF1ZXJ5LnBpcGVsaW5lLCB0aGlzLnBhcnMub3B0aW9ucykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZGVidWcoXCJDcmVhdGluZyBjdXJzb3IgZm9yIGxlZnQgcXVlcnk6XFxuJWpcIiwgbGVmdFF1ZXJ5KTtcclxuICAgICAgICAgICAgdGhpcy5sZWZ0SXQgPSBjcmVhdGVJdGVyYXRvcih0aGlzLnBhcnMuc2NvcGUsIHRoaXMucGFycy5jb2xsZWN0aW9uLmZpbmQobGVmdFF1ZXJ5LCB0aGlzLnBhcnMub3B0aW9ucykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxlZnRDID0gMDtcclxuICAgIH1cclxuICAgIGRlYnVnKFwiU3RlcHBpbmcgb24gbGVmdC5cIik7XHJcbiAgICBsZXQgbGVmdERvYyA9IHlpZWxkIHRoaXMubGVmdEl0Lm5leHRBc3luYygpO1xyXG4gICAgdGhpcy5sZWZ0QysrO1xyXG4gICAgaWYgKCFsZWZ0RG9jKSB7XHJcbiAgICAgICAgZGVidWcoXCJMZWZ0IGRvYyBpcyBudWxsLlwiKTtcclxuICAgICAgICB0aGlzLmxlZnRJdC5jbG9zZSgpO1xyXG4gICAgICAgIHRoaXMubGVmdEl0ID0gbnVsbDtcclxuICAgICAgICBpZiAodGhpcy5wYXJzLnR5cGUgPT09IFwiY3Jvc3NcIikge1xyXG4gICAgICAgICAgICBkZWJ1ZyhcIlRoaXMgaXMgYSBjcm9zcyBhcHBseSwgc28gZG9jdW1lbnQgd2lsbCBub3QgZ2V0IHJldHVybmVkLiBSZXR1cm5pbmcgdGhlIG5leHQgZG9jLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5sZWZ0QyA9PT0gMSkge1xyXG4gICAgICAgICAgICBsZXQgZG9jID0gXy5jbG9uZSh0aGlzLmRvYyk7XHJcbiAgICAgICAgICAgIGRlYnVnKFwiUmV0dXJuaW5nOlxcbiVqXCIsIGRvYyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkb2M7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkZWJ1ZyhcIk51bGwgaGFzIGJlZW4gcmV0dXJuZWQgYmVmb3JlLiBSZXR1cm5pbmcgdGhlIG5leHQgZG9jLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5wYXJzLmZsYXQpIHtcclxuICAgICAgICAgICAgbGV0IGRvYyA9IF8uY2xvbmUodGhpcy5kb2MpO1xyXG4gICAgICAgICAgICBkZWJ1ZyhcIkxlZnQgZG9jIGdvdC5cIik7XHJcbiAgICAgICAgICAgIGRvY1t0aGlzLnBhcnMubmFtZV0gPSBsZWZ0RG9jO1xyXG4gICAgICAgICAgICBkZWJ1ZyhcIlJldHVybmluZzpcXG4lalwiLCBkb2MpO1xyXG4gICAgICAgICAgICByZXR1cm4gZG9jO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZGVidWcoXCJMZWZ0IGRvYyBnb3QsIGFkZGluZyB0byBncm91cC5cIik7XHJcbiAgICAgICAgICAgIHRoaXMuZG9jW3RoaXMucGFycy5uYW1lXS5wdXNoKGxlZnREb2MpO1xyXG4gICAgICAgICAgICBkZWJ1ZyhcIlJldHVybmluZyB0aGUgbmV4dCBkb2MuXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5BcHBseUN1cnNvci5wcm90b3R5cGUuX21ha2VMZWZ0UXVlcnkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBkZWJ1ZyhcIk1ha2luZyBsZWZ0IHF1ZXJ5LlwiKTtcclxuICAgIGxldCBzZWxmID0gdGhpcztcclxuICAgIGxldCBxdWVyeSA9IHRoaXMucGFycy5xdWVyeTtcclxuICAgIGxldCBpc0FnZ3JlZ2F0ZSA9IGZhbHNlO1xyXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChxdWVyeS5waXBlbGluZSkgfHwgXy5pc0FycmF5KHF1ZXJ5LnBpcGVsaW5lKSkge1xyXG4gICAgICAgIGlzQWdncmVnYXRlID0gdHJ1ZTtcclxuICAgICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KHF1ZXJ5LnBpcGVsaW5lKSkge1xyXG4gICAgICAgICAgICBxdWVyeSA9IHF1ZXJ5LnBpcGVsaW5lLiRtYXRjaDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gXyhxdWVyeS5waXBlbGluZSkuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICEhcC4kbWF0Y2g7IH0pLmZpcnN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgbGV0IHRhc2tzID0gdGhpcy50YXNrcztcclxuICAgIGlmICghdGFza3MpIHtcclxuICAgICAgICB0YXNrcyA9IFtdO1xyXG4gICAgICAgIHZhciB0cmFuc2Zvcm0gPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0oaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KG9iaikpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cmltbWVkLmxlbmd0aCA+IDEgJiYgdHJpbW1lZFswXSA9PT0gXCIjXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBleHByID0gdmFsdWUuc3Vic3RyKDEpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHByKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFza3MucHVzaChmdW5jdGlvbiAoZG9jKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdWYWx1ZSA9IHNlbGYuYWNjZXNzb3IuZ2V0KGRvYywgZXhwcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKFwiU2V0dGluZyBxdWVyeSBleHByZXNzaW9uICcjICVzJyB0byBtYWluIGRvY3VtZW50IHZhbHVlIG9mICclaicuXCIsIGV4cHIsIG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqW2tleV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0cmFuc2Zvcm0ocXVlcnkpO1xyXG4gICAgICAgIHRoaXMudGFza3MgPSB0YXNrcztcclxuICAgIH1cclxuICAgIGZvciAobGV0IHRhc2sgb2YgdGFza3MpIHtcclxuICAgICAgICB0YXNrKHRoaXMuZG9jKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnBhcnMucXVlcnk7XHJcbn07XHJcblxyXG5BcHBseUN1cnNvci5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uIChjYikge1xyXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xyXG4gICAgbGV0IGltcGwgPSBhc3luYyhmdW5jdGlvbiooKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGxldCBkb2M7XHJcbiAgICAgICAgZm9yICg7IDspIHtcclxuICAgICAgICAgICAgZG9jID0geWllbGQgc2VsZi5fbmV4dEltcGwoKTtcclxuICAgICAgICAgICAgaWYgKGRvYykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZG9jKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9KTtcclxuICAgIGltcGwoKS5ub2RlaWZ5KGNiKTtcclxufTtcclxuXHJcbkFwcGx5Q3Vyc29yLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZGVidWcoXCJDbG9zZWQuXCIpO1xyXG4gICAgaWYgKHRoaXMuaXQpIHtcclxuICAgICAgICB0aGlzLml0LmNsb3NlKCk7XHJcbiAgICAgICAgdGhpcy5pdCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5sZWZ0SXQpIHtcclxuICAgICAgICB0aGlzLmxlZnRJdC5jbG9zZSgpO1xyXG4gICAgICAgIHRoaXMubGVmdEl0ID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbHlDdXJzb3I7Il19
