const express = require("express");
const router = express.Router();

const jwt = require('jsonwebtoken');

router.post("/", async (req, res) => {
  jwt.verify(req.body.password_reset_token, process.env["JWT_PRIVATE_KEY"], function(err, data) {
    if (err) {
      res.send({
        error: {
          title: "Invalid Password Reset Token",
          message: "Maybe your link timed out? Please try again.<br><br>Contact us at checkhousecf@gmail.com if this issue persists."
        }
      });
    } else {
      res.send({
        success: {
          title: "Create a New Password!",
          message: "Make sure to remember it this time (or use your browser's password manager)!"
        }
      });
    }
  });
});

module.exports = router;