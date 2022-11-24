const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const sqlite3 = require("sqlite3").verbose();
const jwt = require('jsonwebtoken');

app.use(express.static("public")); //client-side css and js files
app.use(express.json()); //parse JSON in incoming requests

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/pages/home.html");
});

//THIS HAS TO BE KEPT AT THE END OF THE ROUTING SECTION OF THE CODE
app.get('*', (req, res) => { //if user tries to go to a random subpage that doesn't exist,
  res.redirect('/'); //redirect them to the home page
});

server.listen(process.env['PORT'], () => {
  console.log("running <3");
});