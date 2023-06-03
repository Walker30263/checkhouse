const express = require("express");
const router = express.Router();

const sqlite3 = require("sqlite3").verbose();
const jwt = require('jsonwebtoken');

/* When it's a POST request, check account_token sent in the request to get the user to get the data of */
router.post("/", async(req, res) => {
  jwt.verify(req.body.account_token, process.env["JWT_PRIVATE_KEY"], function(err, data) {
    if (err) {
      res.send({
        error: {
          title: "Invalid Account Token"
        }
      });
    } else {
      let db = new sqlite3.Database("/home/runner/checkhouse/database/data.db", (err) => {
        if (err) {
          console.log(err);
        }
      });

      db.get(`SELECT user_id, username, profile_picture, bio, friends, incoming_friend_requests, outgoing_friend_requests, rating FROM users WHERE user_id = ?`, [data.user_id], (err, row) => {
        if (err) {
          console.log(err);
        } else {
          db.close();
          
          res.send({
            data: row
          });
        }
      });
    }
  });
});

module.exports = router;