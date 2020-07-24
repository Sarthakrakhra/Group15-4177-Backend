//Author: Sally Keating | B00739692

var express = require('express');
var app = express.Router();
var fileUpload = require('express-fileupload');

app.use(fileUpload());

app.post('/upload', (req, res) => {
    console.log(req.files.fileToUpload);

    if(req.files === null){
        console.log("No file uploaded");
    }

    var file = req.files.file;
    //Move file? to public folder in frontend?
    



    // const queryString = "";
    // connection.query(queryString, function(error, rows, fields){
    //     if (error){
    //         console.log(error);
    //     }
    //     res.json(rows);
    // });
});

module.exports = app;
