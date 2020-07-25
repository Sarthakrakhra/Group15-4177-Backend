//Author: Sally Keating | B00739692

var express = require('express');
var app = express.Router();
var fileUpload = require('express-fileupload');

app.use(fileUpload());

//posts data to the api path
app.post("/upload", (request, result) => {
    console.log(request.files.fileToUpload);

    if(request.files === null){
        console.log("No file uploaded ");
    }

    const media = request.files.file;

    media.mv(`../../public/uploadedMedia/${media.name}`, error => {
        if (error){
            console.log('an error arose when attempting to store the file ' + error);
            result.status(500).send(error);
        }
        result.json({mediaTitle: media.name, filePath: `/uploadedMedia/${media.name}`})
    });
});

module.exports = app;
