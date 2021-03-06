"use strict";
"use strict";
var wf4node = require("workflow-4-node");
var util = require("util");
var Composite = wf4node.activities.Composite;
var path = require("path");
var Collection = require("mongodb").Collection;
function ToArray() {
  Composite.call(this);
  this.documents = null;
}
util.inherits(ToArray, Composite);
ToArray.prototype.createImplementation = function() {
  return {
    "@require": __dirname,
    "@block": {
      root: "= this.$parent",
      result: [],
      args: [{"@eachDocument": {
          documents: "= this.root.documents",
          args: function() {
            this.result.push(this.document);
          }
        }}, "= this.result"]
    }
  };
};
module.exports = ToArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRvQXJyYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxXQUFXLENBQUM7QUFFWixBQUFJLEVBQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hDLEFBQUksRUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLE1BQUssQ0FBQyxDQUFDO0FBQzFCLEFBQUksRUFBQSxDQUFBLFNBQVEsRUFBSSxDQUFBLE9BQU0sV0FBVyxVQUFVLENBQUM7QUFDNUMsQUFBSSxFQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsTUFBSyxDQUFDLENBQUM7QUFDMUIsQUFBSSxFQUFBLENBQUEsVUFBUyxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsU0FBUSxDQUFDLFdBQVcsQ0FBQztBQUU5QyxPQUFTLFFBQU0sQ0FBRSxBQUFELENBQUc7QUFDZixVQUFRLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDO0FBRXBCLEtBQUcsVUFBVSxFQUFJLEtBQUcsQ0FBQztBQUN6QjtBQUFBLEFBRUEsR0FBRyxTQUFTLEFBQUMsQ0FBQyxPQUFNLENBQUcsVUFBUSxDQUFDLENBQUM7QUFFakMsTUFBTSxVQUFVLHFCQUFxQixFQUFJLFVBQVMsQUFBRCxDQUFHO0FBQ2hELE9BQU87QUFDSCxhQUFTLENBQUcsVUFBUTtBQUNwQixXQUFPLENBQUc7QUFDTixTQUFHLENBQUcsaUJBQWU7QUFDckIsV0FBSyxDQUFHLEdBQUM7QUFDVCxTQUFHLENBQUcsRUFDRixDQUNJLGVBQWMsQ0FBRztBQUNiLGtCQUFRLENBQUcsd0JBQXNCO0FBQ2pDLGFBQUcsQ0FBRyxVQUFTLEFBQUQsQ0FBRztBQUNiLGVBQUcsT0FBTyxLQUFLLEFBQUMsQ0FBQyxJQUFHLFNBQVMsQ0FBQyxDQUFDO1VBQ25DO0FBQUEsUUFDSixDQUNKLENBQ0EsZ0JBQWMsQ0FDbEI7QUFBQSxJQUNKO0FBQUEsRUFDSixDQUFDO0FBQ0wsQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLFFBQU0sQ0FBQztBQUFBIiwiZmlsZSI6ImFjdGl2aXRpZXMvdG9BcnJheS5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5sZXQgd2Y0bm9kZSA9IHJlcXVpcmUoXCJ3b3JrZmxvdy00LW5vZGVcIik7XHJcbmxldCB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XHJcbmxldCBDb21wb3NpdGUgPSB3ZjRub2RlLmFjdGl2aXRpZXMuQ29tcG9zaXRlO1xyXG5sZXQgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG5sZXQgQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJtb25nb2RiXCIpLkNvbGxlY3Rpb247XHJcblxyXG5mdW5jdGlvbiBUb0FycmF5KCkge1xyXG4gICAgQ29tcG9zaXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5kb2N1bWVudHMgPSBudWxsO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKFRvQXJyYXksIENvbXBvc2l0ZSk7XHJcblxyXG5Ub0FycmF5LnByb3RvdHlwZS5jcmVhdGVJbXBsZW1lbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBcIkByZXF1aXJlXCI6IF9fZGlybmFtZSxcclxuICAgICAgICBcIkBibG9ja1wiOiB7XHJcbiAgICAgICAgICAgIHJvb3Q6IFwiPSB0aGlzLiRwYXJlbnRcIixcclxuICAgICAgICAgICAgcmVzdWx0OiBbXSxcclxuICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQGVhY2hEb2N1bWVudFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50czogXCI9IHRoaXMucm9vdC5kb2N1bWVudHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3VsdC5wdXNoKHRoaXMuZG9jdW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFwiPSB0aGlzLnJlc3VsdFwiXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUb0FycmF5OyJdfQ==
