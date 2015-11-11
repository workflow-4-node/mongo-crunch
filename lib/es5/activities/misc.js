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
  subDocumentToRoot: async($traceurRuntime.initGeneratorFunction(function $__9(scope, collection, path) {
    var q,
        fields,
        aDoc,
        project,
        pipeline,
        $__10,
        $__11,
        $__12,
        $__13,
        key,
        it,
        bulk,
        doc,
        count,
        originalId,
        $__14,
        $__15,
        $__16;
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
            $__10 = [];
            $__11 = aDoc;
            for ($__12 in $__11)
              $__10.push($__12);
            $ctx.state = 16;
            break;
          case 16:
            $__13 = 0;
            $ctx.state = 14;
            break;
          case 14:
            $ctx.state = ($__13 < $__10.length) ? 8 : 12;
            break;
          case 11:
            $__13++;
            $ctx.state = 14;
            break;
          case 8:
            key = $__10[$__13];
            $ctx.state = 9;
            break;
          case 9:
            $ctx.state = (!(key in $__11)) ? 11 : 6;
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
            $__14 = it.nextAsync;
            $__15 = $__14.call(it);
            $ctx.state = 22;
            break;
          case 22:
            $ctx.state = 18;
            return $__15;
          case 18:
            $__16 = $ctx.sent;
            $ctx.state = 20;
            break;
          case 20:
            doc = $__16;
            $ctx.state = 24;
            break;
          case 24:
            $ctx.state = ($__16) ? 32 : 34;
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
    }, $__9, this);
  })),
  deleteCollections: async($traceurRuntime.initGeneratorFunction(function $__17(db, shouldBeDeleted) {
    var cc,
        colls,
        $__5,
        $__6,
        $__7,
        $__3,
        $__2,
        coll,
        $__18,
        $__19,
        $__20,
        $__21,
        $__22,
        $__23,
        $__24,
        $__25,
        $__8;
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
            $__5 = true;
            $__6 = false;
            $__7 = undefined;
            $ctx.state = 36;
            break;
          case 36:
            $ctx.pushTry(20, 21);
            $ctx.state = 23;
            break;
          case 23:
            $__3 = void 0, $__2 = (colls)[Symbol.iterator]();
            $ctx.state = 19;
            break;
          case 19:
            $ctx.state = (!($__5 = ($__3 = $__2.next()).done)) ? 15 : 17;
            break;
          case 12:
            $__5 = true;
            $ctx.state = 19;
            break;
          case 15:
            coll = $__3.value;
            $ctx.state = 16;
            break;
          case 16:
            $ctx.state = (!_.startsWith(coll.name, "system.")) ? 13 : 12;
            break;
          case 13:
            $ctx.state = (shouldBeDeleted(coll.name)) ? 9 : 12;
            break;
          case 9:
            $__18 = Bluebird.promisify;
            $__19 = db.collection;
            $__20 = $__18.call(Bluebird, $__19, {context: db});
            $__21 = coll.name;
            $__22 = $__20($__21);
            $ctx.state = 10;
            break;
          case 10:
            $ctx.state = 6;
            return $__22;
          case 6:
            $__23 = $ctx.sent;
            $ctx.state = 8;
            break;
          case 8:
            $__24 = $__23.drop;
            $__25 = $__24.call($__23);
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
            $__8 = $ctx.storedException;
            $ctx.state = 26;
            break;
          case 26:
            $__6 = true;
            $__7 = $__8;
            $ctx.state = 21;
            $ctx.finallyFallThrough = -2;
            break;
          case 21:
            $ctx.popTry();
            $ctx.state = 32;
            break;
          case 32:
            try {
              if (!$__5 && $__2.return != null) {
                $__2.return();
              }
            } finally {
              if ($__6) {
                throw $__7;
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
    }, $__17, this);
  }))
};
module.exports = misc;
//# sourceMappingURL=data:application/json;base64,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QyxDQUFDO0FBQ3ZCLGlCQUFvQixDQUFBLElBQUcsZ0JBQWdCLENBQUM7Ozs7QUFJNUMsaUJBQW9CLEtBQUcsQ0FBQztBQUN4QixzQkFBb0MsQ0FBQzs7QUFSL0MsZUFBRyxtQkFBbUIsS0FBb0IsQ0FBQTs7O0FBQTFDLGVBQUcsT0FBTyxBQUFDLEVBQUMsQ0FBQzs7OztBQVVILGNBQUk7QUFDRixpQkFBSSxLQUFpQixHQUFLLENBQUEsV0FBdUIsR0FBSyxLQUFHLENBQUc7QUFDMUQsMEJBQXdCLEFBQUMsRUFBQyxDQUFDO2NBQzdCO0FBQUEsWUFDRixDQUFFLE9BQVE7QUFDUixzQkFBd0I7QUFDdEIsMEJBQXdCO2NBQzFCO0FBQUEsWUFDRjtBQUFBOzs7QUFqQlksZUFBRyxNQUFNLEVBQUksQ0FBQSxJQUFHLG1CQUFtQixDQUFDO0FBQ3BDLGlCQUFLOztBQUYzQixpQkFBTyxDQUFBLElBQUcsSUFBSSxBQUFDLEVBQUMsQ0FBQTs7QUFDbUIsSUFDL0IsUUFBNkIsS0FBRyxDQUFDLENBQUM7RUF1RGxDLENBekRtRCxDQXlEbEQ7QUFBQSxBQUNMLENBQUM7QUFFRCxLQUFLLFFBQVEsRUFBSSxLQUFHLENBQUM7QUFBQSIsImZpbGUiOiJhY3Rpdml0aWVzL21pc2MuanMiLCJzb3VyY2VSb290IjoibGliL2VzNiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5sZXQgQmx1ZWJpcmQgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XHJcbmxldCBhc3luYyA9IEJsdWViaXJkLmNvcm91dGluZTtcclxubGV0IGNyZWF0ZUl0ZXJhdG9yID0gcmVxdWlyZShcIi4vY3JlYXRlSXRlcmF0b3JcIik7XHJcbmxldCBjb25maWcgPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xyXG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XHJcblxyXG5sZXQgbWlzYyA9IHtcclxuICAgIGZsYXR0ZW5NUlJlc3VsdDogZnVuY3Rpb24oc2NvcGUsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICByZXR1cm4gbWlzYy5zdWJEb2N1bWVudFRvUm9vdChzY29wZSwgY29sbGVjdGlvbiwgXCJ2YWx1ZVwiKTtcclxuICAgIH0sXHJcbiAgICBzdWJEb2N1bWVudFRvUm9vdDogYXN5bmMoZnVuY3Rpb24qKHNjb3BlLCBjb2xsZWN0aW9uLCBwYXRoKSB7XHJcbiAgICAgICAgbGV0IHEgPSB7fTtcclxuICAgICAgICBxW3BhdGhdID0geyAkZXhpc3RzOiB0cnVlIH07XHJcbiAgICAgICAgbGV0IGZpZWxkcyA9IHsgX2lkOiAwIH07XHJcbiAgICAgICAgZmllbGRzW3BhdGhdID0gMTtcclxuICAgICAgICBsZXQgYURvYyA9IHlpZWxkIGNvbGxlY3Rpb24uZmluZE9uZShxLCBmaWVsZHMpO1xyXG4gICAgICAgIGlmIChhRG9jKSB7XHJcbiAgICAgICAgICAgIGFEb2MgPSBhRG9jW3BhdGhdO1xyXG4gICAgICAgICAgICBsZXQgcHJvamVjdCA9IHsgX19vcmlnaW5hbElkOiBcIiRfaWRcIiB9O1xyXG4gICAgICAgICAgICBsZXQgcGlwZWxpbmUgPSBbeyAkbWF0Y2g6IHEgfSwgeyAkcHJvamVjdDogcHJvamVjdCB9XTtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGFEb2MpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhRG9jLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9qZWN0W2tleV0gPSBcIiRcIiArIHBhdGggKyBcIi5cIiArIGtleTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgaXQgPSBjcmVhdGVJdGVyYXRvcihzY29wZSwgY29sbGVjdGlvbi5hZ2dyZWdhdGUocGlwZWxpbmUsIHsgYWxsb3dEaXNrVXNlOiB0cnVlIH0pKTtcclxuICAgICAgICAgICAgbGV0IGJ1bGsgPSBjb2xsZWN0aW9uLmluaXRpYWxpemVPcmRlcmVkQnVsa09wKHsgdzogXCJtYWpvcml0eVwiIH0pO1xyXG4gICAgICAgICAgICBsZXQgZG9jO1xyXG4gICAgICAgICAgICBsZXQgY291bnQgPSAwO1xyXG4gICAgICAgICAgICB3aGlsZSAoZG9jID0gKHlpZWxkIGl0Lm5leHRBc3luYygpKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG9yaWdpbmFsSWQgPSBkb2MuX19vcmlnaW5hbElkO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGRvYy5fX29yaWdpbmFsSWQ7XHJcbiAgICAgICAgICAgICAgICBidWxrLmZpbmQoeyBfaWQ6IG9yaWdpbmFsSWQgfSkucmVwbGFjZU9uZShkb2MpO1xyXG4gICAgICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA+PSBjb25maWcuYnVsa1NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICB5aWVsZCBidWxrLmV4ZWN1dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBidWxrID0gY29sbGVjdGlvbi5pbml0aWFsaXplT3JkZXJlZEJ1bGtPcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY291bnQpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIGJ1bGsuZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSksXHJcbiAgICBkZWxldGVDb2xsZWN0aW9uczogYXN5bmMoZnVuY3Rpb24qKGRiLCBzaG91bGRCZURlbGV0ZWQpIHtcclxuICAgICAgICBzaG91bGRCZURlbGV0ZWQgPSBzaG91bGRCZURlbGV0ZWQgfHwgXy5jb25zdGFudCh0cnVlKTtcclxuICAgICAgICBsZXQgY2MgPSBkYi5saXN0Q29sbGVjdGlvbnMoKTtcclxuICAgICAgICBsZXQgY29sbHMgPSB5aWVsZCBjYy50b0FycmF5KCk7XHJcbiAgICAgICAgZm9yIChsZXQgY29sbCBvZiBjb2xscykge1xyXG4gICAgICAgICAgICBpZiAoIV8uc3RhcnRzV2l0aChjb2xsLm5hbWUsIFwic3lzdGVtLlwiKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZEJlRGVsZXRlZChjb2xsLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgKHlpZWxkIEJsdWViaXJkLnByb21pc2lmeShkYi5jb2xsZWN0aW9uLCB7Y29udGV4dDogZGJ9KShjb2xsLm5hbWUpKS5kcm9wKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtaXNjOyJdfQ==
