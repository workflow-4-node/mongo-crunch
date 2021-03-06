"use strict";
"use strict";
var MapReduceBase = require('./mapReduceBase');
var util = require("util");
function InlineMR() {
  MapReduceBase.call(this);
}
util.inherits(InlineMR, MapReduceBase);
InlineMR.prototype.doReduce = function(callContext, coll, map, reduce, options) {
  var self = this;
  options.out = {inline: 1};
  coll.mapReduce(map, reduce, options, function(err, result) {
    if (err) {
      callContext.fail(err);
    } else if (this.flatten) {
      callContext.complete(result.map(function(i) {
        return i.value;
      }));
    } else {
      callContext.complete(result);
    }
  });
};
module.exports = InlineMR;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlubGluZU1SLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsV0FBVyxDQUFDO0FBRVosQUFBSSxFQUFBLENBQUEsYUFBWSxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsaUJBQWdCLENBQUMsQ0FBQztBQUM5QyxBQUFJLEVBQUEsQ0FBQSxJQUFHLEVBQUksQ0FBQSxPQUFNLEFBQUMsQ0FBQyxNQUFLLENBQUMsQ0FBQztBQUUxQixPQUFTLFNBQU8sQ0FBRSxBQUFELENBQUc7QUFDaEIsY0FBWSxLQUFLLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQztBQUM1QjtBQUFBLEFBRUEsR0FBRyxTQUFTLEFBQUMsQ0FBQyxRQUFPLENBQUcsY0FBWSxDQUFDLENBQUM7QUFFdEMsT0FBTyxVQUFVLFNBQVMsRUFBSSxVQUFTLFdBQVUsQ0FBRyxDQUFBLElBQUcsQ0FBRyxDQUFBLEdBQUUsQ0FBRyxDQUFBLE1BQUssQ0FBRyxDQUFBLE9BQU0sQ0FBRztBQUM1RSxBQUFJLElBQUEsQ0FBQSxJQUFHLEVBQUksS0FBRyxDQUFDO0FBQ2YsUUFBTSxJQUFJLEVBQUksRUFBRSxNQUFLLENBQUcsRUFBQSxDQUFFLENBQUM7QUFDM0IsS0FBRyxVQUFVLEFBQUMsQ0FBQyxHQUFFLENBQUcsT0FBSyxDQUFHLFFBQU0sQ0FBRyxVQUFTLEdBQUUsQ0FBRyxDQUFBLE1BQUssQ0FBRztBQUN2RCxPQUFJLEdBQUUsQ0FBRztBQUNMLGdCQUFVLEtBQUssQUFBQyxDQUFDLEdBQUUsQ0FBQyxDQUFDO0lBQ3pCLEtBQ0ssS0FBSSxJQUFHLFFBQVEsQ0FBRztBQUNuQixnQkFBVSxTQUFTLEFBQUMsQ0FBQyxNQUFLLElBQUksQUFBQyxDQUFDLFNBQVMsQ0FBQSxDQUFHO0FBQUUsYUFBTyxDQUFBLENBQUEsTUFBTSxDQUFDO01BQUUsQ0FBQyxDQUFDLENBQUM7SUFDckUsS0FDSztBQUNELGdCQUFVLFNBQVMsQUFBQyxDQUFDLE1BQUssQ0FBQyxDQUFDO0lBQ2hDO0FBQUEsRUFDSixDQUFDLENBQUM7QUFDTixDQUFDO0FBRUQsS0FBSyxRQUFRLEVBQUksU0FBTyxDQUFDO0FBQ3pCIiwiZmlsZSI6ImFjdGl2aXRpZXMvaW5saW5lTVIuanMiLCJzb3VyY2VSb290IjoibGliL2VzNiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxubGV0IE1hcFJlZHVjZUJhc2UgPSByZXF1aXJlKCcuL21hcFJlZHVjZUJhc2UnKTtcclxubGV0IHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcclxuXHJcbmZ1bmN0aW9uIElubGluZU1SKCkge1xyXG4gICAgTWFwUmVkdWNlQmFzZS5jYWxsKHRoaXMpO1xyXG59XHJcblxyXG51dGlsLmluaGVyaXRzKElubGluZU1SLCBNYXBSZWR1Y2VCYXNlKTtcclxuXHJcbklubGluZU1SLnByb3RvdHlwZS5kb1JlZHVjZSA9IGZ1bmN0aW9uKGNhbGxDb250ZXh0LCBjb2xsLCBtYXAsIHJlZHVjZSwgb3B0aW9ucykge1xyXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xyXG4gICAgb3B0aW9ucy5vdXQgPSB7IGlubGluZTogMSB9O1xyXG4gICAgY29sbC5tYXBSZWR1Y2UobWFwLCByZWR1Y2UsIG9wdGlvbnMsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICBjYWxsQ29udGV4dC5mYWlsKGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuZmxhdHRlbikge1xyXG4gICAgICAgICAgICBjYWxsQ29udGV4dC5jb21wbGV0ZShyZXN1bHQubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIGkudmFsdWU7IH0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbGxDb250ZXh0LmNvbXBsZXRlKHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElubGluZU1SO1xyXG4iXX0=
