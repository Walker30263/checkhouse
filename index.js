const express = require("express");
const app = express();
app.use(express.urlencoded());

const http = require("http");
const server = http.createServer(app);

//const validator = require("validator");
//const multer  = require('multer');
//const upload = multer();

const { Server } = require("socket.io");
const io = new Server(server);

const sqlite3 = require("sqlite3").verbose();
//const { verify } = require("hcaptcha");
const jwt = require('jsonwebtoken');
//const bcrypt = require("bcrypt");

//const sendgridMailer = require('@sendgrid/mail');
//sendgridMailer.setApiKey(process.env['SENDGRID_API_KEY']);

const { Game, Member } = require("./classes.js");

let activeGames = [];

app.use(express.static("public")); //client-side css and js files
app.use(express.json()); //parse JSON in incoming requests

app.use('/login', require("./routes/account-handling/Login.js"));
app.use('/register', require("./routes/account-handling/Register.js"));
app.use('/verify-email', require("./routes/account-handling/Verify_Email.js"));
app.use('/request-password-reset', require("./routes/account-handling/Request_Password_Reset.js"));
app.use('/validate-password-reset-token', require("./routes/account-handling/Validate_Password_Reset_Token.js"));
app.use('/new-password', require("./routes/account-handling/New_Password.js"));

app.use('/user-info', require("./routes/user-info-handling/User_Info.js"));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/pages/home.html");
});

app.get('/rules', (req, res) => {
  res.sendFile(__dirname + "/pages/rules.html");
});

app.get('/tos', (req, res) => {
  res.sendFile(__dirname + "/pages/tos.html");
  //res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(__dirname + "/pages/forgot-password.html");
});

app.get('/verify-email', (req, res) => {
  res.sendFile(__dirname + "/pages/verify-email.html");
});

//checkhouse.cf/(game id) = page for a specific game just like Lichess
//(Lichess pls don't sue us thx)
app.get('/:gameId', (req, res) => {
  res.sendFile(__dirname + "/pages/game.html");
});

//THIS HAS TO BE KEPT AT THE END OF THE ROUTING SECTION OF THE CODE
app.get('*', (req, res) => { //if user tries to go to a random subpage that doesn't exist,
  res.redirect('/'); //redirect them to the home page
});

console.log("Initializing database...");

let db = new sqlite3.Database(__dirname + "/database/data.db", (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to the database");
  }
});

