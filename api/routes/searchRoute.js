/**
 * @author Skyler Boutilier
 */

/**
 * Imports
 */
const express = require("express");
const router = express.Router();
const client = require("./../../db");

/**
 * This route is used to retrieve the search results that the user has requested
 * The following query was made with help from https://alvinalexander.com/sql/sql-select-case-insensitive-query-queries-upper-lower/#:~:text=select%20*%20from%20users%20where%20upper,SQL%20function%20you've%20used.
 * The lower function was learned about from the above link
 */ 
router.post("/Search", (req, res) => {
    const { searchRequest } = req.body;

  client.query("SELECT threadid, threadforum, threaduser, threadtitle, threadtext, threaddate, threadflagged FROM threads JOIN forums ON (forumid = threadforum) WHERE forumprivacy = 'public' AND (lower(threadtitle) LIKE lower($1) OR lower(threadtext) LIKE lower($1))", ["%" + searchRequest + "%"], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    } else {
      return res.status(200).json(result.rows);
    }
  });
});

module.exports = router;
