var gulp = require("gulp");
var traceur = require("gulp-traceur");

gulp.task("lib", function () {
    return gulp.src("lib/**/*.js")
        .pipe(traceur({ sourceMaps: "inline" }))
        .pipe(gulp.dest("lib4node"));
});

gulp.task("wflib", function () {
    return gulp.src("deps/workflow-4-node/lib/**/*.js")
        .pipe(traceur({ sourceMaps: "inline" }))
        .pipe(gulp.dest("deps/workflow-4-node/lib4node"));
});

gulp.task("default", ["lib", "wflib"]);