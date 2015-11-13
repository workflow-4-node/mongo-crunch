"use strict";
"use strict";
var Bluebird = require("bluebird");
var async = Bluebird.coroutine;
var createIterator = require("./createIterator");
var config = require("../config");
var _ = require("lodash");
var misc = {
  flattenMRResult: function(scope, collection) {
    return misc.subDocumentToRoot(scope, collection, "value");
  },
  subDocumentToRoot: async($traceurRuntime.initGeneratorFunction(function $__7(scope, collection, path) {
    var q,
        fields,
        aDoc,
        project,
        pipeline,
        $__8,
        $__9,
        $__10,
        $__11,
        key,
        it,
        bulk,
        doc,
        count,
        originalId,
        $__12,
        $__13,
        $__14;
    return $traceurRuntime.createGeneratorInstance(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            q = {};
            q[path] = {$exists: true};
            fields = {_id: 0};
            fields[path] = 1;
            $ctx.state = 46;
            break;
          case 46:
            $ctx.state = 2;
            return collection.findOne(q, fields);
          case 2:
            aDoc = $ctx.sent;
            $ctx.state = 4;
            break;
          case 4:
            $ctx.state = (aDoc) ? 40 : -2;
            break;
          case 40:
            aDoc = aDoc[path];
            project = {__originalId: "$_id"};
            pipeline = [{$match: q}, {$project: project}];
            $ctx.state = 41;
            break;
          case 41:
            $__8 = [];
            $__9 = aDoc;
            for ($__10 in $__9)
              $__8.push($__10);
            $ctx.state = 16;
            break;
          case 16:
            $__11 = 0;
            $ctx.state = 14;
            break;
          case 14:
            $ctx.state = ($__11 < $__8.length) ? 8 : 12;
            break;
          case 11:
            $__11++;
            $ctx.state = 14;
            break;
          case 8:
            key = $__8[$__11];
            $ctx.state = 9;
            break;
          case 9:
            $ctx.state = (!(key in $__9)) ? 11 : 6;
            break;
          case 6:
            if (aDoc.hasOwnProperty(key)) {
              project[key] = "$" + path + "." + key;
            }
            $ctx.state = 11;
            break;
          case 12:
            it = createIterator(scope, collection.aggregate(pipeline, {allowDiskUse: true}));
            bulk = collection.initializeOrderedBulkOp({w: "majority"});
            count = 0;
            $ctx.state = 43;
            break;
          case 43:
            $__12 = it.nextAsync;
            $__13 = $__12.call(it);
            $ctx.state = 22;
            break;
          case 22:
            $ctx.state = 18;
            return $__13;
          case 18:
            $__14 = $ctx.sent;
            $ctx.state = 20;
            break;
          case 20:
            doc = $__14;
            $ctx.state = 24;
            break;
          case 24:
            $ctx.state = ($__14) ? 32 : 34;
            break;
          case 32:
            originalId = doc.__originalId;
            delete doc.__originalId;
            bulk.find({_id: originalId}).replaceOne(doc);
            count++;
            $ctx.state = 33;
            break;
          case 33:
            $ctx.state = (count >= config.bulkSize) ? 25 : 43;
            break;
          case 25:
            $ctx.state = 26;
            return bulk.execute();
          case 26:
            $ctx.maybeThrow();
            $ctx.state = 28;
            break;
          case 28:
            bulk = collection.initializeOrderedBulkOp();
            count = 0;
            $ctx.state = 43;
            break;
          case 34:
            $ctx.state = (count) ? 35 : -2;
            break;
          case 35:
            $ctx.state = 36;
            return bulk.execute();
          case 36:
            $ctx.maybeThrow();
            $ctx.state = -2;
            break;
          default:
            return $ctx.end();
        }
    }, $__7, this);
  })),
  deleteCollections: async($traceurRuntime.initGeneratorFunction(function $__15(db, shouldBeDeleted) {
    var cc,
        colls,
        $__3,
        $__4,
        $__5,
        $__1,
        $__0,
        coll,
        $__16,
        $__17,
        $__18,
        $__19,
        $__20,
        $__21,
        $__22,
        $__23,
        $__6;
    return $traceurRuntime.createGeneratorInstance(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            shouldBeDeleted = shouldBeDeleted || _.constant(true);
            cc = db.listCollections();
            $ctx.state = 34;
            break;
          case 34:
            $ctx.state = 2;
            return cc.toArray();
          case 2:
            colls = $ctx.sent;
            $ctx.state = 4;
            break;
          case 4:
            $__3 = true;
            $__4 = false;
            $__5 = undefined;
            $ctx.state = 36;
            break;
          case 36:
            $ctx.pushTry(20, 21);
            $ctx.state = 23;
            break;
          case 23:
            $__1 = void 0, $__0 = (colls)[$traceurRuntime.toProperty(Symbol.iterator)]();
            $ctx.state = 19;
            break;
          case 19:
            $ctx.state = (!($__3 = ($__1 = $__0.next()).done)) ? 15 : 17;
            break;
          case 12:
            $__3 = true;
            $ctx.state = 19;
            break;
          case 15:
            coll = $__1.value;
            $ctx.state = 16;
            break;
          case 16:
            $ctx.state = (!_.startsWith(coll.name, "system.")) ? 13 : 12;
            break;
          case 13:
            $ctx.state = (shouldBeDeleted(coll.name)) ? 9 : 12;
            break;
          case 9:
            $__16 = Bluebird.promisify;
            $__17 = db.collection;
            $__18 = $__16.call(Bluebird, $__17, {context: db});
            $__19 = coll.name;
            $__20 = $__18($__19);
            $ctx.state = 10;
            break;
          case 10:
            $ctx.state = 6;
            return $__20;
          case 6:
            $__21 = $ctx.sent;
            $ctx.state = 8;
            break;
          case 8:
            $__22 = $__21.drop;
            $__23 = $__22.call($__21);
            $ctx.state = 12;
            break;
          case 17:
            $ctx.popTry();
            $ctx.state = 21;
            $ctx.finallyFallThrough = -2;
            break;
          case 20:
            $ctx.popTry();
            $ctx.maybeUncatchable();
            $__6 = $ctx.storedException;
            $ctx.state = 26;
            break;
          case 26:
            $__4 = true;
            $__5 = $__6;
            $ctx.state = 21;
            $ctx.finallyFallThrough = -2;
            break;
          case 21:
            $ctx.popTry();
            $ctx.state = 32;
            break;
          case 32:
            try {
              if (!$__3 && $__0.return != null) {
                $__0.return();
              }
            } finally {
              if ($__4) {
                throw $__5;
              }
            }
            $ctx.state = 30;
            break;
          case 30:
            $ctx.state = $ctx.finallyFallThrough;
            break;
          default:
            return $ctx.end();
        }
    }, $__15, this);
  }))
};
module.exports = misc;
//# sourceMappingURL=data:application/json;base64,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LEFBQUMsRUFBQyxDQUFDO0FBQ2IsZUFBRyxpQkFBaUIsQUFBQyxFQUFDLENBQUM7QUFDdkIsaUJBQW9CLENBQUEsSUFBRyxnQkFBZ0IsQ0FBQzs7OztBQUk1QyxpQkFBb0IsS0FBRyxDQUFDO0FBQ3hCLHNCQUFvQyxDQUFDOztBQVIvQyxlQUFHLG1CQUFtQixLQUFvQixDQUFBOzs7QUFBMUMsZUFBRyxPQUFPLEFBQUMsRUFBQyxDQUFDOzs7O0FBVUgsY0FBSTtBQUNGLGlCQUFJLEtBQWlCLEdBQUssQ0FBQSxXQUF1QixHQUFLLEtBQUcsQ0FBRztBQUMxRCwwQkFBd0IsQUFBQyxFQUFDLENBQUM7Y0FDN0I7QUFBQSxZQUNGLENBQUUsT0FBUTtBQUNSLHNCQUF3QjtBQUN0QiwwQkFBd0I7Y0FDMUI7QUFBQSxZQUNGO0FBQUE7OztBQWpCWSxlQUFHLE1BQU0sRUFBSSxDQUFBLElBQUcsbUJBQW1CLENBQUM7QUFDcEMsaUJBQUs7O0FBRjNCLGlCQUFPLENBQUEsSUFBRyxJQUFJLEFBQUMsRUFBQyxDQUFBOztBQUNtQixJQUMvQixRQUE2QixLQUFHLENBQUMsQ0FBQztFQXVEbEMsQ0F6RG1ELENBeURsRDtBQUFBLEFBQ0wsQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLEtBQUcsQ0FBQztBQUFBIiwiZmlsZSI6ImFjdGl2aXRpZXMvbWlzYy5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XG5sZXQgYXN5bmMgPSBCbHVlYmlyZC5jb3JvdXRpbmU7XG5sZXQgY3JlYXRlSXRlcmF0b3IgPSByZXF1aXJlKFwiLi9jcmVhdGVJdGVyYXRvclwiKTtcbmxldCBjb25maWcgPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xuXG5sZXQgbWlzYyA9IHtcbiAgICBmbGF0dGVuTVJSZXN1bHQ6IGZ1bmN0aW9uKHNjb3BlLCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBtaXNjLnN1YkRvY3VtZW50VG9Sb290KHNjb3BlLCBjb2xsZWN0aW9uLCBcInZhbHVlXCIpO1xuICAgIH0sXG4gICAgc3ViRG9jdW1lbnRUb1Jvb3Q6IGFzeW5jKGZ1bmN0aW9uKihzY29wZSwgY29sbGVjdGlvbiwgcGF0aCkge1xuICAgICAgICBsZXQgcSA9IHt9O1xuICAgICAgICBxW3BhdGhdID0geyAkZXhpc3RzOiB0cnVlIH07XG4gICAgICAgIGxldCBmaWVsZHMgPSB7IF9pZDogMCB9O1xuICAgICAgICBmaWVsZHNbcGF0aF0gPSAxO1xuICAgICAgICBsZXQgYURvYyA9IHlpZWxkIGNvbGxlY3Rpb24uZmluZE9uZShxLCBmaWVsZHMpO1xuICAgICAgICBpZiAoYURvYykge1xuICAgICAgICAgICAgYURvYyA9IGFEb2NbcGF0aF07XG4gICAgICAgICAgICBsZXQgcHJvamVjdCA9IHsgX19vcmlnaW5hbElkOiBcIiRfaWRcIiB9O1xuICAgICAgICAgICAgbGV0IHBpcGVsaW5lID0gW3sgJG1hdGNoOiBxIH0sIHsgJHByb2plY3Q6IHByb2plY3QgfV07XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gYURvYykge1xuICAgICAgICAgICAgICAgIGlmIChhRG9jLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdFtrZXldID0gXCIkXCIgKyBwYXRoICsgXCIuXCIgKyBrZXk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGl0ID0gY3JlYXRlSXRlcmF0b3Ioc2NvcGUsIGNvbGxlY3Rpb24uYWdncmVnYXRlKHBpcGVsaW5lLCB7IGFsbG93RGlza1VzZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgICBsZXQgYnVsayA9IGNvbGxlY3Rpb24uaW5pdGlhbGl6ZU9yZGVyZWRCdWxrT3AoeyB3OiBcIm1ham9yaXR5XCIgfSk7XG4gICAgICAgICAgICBsZXQgZG9jO1xuICAgICAgICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChkb2MgPSAoeWllbGQgaXQubmV4dEFzeW5jKCkpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG9yaWdpbmFsSWQgPSBkb2MuX19vcmlnaW5hbElkO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkb2MuX19vcmlnaW5hbElkO1xuICAgICAgICAgICAgICAgIGJ1bGsuZmluZCh7IF9pZDogb3JpZ2luYWxJZCB9KS5yZXBsYWNlT25lKGRvYyk7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPj0gY29uZmlnLmJ1bGtTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIGJ1bGsuZXhlY3V0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBidWxrID0gY29sbGVjdGlvbi5pbml0aWFsaXplT3JkZXJlZEJ1bGtPcCgpO1xuICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgeWllbGQgYnVsay5leGVjdXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KSxcbiAgICBkZWxldGVDb2xsZWN0aW9uczogYXN5bmMoZnVuY3Rpb24qKGRiLCBzaG91bGRCZURlbGV0ZWQpIHtcbiAgICAgICAgc2hvdWxkQmVEZWxldGVkID0gc2hvdWxkQmVEZWxldGVkIHx8IF8uY29uc3RhbnQodHJ1ZSk7XG4gICAgICAgIGxldCBjYyA9IGRiLmxpc3RDb2xsZWN0aW9ucygpO1xuICAgICAgICBsZXQgY29sbHMgPSB5aWVsZCBjYy50b0FycmF5KCk7XG4gICAgICAgIGZvciAobGV0IGNvbGwgb2YgY29sbHMpIHtcbiAgICAgICAgICAgIGlmICghXy5zdGFydHNXaXRoKGNvbGwubmFtZSwgXCJzeXN0ZW0uXCIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZEJlRGVsZXRlZChjb2xsLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICh5aWVsZCBCbHVlYmlyZC5wcm9taXNpZnkoZGIuY29sbGVjdGlvbiwge2NvbnRleHQ6IGRifSkoY29sbC5uYW1lKSkuZHJvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1pc2M7Il19
