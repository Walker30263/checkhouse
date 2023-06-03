const express = require("express");
const router = express.Router();

const sqlite3 = require("sqlite3").verbose();
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  jwt.verify(req.body.token, process.env["JWT_PRIVATE_KEY"], function(err, data) {
    if (err) {
      res.send({
        error: {
          title: "Invalid/Expired Token",
          message: "Please sign in to your account and request a new link to verify your email."
        }
      });
    } else {
      let db = new sqlite3.Database("/home/runner/checkhouse/database/data.db", (err) => {
        if (err) {
          console.log(err);
        }
      });
  
      db.run(`UPDATE users SET email_verified = ? WHERE email = ?`, [true, data.email], function(err) {
        if (err) {
          console.log(err);
        } else {
          db.close();
          res.send({
            success: {
              title: "Verified!",
              message: "Enjoy your time playing Checkhouse!"
            }
          });
        }
      });
    }
  });
});

module.exports = router;