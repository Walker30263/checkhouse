const swalAlertColor = {
  iconColor: '#FFFFFF',
  backgroundColor: '#321a47',
  color: '#FFFFFF'
};

let loginOrRegister = document.getElementById("loginOrRegister");
let profilePictureContainer = document.getElementById("profilePictureContainer");
let username = document.getElementById("username");
let bio = document.getElementById("bio");
let guestUsernameInputContainer = document.getElementById("guestUsernameInputContainer");
let guestUsernameInput = document.getElementById("guestUsernameInput");

let preferredColorOptions = document.querySelectorAll("#preferredColorContainer > div");
let timeControlOptions = document.querySelectorAll("#timeControlContainer > div");

let createGame = document.getElementById("createGame");
let randomMatchmake = document.getElementById("randomMatchmake");
let matchmakingLoader = document.getElementById("matchmakingLoader");
let cancelMatchmaking = document.getElementById("cancelMatchmaking");

let pfp = "default";

window.onload = async function() {
  let account_token = localStorage.getItem("account_token") || sessionStorage.getItem("account_token");

  if (account_token === null) {
    loginOrRegister.style.display = "block";
    let img = document.createElement("img");
    img.src = "/assets/anonymous-pfp.png";
    profilePictureContainer.appendChild(img);
    username.textContent = "Guest User";
    guestUsernameInputContainer.style.display = "block";

    if (localStorage.getItem("guestUsername")) {
      guestUsernameInput.value = localStorage.getItem("guestUsername");
      username.textContent = guestUsernameInput.value + " (Guest User)";
    }
  } else {
    loginOrRegister.style.display = "none";

    let response = await fetchWrapper("POST", "/user-info", {
      account_token: account_token
    });

    console.log(response);

    if (response.data.profile_picture === "defaultAvatar") {
      let img = document.createElement("img");
      img.src = "/assets/default_avatar_pride.png";
      profilePictureContainer.appendChild(img);
    } else {
      //figure out custom pfps later
    }

    username.textContent = response.data.username;
    bio.textContent = response.data.bio;

    if (response.error) {
      if (response.error.title === "Invalid Account Token") {
        localStorage.removeItem("account_token");
        sessionStorage.removeItem("account_token");
        location.reload();
      } else {
        swalError(response.error.title, response.error.message);
      }
    }
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
    localStorage.setItem("guestUsername", guestUsernameInput.value);
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

createGame.addEventListener("click", async function() {
  let account_token = localStorage.getItem("account_token") || sessionStorage.getItem("account_token");
  let data = {
    playerInfo: {}
  };

  if (account_token === null) {
    data.playerInfo.guest = true;
    data.playerInfo.username = username.textContent;
  } else {
    data.playerInfo.guest = false;
  }

  data.playerInfo.pfp = pfp;

  data.gameSettings = getGameSettings();
  
  let res = await fetchWrapper('POST', '/create', data);
  sessionStorage.setItem("tempChallengerToken", res.data.token);
  window.location.href = `/${res.data.gameId}`;
});

randomMatchmake.addEventListener("click", function() {
  document.getElementById("gameSettings").style.display = "none";
  this.parentElement.style.display = "none";
  matchmakingLoader.style.display = "block";
  cancelMatchmaking.style.display = "block";
});

cancelMatchmaking.addEventListener("click", function() {
  matchmakingLoader.style.display = "none";
  cancelMatchmaking.style.display = "none";
  document.getElementById("gameSettings").style.display = "block";
  document.querySelector("#newGameContainer > .wrapper").style.display = "block";
});



/* Login/Register */

let btnOpenLoginScreen = document.getElementById("login");
let btnOpenRegisterScreen = document.getElementById("register");
let loginOrRegisterFormsContainer = document.getElementById("loginOrRegisterFormsContainer");
let btnSwitchToLoginForm = document.getElementById("btnSwitchToLoginForm");
let btnSwitchToRegisterForm = document.getElementById("btnSwitchToRegisterForm");

let loginForm = document.getElementById("loginForm");
let registerForm = document.getElementById("registerForm");

let rememberMe = document.getElementById("rememberMe");

btnOpenLoginScreen.addEventListener("click", function() {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
  openOverlay();
});

btnOpenRegisterScreen.addEventListener("click", function() {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
  openOverlay();
});

btnSwitchToLoginForm.addEventListener("click", function() {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
});

btnSwitchToRegisterForm.addEventListener("click", function() {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
});

/* Open when someone clicks on the span element */
function openOverlay() {
  loginOrRegisterFormsContainer.style.height = "100%";
}

/* Close when someone clicks on the "x" symbol inside the overlay */
function closeOverlay() {
  loginOrRegisterFormsContainer.style.height = "0%";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let response = await fetch('/login', {
    method: "POST",
    body: new FormData(loginForm)
  });

  let result = await response.json();

  if (result.error) {
    swalError(result.error.title, result.error.message);
    hcaptcha.reset();
  } else if (result.success) {
    Swal.fire({
      title: result.success.title,
      html: result.success.message,
      icon: "success",
      iconColor: swalAlertColor.iconColor,
      background: swalAlertColor.backgroundColor,
      color: swalAlertColor.color,
      didClose: () => {
        loginForm.reset();

        if (rememberMe.checked) {
          localStorage.setItem("account_token", result.success.token);
        } else {
          sessionStorage.setItem("account_token", result.success.token);
        }
        
        location.reload();
      }
    });
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let response = await fetch('/register', {
    method: "POST",
    body: new FormData(registerForm)
  });

  let result = await response.json();

  if (result.error) {
    swalError(result.error.title, result.error.message);
  } else {
    if (result.success) {
      Swal.fire({
        title: result.success.title,
        html: result.success.message,
        icon: "success",
        iconColor: swalAlertColor.iconColor,
        background: swalAlertColor.backgroundColor,
        color: swalAlertColor.color,
        didClose: () => location.reload()
      });

      registerForm.reset();
    }
  }
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

function swalError(errorTitle, errorMessage) {
  Swal.fire({
    title: errorTitle,
    text: errorMessage,
    icon: "error",
    iconColor: swalAlertColor.iconColor,
    background: swalAlertColor.backgroundColor,
    color: swalAlertColor.color
  });
}

function swalSuccess(successTitle, successMessage) {
  Swal.fire({
    title: successTitle,
    text: successMessage,
    icon: "success",
    iconColor: swalAlertColor.iconColor,
    background: swalAlertColor.backgroundColor,
    color: swalAlertColor.color
  });
}