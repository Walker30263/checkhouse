var socket = io();

let chessboardConfig = {
  pieceTheme: '/assets/pieces/wikimedia/{piece}.svg'
}

var board = Chessboard('board', chessboardConfig);

let requestGuestUserForScreenNameContainer = document.getElementById("requestGuestUserForScreenNameContainer");
let profilePictureContainer = document.getElementById("profilePictureContainer");
let username = document.getElementById("username");
let guestUsernameInputContainer = document.getElementById("guestUsernameInputContainer");
let guestUsernameInput = document.getElementById("guestUsernameInput");
let btnJoinAsGuest = document.getElementById("joinAsGuest");
let btnLogin = document.getElementById("login");
let btnRegister = document.getElementById("register");

let invalidGameCodeContainer = document.getElementById("invalidGameCodeContainer");
let btnRedirectToMainPage = document.getElementById("redirectToMainPage");
let chatContainer = document.getElementById("chatContainer");
let chatForm = document.getElementById("chatForm");
let chatInput = document.getElementById("chatInput");
let messagesContainer = document.getElementById("messages");
let boardDiv = document.getElementById("board");

btnRedirectToMainPage.addEventListener("click", function() {
  window.location.href = "/";
});

btnLogin.addEventListener("click", function() {
  window.location.href = "/?login";
});

btnRegister.addEventListener("click", function() {
  window.location.href = "/?register";
});

guestUsernameInput.addEventListener("input", function() {
  if (guestUsernameInput.value) {
    username.textContent = guestUsernameInput.value + " (Guest User)";
    localStorage.setItem("guestUsername", guestUsernameInput.value);
  } else {
    username.textContent = "Guest User";
  }
});

window.onload = function() {
  let token = localStorage.getItem("token"); //for logged-in users
  let tempChallengerToken = localStorage.getItem("tempChallengerToken");
  let refreshToken = localStorage.getItem("refreshToken");
  let url = window.location.href;
  let gameId = url.substring(url.lastIndexOf('/') + 1); //get the thing after the last / in the URL
  let gameTokenObj = {};

  if (tempChallengerToken) {
    gameTokenObj.type = "tempChallenger";
    gameTokenObj.token = tempChallengerToken;
    socket.emit("requestGameInfo", gameTokenObj, gameId);
  } else if (refreshToken) {
    gameTokenObj.type = "refresh";
    gameTokenObj.token = refreshToken;
    socket.emit("requestGameInfo", gameTokenObj, gameId);
  } else {
    gameTokenObj.type = "null";
    gameTokenObj.token = null;

    if (token) {
      //idk yet
    } else {
      requestGuestUserForScreenNameContainer.style.display = "block";
      
      let img = document.createElement("img");
      img.src = "/assets/anonymous-pfp.png";
      profilePictureContainer.appendChild(img);
      username.textContent = "Guest User";
      guestUsernameInputContainer.style.display = "block";
  
      if (localStorage.getItem("guestUsername")) {
        guestUsernameInput.value = localStorage.getItem("guestUsername");
        username.textContent = guestUsernameInput.value + " (Guest User)";
      }
  
      joinAsGuest.addEventListener("click", function() {
        socket.emit("requestGameInfo", gameTokenObj, gameId, guestUsernameInput.value + " (Guest User)");
        requestGuestUserForScreenNameContainer.style.display = "none";
      });
    }
  }
  
  localStorage.removeItem("tempChallengerToken");
}

socket.on("invalidGameId", () => {
  invalidGameCodeContainer.style.display = "block";
});

socket.on("display", (game, state, refreshToken) => {
  alert(state);
  alert(JSON.stringify(game));

  board.position(game.position);

  if (game.inProgress) {
    boardDiv.style.display = "inline-block";
    chatContainer.style.display = "inline-block";
    inviteSomeoneContainer.style.display = "none";
  } else {
    inviteSomeoneContainer.style.display = "block";
  }

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