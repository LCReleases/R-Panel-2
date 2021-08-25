const {
  ipcRenderer
} = require("electron");

const db = remote.getGlobal("database");
const collect = remote.getGlobal("collect");

const dateManager = require("../scripts/modules/DateManager");
const currencyManager = require("../scripts/modules/CurrencyManager");

const chipsList = ["1", "2", "5", "10", "30", "50", "100", "300", "500"];
const ticketsList = ["entrance", "vip"];

let lastRevenues = []

let sideNavActivated = false;
let debugging = false;
let firstLoad = true;

let localTicketData;
let localWeekRevenue = 0;
let localMonthRevenue = 0;
let localSessionAmount = 0;

let monthAverage = 0;

let currentSessionInfo;

setSessionValuesLabel = (revenueList) => {
  const revenuesLabels = ["today", "week", "month"];
  revenuesLabels.forEach(async (label, index) => {
    const revenueNumber = currencyManager.parseToBRL(revenueList[index])
    document.getElementById(label + "Revenue").innerHTML = revenueNumber;
  });
};

async function downloadLocalTicketData() {
  await getData().then(async ticketData => {
    localTicketData = ticketData.data()
  })
}

async function init() {
  await downloadLocalTicketData();
  document.getElementById("currentSession").innerText = localTicketData.sessions;

  getMonthAverage(localTicketData)

  lastRevenues = getLastRevenue(localTicketData);

  createCardList(localTicketData)
  loadLastRevenueCards(localTicketData)
  loadSessionMenu(localTicketData)
}

function getData() {
  return db.collection(collect).doc("tickets").get();
}


function getCurrentSession(currentSessionData, sessionName) {
  let ticketSold = 0;

  let womenSold = 0;
  let menSold = 0;
  let vipSold = 0;
  let differenceSold = 0;

  let menCard = 0;
  let menCash = 0;

  let womenCard = 0;
  let womenCash = 0;

  let vipCard = 0;
  let vipCash = 0;

  let differenceCard = 0;
  let differenceCash = 0;

  let ticketCard = 0;
  let ticketCash = 0;
  let ticketRevenue = 0;

  let chipAmount = [];
  let chipSold = 0;
  let chipRevenue = 0;

  let soldInCard = 0;
  let soldInCash = 0;

  const start = currentSessionData["start"]
  const end = currentSessionData["end"];

  const uuid = currentSessionData["uuid"]

  for (let chipIndex = 0; chipIndex < chipsList.length; chipIndex++) {
    let chipValue = currentSessionData["chips"][chipsList[chipIndex]];

    if (chipValue == undefined) {
      chipValue = 0;
    }
    chipSold += parseInt(chipValue);
    chipRevenue += parseInt(chipValue) * chipsList[chipIndex];
    chipAmount[chipIndex] = chipValue;
  }
  soldInCard += chipRevenue;

  let ticketPaymentsType = ["card", "money"];
  let ticketPaymentsValue = ["10", "20"];
  for (let index = 0; index < ticketsList.length; index++) {
    const ticketType = currentSessionData[ticketsList[index]];

    ticketPaymentsType.forEach((type) => {
      ticketPaymentsValue.forEach((value) => {
        const ticketPayment = ticketType[type];
        const ticketSoldAmount = ticketPayment[value];

        ticketRevenue += parseInt(ticketSoldAmount) * parseInt(value);

        if (type == "card") {
          soldInCard += ticketSoldAmount * parseInt(value)
          ticketCard += ticketSoldAmount * parseInt(value)

          if (ticketsList[index] == 'entrance') {
            if (value == "10") {
              womenCard += ticketSoldAmount * parseInt(value)
            } else {
              menCard += ticketSoldAmount * parseInt(value)
            }
          } else {
            if (value == "10") {
              differenceCard += ticketSoldAmount * parseInt(value)
            } else {
              vipCard += ticketSoldAmount * parseInt(30)
            }
          }
        } else {
          soldInCash += ticketSoldAmount * parseInt(value)
          ticketCash += ticketSoldAmount * parseInt(value)

          if (ticketsList[index] == 'entrance') {
            if (value == "10") {
              womenCash += ticketSoldAmount * parseInt(value)
            } else {
              menCash += ticketSoldAmount * parseInt(value)
            }
          } else {
            if (value == "10") {
              differenceCash += ticketSoldAmount * parseInt(value)
            } else {
              vipCash += ticketSoldAmount * parseInt(30)
            }
          }
        }

        if (ticketsList[index] == "entrance" && value == "10") {
          womenSold += ticketSoldAmount;
        } else {
          if (ticketsList[index] == "entrance") {
            menSold += ticketSoldAmount;
          }
        }

        if (ticketsList[index] == "vip" && value == "10") {
          differenceSold += ticketSoldAmount;
        } else {
          if (ticketsList[index] == "vip") {
            vipSold += ticketSoldAmount;
          }
        }
      });
    });
  }

  function getInfo() {
    let currentSessionInfoObject = {};
    currentSessionInfoObject[sessionName] = {
      uuid,
      menAmount: menSold,
      womenAmount: womenSold,
      ticket: ticketSold,
      vip: vipSold,
      difference: differenceSold,
      ticketCard,
      ticketCash,
      womenCard,
      womenCash,
      menCard,
      menCash,
      differenceCard,
      differenceCash,
      vipCard,
      vipCash,
      ticketRevenue,
      ticketAmount: vipSold + differenceSold + menSold + womenSold,
      chipSold,
      chipRevenue,
      chipAmount,
      soldInCard,
      soldInCash,
      totalSold: soldInCard + soldInCash,
      start,
      end,
    }
    return currentSessionInfoObject
  }

  return {
    getInfo
  }
}

