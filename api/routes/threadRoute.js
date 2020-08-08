// @author Lauchlan Toal
// Endpoints for viewing/editing/creating/deleting threads and comments

//Import necessary dependencies
const express = require("express");
const router = express.Router();
const client = require("./../../db");
const userCookies = require("./../controllers/verifyUser"); 
const verifyUser = userCookies.verifyUser;

//Get the thread info and all comments in the thread
router.post("/thread/:threadid", async (req, res) => {
	var threadid = req.params.threadid;
	//Get thread info
	var thread;
	try {
		thread = await client.query("SELECT threadid, threadforum, forumname, threaduser, username, threadtitle, threadtext, threaddate FROM threads JOIN users ON (threaduser = userid) JOIN forums ON (threadforum = forumid) WHERE threadid = $1",[threadid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	thread = thread.rows;
	if (!thread[0]) {
		return res.status(404).json({message:"This thread does not exist"});
	}
	thread = thread[0];
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	//Check if user can view thread
	var forum;
	try {
		forum = await client.query("SELECT * FROM forums WHERE forumid = $1",[thread.threadforum]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	forum = forum.rows;
	if (!forum[0]) {
		return res.status(404).json({message:"This forum does not exist"});
	}
	forum = forum[0];
	//If forum is private, check if user has permission to view it
	if (forum.forumprivacy != "public" && userid != null) {
		var membership;
		try {
			membership = await client.query("SELECT * FROM memberships WHERE memberforum = $1 AND memberuser = $2",[thread.threadforum, userid]);
		} catch (err) {
			return res.status(500).json({message:err.message});
		}
		if (!membership[0] || membership[0].memberrole == 0) {
			return res.status(401).json({message:`You must be a member of ${forum.forumname} to view this thread`});
		}
	} 
	if (forum.forumprivacy != "public" && userid == null) {
		return res.status(401).json({message:`You must be a member of ${forum.forumname} to view this thread`});
	}
	//Get comments
	var comments;
	try {
		comments = await client.query("SELECT userid, username, commentid, commenttext, commentlikes, commentdate FROM comments JOIN users ON (commentuser = userid) WHERE commentthread = $1",[threadid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	comments = comments.rows;
	//Return
	return res.status(200).json({"thread":thread, "comments":comments});
});


//Post a new thread
router.post("/", async (req, res) => {
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to post new threads"});
	}
	//Verify that input values are reasonable
	var data 
	try {
		data = req.body.data;
	} catch (err) {
		return res.status(400).json({message:"You must send data for the post"});
	}
	if (!(data.threadforum && data.threadtitle && data.threadtext)) {
		return res.status(400).json({message:"You must send threadforum, threadtitle, and threadtext"});
	}
	if (data.threadtitle.length > 255) {
		return res.status(400).json({message:"Titles must be 255 characters or less"});
	}
	//Check if user can post to this forum
	var membership;
	try {
		membership = await client.query("SELECT * FROM memberships WHERE memberforum = $1 AND memberuser = $2",[data.threadforum, userid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	membership = membership.rows;
	if (!membership[0] || membership[0].memberrole < 2) {
		return res.status(401).json({message:"You must be a member of the forum to post new threads"});
	}
	//Post
	try {
		await client.query("INSERT INTO threads (threadforum, threaduser, threadtitle, threadtext, threaddate, threadflagged) VALUES ($1, $2, $3, $4, NOW(), 0)",[data.threadforum, userid, data.threadtitle, data.threadtext]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	//Return
	return res.status(201).json({message:"Post successful"});
});

//Post a comment to a thread
router.post("/:threadid", async (req, res) => {
	var threadid = req.params.threadid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to post new comments"});
	}
	//Verify that input values are reasonable
	var data
	try {
		data = req.body.data;
	} catch (err) {
		return res.status(400).json({message:"You must send data for the comment"});
	}
	if (!(data.commenttext)) {
		return res.status(400).json({message:"You must send commenttext"});
	}
	//Check if user can post to this forum
	var membership;
	try {
		membership = await client.query("SELECT * FROM memberships WHERE memberforum = (SELECT threadforum FROM threads WHERE threadid = $1 LIMIT 1) AND memberuser = $2",[threadid, userid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	membership = membership.rows;
	if (!membership[0] || membership[0].memberrole < 2) {
		return res.status(401).json({message:"You must be a member of the forum to post new comments"});
	}
	//Post
	try {
		await client.query("INSERT INTO comments (commentthread, commentuser, commenttext, commentlikes, commentdate, commentflagged) VALUES ($1, $2, $3, 0, NOW(), 0)",[threadid, userid, data.commenttext]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	//Return
	return res.status(201).json({message:"Post successful"});
});

//Update a thread
router.put("/:threadid", async (req, res) => {
	var threadid = req.params.threadid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to update threads"});
	}
	//Verify that input values are reasonable
	var data
	try {
		data = req.body.data;
	} catch (err) {
		return res.status(400).json({message:"You must send data to update"});
	}
	if (!(data.threadtitle && data.threadtext)) {
		return res.status(400).json({message:"You must send threadtitle and threadtext"});
	}
	if (data.threadtitle.length > 255) {
		return res.status(400).json({message:"Titles must be 255 characters or less"});
	}
	//Get thread info
	var thread;
	try {
		thread = await client.query("SELECT threaduser FROM threads WHERE threadid = $1",[threadid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	thread = thread.rows;
	if (!thread[0]) {
		return res.status(404).json({message:"This thread does not exist"});
	}
	thread = thread[0];
	//Did user create thread?
	if (thread.threaduser != userid) {
		return res.status(401).json({message:"You did not create this thread"});
	}
	//Update
	try {
		await client.query("UPDATE threads SET threadtitle = $1, threadtext = $2 WHERE threadid = $3",[data.threadtitle, data.threadtext, threadid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	//Return
	return res.status(200).json({message:"Update successful"});
});

//Delete a thread
router.delete("/:threadid", async (req, res) => {
	var threadid = req.params.threadid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to delete threads"});
	}
	//Get thread info
	var thread;
	try {
		thread = await client.query("SELECT threaduser FROM threads WHERE threadid = $1",[threadid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	thread = thread.rows;
	if (!thread[0]) {
		return res.status(404).json({message:"This thread does not exist"});
	}
	thread = thread[0];
	//Did user create thread?
	if (thread.threaduser != userid) {
		return res.status(401).json({message:"You did not create this thread"});
	}
	//Delete
	try {
		await client.query("DELETE FROM threads WHERE threadid = $1",[threadid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	//Return
	return res.status(200).json({message:"Delete successful"});
});

//Update a comment
router.put("/comment/:commentid", async (req, res) => {
	var commentid = req.params.commentid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to update comments"});
	}
	//Verify that input values are reasonable
	var data;
	try {
		data = req.body.data;
	} catch (err) {
		return res.status(400).json({message:"You must send data to update"});
	}
	if (!(data.commenttext)) {
		return res.status(400).json({message:"You must send commenttext"});
	}
	//Get comment info
	var comment;
	try {
		comment = await client.query("SELECT commentuser FROM comments WHERE commentid = $1",[commentid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	comment = comment.rows;
	if (!comment[0]) {
		return res.status(404).json({message:"This comment does not exist"});
	}
	comment = comment[0];
	//Did user create comment?
	if (comment.commentuser != userid) {
		return res.status(401).json({message:"You did not create this comment"});
	}
	//Update
	try {
		await client.query("UPDATE comments SET commenttext = $1 WHERE commentid = $2",[data.commenttext, commentid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	//Return
	return res.status(200).json({message:"Update successful"});
});

//Delete a comment
router.delete("/comment/:commentid", async (req, res) => {
	var commentid = req.params.commentid;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to delete comments"});
	}
	//Get comment info
	var comment;
	try {
		comment = await client.query("SELECT commentuser FROM comments WHERE commentid = $1",[commentid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	comment = comment.rows;
	if (!comment[0]) {
		return res.status(404).json({message:"This comment does not exist"});
	}
	comment = comment[0];
	//Did user create comment?
	if (comment.commentuser != userid) {
		return res.status(401).json({message:"You did not create this comment"});
	}
	//Delete
	try {
		await client.query("DELETE FROM comments WHERE commentid = $1",[commentid]);
	} catch (err) {
		return res.status(500).json({message:err.message});
	}
	//Return
	return res.status(200).json({message:"Delete successful"});
});

module.exports = router;
