/**
 * Main server script
 */
require('dotenv').config();
const express = require("express");
const app = express();
const openDb = require('./db');
const CodeFile = require('./CodeFile');

const code_filter = /(java|cpp|h|c|js|css|html|py)$/;

app.use(express.static('public'));

app.get('/search', function(req, res) {
    let query = {
        $text: { $search: req.query.q },
        path : { $regex: code_filter }
    };
    CodeFile.find(query, {
        score: { $meta: 'textScore' }
    }).sort({
        score: { $meta:'textScore' }
    }).then(function(result) {
        res.json(result);
    })
});

openDb(function(){
    const port = process.env.port || 3000;
    
    app.listen(port, function() {
        console.log('Listening on https://' + (process.env.hostname || 'localhost') + ':' + port);
    });
});