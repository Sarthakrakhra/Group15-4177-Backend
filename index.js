const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const port = process.env.port || 3001;
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const userRoute = require("./api/routes/userRoute");
const searchRoute = require("./api/routes/searchRoute");

app.use("/user", userRoute);
app.use("/search", searchRoute);

const server = http.createServer(app);
server.listen(port);
