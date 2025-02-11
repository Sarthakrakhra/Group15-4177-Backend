/**
 * @author Sarthak Rakhra, Lauchlan Toal, Sally Keating, Skyler Boutilier
 */

const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");

const bodyParser = require("body-parser");


app.use(cors());
app.use(bodyParser.json());

const userRoute = require("./api/routes/userRoute");
const threadRoute = require("./api/routes/threadRoute");
const mediaUploadRoute = require("./api/routes/mediauploadRoute");

const searchRoute = require("./api/routes/searchRoute");
const messagingRoute = require("./api/routes/messagingRoute");

app.use("/user", userRoute);
app.use("/thread", threadRoute);
app.use("/upload", mediaUploadRoute);
app.use("/search", searchRoute);
app.use("/messaging", messagingRoute);

const forumRoute = require("./api/routes/forumRoute");
app.use("/forum", forumRoute);

app.use((req, res, next) => {
  res.send({ Message: "it works!" });
});

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port);
console.log(`Listening on port ${port}`);
