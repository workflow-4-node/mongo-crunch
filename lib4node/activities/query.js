"use strict";
var CollectionOp = require('./collectionOp');
var util = require('util');
var Activity = require("../../deps/workflow-4-node").activities.Activity;
function Query() {
  CollectionOp.call(this);
  this.query = null;
  this.options = null;
  this.nonScopedProperties.add("doQuery");
}
util.inherits(Query, CollectionOp);
Query.prototype.doWork = function(callContext) {
  callContext.schedule(this.get('query'), '_queryGot');
};
Query.prototype._queryGot = function(callContext, reason, result) {
  if (result === Activity.states.complete) {
    callContext.activity.doQuery.call(this, callContext, result);
  } else {
    callContext.end(reason, result);
  }
};
Query.prototype.doQuery = function(callContext, query) {
  callContext.fail(new Error("Not implemented!"));
};
module.exports = Query;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsQUFBSSxFQUFBLENBQUEsWUFBVyxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsZ0JBQWUsQ0FBQyxDQUFDO0FBQzVDLEFBQUksRUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLE1BQUssQ0FBQyxDQUFDO0FBQzFCLEFBQUksRUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLDRCQUEyQixDQUFDLFdBQVcsU0FBUyxDQUFDO0FBRXhFLE9BQVMsTUFBSSxDQUFFLEFBQUQsQ0FBRztBQUNiLGFBQVcsS0FBSyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUM7QUFDdkIsS0FBRyxNQUFNLEVBQUksS0FBRyxDQUFDO0FBQ2pCLEtBQUcsUUFBUSxFQUFJLEtBQUcsQ0FBQztBQUNuQixLQUFHLG9CQUFvQixJQUFJLEFBQUMsQ0FBQyxTQUFRLENBQUMsQ0FBQztBQUMzQztBQUFBLEFBRUEsR0FBRyxTQUFTLEFBQUMsQ0FBQyxLQUFJLENBQUcsYUFBVyxDQUFDLENBQUM7QUFFbEMsSUFBSSxVQUFVLE9BQU8sRUFBSSxVQUFVLFdBQVUsQ0FBRztBQUM1QyxZQUFVLFNBQVMsQUFBQyxDQUFDLElBQUcsSUFBSSxBQUFDLENBQUMsT0FBTSxDQUFDLENBQUcsWUFBVSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELElBQUksVUFBVSxVQUFVLEVBQUksVUFBVSxXQUFVLENBQUcsQ0FBQSxNQUFLLENBQUcsQ0FBQSxNQUFLLENBQUc7QUFDL0QsS0FBSSxNQUFLLElBQU0sQ0FBQSxRQUFPLE9BQU8sU0FBUyxDQUFHO0FBQ3JDLGNBQVUsU0FBUyxRQUFRLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBRyxZQUFVLENBQUcsT0FBSyxDQUFDLENBQUM7RUFDaEUsS0FDSztBQUNELGNBQVUsSUFBSSxBQUFDLENBQUMsTUFBSyxDQUFHLE9BQUssQ0FBQyxDQUFDO0VBQ25DO0FBQUEsQUFDSixDQUFBO0FBRUEsSUFBSSxVQUFVLFFBQVEsRUFBSSxVQUFTLFdBQVUsQ0FBRyxDQUFBLEtBQUksQ0FBRztBQUNuRCxZQUFVLEtBQUssQUFBQyxDQUFDLEdBQUksTUFBSSxBQUFDLENBQUMsa0JBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUE7QUFFQSxLQUFLLFFBQVEsRUFBSSxNQUFJLENBQUM7QUFDdEIiLCJmaWxlIjoiYWN0aXZpdGllcy9xdWVyeS5qcyIsInNvdXJjZVJvb3QiOiJDOi9HSVQvbW9uZ28tY3J1bmNoL2xpYi8iLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgQ29sbGVjdGlvbk9wID0gcmVxdWlyZSgnLi9jb2xsZWN0aW9uT3AnKTtcclxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoXCIuLi8uLi9kZXBzL3dvcmtmbG93LTQtbm9kZVwiKS5hY3Rpdml0aWVzLkFjdGl2aXR5O1xyXG5cclxuZnVuY3Rpb24gUXVlcnkoKSB7XHJcbiAgICBDb2xsZWN0aW9uT3AuY2FsbCh0aGlzKTtcclxuICAgIHRoaXMucXVlcnkgPSBudWxsO1xyXG4gICAgdGhpcy5vcHRpb25zID0gbnVsbDtcclxuICAgIHRoaXMubm9uU2NvcGVkUHJvcGVydGllcy5hZGQoXCJkb1F1ZXJ5XCIpO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKFF1ZXJ5LCBDb2xsZWN0aW9uT3ApO1xyXG5cclxuUXVlcnkucHJvdG90eXBlLmRvV29yayA9IGZ1bmN0aW9uIChjYWxsQ29udGV4dCkge1xyXG4gICAgY2FsbENvbnRleHQuc2NoZWR1bGUodGhpcy5nZXQoJ3F1ZXJ5JyksICdfcXVlcnlHb3QnKTtcclxufTtcclxuXHJcblF1ZXJ5LnByb3RvdHlwZS5fcXVlcnlHb3QgPSBmdW5jdGlvbiAoY2FsbENvbnRleHQsIHJlYXNvbiwgcmVzdWx0KSB7XHJcbiAgICBpZiAocmVzdWx0ID09PSBBY3Rpdml0eS5zdGF0ZXMuY29tcGxldGUpIHtcclxuICAgICAgICBjYWxsQ29udGV4dC5hY3Rpdml0eS5kb1F1ZXJ5LmNhbGwodGhpcywgY2FsbENvbnRleHQsIHJlc3VsdCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsQ29udGV4dC5lbmQocmVhc29uLCByZXN1bHQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5RdWVyeS5wcm90b3R5cGUuZG9RdWVyeSA9IGZ1bmN0aW9uKGNhbGxDb250ZXh0LCBxdWVyeSkge1xyXG4gICAgY2FsbENvbnRleHQuZmFpbChuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQhXCIpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeTtcclxuIl19
