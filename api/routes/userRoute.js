/**
 * @author Sarthak Rakhra, Lauchlan Toal
 */

/**
 * Imports
 */
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid"); // used to create the uuid
const client = require("./../../db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const userCookies = require("./../controllers/verifyUser");
const getCookieId = userCookies.getCookieId;
const verifyUser = userCookies.verifyUser;

client.connect(); //Connect client to database


/**
 *
 * This post route is used to login the user to the system.
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body; // get usernam and password from the request

  // if username or password is missing or not valid then we return a status 400
  if (username.trim() === "" || password.trim() === "") {
    return res
      .status(400)
      .json({ message: "Please provide non-empty username and password" });
  } else {
    client.query(
      "SELECT userid, userpassword FROM users WHERE username = $1",
      [username],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        } else {
          if (result.rowCount !== 1) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          const userFromDb = result.rows[0];

          // use bcrypt to compare if the password from input matches the password with password of the user from the database
          bcrypt.compare(password, userFromDb.userpassword, function (
            err,
            result
          ) {
            if (result) {
              var generatedCookie = uuidv4();
              client.query(
                "INSERT INTO cookies VALUES ($1, $2, NOW())",
                [generatedCookie, userFromDb.userid],
                (err, result) => {
                  if (err) {
                    return res.status(500).json({ message: err.message });
                  } else {
                    return res.status(200).json({ loggedIn: true, cookie: generatedCookie });
                  }
                }
              );
            } else {
              return res.status(401).json({ loggedIn: false });
            }
          });
        }
      }
    );
  }
});

/**
 * This post route is used to change the password of a user
 */
router.post("/changePassword", async (req, res) => {

  const { password, confirmPassword, userid } = req.body.data; // getting data from the request body
  var authuser;
  try {
   authuser = await verifyUser(req.body.cookie);
  } catch (err) {
  	authuser = null;
  }
  
  if (authuser == null) {
  	return res.status(401).json({message:"You must be logged in to change your password"});
  }
	if (authuser != userid) {
		return res.status(401).json({message:"You are not logged in as this user"});
	}
	
	
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

    // using bcrypt to hash the password sent by the user
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

/**
 *
 * Get route used to search a user by their userid
 *
 */
router.get("/searchUser/:uuid", (req, res) => {
  const userId = req.params.uuid;

  client.query(
    "SELECT userid, username, userinfo, userdate FROM users WHERE userid = $1",
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      } else {
        if (result.rowCount !== 1) {
          return res.status(404).json({
            message: `No results found with the specified user id ${userId}`,
          });
        } else {
          return res.status(200).json(result.rows[0]);
        }
      }
    }
  );
});

//post route to register a new user
router.post("/register", (req, res) => {
  const { username, email, password, info } = req.body; // get data from request body

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
    // Using bcrypt to hash the password user wants
    bcrypt.hash(password, saltRounds, function (err, hash) {
      var userId = uuidv4();
      client.query(
        "INSERT INTO users (userid, username, useremail, userpassword, userinfo, userdate) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, username, email, hash, info, new Date()],
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
              var generatedCookie = uuidv4();
              client.query(
                "INSERT INTO cookies VALUES ($1, $2, NOW())",
                [generatedCookie, userId],
                (err, result) => {
                  if (err) {
                    return res.status(500).json({ message: err.message });
                  } else {
                  	return res.status(200).json({ message: "User added!", cookie: generatedCookie });
                  }
                }
              );
            }
          }
        }
      );
    });
  }
});

/**
 * Put route used to update a users information.
 *
 * This method can accept 1 or more of the fields inside the `editableFields` array
 */
router.put("/updateUserInfo", async (req, res) => {
	if (!req.body.cookie) {
		return res.status(400).json({message: "You must be logged in to edit users"});
	}
	var authuser;
	try {
		authuser = await verifyUser(req.body.cookie);
	} catch (err) {
		authuser = null;
	}
	if (authuser == null) {
		return res.status(401).json({message: "You must be logged in to edit users"});
	}
  if (!req.body.userid) {
    return res.status(400).json({
      message: "Please provide the uuid of the user",
    });
  } else {
  	if (authuser != req.body.userid) {
  		return res.status(401).json({message: "You must log in as the user to update"});
  	}
  	if (!req.body.userinfo) {
  		return res.status(400).json({message: "You must provide user info"});
  	}

    client.query(
      'UPDATE users SET userinfo = $1 WHERE userid = $2',
      [req.body.userinfo, req.body.userid],
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

router.get("/logout", async (req, res) => {
  var cookieid;
  try {
    cookieid = await getCookieId(req.body.cookie);
  } catch (err) {
    cookieid = null;
  }
  if (!cookieid) {
    return res
      .status(401)
      .json({ message: "You must be logged in to log out" });
  }
  try {
    await client.query("DELETE FROM cookies WHERE cookieid = $1", [cookieid]);
    return res.status(200).json({ message: "Logout successful!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
