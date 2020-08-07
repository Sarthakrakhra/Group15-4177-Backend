// @author Lauchlan Toal
// Endpoints for viewing forums

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
		userid = await verifyUser(req.body.cookie);
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
		userid = await verifyUser(req.body.cookie);
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

//Create a new forum
router.post("/", async (req, res) => {
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to create a forum"});
	}
	
	//Validate input data
	if (!req.body.data) {
		return res.status(400).json({message:"You must send forum details to create a forum"});
	}
	if (!req.body.data.name || !req.body.data.info || !req.body.data.privacy) {
		return res.status(400).json({message:"You must send name, info, and privacy to create a forum"});
	}
	if (req.body.data.privacy != "public" && req.body.data.privacy != "private") {
		return res.status(400).json({message:"Privacy must be private or public"});
	}
	if (req.body.data.name.length > 255) {
		return res.status(400).json({message:"Forum name may not exceed 255 characters"});
	}
	
	//Create forum
	try {
		await client.query("INSERT INTO forums (forumname, foruminfo, forumprivacy, forumdate, forumflagged) VALUES ($1, $2, $3, NOW(), 0)", [req.body.data.name, req.body.data.info, req.body.data.privacy]);
		await client.query("INSERT INTO memberships (memberforum, memberuser, memberrole, memberdate) VALUES ((SELECT forumid FROM forums WHERE forumname = $1), $2, 5, NOW())", [req.body.data.name, userid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	
	return res.status(201).json({message: "Forum created successfully!"});
	
});

//Join a forum
router.get("/join/:forumid", async (req, res) => {
	var forumid = req.params.forumid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to join a forum"});
	}
	//Verify forum exists
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
	//Verify user is not already a member or banned
	try {
		var membership = await client.query("SELECT * FROM memberships WHERE memberforum = $1 AND memberuser = $2", [forumid, userid]);
		if (membership.rows[0]) {
			return res.status(409).json({message: "You already have a role in this forum"});
		}
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	//Join forum
	try {
		await client.query("INSERT INTO memberships (memberforum, memberuser, memberrole, memberdate) VALUES ($1, $2, 2, NOW())", [forumid, userid]);
		return res.status(200).json({message:"Joined successfully"});
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	
});

module.exports = router;
