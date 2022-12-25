var socket = io();
var board = Chessboard('board');

let invalidGameCodeContainer = document.getElementById("invalidGameCodeContainer");
let btnRedirectToMainPage = document.getElementById("redirectToMainPage");
let chatContainer = document.getElementById("chatContainer");
let chatForm = document.getElementById("chatForm");
let chatInput = document.getElementById("chatInput");
let messagesContainer = document.getElementById("messages");

btnRedirectToMainPage.addEventListener("click", function() {
  window.location.href = "/";
});

window.onload = function() {
  let tempChallengerToken = localStorage.getItem("tempChallengerToken");
  let refreshToken = localStorage.getItem("refreshToken");
  let url = window.location.href;
  let gameId = url.substring(url.lastIndexOf('/') + 1); //get the thing after the last / in the URL
  let token = {};

  if (tempChallengerToken) {
    token.type = "tempChallenger";
    token.token = tempChallengerToken;
  } else if (refreshToken) {
    token.type = "refresh";
    token.token = refreshToken;
  } else {
    token.type = "null";
    token.token = null;
  }

  socket.emit("requestGameInfo", token, gameId);
  localStorage.removeItem("tempChallengerToken");
}

socket.on("invalidGameId", () => {
  invalidGameCodeContainer.style.display = "block";
});

socket.on("display", (game, state, refreshToken) => {
  chatContainer.style.display = "block";
  alert(state);
  alert(JSON.stringify(game));

  board.position(game.position);

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
});

//chat:
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (chatInput.value) {
    socket.emit("chatMessageSend", chatInput.value);
    let newMessage = document.createElement("li");
    let messageAuthor = document.createElement("span");
    let messageContent = document.createElement("span");
    messageAuthor.classList.add("messageAuthor");
    messageContent.classList.add("messageContent");
    messageAuthor.textContent = "You: ";
    messageContent.textContent = chatInput.value;
    newMessage.appendChild(messageAuthor);
    newMessage.appendChild(messageContent);
    messagesContainer.appendChild(newMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    chatInput.value = "";
  }
});

socket.on("chatMessageReceive", (username, message) => {
  let newMessage = document.createElement("li");
  let messageAuthor = document.createElement("span");
  let messageContent = document.createElement("span");
  messageAuthor.classList.add("messageAuthor");
  messageContent.classList.add("messageContent");
  messageAuthor.textContent = `${username}: `;
  messageContent.textContent = message;
  newMessage.appendChild(messageAuthor);
  newMessage.appendChild(messageContent);
  messagesContainer.appendChild(newMessage);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});