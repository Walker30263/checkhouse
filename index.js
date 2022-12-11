const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const sqlite3 = require("sqlite3").verbose();
const jwt = require('jsonwebtoken');

let activeGames = [];

class Game {
  constructor(challenger, id, settings) {
    this.challenger = new Member(challenger.id, challenger.guest, challenger.username, challenger.profilePicture);
    this.players = [this.challenger];
    this.id = id;
    this.settings = settings;
    this.playerChat = [];
    this.spectatorChat = [];
  }

  hasPlayer(id) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        return true;
        break;
      }
    }

    return false;
  }
}

class Member {
  constructor(id, guest, name, profilePicture = "default") {
    this.id = id;
    this.guest = guest;
    this.name = name;
    this.profilePicture = profilePicture;
  }
}

app.use(express.static("public")); //client-side css and js files
app.use(express.json()); //parse JSON in incoming requests

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/pages/home.html");
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
    profile_picture TEXT,
    bio TEXT,
    friends TEXT,
    incoming_friend_requests TEXT,
    outgoing_friend_requests TEXT
  )`);*/

  /*db.run(`CREATE TABLE IF NOT EXISTS games(
    game_id TEXT PRIMARY KEY,
    game_data TEXT
  )`);*/

  //logging database, uncomment following code to log database in console at runtime:
  
  /*db.all(`SELECT user_id, username, password_hashed, email, bio, friends, incoming_friend_requests, outgoing_friend_requests FROM users`, [], (err, rows) => {
  db.all(`SELECT * FROM games`, [], (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach(row => {
        console.log(row);
      });
    }
  });*/
});

db.close((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Successfully initialized database!");
  }
});

app.post('/create', async (req, res) => {
  let data = req.body;
  
  let tempId = generateTempChallengerId();
  let challenger = new Member(tempId, data.playerInfo.guest, data.playerInfo.username, data.playerInfo.pfp);
  let gameId = await generateGameId();
  let game = new Game(challenger, gameId, data.gameSettings);
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