const express = require("express");
const router = express.Router();
const { userData } = require("../models/userModel");
const { v4: uuidv4 } = require("uuid"); // used to create the uuid
const client = require("./../../db");
const bcrypt = require("bcrypt");
const saltRounds = 10;

client.connect();

router.get("/", (req, res) => {
  client.query("SELECT * FROM users", (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    } else {
      return res.status(200).json(result.rows);
      // client.end();
    }
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username.trim() === "" || password.trim() === "") {
    return res
      .status(400)
      .json({ message: "Please provide non-empty username and password" });
  } else {
    client.query(
      "SELECT username, userpassword FROM users WHERE username = $1",
      [username],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        } else {
          if (result.rowCount !== 1) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          const userFromDb = result.rows[0];

          bcrypt.compare(password, userFromDb.userpassword, function (
            err,
            result
          ) {
            if (result) {
              return res.status(200).json({ loggedIn: result });
            }

            return res.status(401).json({ loggedIn: result });
          });
        }
      }
    );
  }
});

router.post("/changePassword", (req, res) => {
  const { password, confirmPassword, userid } = req.body;
  if (!userid) {
    return res.status(400).json({ message: "Please provide the userid" });
  }
  if (
    !password ||
    !confirmPassword ||
    password.trim() === "" ||
    confirmPassword.trim() === ""
  ) {
    return res.status(400).json({
      message: "Please provide password and the confirm password",
    });
  } else {
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    bcrypt.hash(password, saltRounds, function (err, hash) {
      client.query(
        "UPDATE users SET userpassword = $1 WHERE userid = $2",
        [hash, userid],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: err.message });
          }

          if (result.rowCount === 1) {
            return res.status(200).json({
              message: "Password has been updated",
            });
          }

          return res.status(500).json({
            message: "Password is not updated",
          });
        }
      );
    });
  }
});

router.get("/searchUser/:uuid", (req, res) => {
  const userId = req.params.uuid;
  client.query(
    "SELECT * FROM users WHERE userid = $1",
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      } else {
        if (result.rowCount !== 1) {
          return res.status(400).json({
            message: `No results found with the specified user id ${userId}`,
          });
        } else {
          return res.status(200).json(result.rows);
        }
      }
    }
  );
});

//post route to add new user
router.post("/register", (req, res) => {
  const { username, email, password, info } = req.body;

  if (
    username.trim() === "" ||
    !username ||
    password.trim() === "" ||
    !password ||
    !info ||
    !validateEmail(email)
  ) {
    return res.status(400).json({
      message:
        "Please make sure all data required is sent and in a valid format",
    });
  } else {
    bcrypt.hash(password, saltRounds, function (err, hash) {
      // Store hash in your password DB.
      client.query(
        "INSERT INTO users (userid, username, useremail, userpassword, userinfo, userdate) VALUES ($1, $2, $3, $4, $5, $6)",
        [uuidv4(), username, email, hash, info, new Date()],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: err.message,
            });
          } else {
            if (result.rowCount !== 1) {
              return res.status(500).json({
                message: "User could not be added",
              });
            } else {
              return res.status(200).json({
                message: `User added!`,
              });
            }
          }
        }
      );
    });
  }
});

// // put route to update/modify a user
router.put("/updateUserInfo", async (req, res) => {
  if (!req.body.userid) {
    res.status(400).json({
      message: "Please provide the uuid of the user",
    });
  } else {
    const editableFields = ["username", "useremail", "userinfo"];

    let querySetString = "";
    let querySetVariables = [];
    let i = 1;

    for (const field in req.body) {
      if (!editableFields.includes(field) && field != "userid") {
        return res
          .status(400)
          .json({ message: "Bad request to edit an uneditable field" });
      } else if (req.body[field].trim === "" || !req.body[field]) {
        return res.status(400).json({
          message: "Please provide valid strings as parameters",
        });
      } else {
        if (field == "userid") continue;
        if (field == "useremail" && !validateEmail(req.body[field])) {
          return res.status(400).json({
            message: "Please provide a valid email",
          });
        } else {
          const comma = i === Object.keys(req.body).length - 1 ? "" : ",";
          querySetString += `${field} = $${i++}${comma} `;
          querySetVariables.push(req.body[field]);
        }
      }
    }

    querySetVariables.push(req.body.userid);

    client.query(
      `UPDATE users SET ${querySetString} WHERE userid = $${i}`,
      querySetVariables,
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: err.message,
          });
        } else {
          if (result.rowCount === 1) {
            return res.status(200).json({ message: "User updated!" });
          }

          return res.status(409).json({
            message: "User could not be updated",
          });
        }
      }
    );
  }
});

/**
 *
 * This function is adapted from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript to validate a users email using Regex
 *
 * @param {String} email Email of user
 * @returns If the email is valid it returns true else false
 */
const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

module.exports = router;
