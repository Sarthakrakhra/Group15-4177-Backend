const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");

const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const userRoute = require("./api/routes/userRoute");
const threadRoute = require("./api/routes/threadRoute");
const forumRoute = require("./api/routes/forumRoute");

app.use("/user", userRoute);
app.use("/thread", threadRoute);
app.use("/forum", forumRoute);

app.use((req, res, next) => {
  res.send({ Message: "it works!" });
});

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port);
console.log(`Listening on port ${port}`);
