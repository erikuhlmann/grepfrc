const mongoose = require("mongoose");
mongoose.Promise = Promise;
require('./CodeFile');
module.exports = function(cb) {
    mongoose.connect(`mongodb://${process.env.db_user}:${process.env.db_pass}@${process.env.db_host}/${process.env.db_name}`);
    let db = mongoose.connection;
    db.on('error', e => {
        console.error(e.message);
        process.exit(1);
    });
    db.once('open', function() {
        console.log("db open");
        cb();
    });
}