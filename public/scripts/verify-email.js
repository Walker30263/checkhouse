let heading = document.getElementById("heading");
let loader = document.getElementById("loader");
let buttonContainer = document.getElementById("buttonContainer");

const swalAlertColor = {
  iconColor: '#FFFFFF',
  backgroundColor: '#321a47',
  color: '#FFFFFF'
};

let urlParams = new URLSearchParams(window.location.search);
let token = urlParams.get("token");

window.onload = async function() {
  let response = await fetchWrapper("POST", "/verify-email", {
    token: token
  });
  
  if (response.error) {
    swalError(response.error.title, response.error.message);
    heading.textContent = "Verification failed :/";
  } else if (response.success) {
    swalSuccess(response.success.title, response.success.message);
    heading.textContent = "Verification successful!";
  }
  
  loader.style.display = "none";
  buttonContainer.style.display = "block";
}

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