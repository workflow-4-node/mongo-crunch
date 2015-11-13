"use strict";
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
              $__0 = (obj)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
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
        $__0 = (tasks)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
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
//# sourceMappingURL=data:application/json;base64,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LENBQUMsQ0FBQztBQUN0QixDQUFDO0FBRUQsVUFBVSxVQUFVLE1BQU0sRUFBSSxVQUFTLEFBQUQsQ0FBRztBQUNyQyxNQUFJLEFBQUMsQ0FBQyxTQUFRLENBQUMsQ0FBQztBQUNoQixLQUFJLElBQUcsR0FBRyxDQUFHO0FBQ1QsT0FBRyxHQUFHLE1BQU0sQUFBQyxFQUFDLENBQUM7QUFDZixPQUFHLEdBQUcsRUFBSSxLQUFHLENBQUM7RUFDbEI7QUFBQSxBQUNBLEtBQUksSUFBRyxPQUFPLENBQUc7QUFDYixPQUFHLE9BQU8sTUFBTSxBQUFDLEVBQUMsQ0FBQztBQUNuQixPQUFHLE9BQU8sRUFBSSxLQUFHLENBQUM7RUFDdEI7QUFBQSxBQUNKLENBQUM7QUFFRCxLQUFLLFFBQVEsRUFBSSxZQUFVLENBQUM7QUFBQSIsImZpbGUiOiJhY3Rpdml0aWVzL2FwcGx5Q3Vyc29yLmpzIiwic291cmNlUm9vdCI6ImxpYi9lczYiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxubGV0IGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwibW9uZ28tY3J1bmNoOkFwcGx5Q3Vyc29yXCIpO1xubGV0IEJsdWViaXJkID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xubGV0IGFzeW5jID0gQmx1ZWJpcmQuY29yb3V0aW5lO1xubGV0IGNyZWF0ZUl0ZXJhdG9yID0gcmVxdWlyZShcIi4vY3JlYXRlSXRlcmF0b3JcIik7XG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5sZXQgVmFsdWVBY2Nlc3NvciA9IHJlcXVpcmUoXCIuL3ZhbHVlQWNjZXNzb3JcIik7XG5cbmZ1bmN0aW9uIEFwcGx5Q3Vyc29yKHBhcnMpIHtcbiAgICB0aGlzLml0ID0gY3JlYXRlSXRlcmF0b3IocGFycy5zY29wZSwgcGFycy5jdXJzb3IpO1xuICAgIHRoaXMubGVmdEl0ID0gbnVsbDtcbiAgICB0aGlzLmxlZnRDID0gMDtcbiAgICB0aGlzLnBhcnMgPSBwYXJzO1xuICAgIHRoaXMuZW5kID0gZmFsc2U7XG4gICAgdGhpcy5hY2Nlc3NvciA9IG5ldyBWYWx1ZUFjY2Vzc29yKCk7XG59XG5cbkFwcGx5Q3Vyc29yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdGhpcy5fbmV4dEltcGwoKS5ub2RlaWZ5KGNiKTtcbn07XG5cbkFwcGx5Q3Vyc29yLnByb3RvdHlwZS5fbmV4dEltcGwgPSBhc3luYyhmdW5jdGlvbiooKSB7XG4gICAgbGV0IG5leHQ7XG4gICAgZG8ge1xuICAgICAgICBuZXh0ID0geWllbGQgdGhpcy5fbmV4dEltcGxJbm5lcigpO1xuICAgIH1cbiAgICB3aGlsZSAoXy5pc1VuZGVmaW5lZChuZXh0KSk7XG4gICAgcmV0dXJuIG5leHQ7XG59KTtcblxuQXBwbHlDdXJzb3IucHJvdG90eXBlLl9uZXh0SW1wbElubmVyID0gYXN5bmMoZnVuY3Rpb24qKCkge1xuICAgIGlmICh0aGlzLmVuZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5sZWZ0SXQgPT09IG51bGwpIHtcbiAgICAgICAgZGVidWcoXCJMZWZ0IGl0ZXJhdG9yIGlzIG5vdCBwcmVzZW50LlwiKTtcbiAgICAgICAgZGVidWcoXCJTdGVwcGluZyBvbiBtYWluIGl0ZXJhdG9yLlwiKTtcbiAgICAgICAgaWYgKCF0aGlzLnBhcnMuZmxhdCAmJiB0aGlzLmRvYyAmJiB0aGlzLmRvY1t0aGlzLnBhcnMubmFtZV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIlJldHVybmluZyBncm91cGVkIGRvY3VtZW50OiAlalwiLCB0aGlzLmRvYyk7XG4gICAgICAgICAgICBsZXQgZG9jID0gXy5jbG9uZSh0aGlzLmRvYyk7XG4gICAgICAgICAgICB0aGlzLmRvYyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZG9jID0geWllbGQgdGhpcy5pdC5uZXh0QXN5bmMoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRvYykge1xuICAgICAgICAgICAgZGVidWcoXCJNYWluIGl0ZXJhdG9yIGNvbXBsZXRlZC4gRW5kLlwiKTtcbiAgICAgICAgICAgIHRoaXMuZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZG9jW3RoaXMucGFycy5uYW1lXSA9IHRoaXMucGFycy5mbGF0ID8gbnVsbCA6IFtdO1xuICAgICAgICBkZWJ1ZyhcIkRvYyBnb3QsIG1ha2luZyB0aGUgbGVmdCBxdWVyeS5cIik7XG4gICAgICAgIGxldCBsZWZ0UXVlcnkgPSB0aGlzLl9tYWtlTGVmdFF1ZXJ5KCk7XG4gICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QobGVmdFF1ZXJ5LnBpcGVsaW5lKSB8fCBfLmlzQXJyYXkobGVmdFF1ZXJ5LnBpcGVsaW5lKSkge1xuICAgICAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQodGhpcy5wYXJzLm9wdGlvbnMuYWxsb3dEaXNrVXNlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFycy5vcHRpb25zLmFsbG93RGlza1VzZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1ZyhcIkNyZWF0aW5nIGN1cnNvciBmb3IgbGVmdCBhZ2dyZWdhdGUgcGlwZWxpbmU6XFxuJWpcIiwgbGVmdFF1ZXJ5LnBpcGVsaW5lKTtcbiAgICAgICAgICAgIHRoaXMubGVmdEl0ID0gY3JlYXRlSXRlcmF0b3IodGhpcy5wYXJzLnNjb3BlLCB0aGlzLnBhcnMuY29sbGVjdGlvbi5hZ2dyZWdhdGUobGVmdFF1ZXJ5LnBpcGVsaW5lLCB0aGlzLnBhcnMub3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVidWcoXCJDcmVhdGluZyBjdXJzb3IgZm9yIGxlZnQgcXVlcnk6XFxuJWpcIiwgbGVmdFF1ZXJ5KTtcbiAgICAgICAgICAgIHRoaXMubGVmdEl0ID0gY3JlYXRlSXRlcmF0b3IodGhpcy5wYXJzLnNjb3BlLCB0aGlzLnBhcnMuY29sbGVjdGlvbi5maW5kKGxlZnRRdWVyeSwgdGhpcy5wYXJzLm9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxlZnRDID0gMDtcbiAgICB9XG4gICAgZGVidWcoXCJTdGVwcGluZyBvbiBsZWZ0LlwiKTtcbiAgICBsZXQgbGVmdERvYyA9IHlpZWxkIHRoaXMubGVmdEl0Lm5leHRBc3luYygpO1xuICAgIHRoaXMubGVmdEMrKztcbiAgICBpZiAoIWxlZnREb2MpIHtcbiAgICAgICAgZGVidWcoXCJMZWZ0IGRvYyBpcyBudWxsLlwiKTtcbiAgICAgICAgdGhpcy5sZWZ0SXQuY2xvc2UoKTtcbiAgICAgICAgdGhpcy5sZWZ0SXQgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5wYXJzLnR5cGUgPT09IFwiY3Jvc3NcIikge1xuICAgICAgICAgICAgZGVidWcoXCJUaGlzIGlzIGEgY3Jvc3MgYXBwbHksIHNvIGRvY3VtZW50IHdpbGwgbm90IGdldCByZXR1cm5lZC4gUmV0dXJuaW5nIHRoZSBuZXh0IGRvYy5cIik7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMubGVmdEMgPT09IDEpIHtcbiAgICAgICAgICAgIGxldCBkb2MgPSBfLmNsb25lKHRoaXMuZG9jKTtcbiAgICAgICAgICAgIGRlYnVnKFwiUmV0dXJuaW5nOlxcbiVqXCIsIGRvYyk7XG4gICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVidWcoXCJOdWxsIGhhcyBiZWVuIHJldHVybmVkIGJlZm9yZS4gUmV0dXJuaW5nIHRoZSBuZXh0IGRvYy5cIik7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5wYXJzLmZsYXQpIHtcbiAgICAgICAgICAgIGxldCBkb2MgPSBfLmNsb25lKHRoaXMuZG9jKTtcbiAgICAgICAgICAgIGRlYnVnKFwiTGVmdCBkb2MgZ290LlwiKTtcbiAgICAgICAgICAgIGRvY1t0aGlzLnBhcnMubmFtZV0gPSBsZWZ0RG9jO1xuICAgICAgICAgICAgZGVidWcoXCJSZXR1cm5pbmc6XFxuJWpcIiwgZG9jKTtcbiAgICAgICAgICAgIHJldHVybiBkb2M7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIkxlZnQgZG9jIGdvdCwgYWRkaW5nIHRvIGdyb3VwLlwiKTtcbiAgICAgICAgICAgIHRoaXMuZG9jW3RoaXMucGFycy5uYW1lXS5wdXNoKGxlZnREb2MpO1xuICAgICAgICAgICAgZGVidWcoXCJSZXR1cm5pbmcgdGhlIG5leHQgZG9jLlwiKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuQXBwbHlDdXJzb3IucHJvdG90eXBlLl9tYWtlTGVmdFF1ZXJ5ID0gZnVuY3Rpb24gKCkge1xuICAgIGRlYnVnKFwiTWFraW5nIGxlZnQgcXVlcnkuXCIpO1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgcXVlcnkgPSB0aGlzLnBhcnMucXVlcnk7XG4gICAgbGV0IGlzQWdncmVnYXRlID0gZmFsc2U7XG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChxdWVyeS5waXBlbGluZSkgfHwgXy5pc0FycmF5KHF1ZXJ5LnBpcGVsaW5lKSkge1xuICAgICAgICBpc0FnZ3JlZ2F0ZSA9IHRydWU7XG4gICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QocXVlcnkucGlwZWxpbmUpKSB7XG4gICAgICAgICAgICBxdWVyeSA9IHF1ZXJ5LnBpcGVsaW5lLiRtYXRjaDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHF1ZXJ5ID0gXyhxdWVyeS5waXBlbGluZSkuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICEhcC4kbWF0Y2g7IH0pLmZpcnN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHRhc2tzID0gdGhpcy50YXNrcztcbiAgICBpZiAoIXRhc2tzKSB7XG4gICAgICAgIHRhc2tzID0gW107XG4gICAgICAgIHZhciB0cmFuc2Zvcm0gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICBpZiAoXy5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIG9iaikge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0oaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KG9iaikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRyaW1tZWQubGVuZ3RoID4gMSAmJiB0cmltbWVkWzBdID09PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBleHByID0gdmFsdWUuc3Vic3RyKDEpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdWYWx1ZSA9IHNlbGYuYWNjZXNzb3IuZ2V0KGRvYywgZXhwcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcIlNldHRpbmcgcXVlcnkgZXhwcmVzc2lvbiAnIyAlcycgdG8gbWFpbiBkb2N1bWVudCB2YWx1ZSBvZiAnJWonLlwiLCBleHByLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpba2V5XSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdHJhbnNmb3JtKHF1ZXJ5KTtcbiAgICAgICAgdGhpcy50YXNrcyA9IHRhc2tzO1xuICAgIH1cbiAgICBmb3IgKGxldCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICAgIHRhc2sodGhpcy5kb2MpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wYXJzLnF1ZXJ5O1xufTtcblxuQXBwbHlDdXJzb3IucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGltcGwgPSBhc3luYyhmdW5jdGlvbiooKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgbGV0IGRvYztcbiAgICAgICAgZm9yICg7IDspIHtcbiAgICAgICAgICAgIGRvYyA9IHlpZWxkIHNlbGYuX25leHRJbXBsKCk7XG4gICAgICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gICAgaW1wbCgpLm5vZGVpZnkoY2IpO1xufTtcblxuQXBwbHlDdXJzb3IucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgZGVidWcoXCJDbG9zZWQuXCIpO1xuICAgIGlmICh0aGlzLml0KSB7XG4gICAgICAgIHRoaXMuaXQuY2xvc2UoKTtcbiAgICAgICAgdGhpcy5pdCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLmxlZnRJdCkge1xuICAgICAgICB0aGlzLmxlZnRJdC5jbG9zZSgpO1xuICAgICAgICB0aGlzLmxlZnRJdCA9IG51bGw7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHBseUN1cnNvcjsiXX0=
