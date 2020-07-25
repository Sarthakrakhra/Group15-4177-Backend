const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");


app.use(cors());
app.use(bodyParser.json());

const userRoute = require("./api/routes/userRoute");
const threadRoute = require("./api/routes/threadRoute");
const mediaUploadRoute = require("./api/routes/mediauploadRoute");

app.use("/user", userRoute);
app.use("/thread", threadRoute);
app.use("/upload", mediaUploadRoute);

const server = http.createServer(app);
server.listen(port);
