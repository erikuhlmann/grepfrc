const mongoose = require("mongoose");

let CodeFileSchema = mongoose.Schema({
    team: { type: Number },
    year: { type: Number },
    purpose: { type: String },
    ghUrl: { type: String },
    path: { type: String },
    lines: [ { type: String } ]
});
CodeFileSchema.index({ lines: 'text' });

module.exports = mongoose.model('CodeFile', CodeFileSchema);