db.serialize(() => {
  /*db.run(`CREATE TABLE IF NOT EXISTS users(
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hashed TEXT NOT NULL,
    email TEXT UNIQUE,
    email_verified TEXT,
    profile_picture TEXT,
    bio TEXT,
    friends TEXT,
    incoming_friend_requests TEXT,
    outgoing_friend_requests TEXT,
    rating INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS games(
    game_id TEXT PRIMARY KEY,
    game_data TEXT
  )`);*/

  //logging database, uncomment following code to log database in console at runtime:
  
  db.all(`SELECT user_id, username, password_hashed, email, email_verified, bio, friends, incoming_friend_requests, outgoing_friend_requests, rating FROM users`, [], (err, rows) => {
  //db.all(`SELECT * FROM games`, [], (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach(row => {
        console.log(row);
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Successfully initialized database!");
  }
});

app.post('/create', async (req, res) => {
  let tempId = generateTempChallengerId();
  let challenger = new Member(tempId, req.body.playerInfo.guest, req.body.playerInfo.username, req.body.playerInfo.pfp);
  let gameId = await generateGameId();
  let game = new Game(challenger, gameId, req.body.gameSettings);
  activeGames.push(game);

  let tempData = {
    tempId: tempId
  }
  
  jwt.sign(tempData, process.env['JWT_PRIVATE_KEY'], (err, token) => {
    if (err) {
      console.log(err);
    } else {
      res.send({
        data: {
          token: token,
          gameId: gameId
        }
      });
    }
  });
});

io.on("connection", (socket) => {
  socket.on("log", () => {
    console.log(activeGames);
  });
  
  socket.on("requestGameInfo", async (token, gameId, guestUsernameWhenAcceptingChallenge) => {
    let gameStatus = await verifyGameId(gameId);

    console.log(gameStatus);
    console.log(gameId);
    console.log(token);
    console.log('~~~~~~~~~~~~~~~~~~~~');

    if (gameStatus === "active") {
      if (token.type === "tempChallenger") {
        jwt.verify(token.token, process.env['JWT_PRIVATE_KEY'], function(err, data) {
          if (err) {
            console.log(err);
          } else {
            for (let i = 0; i < activeGames.length; i++) {
              if (activeGames[i].id === gameId) {
                if (activeGames[i].inProgress) {
                  
                } else {
                  activeGames[i].updateMemberId(data.tempId, socket.id);

                  //give them a refresh token so they can get back into the game if they accidentally close the tab
                  let refreshTokenObj = {
                    id: socket.id,
                    gameId: gameId
                  }

                  jwt.sign(refreshTokenObj, process.env['JWT_PRIVATE_KEY'], (err, refreshToken) => {
                    if (err) {
                      console.log(err);
                    } else {
                      socket.emit("display", activeGames[i], gameStatus, refreshToken);
                    }
                  });
                }
                break;
              }
            }
          }
        });
      } else if (token.type === "refresh") {
        jwt.verify(token.token, process.env['JWT_PRIVATE_KEY'], function(err, data) {
          if (err) {
            console.log(err);
          } else {
            let wasValidRefreshToken = false;
            
            for (let i = 0; i < activeGames.length; i++) {
              if (activeGames[i].id === data.gameId) {
                wasValidRefreshToken = true;
                activeGames[i].updateMemberId(data.id, socket.id);

                //give them another refresh token so they can get back into the game if they accidentally close the tab
                let refreshTokenObj = {
                  id: socket.id,
                  gameId: data.gameId
                }

                jwt.sign(refreshTokenObj, process.env['JWT_PRIVATE_KEY'], (err, refreshToken) => {
                  if (err) {
                    console.log(err);
                  } else {
                    socket.emit("display", activeGames[i], gameStatus, refreshToken);
                  }
                });
              }
            }
            console.log(data);

            if (!wasValidRefreshToken) { //if refresh token from a past game
              socket.emit("invalidRefreshTokenRetryWithNullToken");
              console.log("invalid refresh token...retrying with null token");
            }
            
            console.log("---------------");
          }
        });
      } else if (token.type == "null") {
        for (let i = 0; i < activeGames.length; i++) {
          if (activeGames[i].id === gameId) {
            if (activeGames[i].inProgress) {
              socket.emit("display", activeGames[i], gameStatus, null, true)
            } else {
              let player = new Member(socket.id, true, guestUsernameWhenAcceptingChallenge, "default");
              activeGames[i].players.push(player);

              activeGames[i].start();

              //give them a refresh token so they can get back into the game if they accidentally close the tab
              let refreshTokenObj = {
                id: socket.id,
                gameId: gameId
              }

              jwt.sign(refreshTokenObj, process.env['JWT_PRIVATE_KEY'], (err, refreshToken) => {
                if (err) {
                  console.log(err);
                } else {
                  activeGames[i].players.forEach(player => {
                    console.log(player.id);
                    if (player.id === socket.id) {
                      socket.emit("display", activeGames[i], gameStatus, refreshToken);
                    } else {
                      socket.to(player.id).emit("display", activeGames[i], gameStatus);
                    }
                  });
                }
              });
            }
          }
        }
      }
    } else if (gameStatus === "past") {
      let db = new sqlite3.Database(__dirname + "/database/data.db", (err) => {
        if (err) {
          console.log(err);
        }
      });

      db.get(`SELECT * FROM games WHERE game_id = ?`, [gameId], (err, row) => {
        socket.emit("display", row.game_data, gameStatus);
        
        db.close((err) => {
          if (err) {
            console.log(err);
          }
        });
      });
    } else if (gameStatus === "invalid") {
      socket.emit("invalidGameId");
    }
  });

  socket.on("chatMessageSend", (message) => {
    for (let i = 0; i < activeGames.length; i++) {
      if (activeGames[i].hasPlayer(socket.id)) {
        activeGames[i].newMessage(activeGames[i].getPlayerUsername(socket.id), message, Date.now(), "playerChat");
        
        for (let j = 0; j < activeGames[i].players.length; j++) {
          if (activeGames[i].players[j].id !== socket.id) {
            socket.to(activeGames[i].players[j].id).emit("chatMessageReceive", activeGames[i].getPlayerUsername(socket.id), message);
            break;
          }
        }
      }
      
      break;
    }
  });


});

server.listen(process.env['PORT'], () => {
  console.log("running <3");
});

//helper functions:

/*
Source: https://stackoverflow.com/a/10727155/16728970

Generate a random string of length parameter
*/
function randomString(length) {
  let result = '';
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/*
Generate a unique game ID by generating
a random 8-char string and checking if it's unique:
*/

async function generateGameId() {
  let possibleGameId = randomString(8);

  return new Promise((resolve, reject) => {
    let db = new sqlite3.Database(__dirname + "/database/data.db", (err) => {
      if (err) {
        console.log(err);
      }
    });
  
    //check if unique
    db.all(`SELECT game_id FROM games WHERE game_id = ?`, [possibleGameId], function(err, rows) {
      if (err) {
        console.log(err);
      } else {
        if (rows.length === 0) {
          db.run(`INSERT INTO games(game_id) VALUES (?)`, [possibleGameId], function(err) {
            if (err) {
              console.log(err);
            } else {
              db.close((err) => {
                if (err) {
                  console.log(err);
                }
  
                resolve(possibleGameId);
              });
            }
          });
        } else {
          db.close((err) => {
            if (err) {
              console.log(err);
            }
  
            resolve(generateGameId());
          });
        }
      }
    });
  });
}

/*
Generate a temp ID for user when they create a game invite link
This ID will be tokenized and sent to the client side to be saved in localStorage temporarily
They will then be redirected to checkhouse.cf/{game link}
After they connect there, their token (which was temporarily saved in localStorage) gets
sent back to the server, where they are "rematched" within the game - this will most likely
be done with socket.io but it is 2 am right now and i'll probably go to sleep soon and i might
have better ideas next morning
*/

function generateTempChallengerId() {
  let possibleId = randomString(12);
  let unique = true;
  
  for (let i = 0; i < activeGames.length; i++) {
    if (activeGames[i].hasPlayer(possibleId)) {
      unique = false;
      break;
    }
  }

  if (unique) {
    return possibleId;
  } else {
    return generateTempChallengerId();
  } 
}

/*
Verify if game ID exists and if so, what type of game it is
Returns either "active", "past", or "invalid"
Parameter: string gameId to be checked
returns a promise because it checks through the database of past games
*/

async function verifyGameId(gameId) {
  return new Promise((resolve, reject) => {
    //first check if it's active
    let active = false;

    for (let i = 0; i < activeGames.length; i++) {
      if (activeGames[i].id === gameId) {
        active = true;
        break;
      }
    }

    if (active) {
      resolve("active");
    } else { //check the database to see if it's a past game
      let db = new sqlite3.Database(__dirname + "/database/data.db", (err) => {
        if (err) {
          console.log(err);
        }
      });

      db.all(`SELECT game_id FROM games WHERE game_id = ?`, [gameId], function(err, rows) {
        db.close((err) => {
          if (err) {
            console.log(err);
          }
        });
        
        if (rows.length === 0) { //if no entries were found...
          resolve("invalid");
        } else { //if entries WERE found...
          resolve("past");
        }
      });
    }
  });
}