function createCardList(sessionAmount, ticketData) {
  const sessions = ticketData["sessions"]

  let sessionIcon;

  localSessionAmount += sessionAmount;

  if (localSessionAmount >= sessions) {
    sessionAmount = 0;
    localSessionAmount = 0;
  }

  var clearSessions = document.getElementById('lSessions');
  clearSessions.innerHTML = "";

  for (let index = 1 + ((1 + localSessionAmount) < 1 ? 0 : localSessionAmount); index < (7 + localSessionAmount); index++) {
    if (sessions - index == 0) {
      break;
    }

    const session = ticketData["session#" + (sessions - index)];
    const sessionList = getCurrentSession(session, "session#" + (sessions - index)).getInfo()["session#" + (sessions - index)]
    let sessionChips = 0;
    sessionList["chipAmount"].forEach(value => {
      sessionChips += value;
    });

    if ((sessions - index) > 1) {
      sessionIcon = returnIcon(sessionList["totalSold"], getCurrentSession(ticketData["session#" + (sessions - (index + 1))], "session#" + (sessions - (index + 1))).getInfo()["session#" + (sessions - (index + 1))]["totalSold"])
    } else {
      sessionIcon = {
        side: "up",
        color: "rgb(101, 216, 101)",
        result: 0
      };
    }

    const sessionCard = `
      <div class="info hide">
      <div class="lDate">
          <div class="lStart lLabel">
              <span class="fa fa-clock green"></span>
              ${dateManager.formatDate(session["start"])}</div>
          <div class="lEnd lLabel">
              <span class="fa fa-clock red"></span>
              ${dateManager.formatDate(session["end"])}</div>
      </div>

      <div class="lSell">
          <div class="lTicket">
              <span class="fa fa-ticket gold"></span>
              ${sessionList["ticketAmount"]}
          </div>
          <div class="lChip">
              <span class="fa fa-coins gold"></span>
              ${sessionChips}
          </div>
      </div>
  </div>

  <div class="normal">
      <div class="lName">Sessão ${sessions - index}</div>
      
      <div class="lDivider"></div>
      <div class="lRevenueContent">
          <div class="lRevenueLabel">Faturamento</div>
          <div class="lRevenue">${currencyManager.parseToBRL(parseInt(sessionList["totalSold"]))}</div>
      </div>
      <div class="${sessionIcon["side"] == "up" ? "green" : "red"}" style="margin-left: auto; margin-right: 10px">
      ${sessionIcon["result"]}%
          <span class="fa fa-arrow-${sessionIcon["side"]} arrow" style="text-shadow: 1px 1px 10px ${sessionIcon["color"]};"></span>
      </div>
  </div>
  </div>
  </div>`

    const dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", "session" + (sessions - index));
    dataDiv.className = "lDefault"
    dataDiv.innerHTML = sessionCard;

    document.getElementById("lSessions").appendChild(dataDiv)

    $(".lDefault").mouseenter(function () {
      const sessionId = this.id;
      $("#" + sessionId).find(".info").attr("class", "info")
      $("#" + sessionId).find(".info").css("opacity", "1")
      $("#" + sessionId).find(".normal").css("opacity", "0")
      $("#" + sessionId).find(".normal").attr("class", "normal hide");
    })

    $(".lDefault").mouseleave(function () {
      const sessionId = this.id;
      $("#" + sessionId).find(".normal").attr("class", "normal")
      $("#" + sessionId).find(".normal").css("opacity", "1")
      $("#" + sessionId).find(".info").css("opacity", "0")
      $("#" + sessionId).find(".info").attr("class", "info hide")
    })
  }

  if (localSessionAmount == 0) {
    $("#arrowUp").css("visibility", "hidden")
    $("#arrowUp").css("position", "absolute")
  } else {
    $("#arrowUp").css("visibility", "visible")
    $("#arrowUp").css("position", "relative")
  }
}

