// @author Lauchlan Toal
// Endpoints for viewing/posting/editing/deleting threads and comments

//Import necessary dependencies
const express = require("express");
const router = express.Router();
const client = require("./../../db");
const userCookies = require("./../controllers/verifyUser"); 
const verifyUser = userCookies.verifyUser;

//Get all public forums info arranged by name
router.get("/", async (req, res) => {
	var forums;
	try {
		forums = await client.query("SELECT forumid, forumname, foruminfo FROM forums WHERE forumprivacy = 'public' ORDER BY forumname DESC", []);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	forums = forums.rows;
	return res.status(200).json(forums);
});

//Get all forums info arranged by name for current user
router.get("/user", async (req, res) => {
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.headers.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to view your forums"});
	}
	//Get all user's forums
	var forums;
	try {
		forums = await client.query("SELECT forumid, forumname, foruminfo FROM forums JOIN memberships ON (forumid = memberforum) WHERE memberuser = $1 AND memberrole > 1",[userid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	forums = forums.rows;
	return res.status(200).json(forums);
});

//Get forum info and all threads in a forum, and if user is a member
router.get("/:forumid", async (req, res) => {
	var forumid = req.params.forumid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.headers.cookie);
	} catch (err) {
		userid = null;
	}
	var forum;
	try {
		forum = await client.query("SELECT forumid, forumname, foruminfo, forumdate, forumprivacy FROM forums WHERE forumid = $1",[forumid]);
	} catch (err) {
		res.status(500).json({message: err.message});
	}
	forum = forum.rows;
	if (!forum[0]) {
		return res.status(404).json({message: "This forum does not exist"});
	}
	forum = forum[0];
	//If the user is logged in, determine their membership in the forum
	var membership = -1;
	if (userid != null) {
		try {
			membership = await client.query("SELECT memberrole FROM memberships WHERE memberforum = $1 AND memberuser = $2", [forumid, userid]);
		} catch (err) {
			res.status(500).json({message: err.message});
		}
		membership = membership.rows;
		if (!membership[0]) {
			membership = -1;
		} else {
			membership = membership[0].memberrole;
		}
	}
	//Return error if forum is private and user is not a member
	if (forum.forumprivacy == "private" && membership < 1) {
		return res.status(401).json({message: "You must be a member of a private forum to view its content"});
	}
	var threads;
	try {
		threads = await client.query("SELECT threadid, threadforum, threaduser, username, threadtitle, threaddate FROM threads JOIN users ON (threaduser = userid) WHERE threadforum = $1 ORDER BY threaddate DESC", [forumid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}	
	threads = threads.rows;
	return res.status(200).json({"forum":forum, "membership":membership, "threads":threads});
});

module.exports = router;
