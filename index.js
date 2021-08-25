const {
    app,
    BrowserWindow,
    dialog,
    ipcMain
  } = require("electron");
  
  const { autoUpdater } = require('electron-updater')
  const PDFWindow = require("electron-pdf-window");
  const url = require("url");
  const path = require("path");
  var admin = require("firebase-admin");
  var functions = require("firebase-functions");
  
  var {
    table
  } = require("./src/utils/images64");
  
  global.table = table;
  
  var serviceAccount = require("./src/utils/key.json");

  require('dotenv/config')
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL,
  });
  
  const database = admin.firestore();
  global.database = database;
  global.functions = functions;
  
  let collect = "";
  runningMode = () => {
    const debugging = true;
    const beernfood = true;
  
    if (debugging) {
      if (beernfood) {
        collect = process.env.DEBUG_BEER_N_FOOD;
      } else {
        collect = process.env.DEBUG_NORMAL_DB;
      }
    } else {
      if (beernfood) {
        collect = process.env.BEER_N_FOOD;
      } else {
        collect = process.env.NORMAL_DB;
      }
    }
  
    global.collect = collect;
  };
  
  runningMode();
  
  let win;
  
  function createWindow() {
    // Cria uma janela de navegação.
  
    win = new BrowserWindow({
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true
      },
      icon: __dirname + "/src/images/icon.png",
      title: "RTS"
    });
  
    // e carrega o index.html do aplicativo.
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "./src/pages/Login.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  
    win.on("ready-to-show", () => {
      win.show();
    });
  
    win.on("closed", () => {
      app.quit();
    });
  
    win.setMenuBarVisibility(false);
    win.maximize();
  
  }
  
  app.setUserTasks([
    {
      program: process.execPath,
      arguments: '--new-window',
      icon: __dirname + "/src/images/icon.png",
      title: 'Nova Janela',
      description: 'Criar nova janela'
    }
  ])
  
  app.on("ready", function () {
    createWindow()
  });
  
  app.on("ready", function () {
  
    const log = require("electron-log")
    log.transports.file.level = "debug"
    autoUpdater.logger = log
    autoUpdater.checkForUpdatesAndNotify().then(() => { console.log('rodou porra') }, error => { throw (error) })
  });
  
  ipcMain.on("login", (event, user) => {
    global.username = user[0];
    global.initialsession = user[1];
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "./src/pages/Panel.html"),
        protocol: "file:",
        slashes: true,
        autoHideMenuBar: true,
      })
    );
    win.maximize();
  });
  
  ipcMain.on("printPdf", (event, session) => {
    global.sessionInfo = session[0];
  
    const htmlWindow = new BrowserWindow({
      show: false,
      width: 1366,
      height: 768,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
      },
      icon: __dirname + "/src/images/icon.png",
      title: "RTS: Impressão de dados",
  
    })
  
    htmlWindow.setMenuBarVisibility(false)
    htmlWindow.loadURL(url.format({
      pathname: path.join(__dirname, "./src/pages/Pdf.html"),
      protocol: "file:",
      slashes: true,
      icon: __dirname + "/src/images/icon.png",
    }))
  
    setTimeout(() => {
      htmlWindow.destroy()
    }, 4500);
  });
  
  ipcMain.on("backToPanel", (event, user) => {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "./src/pages/Panel.html"),
        protocol: "file:",
        slashes: true,
  
      })
    );
    win.maximize();
  });
  
  
  ipcMain.on("tryLogin", (event, credentials) => {
    database
      .collection("users")
      .doc(credentials[0])
      .get()
      .then(async (user) => {
        if (user.data() == undefined) {
          event.reply("responseLogin", "USERNAME WRONG");
          return;
        }
  
        const userPassword = user.data()["password"];
  
        autoUpdater.checkForUpdatesAndNotify(true)
  
        if (userPassword == credentials[1]) {
          event.reply("responseLogin", "OK");
          return;
        } else {
          event.reply("responseLogin", "PASSWORD WRONG");
          return;
        }
      });
  });
  
  ipcMain.on("session-notfound", (event, session) => {
    dialog.showErrorBox(
      "Oops! Algo de errado aconteceu!",
      "A sessão " + session + " não é uma sessão existente!"
    );
  });
  
  ipcMain.on("logout", (event, args) => {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "./src/pages/Login.html"),
        protocol: "file:",
        slashes: true,
      })
    );
    win.maximize();
  });
  
  ipcMain.on("createPDF", (event, filePath) => {
    const pdfwindow = new PDFWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
      icon: __dirname + "/src/images/icon.png",
      title: "RTS: Impressão de dados",
    });
  
    pdfwindow.loadURL(filePath);
    pdfwindow.maximize();  
  });
  
  function sendStatusToWindow(text) {
    win.webContents.send('message', text);
  }
  
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
  })
  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
  })
  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
  })
  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
  })
  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded');
  });