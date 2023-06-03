const express = require("express");
const router = express.Router();

const validator = require("validator");
const multer = require('multer');
const upload = multer();

const sqlite3 = require("sqlite3").verbose();
const { verify } = require("hcaptcha");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

router.post('/', upload.none(), async (req, res) => {
  verify(process.env['HCAPTCHA_PRIVATE_KEY'], req.body["h-captcha-response"]).then((data) => {
    if (data.success === true) {
      if (!validator.isAlphanumeric(req.body.username)) {
        res.send({
          error: {
            title: "Username must be alphanumeric!"
          }
        });
      } else {
        let db = new sqlite3.Database("/home/runner/checkhouse/database/data.db", (err) => {
          if (err) {
            console.log(err);
          }
        });

        db.get(`SELECT user_id, username, password_hashed FROM users WHERE username = ?`, [req.body.username], function(err, row) {
          db.close();
          if (err) {
            console.log(err);
          } else {
            if (row) {
              bcrypt.compare(req.body.password, row.password_hashed, function(err, result) {
                if (err) {
                  console.log(err);
                } else {
                  if (result) {
                    let user = {
                      user_id: row.user_id
                    }
                    
                    jwt.sign(user, process.env['JWT_PRIVATE_KEY'], function(err, token) {
                      if (err) {
                        console.log(err);
                      } else {
                        res.send({
                          success: {
                            title: "Logged in!",
                            token: token
                          }
                        });
                      }
                    });
                  } else {
                    res.send({
                      error: {
                        title: "Wrong password!",
                        message: 'If you forgor your password and want to reset your password, please click the "Forgot Password" link.'
                      }
                    });
                  }
                }
              });
            } else {
              res.send({
                error: {
                  title: "Username does not exist!",
                  message: "If you want this username, please Register Instead!"
                }
              });
            }
          }
        });
      }
    } else {
      res.send({
        error: {
          title: "Captcha Failed",
          message: "Are you sure you're a human? Try again."
        }
      });
    }
  });
});

module.exports = router;