const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const userRoute = require("./api/routes/userRoute");

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.send({ Message: "it works!" });
});

app.use("/user", userRoute);

const port = process.env.port || 3000;
const server = http.createServer(app);
server.listen(port);