function getLastRevenue(ticketData) {

  let lastRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;

  const sessionsAmount = ticketData["sessions"];

  /* START LAST REVENUE LOGIC*/
  const lastSessionData = ticketData["session#" + (sessionsAmount - (sessionsAmount > 1 ? 1 : 0))];
  const lastSession = "session#" + (sessionsAmount - 1);
  lastRevenue = getCurrentSession(lastSessionData, lastSession).getInfo()[lastSession]["totalSold"];

  if (debugging) {
    console.log("---CÁLCULO DO FATURAMENTO DA ÚLTIMA SESSÃO INICIADO---")
    console.log(`A última sessão{${sessionsAmount - 1}} faturou ${lastRevenue}\nObjeto para verificação de dados abaixo`)
    console.log(getCurrentSession(lastSessionData, lastSession).getInfo()[lastSession]);
    console.log("---FINALIZADO CÁCULO DO ÚLTIMO FATURAMENTO---")
  }
  /* END LAST REVENUE LOGIC*/

  /* START LAST WEEK REVENUE LOGIC */
  const currentDay = dateManager.parseTimestampToDayNumber(Date.now());
  const isSaturday = currentDay == 6;
  let reachedSunday = false;

  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  if (debugging) {
    console.log("###CÁLCULO DO FATURAMENTO DA ÚLTIMA SEMANA INICIADO###")
    console.log(`O dia atual é {${days[currentDay]}}`)
  }

  for (let index = 0; index < 25; index++) {
    const currentSessionNumber = sessionsAmount - index;
    if (currentSessionNumber == 0) {
      break;
    }
    const currentSessionName = "session#" + currentSessionNumber;
    const currentSession = ticketData["session#" + currentSessionNumber];
    let sessionDayNumber = dateManager.parseTimestampToDayNumber(currentSession["start"]);
    const sessionDayHour = dateManager.parseTimestampToHours(currentSession["start"]);

    if (sessionDayHour < 13) {
      if (sessionDayNumber == 0) {
        sessionDayNumber = 6;
      } else {
        sessionDayNumber -= 1;
      }
    }

    if (isSaturday) {
      if (sessionDayNumber <= currentDay) {
        if (sessionDayNumber == 0) {
          reachedSunday = true;
        }

        if (reachedSunday) {
          if (sessionDayNumber != 6) {
            weekRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
            localWeekRevenue = weekRevenue;
            if (debugging) {
              console.log("date: " + dateManager.formatDate(currentSession["start"]))
              console.log(`${currentSessionName} foi adicionado à lista pois foi iniciado no dia ${days[sessionDayNumber]} ${getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"]}`)
            }
          } else {
            break;
          }
        } else {
          weekRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
          localWeekRevenue = weekRevenue;
          if (debugging) {
            console.log("date: " + dateManager.formatDate(currentSession["start"]))
            console.log(`${currentSessionName} foi adicionado à lista pois foi iniciado no dia ${days[sessionDayNumber]} ${getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"]}`)
          }
        }
      }
    } else {
      if (sessionDayNumber <= currentDay) {
        weekRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
        localWeekRevenue = weekRevenue;
        if (debugging) {
          console.log("date: " + dateManager.formatDate(currentSession["start"]))
          console.log(`${currentSessionName} foi adicionado à lista pois foi iniciado no dia ${days[sessionDayNumber]} ${getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"]}`)
        }
      } else {
        break;
      }
    }
  }
  if (debugging) {
    console.log("###FINALIZADO CÁLCULO DO FATURAMENTO DA ÚLTIMA SEMANA###")
  }
  /* END LAST WEEK REVENUE LOGIC */

  /* START LAST REVENUE MONTH LOGIC */
  const currentMonth = dateManager.parseTimestampToMonth(Date.now());

  if (debugging) {
    console.log("***CÁLCULO DO FATURAMENTO DO ÚLTIMO MÊS INICIADO***")
    console.log(`O mês atual é {${currentMonth}}`)
  }

  for (let index = 0; index < 300; index++) {
    const currentSessionNumber = sessionsAmount - index;
    if (currentSessionNumber == 0) {
      break;
    }
    const currentSessionName = "session#" + currentSessionNumber;
    const currentSession = ticketData["session#" + currentSessionNumber];
    const sessionMonth = dateManager.parseTimestampToMonth(currentSession["start"]);

    if (sessionMonth == currentMonth) {
      monthRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
      localMonthRevenue = monthRevenue;
      if (debugging) {
        console.log(`${currentSessionName} sessionMonth${sessionMonth} currentMonth${currentMonth}`)
        console.log(`Faturamento da sessão: ${getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"]}`)
      }
    } else {
      if (debugging) {
        console.log(`reached month{${sessionMonth}}`)
        console.log("break;")
      }
      break;
    }
  }
  /* END LAST MONTH REVENUE LOGIC */

  function getList() {
    const returnObject = {}
    returnObject["sessionsRevenue"] = {
      lastRevenue,
      weekRevenue,
      monthRevenue,
    }
    return returnObject["sessionsRevenue"];
  }

  async function updateRevenue() {
    localMonthRevenue -= parseInt(getCurrentSession(ticketData["session#" + ticketData.sessions], "session#" + ticketData.sessions).getInfo()["session#" + ticketData.sessions]["totalSold"])
    localWeekRevenue -= parseInt(getCurrentSession(ticketData["session#" + ticketData.sessions], "session#" + ticketData.sessions).getInfo()["session#" + ticketData.sessions]["totalSold"])
    await downloadLocalTicketData();
    localWeekRevenue += parseInt(getCurrentSession(ticketData["session#" + ticketData.sessions], "session#" + ticketData.sessions).getInfo()["session#" + ticketData.sessions]["totalSold"])
    localMonthRevenue += parseInt(getCurrentSession(ticketData["session#" + ticketData.sessions], "session#" + ticketData.sessions).getInfo()["session#" + ticketData.sessions]["totalSold"])

    document.getElementById("weekRevenue").innerText = currencyManager.parseToBRL(localWeekRevenue);
    document.getElementById("monthRevenue").innerText = currencyManager.parseToBRL(localMonthRevenue);
  }

  return {
    getList,
    updateRevenue
  }
}

