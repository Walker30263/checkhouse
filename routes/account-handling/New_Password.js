const express = require("express");
const router = express.Router();

const sqlite3 = require("sqlite3").verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  if (!validPasswordCharacters(req.body.new_password)) {
    res.send({
      error: {
        title: "Invalid character in password!",
        message: "Your password can consist of these letters: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890[`!@#$%^&*()_+-=[]{};\':\"\\|,.<>/?~]/"
      }
    });
  } else if (req.body.new_password.length < 8) {
    res.send({
      error: {
        title: "Your new password must be at least 8 characters long!"
      }
    });
  } else if (req.body.new_password != req.body.confirm_new_password) {
    res.send({
      error: {
        title: "Passwords do not match!",
        message: "Please make sure that the passwords in the 2 fields are the same."
      }
    });
  } else {
    jwt.verify(req.body.password_reset_token, process.env["JWT_PRIVATE_KEY"], function(err, data) {
      if (err) {
        res.send({
          error: {
            title: "Expired Token!",
            message: "Maybe your link timed out? Please try again.<br><br>Contact us at checkhousecf@gmail.com if this issue persists."
          }
        });
      } else {
        bcrypt.hash(req.body.new_password, 10, function(err, hashedPassword) {
          if (err) {
            console.log(err);
          } else {
            let db = new sqlite3.Database("/home/runner/checkhouse/database/data.db", (err) => {
              if (err) {
                console.log(err);
              }
            });
    
            db.run(`UPDATE users SET password_hashed = ? WHERE user_id = ?`, [hashedPassword, data.user_id], function (err) {
              if (err) {
                console.log(err); 
              } else {
                db.close();
                
                res.send({
                  success: {
                    title: "Successfully Updated Password!",
                    message: "Enjoy Checkhouse!"
                  }
                });
              }
            });
          }
        });
      }
    });
  }
});

/* Helper functions: */

function validPasswordCharacters(password) {
  const allowedPasswordValues = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890[`!@#$%^&*()_+-=[]{};\':\"\\|,.<>/?~]/".split("");

  for (let i = 0; i < password.length; i++) {
    if (!allowedPasswordValues.includes(password[i])) {
      return false;
    }
  }

  return true;
}

module.exports = router;