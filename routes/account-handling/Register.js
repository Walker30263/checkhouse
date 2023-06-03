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
  if (!validator.isEmail(req.body.email)) {
    res.send({
      error: {
        title: "Invalid Email Address"
      }
    });
  } else if (!validator.isAlphanumeric(req.body.username)) {
    res.send({
      error: {
        title: "Username must be alphanumeric!"
      }
    });
  } else if (!validPasswordCharacters(req.body.password)) {
    res.send({
      error: {
        title: "Invalid character in password!",
        message: "Your password can consist of these letters: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890[`!@#$%^&*()_+-=[]{};\':\"\\|,.<>/?~]/"
      }
    });
  } else if (req.body.password.length < 8) {
    res.send({
      error: {
        title: "Your password must be at least 8 characters long!"
      }
    });
  } else if (req.body.password != req.body.confirmPassword) {
    res.send({
      error: {
        title: "Passwords don't match.",
        message: "Please make sure you typed the same password in the \"Password\" and \"Confirm Password\" fields."
      }
    });
  } else {
    verify(process.env['HCAPTCHA_PRIVATE_KEY'], req.body["h-captcha-response"]).then((data) => {
      if (data.success === true) {
        let db = new sqlite3.Database("/home/runner/checkhouse/database/data.db", (err) => {
          if (err) {
            console.log(err);
          }
        });
  
        db.get(`SELECT username FROM users WHERE username = ?`, [req.body.username], (err, row) => {
          if (err) {
            console.log(err);
          } else {
              if (row) {
                db.close();
    
                res.send({
                  error: {
                    title: "Username taken!",
                    message: "Please choose a new username! Or if this IS the real " + req.body.username + ", please Log In Instead!"
                  }
                });
              } else {
                db.get(`SELECT email FROM users WHERE email = ?`, [req.body.email], (err, row) => {
                    if (err) {
                      console.log(err);
                    } else {
                      if (row && req.body.email) { //check if the email is taken as well if they inputted an email
                        db.close();
                        
                        res.send({
                          error: {
                            title: "Email taken!",
                            message: "Please choose another email! Or if this IS actually your email, please Log In Instead!"
                          }
                        });
                      } else { //actually register the user lol
                        bcrypt.hash(req.body.password, 10, function(err, hashedPassword) {
                          if (err) {
                            console.log(err);
                          } else {
                            db.run(`INSERT INTO users(username, password_hashed, email, email_verified, profile_picture, bio, friends, incoming_friend_requests, outgoing_friend_requests, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.username, hashedPassword, req.body.email, false, "defaultAvatar", "No bio yet.", "[]", "[]", "[]", 1200], function(err) {
                              if (err) {
                                console.log(err);
                              } else {
                                db.close();
  
                                if (req.body.email) {
                                  let user = {
                                    email: req.body.email
                                  }
                                  
                                  jwt.sign(user, process.env['JWT_PRIVATE_KEY'], { expiresIn: "60m" }, function(err, token) {
                                    if (err) {
                                      console.log(err);
                                    } else {
                                      let msg = {
                                        to: req.body.email,
                                        from: 'help@checkhouse.cf',
                                        subject: 'Verify Email',
                                        text: 'Verify your Checkhouse Account',
                                        html: `<p>Dear <strong>${req.body.username}</strong>,</p>
                                              <p>Welcome to Checkhouse!</p>
                                              <p><br></p>
                                              <p>Please click the following link within the next hour to verify your email: <a href="https://checkhouse.cf/verify-email?token=${token}" target="_blank" rel="noopener noreferrer"><strong>Verify Email</strong></a></p>
                                              <p>If the hyperlink doesn&apos;t work in your browser, copy this link and paste it into a new browser tab:</p>
                                              <p><a href="https://checkhouse.cf/verify-email?token=${token}" target="_blank" rel="noopener noreferrer"><strong>https://checkhouse.cf/verify-email?token=${token}</strong></a></p>
                                              <p><br></p>
                                              <p>By verifying your email, you will be able to add friends, message others, and so much more!</p>
                                              <p><br></p>
                                              <p>Please read the <a href="https://checkhouse.cf/rules" target="_blank" rel="noopener noreferrer">Rules</a> page to learn how to play: <a data-fr-linked="true" href="https://checkhouse.cf/rules">https://checkhouse.cf/rules</a></p>
                                              <p>Please also read the <a href="https://checkhouse.cf/tos" target="_blank" rel="noopener noreferrer">Terms of Service</a> page if you haven&apos;t already: <a data-fr-linked="true" href="https://checkhouse.cf/tos" target="_blank" rel="noopener noreferrer">https://checkhouse.cf/tos</a></p>
                                              <p>Thank you so much for supporting our game/website! If you have any questions, please email us at <a href="mailto:checkhousecf@gmail.com">checkhousecf@gmail.com</a>&nbsp;and one of us will be in touch with your shortly! If you didn't actually sign up and someone else used your email to sign up, please contact us and we'll deal with it.</p>
                                              <p><br></p>
                                              <p>Enjoy your time,</p>
                                              <p>The Checkhouse Development Team</p>
                                              <p><br></p>`
                                      }
  
                                      sendgridMailer.send(msg).catch((error) => {
                                        console.error(error);
                                      });

                                      res.send({
                                        success: {
                                          title: "Account successfully created!",
                                          message: "Please try logging in now!<br><br><br>Also, a link to verify your email has been sent to your email address! If you don't receive it within a few minutes, please check your Spam folder. Please verify within the next hour!"
                                        }
                                      });
                                    }
                                  });
                                } else {
                                  res.send({
                                    success: {
                                      title: "Account successfully created!",
                                      message: "Please try logging in now!"
                                    }
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                    }
                  });
              }
          }
        });
      } else {
        res.send({
          error: {
            title: "Captcha Failed",
            message: "Are you sure you're a human? Try again."
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