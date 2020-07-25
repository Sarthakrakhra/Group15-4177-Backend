// @author Lauchlan Toal

//Import necessary dependencies
const express = require("express");
const router = express.Router();
const client = require("./../../db");
const verifyUser = require("./../controllers/verifyUser");

//Get all public forums info arranged by name
router.get("/:forumid", async (req, res) => {

});

//Get all forums info arranged by name for current user
router.get("/:forumid", async (req, res) => {

});

//Get forum info and all threads in a forum
router.get("/:threadid", async (req, res) => {

});

module.exports = router;
