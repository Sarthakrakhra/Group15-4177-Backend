const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
var fileUpload = require('express-fileupload');

app.use(fileUpload());

app.use(cors());
app.use(bodyParser.json());

const userRoute = require("./api/routes/userRoute");

app.use("/user", userRoute);

const server = http.createServer(app);
server.listen(port);
