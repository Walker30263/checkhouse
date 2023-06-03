const swalAlertColor = {
  iconColor: '#FFFFFF',
  backgroundColor: '#321a47',
  color: '#FFFFFF'
};

let urlParams = new URLSearchParams(window.location.search);
let token = urlParams.get("token");

let heading = document.getElementById("heading");

let requestResetLinkForm = document.getElementById("requestResetLinkForm");
let requestResetLinkFormContainer = document.getElementById("requestResetLinkFormContainer");

let verifyingPasswordResetTokenContainer = document.getElementById("verifyingPasswordResetTokenContainer");

let updatePasswordContainer = document.getElementById("updatePasswordContainer");
let updatePassword = document.getElementById("updatePassword");
let new_password = document.getElementById("new_password");
let confirm_new_password = document.getElementById("confirm_new_password");

window.onload = async function() {
  if (token) {
    verifyingPasswordResetTokenContainer.style.display = "block";
    heading.textContent = "Verifying Password Reset Token...";
    
    let response = await fetchWrapper("POST", "/validate-password-reset-token", {
      password_reset_token: token
    });

    if (response.error) {
      Swal.fire({
        title: response.error.title,
        html: response.error.message,
        icon: "error",
        iconColor: swalAlertColor.iconColor,
        background: swalAlertColor.backgroundColor,
        color: swalAlertColor.color,
        didClose: () => {
          window.location.href = "/forgot-password"
        }
      });
    } else if (response.success) {
      swalSuccess(response.success.title, response.success.message);
      heading.textContent = "Reset Password";
      verifyingPasswordResetTokenContainer.style.display = "none";
      updatePasswordContainer.style.display = "block";

      updatePassword.addEventListener("submit", async (e) => {
        e.preventDefault();

        let response = await fetchWrapper("POST", "/new-password", {
          password_reset_token: token,
          new_password: new_password.value,
          confirm_new_password: confirm_new_password.value
        });

        if (response.error) {
          if (response.error.title != "Expired Token!") {
            swalError(response.error.title, response.error.message);
          } else {
            Swal.fire({
              title: response.error.title,
              html: response.error.message,
              icon: "error",
              iconColor: swalAlertColor.iconColor,
              background: swalAlertColor.backgroundColor,
              color: swalAlertColor.color,
              didClose: () => {
                window.location.href = "/forgot-password"
              }
            });
          }
        } else if (response.success) {
          updatePasswordContainer.style.display = "none";
          Swal.fire({
            title: response.success.title,
            html: response.success.message,
            icon: "success",
            iconColor: swalAlertColor.iconColor,
            background: swalAlertColor.backgroundColor,
            color: swalAlertColor.color,
            didClose: () => {
              window.location.href = "/"
            }
          });
        }
      });
    }
  } else {
    requestResetLinkFormContainer.style.display = "block";
    
    requestResetLinkForm.addEventListener("submit", async (e) => {
      e.preventDefault();
    
      let response = await fetch('/request-password-reset', {
        method: "POST",
        body: new FormData(requestResetLinkForm)
      });
    
      let result = await response.json();
    
      if (result.error) {
        swalError(result.error.title, result.error.message);
        hcaptcha.reset();
      } else {
        swalSuccess(result.success.title, result.success.message);
        requestResetLinkFormContainer.style.display = "none";
        heading.textContent = "Check your email!";
      }
    });
  }
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