//LIBARIES
const crypto = require("crypto");
const {
  ipcRenderer,
  remote
} = require("electron");

let real_user;

let da = remote.getGlobal("database");
let collection = remote.getGlobal("collect");

function tryLogin() {
  try {
    const user = document.getElementById("user").value;
    const typed_password = document.getElementById("pass").value;
    const password = crypto
      .createHash("md5")
      .update(typed_password)
      .digest("hex");

    ipcRenderer.send("tryLogin", [user.toLowerCase(), password]);
    real_user = user;
  } catch (e) {
    console.log(e);
  }
}

ipcRenderer.on("message", (event, message) => {
  console.log(message)
})

ipcRenderer.on("responseLogin", (event, response) => {
  let message = response;

  if (response == "USERNAME WRONG") {
    log_error(message, "usúario", "wrong");
    displayError("Usúario não encontrado!")
  } else if (response == "PASSWORD WRONG") {
    log_error(message, "senha", "wrong");
    displayError("A senha está incorreta!")
  } else if (response == "OK") {
    da.collection(collection)
      .doc("tickets")
      .get()
      .then(async (session) => {
        ipcRenderer.send("login", [real_user, session.data().sessions]);
      });
  }
});

const log_error = (html_message, value, error) => {
  switch (error) {
    case "found":
      html_message.innerHTML = `${value} não foi encontrado!`;
      break;
    case "wrong":
      html_message.innerHTML = `${value} está incorreto!`;
      break;
    case "blank":
      html_message.innerHTML = `${value} está em branco!`;
      break;
    case "logged":
      html_message.innerHTML = `${value} entrou em sua conta!`;
      break;
  }

  return html_message;
};

let showing = false;

function displayError(message) {
  if (!showing) {
    showing = true;
    document.getElementById("errorBox").style.position = "relative";
    document.getElementById("errorBox").style.opacity = "1";
    document.getElementById("errorText").innerText = message;
    setTimeout(() => {
      document.getElementById("errorBox").style.opacity = "0";
    }, 1000);
    setTimeout(() => {
      document.getElementById("errorBox").style.position = "absolute";
      showing = false;
    }, 1500);
  }
}