function getMonthAverage(ticketData) {
  let sessions = ticketData["sessions"];

  let lastCalculatedDay = dateManager.parseTimestampToDay(Date.now);
  let daysAmount = 0;

  let days = [];

  let last30DaysRevenue = 0;

  for (let index = 0; index < 200; index++) {
    const sessionNumber = sessions - index
    if (sessionNumber == 0) {
      break;
    }
    const sessionName = "session#" + sessionNumber;
    const sessionData = ticketData[sessionName];
    const sessionRevenue = parseInt(getCurrentSession(sessionData, sessionName).getInfo()[sessionName]["totalSold"])
    const sessionDay = dateManager.parseTimestampToDay(sessionData["start"]);

    if (sessionDay <= lastCalculatedDay) {
      if (daysAmount < (sessions > 30 ? 30 : sessions)) {
        last30DaysRevenue += sessionRevenue;
        if (!days.includes(sessionDay)) {
          daysAmount += 1;
          days.push(sessionDay)
        }
      } else {
        monthAverage = last30DaysRevenue / index;
        break;
      }
    }
  }
}

function returnIcon(sessionRevenue) {
  let highest = (monthAverage > sessionRevenue ? monthAverage : sessionRevenue)
  let lowest = (monthAverage < sessionRevenue ? monthAverage : sessionRevenue)

  let result = (highest / lowest) * 100;
  if (result == Infinity) {
    result = 0;
  }

  return {
    side: (sessionRevenue > monthAverage ? "up" : "down"),
    color: (sessionRevenue > monthAverage ? "rgb(101, 216, 101)" : "rgb(226, 82, 82)"),
    result: Math.round(result),
  }
}

function loadLastRevenueCards() {
  document.getElementById("todayRevenue").innerText = currencyManager.parseToBRL(lastRevenues.lastRevenue);
  document.getElementById("weekRevenue").innerText = currencyManager.parseToBRL(lastRevenues.weekRevenue);
  document.getElementById("monthRevenue").innerText = currencyManager.parseToBRL(lastRevenues.monthRevenue);
}

