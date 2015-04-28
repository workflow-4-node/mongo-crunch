var es6 = true;
try {
    eval("(function *(){})");
} catch(err) {
    es6 = false;
}

if (es6) {
    module.exports = {
        activities: require("./lib/activities")
    };
}
else {
    require("traceur");
    module.exports = {
        activities: require("./lib4node/activities")
    };
}
