const express = require("express");
const router = express.Router();
const { userData } = require("../models/userModel");
const { v4: uuidv4 } = require("uuid"); // used to create the uuid
const {
  searchUser,
  addUser,
  updateUsername,
} = require("../controllers/userController");

router.get("/", (req, res) => {
  res.status(200).json(userData);
});

router.get("/searchUser/:uuid", (req, res) => {
  const userId = req.params.uuid;

  try {
    const user = searchUser("uuid", userId);
    res.status(200).json(user);
  } catch (err) {
    res.status(406).json({
      msg: "Not found",
    });
  }
});

//post route to add new user
router.post("/addUser", (req, res) => {
  try {
    addUser(uuidv4(), req.body);
    res.status(200).json({
      msg: "User added!",
    });
  } catch (err) {
    res.status(403).json({
      msg: err.message,
    });
  }
});

// put route to update/modify a user
router.put("/modifyUser", (req, res) => {
  try {
    updateUsername(req.body.uuid, req.body.username);
    res.status(200).json({
      msg: "User updated",
    });
  } catch (err) {
    res.status(409).json({
      msg: err.message,
    });
  }
});

module.exports = router;
