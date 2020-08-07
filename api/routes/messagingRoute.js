// @author Lauchlan Toal
// Endpoints for private messaging

//Import necessary dependencies
const express = require("express");
const router = express.Router();
const client = require("./../../db");
const userCookies = require("./../controllers/verifyUser"); 
const verifyUser = userCookies.verifyUser;

//Get all conversations for the current user
router.get("/", async (req, res) => {
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to view conversations"});
	}
	//Get all conversations
	var convos;
	try {
		convos = await client.query("SELECT convoid, convousera, convouserb, convoinfo, convodate, a.username AS usera, b.username AS userb FROM conversations JOIN users a ON (a.userid = convousera) JOIN users b ON (b.userid = convouserb) WHERE convousera = $1 OR convouserb = $1", [userid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	convos = convos.rows;
	return res.status(200).json(convos);
});

//Get conversation between current user and another user
router.get("/user/:user", async (req, res) => {
	var otherid = req.params.user;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to view conversations"});
	}
	//Get conversation
	var convos;
	try {
		convos = await client.query("SELECT convoid, convousera, convouserb, convoinfo, convodate, a.username AS usera, b.username AS userb FROM conversations JOIN users a ON (a.userid = convousera) JOIN users b ON (b.userid = convouserb) WHERE (convousera = $1 AND convouserb = $2) OR (convousera = $2 AND convouserb = $1)", [userid, otherid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	convos = convos.rows;
	if (!convos[0]) {
		return res.status(404).json({message:"No conversation found"});
	}
	return res.status(200).json(convos[0]);
});

//Get messages from a conversation
router.get("/:convo", async (req, res) => {
	var convoid = req.params.convo;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to view conversations"});
	}
	//Get conversation
	var convo;
	try {
		convo = await client.query("SELECT convoid, convousera, convouserb, convoinfo, convodate, a.username AS usera, b.username AS userb FROM conversations JOIN users a ON (a.userid = convousera) JOIN users b ON (b.userid = convouserb) WHERE convoid = $1", [convoid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	convos = convo.rows;
	if (!convos[0]) {
		return res.status(404).json({message:"No conversation found"});
	}
	convos = convos[0];
	//For security, if user is not part of conversation don't even let them know it exists
	if (convos.convousera != userid && convos.convouserb != userid) {
		return res.status(404).json({message:"No conversation found"});
	}
	//Get messages in conversation
	var messages;
	try {
		messages = await client.query("SELECT messageid, messageconvo, messagesender, username, messagetext, messagedate FROM messages JOIN users ON (messagesender = userid) WHERE messageconvo = $1",[convoid]);
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	return res.status(200).json({"convo":convos, "messages":messages.rows});
});

//Start a new conversation with a user
router.post("/user/:user", async (req, res) => {
	var otherid = req.params.user;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to post conversations"});
	}
	//Check that user exists
	try {
		var checkuser = await client.query("SELECT * FROM users WHERE userid = $1", [otherid]);
		if (!checkuser.rows[0]) {
			return res.status(404).json({message: "User does not exist"});
		}
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	//Check that conversation does not already exist
	try {
		var checkconvo = await client.query("SELECT * FROM conversations WHERE (convousera = $1 AND convouserb = $2) OR (convousera = $2 AND convouserb = $1)",[userid, otherid]);
		if (checkconvo.rows[0]) {
			return res.status(409).json({message: "This conversation exists already"});
		}
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	//Create conversation
	try {
		await client.query("INSERT INTO conversations (convousera, convouserb, convoinfo, convodate) VALUES ($1, $2, 'Private conversation', NOW())", [userid, otherid]);
		return res.status(201).json({message: "Conversation created"});
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
});

//Send a message to a conversation
router.post("/:convo", async (req, res) => {
	var convoid = req.params.convo;
	//Get user
	var userid;
	try {
		userid = await verifyUser(req.body.cookie);
	} catch (err) {
		userid = null;
	}
	if (!userid) {
		return res.status(401).json({message:"You must be logged in to post messages"});
	}
	//Validate message
	if (!req.body.data) {
		return res.status(400).json({message:"You must send message data"});
	}
	if (!req.body.data.message) {
		return res.status(401).json({message:"You must send the message"});
	}
	var message = req.body.data.message;
	//Check that convo exists
	try {
		var checkconvo = await client.query("SELECT * FROM conversations WHERE convoid = $1", [convoid]);
		if (!checkconvo.rows[0]) {
			return res.status(404).json({message: "Conversation does not exist"});
		}
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
	//Post message
	try {
		await client.query("INSERT INTO messages (messageconvo, messagesender, messagetext, messagedate) VALUES ($1, $2, $3, NOW())", [convoid, userid, message]);
		return res.status(201).json({message: "Message sent"});
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
});


module.exports = router;
