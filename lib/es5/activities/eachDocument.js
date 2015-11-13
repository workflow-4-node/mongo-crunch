"use strict";
"use strict";
var wf4node = require("workflow-4-node");
var util = require("util");
var Activity = wf4node.activities.Activity;
var ForEach = wf4node.activities.ForEach;
var debug = require("debug")("mongo-crunch:EachDocument");
var _ = require("lodash");
var UnitOfWork = require("./unitOfWork");
var Collection = require("mongodb").Collection;
var createIterator = require("./createIterator");
function querify(doc) {
  if (_.isArray(doc)) {
    return doc.map(querify);
  } else if (_.isPlainObject(doc)) {
    var result = {};
    for (var key in doc) {
      if (key[0] === "~" || key[0] === "`" || key[0] === "!") {
        result["$" + key.substr(1)] = querify(doc[key]);
      } else {
        result[key] = querify(doc[key]);
      }
    }
    return result;
  } else {
    return doc;
  }
}
function EachDocument() {
  Activity.call(this);
  this.varName = "document";
  this.documents = null;
  this.querify = false;
  this.parallel = true;
  this._forEach = null;
}
util.inherits(EachDocument, Activity);
EachDocument.prototype.initializeStructure = function() {
  this._forEach = new ForEach();
  this._forEach.varName = this.varName;
  this._forEach.args = this.args;
  this._forEach.parallel = this.parallel;
  this.args = null;
};
EachDocument.prototype.run = function(callContext, args) {
  callContext.schedule(this.documents, "_documentsGot");
};
EachDocument.prototype._documentsGot = function(callContext, reason, result) {
  if (reason !== Activity.states.complete) {
    callContext.end(reason, result);
    return;
  }
  if (_.isArray(result) || _.isPlainObject(result)) {
    this._items = result;
  } else {
    this._it = createIterator(this, result);
  }
  callContext.activity._doStep.call(this, callContext);
};
EachDocument.prototype._doStep = function(callContext) {
  var self = this;
  debug("Doing EachDocument step.");
  var doQuerify = self.querify;
  var forEach = self._forEach;
  var it = self._it;
  var items = self._items;
  if (it) {
    debug("Iterating.");
    it.next(function(err, doc) {
      if (err) {
        debug(("Next failed.\n" + err.stack));
        callContext.fail(err);
      } else if (doc) {
        debug("Doc got, scheduling body.");
        if (doQuerify) {
          doc = querify(doc);
        }
        forEach.items = doc;
        callContext.schedule(forEach, "_completed");
      } else {
        debug("Iteration completed.");
        callContext.complete();
      }
    });
  } else if (items) {
    debug("Yielding items.");
    delete self._items;
    forEach.items = items;
    callContext.schedule(forEach, "_completed");
  } else {
    debug("Yielding completed.");
    callContext.complete();
  }
};
EachDocument.prototype._completed = function(callContext, reason, result) {
  if (reason === Activity.states.complete) {
    callContext.activity._doStep.call(this, callContext, result);
  } else {
    callContext.end(reason, result);
  }
};
module.exports = EachDocument;
//# sourceMappingURL=data:application/json;base64,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LENBQUMscUJBQW9CLENBQUMsQ0FBQztBQUM1QixjQUFVLFNBQVMsQUFBQyxFQUFDLENBQUM7RUFDMUI7QUFBQSxBQUNKLENBQUM7QUFFRCxXQUFXLFVBQVUsV0FBVyxFQUFJLFVBQVUsV0FBVSxDQUFHLENBQUEsTUFBSyxDQUFHLENBQUEsTUFBSyxDQUFHO0FBQ3ZFLEtBQUksTUFBSyxJQUFNLENBQUEsUUFBTyxPQUFPLFNBQVMsQ0FBRztBQUNyQyxjQUFVLFNBQVMsUUFBUSxLQUFLLEFBQUMsQ0FBQyxJQUFHLENBQUcsWUFBVSxDQUFHLE9BQUssQ0FBQyxDQUFDO0VBQ2hFLEtBQ0s7QUFDRCxjQUFVLElBQUksQUFBQyxDQUFDLE1BQUssQ0FBRyxPQUFLLENBQUMsQ0FBQztFQUNuQztBQUFBLEFBQ0osQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLGFBQVcsQ0FBQztBQUFBIiwiZmlsZSI6ImFjdGl2aXRpZXMvZWFjaERvY3VtZW50LmpzIiwic291cmNlUm9vdCI6ImxpYi9lczYiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxubGV0IHdmNG5vZGUgPSByZXF1aXJlKFwid29ya2Zsb3ctNC1ub2RlXCIpO1xubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcbmxldCBBY3Rpdml0eSA9IHdmNG5vZGUuYWN0aXZpdGllcy5BY3Rpdml0eTtcbmxldCBGb3JFYWNoID0gd2Y0bm9kZS5hY3Rpdml0aWVzLkZvckVhY2g7XG5sZXQgZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJtb25nby1jcnVuY2g6RWFjaERvY3VtZW50XCIpO1xubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xubGV0IFVuaXRPZldvcmsgPSByZXF1aXJlKFwiLi91bml0T2ZXb3JrXCIpO1xubGV0IENvbGxlY3Rpb24gPSByZXF1aXJlKFwibW9uZ29kYlwiKS5Db2xsZWN0aW9uO1xubGV0IGNyZWF0ZUl0ZXJhdG9yID0gcmVxdWlyZShcIi4vY3JlYXRlSXRlcmF0b3JcIik7XG5cbmZ1bmN0aW9uIHF1ZXJpZnkoZG9jKSB7XG4gICAgaWYgKF8uaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHF1ZXJpZnkpO1xuICAgIH1cbiAgICBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QoZG9jKSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBkb2MpIHtcbiAgICAgICAgICAgIGlmIChrZXlbMF0gPT09IFwiflwiIHx8IGtleVswXSA9PT0gXCJgXCIgfHwga2V5WzBdID09PSBcIiFcIikge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtcIiRcIiArIGtleS5zdWJzdHIoMSldID0gcXVlcmlmeShkb2Nba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHF1ZXJpZnkoZG9jW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gRWFjaERvY3VtZW50KCkge1xuICAgIEFjdGl2aXR5LmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLnZhck5hbWUgPSBcImRvY3VtZW50XCI7XG4gICAgdGhpcy5kb2N1bWVudHMgPSBudWxsO1xuICAgIHRoaXMucXVlcmlmeSA9IGZhbHNlO1xuICAgIHRoaXMucGFyYWxsZWwgPSB0cnVlO1xuICAgIHRoaXMuX2ZvckVhY2ggPSBudWxsO1xufVxuXG51dGlsLmluaGVyaXRzKEVhY2hEb2N1bWVudCwgQWN0aXZpdHkpO1xuXG5FYWNoRG9jdW1lbnQucHJvdG90eXBlLmluaXRpYWxpemVTdHJ1Y3R1cmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZm9yRWFjaCA9IG5ldyBGb3JFYWNoKCk7XG4gICAgdGhpcy5fZm9yRWFjaC52YXJOYW1lID0gdGhpcy52YXJOYW1lO1xuICAgIHRoaXMuX2ZvckVhY2guYXJncyA9IHRoaXMuYXJncztcbiAgICB0aGlzLl9mb3JFYWNoLnBhcmFsbGVsID0gdGhpcy5wYXJhbGxlbDtcbiAgICB0aGlzLmFyZ3MgPSBudWxsO1xufTtcblxuRWFjaERvY3VtZW50LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIGFyZ3MpIHtcbiAgICBjYWxsQ29udGV4dC5zY2hlZHVsZSh0aGlzLmRvY3VtZW50cywgXCJfZG9jdW1lbnRzR290XCIpO1xufTtcblxuRWFjaERvY3VtZW50LnByb3RvdHlwZS5fZG9jdW1lbnRzR290ID0gZnVuY3Rpb24gKGNhbGxDb250ZXh0LCByZWFzb24sIHJlc3VsdCkge1xuICAgIGlmIChyZWFzb24gIT09IEFjdGl2aXR5LnN0YXRlcy5jb21wbGV0ZSkge1xuICAgICAgICBjYWxsQ29udGV4dC5lbmQocmVhc29uLCByZXN1bHQpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkocmVzdWx0KSB8fCBfLmlzUGxhaW5PYmplY3QocmVzdWx0KSkge1xuICAgICAgICB0aGlzLl9pdGVtcyA9IHJlc3VsdDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuX2l0ID0gY3JlYXRlSXRlcmF0b3IodGhpcywgcmVzdWx0KTtcbiAgICB9XG4gICAgY2FsbENvbnRleHQuYWN0aXZpdHkuX2RvU3RlcC5jYWxsKHRoaXMsIGNhbGxDb250ZXh0KTtcbn07XG5cbkVhY2hEb2N1bWVudC5wcm90b3R5cGUuX2RvU3RlcCA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBkZWJ1ZyhgRG9pbmcgRWFjaERvY3VtZW50IHN0ZXAuYCk7XG4gICAgbGV0IGRvUXVlcmlmeSA9IHNlbGYucXVlcmlmeTtcbiAgICBsZXQgZm9yRWFjaCA9IHNlbGYuX2ZvckVhY2g7XG4gICAgbGV0IGl0ID0gc2VsZi5faXQ7XG4gICAgbGV0IGl0ZW1zID0gc2VsZi5faXRlbXM7XG4gICAgaWYgKGl0KSB7XG4gICAgICAgIGRlYnVnKFwiSXRlcmF0aW5nLlwiKTtcbiAgICAgICAgaXQubmV4dChmdW5jdGlvbiAoZXJyLCBkb2MpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZyhgTmV4dCBmYWlsZWQuXFxuJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICAgICAgY2FsbENvbnRleHQuZmFpbChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZG9jKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoYERvYyBnb3QsIHNjaGVkdWxpbmcgYm9keS5gKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9RdWVyaWZ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGRvYyA9IHF1ZXJpZnkoZG9jKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yRWFjaC5pdGVtcyA9IGRvYztcbiAgICAgICAgICAgICAgICBjYWxsQ29udGV4dC5zY2hlZHVsZShmb3JFYWNoLCBcIl9jb21wbGV0ZWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZyhcIkl0ZXJhdGlvbiBjb21wbGV0ZWQuXCIpO1xuICAgICAgICAgICAgICAgIGNhbGxDb250ZXh0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChpdGVtcykge1xuICAgICAgICBkZWJ1ZyhcIllpZWxkaW5nIGl0ZW1zLlwiKTtcbiAgICAgICAgZGVsZXRlIHNlbGYuX2l0ZW1zO1xuICAgICAgICBmb3JFYWNoLml0ZW1zID0gaXRlbXM7XG4gICAgICAgIGNhbGxDb250ZXh0LnNjaGVkdWxlKGZvckVhY2gsIFwiX2NvbXBsZXRlZFwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGRlYnVnKFwiWWllbGRpbmcgY29tcGxldGVkLlwiKTtcbiAgICAgICAgY2FsbENvbnRleHQuY29tcGxldGUoKTtcbiAgICB9XG59O1xuXG5FYWNoRG9jdW1lbnQucHJvdG90eXBlLl9jb21wbGV0ZWQgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIHJlYXNvbiwgcmVzdWx0KSB7XG4gICAgaWYgKHJlYXNvbiA9PT0gQWN0aXZpdHkuc3RhdGVzLmNvbXBsZXRlKSB7XG4gICAgICAgIGNhbGxDb250ZXh0LmFjdGl2aXR5Ll9kb1N0ZXAuY2FsbCh0aGlzLCBjYWxsQ29udGV4dCwgcmVzdWx0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNhbGxDb250ZXh0LmVuZChyZWFzb24sIHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFYWNoRG9jdW1lbnQ7Il19