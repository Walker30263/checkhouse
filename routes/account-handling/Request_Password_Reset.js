const express = require("express");
const router = express.Router();

const validator = require("validator");
const multer = require('multer');
const upload = multer();

const sqlite3 = require("sqlite3").verbose();
const { verify } = require("hcaptcha");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

const sendgridMailer = require('@sendgrid/mail');
sendgridMailer.setApiKey(process.env['SENDGRID_API_KEY']);

router.post('/', upload.none(), async (req, res) => {
  verify(process.env['HCAPTCHA_PRIVATE_KEY'], req.body["h-captcha-response"]).then((data) => {
    if (data.success === true) {
      if (!validator.isEmail(req.body.email)) {
        res.send({
          error: {
            title: "Invalid Email Address"
          }
        });
      } else {
        let db = new sqlite3.Database("/home/runner/checkhouse/database/data.db", (err) => {
          if (err) {
            console.log(err);
          }
        });

        db.get(`SELECT user_id, username FROM users WHERE email = ?`, [req.body.email], function(err, row) {
          if (err) {
            console.log(err);
          } else {
            db.close();
            if (row) {
              let user = {
                user_id: row.user_id
              }

              jwt.sign(user, process.env["JWT_PRIVATE_KEY"], { expiresIn: "2h" }, function(err, token) {
                if (err) {
                  console.log(err);
                } else {
                  let msg = {
                    to: req.body.email,
                    from: 'help@checkhouse.cf',
                    subject: 'Reset Password',
                    text: 'Reset your Checkhouse Account Password',
                    html: `<p>Dear <strong>${row.username}</strong>,</p>

                          <p>Sorry to hear that you forgot your password.&nbsp;</p>
                          
                          <p>Please click the following link within the next hour to reset your password: <strong><a href="https://checkhouse.cf/forgot-password?token=${token}">Reset Password</a></strong></p>
                          
                          <p>If the hyperlink doesn&#39;t work in your browser, copy this link and paste it into a new browser tab:</p>
                          
                          <p><a href="https://checkhouse.cf/forgot-password?token=${token}">https://checkhouse.cf/forgot-password?token=${token}</a></p>
                          
                          <p>&nbsp;</p>
                          
                          <p><strong>DO NOT SHARE THIS EMAIL WITH ANYONE!!!&nbsp;</strong></p>
                          
                          <p>If you didn&#39;t request this email, don&#39;t worry, your account&#39;s security is NOT in danger, unless you share this email with someone else.&nbsp;</p>
                          
                          <p>&nbsp;</p>
                          
                          <p>Hopefully you remember your password next time,</p>
                          
                          <p>The Checkhouse Development Team</p>
                          `
                  }

                  sendgridMailer.send(msg).catch((error) => {
                    console.error(error);
                  });

                  res.send({
                    success: {
                      title: "Sent you an email!",
                      message: "Please click the Password Reset link in your email within the next hour to reset your password. If you don't get an email from us within the next few minutes, please check your Spam folder."
                    }
                  });
                }
              });
            } else {
              res.send({
                error: {
                  title: "Invalid Email Address",
                  message: "There is no Checkhouse account currently associated with that email address."
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