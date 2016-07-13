var fluent = require('fluent-logger-node');
var logger;
var counter = 0;
var sleep = require('sleep');

module.exports.fluentLogger = function(data, db, col) {
    // console.log("***********************************************");
    // console.log("***********************************************");
    // console.log("***********************************************");
    // console.log("***********************************************");
    // console.log("***********************************************");
    // console.log("***********************************************");
    // console.log("col", col);
    // console.log("data", data);
    // console.log("db", db);
    if (col !== undefined && data !== undefined) {
        // console.log(logger);
        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");

        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");

        console.log(data);
        // process.stdout.write(".");
        logger.post(col, data);
        sleep.usleep(300000);
        // console.log("dumping to fluent DB: " + db + " collection: " + col + "counter= " + counter);
        // counter++;
    }
};


module.exports.loggerIntializer = function(tagPrefix) {
    logger = fluent.createLogger({
        host: "localhost",
        port: 24242,
        tagPrefix: tagPrefix
    });
};