function loadSessionMenu(ticketData) {
  if (ticketData == "#") {
    ticketData = localTicketData
  }

  const sessionsAmount = ticketData["sessions"];
  const currentSession = document.getElementById("currentSession").innerText;

  if (parseInt(currentSession) > parseInt(sessionsAmount)) {
    $("searchSession").focusout();
    document.getElementById("currentSession").classList.add("error")

    setTimeout(function () {
      document.getElementById("currentSession").classList.remove("error")
      document.getElementById("currentSession").classList.add("blinking")
      document.getElementById("currentSession").innerText = sessionsAmount;
      loadSessionMenu("#");
    }, 400);

    return false;
  }

  const sessionName = "session#" + currentSession;
  const sessionData = ticketData[sessionName]
  const sessionInfo = getCurrentSession(sessionData, sessionName).getInfo()[sessionName];
  currentSessionInfo = sessionInfo;
  currentSessionInfo["session"] = currentSession;

  document.getElementById("menTicket").innerText = sessionInfo["menAmount"]
  document.getElementById("womenTicket").innerText = sessionInfo["womenAmount"]
  document.getElementById("vipTicket").innerText = sessionInfo["vip"]
  document.getElementById("differenceTicket").innerText = sessionInfo["difference"]
  document.getElementById("ticketRevenue").innerText = currencyManager.parseToBRL(sessionInfo["ticketRevenue"])

  chipsList.forEach((chipValue, index) => {
    let formatedChipAmount = sessionInfo["chipAmount"][index].toString().padStart(3, "0");
    document.getElementById("chip" + chipValue).innerText = formatedChipAmount
  });
  document.getElementById("chipRevenue").innerText = currencyManager.parseToBRL(sessionInfo["chipRevenue"])

  document.getElementById("cashRevenue").innerText = currencyManager.parseToBRL(sessionInfo["soldInCash"]);
  document.getElementById("cardRevenue").innerText = currencyManager.parseToBRL(sessionInfo["soldInCard"]);
  document.getElementById("revenue").innerText = currencyManager.parseToBRL(sessionInfo["totalSold"])
  document.getElementById("totalRevenue").innerText = currencyManager.parseToBRL(sessionInfo["totalSold"])
}

if (document.readyState === 'complete') {
  init();
}

let showingNotification = false;

db.collection(collect)
  .onSnapshot(docSnapshot => {
    getData().then(async ticketData => {
      await downloadLocalTicketData();
      document.getElementById("currentSession").innerText = localTicketData.sessions;

      if (firstLoad) {
        getMonthAverage(localTicketData)

        lastRevenues = getLastRevenue(ticketData.data()).getList()
        loadLastRevenueCards(ticketData.data());
        createCardList(0, localTicketData)
        firstLoad = false;
      } else {
        if (!showingNotification) {
          showingNotification = true;
          document.getElementById("lNotification").style.transition = "1s";
          document.getElementById("lNotification").style.opacity = 1;
          setTimeout(() => {
            document.getElementById("lNotification").style.opacity = 0;
          }, 1200);
          setTimeout(() => {
            showingNotification = false;
          }, 1300);
        }
        getLastRevenue(ticketData.data()).updateRevenue()
      }
      if (document.activeElement !== document.getElementById("searchSession")) {
        loadSessionMenu(ticketData.data())
      }
    })
  }, err => {
    console.log(`Encountered error: ${err}`);
  })

function toggleNav() {
  if (!sideNavActivated) {
    $("#lList").css("width", "23.5vw");
    $("#lSessions").css("transition", "opacity 2s");
    $("#lSessions").css("opacity", "1");
    $("#organize").css("margin-right", "23.5vw");
    $("#organizeMenu").css("margin-right", "23.5vw");
    $("#lButton").css("visibility", "hidden");
    sideNavActivated = true;
  } else {
    $("#lSessions").css("opacity", "0");
    $("#lSessions").css("transition", "opacity 0.1s");
    $("#lList").css("width", "0");
    $("#organize").css("margin-right", "0");
    $("#organizeMenu").css("margin-right", "0");
    $("#lButton").css("visibility", "visible");
    sideNavActivated = false;
  }
}

function arrowUp() {
  createCardList(-6, localTicketData);
}

function arrowDown() {
  createCardList(6, localTicketData);
}

function printPdf() {
  ipcRenderer.send("printPdf", [currentSessionInfo]);
}

function logout() {
  ipcRenderer.send("logout", [currentSessionInfo]);
}