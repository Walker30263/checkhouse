let profilePictureContainer = document.getElementById("profilePictureContainer");
let username = document.getElementById("username");
let guestUsernameInputContainer = document.getElementById("guestUsernameInputContainer");
let guestUsernameInput = document.getElementById("guestUsernameInput");

let preferredColorOptions = document.querySelectorAll("#preferredColorContainer > div");
let timeControlOptions = document.querySelectorAll("#timeControlContainer > div");

let createGame = document.getElementById("createGame");
let randomMatchmake = document.getElementById("randomMatchmake");
let matchmakingLoader = document.getElementById("matchmakingLoader");
let cancelMatchmaking = document.getElementById("cancelMatchmaking");

window.onload = function() {
  let token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token === null) {
    let img = document.createElement("img");
    img.src = "/assets/anonymous-pfp.png";
    profilePictureContainer.appendChild(img);
    username.textContent = "Guest User";
    guestUsernameInputContainer.style.display = "block";
  } else {
    
  }

  if (localStorage.getItem("colorPreference")) {
    //calling it a button but it's actually a div that looks like a button
    let colorPrefButton = document.getElementById(localStorage.getItem("colorPreference"));
    colorPrefButton.classList.add("secondaryContentTheme");
    colorPrefButton.classList.remove("contentTheme");
  } else {
    localStorage.setItem("colorPreference", "noPref");
    //calling it a button but it's actually a div that looks like a button
    let colorPrefButton = document.getElementById(localStorage.getItem("colorPreference"));
    colorPrefButton.classList.add("secondaryContentTheme");
    colorPrefButton.classList.remove("contentTheme");
  }

  if (localStorage.getItem("timePreference")) {
    //calling it a button but it's actually a div that looks like a button
    let timePrefButton = document.getElementById(localStorage.getItem("timePreference"));
    timePrefButton.classList.add("secondaryContentTheme");
    timePrefButton.classList.remove("contentTheme");
  } else {
    localStorage.setItem("timePreference", "time_20+0");
    //calling it a button but it's actually a div that looks like a button
    let timePrefButton = document.getElementById(localStorage.getItem("timePreference"));
    timePrefButton.classList.add("secondaryContentTheme");
    timePrefButton.classList.remove("contentTheme");
  }
}

guestUsernameInput.addEventListener("input", function() {
  if (guestUsernameInput.value) {
    username.textContent = guestUsernameInput.value + " (Guest User)";
  } else {
    username.textContent = "Guest User";
  }
});

for (let i = 0; i < preferredColorOptions.length; i++) {
  preferredColorOptions[i].addEventListener("click", function() {
    //"select" the clicked div
    this.classList.add("secondaryContentTheme");
    this.classList.remove("contentTheme");
    localStorage.setItem("colorPreference", preferredColorOptions[i].id);

    //"deselect" other options
    for (let j = 0; j < preferredColorOptions.length; j++) {
      if (j !== i) {
        preferredColorOptions[j].classList.remove("secondaryContentTheme");
        preferredColorOptions[j].classList.add("contentTheme");
      }
    }
  });
}

for (let i = 0; i < timeControlOptions.length; i++) {
  timeControlOptions[i].addEventListener("click", function() {
    //"select" the clicked div
    this.classList.add("secondaryContentTheme");
    this.classList.remove("contentTheme");
    localStorage.setItem("timePreference", timeControlOptions[i].id);

    //"deselect" other options
    for (let j = 0; j < timeControlOptions.length; j++) {
      if (j !== i) {
        timeControlOptions[j].classList.remove("secondaryContentTheme");
        timeControlOptions[j].classList.add("contentTheme");
      }
    }
  });
}

createGame.addEventListener("click", function() {
  
});

randomMatchmake.addEventListener("click", function() {
  document.getElementById("gameSettings").style.display = "none";
  this.parentElement.style.display = "none";
  matchmakingLoader.style.display = "block";
  cancelMatchmaking.style.display = "block";
  alert(JSON.stringify(getGameSettings()));
});

cancelMatchmaking.addEventListener("click", function() {
  matchmakingLoader.style.display = "none";
  cancelMatchmaking.style.display = "none";
  document.getElementById("gameSettings").style.display = "block";
  document.querySelector("#newGameContainer > .wrapper").style.display = "block";
});

//helper functions:

async function fetchWrapper(type = 'GET', url = '', data = {}) {
  let response = await fetch(url, {
    method: type,
    credentials: 'include',
    cache: 'no-cache',
    headers: new Headers({
      "content-type": "application/json"
    }),
    body: JSON.stringify(data)
  });
  return response.json(); //parses JSON response into JavaScript objects
}

function getGameSettings() {
  let settings = {};
  
  for (let i = 0; i < preferredColorOptions.length; i++) {
    if (preferredColorOptions[i].classList.contains("secondaryContentTheme")) {
      settings.preferredColor = preferredColorOptions[i].id;
      break;
    }
  }

  for (let i = 0; i < timeControlOptions.length; i++) {
    if (timeControlOptions[i].classList.contains("secondaryContentTheme")) {
      settings.timeControl = timeControlOptions[i].id;
      break;
    }
  }

  return settings; //should be an object
}