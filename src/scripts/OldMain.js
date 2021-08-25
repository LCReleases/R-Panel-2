const {
    ipcRenderer
  } = require("electron");
  
  const db = remote.getGlobal("database");
  const collect = remote.getGlobal("collect");
  
  const {
    jsPDF
  } = require("jspdf");
  const fs = require("fs");
  const images = require("../utils/images64");
  
  const tableManager = require("../scripts/modules/TableManager");
  const chartManager = require("../scripts/modules/ChartManager");
  const listSession = require("../scripts/modules/ListSessionManager");
  const dateManager = require("../scripts/modules/DateManager");
  const currencyManager = require("../scripts/modules/CurrencyManager");
  
  require("../utils/autotable");
  
  const chipsList = ["1", "2", "5", "10", "50", "100", "200", "300", "500"];
  const ticketsList = ["entrance", "vip"];
  
  let lastSessions = [];
  let sessionTable = {};
  
  let debugging = false;
  
  setSessionValuesLabel = (revenueList) => {
    const revenuesLabels = ["today", "week", "month"];
    revenuesLabels.forEach(async (label, index) => {
      const revenueNumber = currencyManager.parseToBRL(revenueList[index])
      document.getElementById(label + "Revenue").innerHTML = revenueNumber;
    });
  };
  getSessionDataTest = (session) => {
    db.collection(collect)
      .doc("tickets")
      .get()
      .then(async (sessions) => {
        const currentSessionsAmount = sessions.data()["sessions"]
        let sessionName = "";
  
        if (session > currentSessionsAmount) {
          ipcRenderer.send('session-notfound', session)
          session = "#"
        }
        if (session == "#") {
          sessionName = "session#" + currentSessionsAmount;
          document.getElementById("currentSession").innerHTML = currentSessionsAmount;
        } else {
          sessionName = "session#" + session;
        }
  
        const currentSession = sessions.data()[sessionName];
  
        console.log(getCurrentSession(currentSession, sessionName).getInfo());
        // const chipsValues = getChipsBalance(
        //   currentSession,
        //   sessionName
        // ).getChipValuesList();
  
        // // //CARDS
        // // const todayRevenue = getLastRevenuesOf(sessions.data(), 1);
        // // const weekRevenue = getLastRevenuesOf(sessions.data(), 7);
        // // const monthRevenue = getLastRevenuesOf(sessions.data(), 30);
        // // setSessionValuesLabel([todayRevenue, weekRevenue, monthRevenue]);
  
        // //MENU
        // const tableList = getTicketsBalance(currentSession, sessionName).getSession().getSessionTable()[sessionName];
        // document.getElementById("normalTicket").innerHTML = tableList.entrance;
        // document.getElementById("vipTicket").innerHTML = tableList.vips;
        // document.getElementById("differenceTicket").innerHTML = tableList.difference;
        // document.getElementById("ticketsRevenue").innerHTML = currencyManager.parseToBRL(tableList.ticketsRevenue)
  
        // chipsList.forEach(value => {
        //   document.getElementById("chip" + value).innerHTML = chipsValues[sessionName][value]
        // });
        // document.getElementById("chipsRevenue").innerHTML = currencyManager.parseToBRL(tableList.chipsRevenue)
  
        // document.getElementById("moneyRevenue").innerHTML = currencyManager.parseToBRL(tableList.moneyRevenue)
        // document.getElementById("cardRevenue").innerHTML = currencyManager.parseToBRL(tableList.cardRevenue)
        // document.getElementById("totalRevenue").innerHTML = currencyManager.parseToBRL(tableList.revenue)
        // document.getElementById("revenue").innerHTML = currencyManager.parseToBRL(tableList.revenue)
  
        // listSession.createListSession(currentSessionsAmount, sessions.data(), tableList)
      });
  };
  
  getChipsBalance = (currentSessionData, session) => {
    function getChipValuesList() {
      let chipsValues = {};
      let chipValueObject = {};
  
      for (let index = 0; index < chipsList.length; index++) {
        const chipValue = chipsList[index];
        let chipAmount = currentSessionData.chips[chipValue];
  
        if (chipAmount == undefined) {
          chipAmount = 0;
        }
  
        chipValueObject[chipValue] = chipAmount;
        chipsValues[session] = chipValueObject;
      }
  
      return chipsValues;
    }
  
    function getChipsRevenue() {
      let sessionChipsRevenue = 0;
      for (let index = 0; index < chipsList.length; index++) {
        const chipValue = chipsList[index];
        let chipAmount = currentSessionData.chips[chipValue];
  
        if (chipAmount == undefined) {
          chipAmount = 0;
        }
  
        sessionChipsRevenue += parseInt(chipValue) * parseInt(chipAmount);
      }
      return sessionChipsRevenue;
    }
  
    return {
      getChipsRevenue,
      getChipValuesList,
    };
  };
  
  getTicketsBalance = (currentSessionData, session) => {
    let paymentsType = ["card", "money"];
    let paymentsValue = ["10", "20"];
  
    function getTicketsValuesList() {
      const ticketObject = {};
      let ticketsValues = {};
  
      for (let index = 0; index < ticketsList.length; index++) {
        const ticketType = currentSessionData[ticketsList[index]];
        ticketObject[ticketsList[index]] = ticketType;
        ticketsValues[session] = ticketObject;
      }
  
      return ticketsValues;
    }
  
    function getSession() {
      let sessionTicketsRevenue = 0;
      let sessionMoneyRevenue = 0;
      let sessionCardRevenue = 0;
  
      let sessionEntrances = 0;
      let sessionVips = 0;
      let sessionDifference = 0;
      let sessionTickets = 0;
  
      let sessionChips = 0;
      let sessionChipsRevenue = getChipsBalance(currentSessionData, session).getChipsRevenue();
  
      const startDay = currentSessionData["start"]
      const endDay = currentSessionData["end"];
  
      for (let chipIndex = 0; chipIndex < chipsList.length; chipIndex++) {
        const chipValue = currentSessionData["chips"][chipsList[chipIndex]];
        sessionChips += parseInt(chipValue);
      }
  
      for (let index = 0; index < ticketsList.length; index++) {
        const ticketType = currentSessionData[ticketsList[index]];
  
        paymentsType.forEach((type) => {
          paymentsValue.forEach((value) => {
            const ticketPayment = ticketType[type];
            const ticketAmount = ticketPayment[value];
  
            sessionTicketsRevenue += parseInt(ticketAmount) * parseInt(value);
  
            type == "card" ?
              (sessionCardRevenue += ticketAmount * parseInt(value)) :
              (sessionMoneyRevenue += ticketAmount * parseInt(value));
  
            if (ticketsList[index] == "vip" && value == "10") {
              sessionDifference += ticketAmount;
            } else {
              if (ticketsList[index] == "vip") {
                sessionVips += ticketAmount;
              } else {
                sessionEntrances += ticketAmount;
              }
            }
  
            sessionTickets += ticketAmount;
          });
        });
      }
  
      let sessionRevenue = sessionTicketsRevenue + sessionChipsRevenue
      sessionCardRevenue += sessionChipsRevenue
  
      sessionTable[session] = {
        entrance: sessionEntrances,
        vips: sessionVips,
        difference: sessionDifference,
        tickets: sessionTickets,
        chips: sessionChips,
        cardRevenue: sessionCardRevenue,
        moneyRevenue: sessionMoneyRevenue,
        revenue: sessionRevenue,
        ticketsRevenue: sessionTicketsRevenue,
        chipsRevenue: sessionChipsRevenue,
        start: dateManager.formatDate(startDay),
        end: dateManager.formatDate(endDay),
      };
  
      function getCardRevenue() {
        return sessionCardRevenue;
      }
  
      function getMoneyRevenue() {
        return sessionMoneyRevenue;
      }
  
      function getRevenue() {
        return sessionTicketsRevenue;
      }
  
      function getSessionTable() {
        return sessionTable;
      }
  
      return {
        getCardRevenue,
        getMoneyRevenue,
        getRevenue,
        getSessionTable,
      };
    }
  
    return {
      getSession,
      getTicketsValuesList,
    };
  };
  
  getLastRevenuesOf = (sessionData, days) => {
    const sessionsAmount = sessionData["sessions"];
  
    let sessionProfit = 0;
    let revenue = 0;
  
    let daysList = [];
    let daysAmount = parseInt(days);
  
    var daysInMilliseconds = 86400000 * daysAmount;
    var lastDays = Date.now() - daysInMilliseconds;
  
    for (let index = 0; index < sessionsAmount; index++) {
      const sessionNumber = sessionsAmount - index;
      const sessionName = `session#${sessionNumber}`;
      const session = sessionData[sessionName];
  
      const sessionDay = dateManager.parseTimestampToDay(session["start"]);
      const sessionHour = dateManager.parseTimestampToHours(session["start"])
  
      if (session["start"] > lastDays && parseInt(sessionHour) >= 14) {
        sessionProfit =
          getChipsBalance(session, sessionName).getSessionRevenue() +
          getTicketsBalance(session, sessionName).getSession().getRevenue();
        if (!daysList.includes(sessionDay)) {
          const sessionObject = {
            sessionName,
            sessionRevenue: sessionProfit,
            dateStart: dateManager.formatDate(session["start"]),
            dateEnd: dateManager.formatDate(session["end"]),
          };
          const profitObject = {};
  
          profitObject[sessionDay] = sessionProfit;
          sessionObject["session#" + sessionNumber] = profitObject;
          daysList.push(sessionObject);
          lastSessions.push(sessionObject);
  
          revenue += sessionProfit;
        } else {
          console.log(sessionsAmount)
          break;
        }
      }
    }
    return revenue;
  };
  
  recalculateLastSessionsRevenues = () => {}
  
  function init() {
    getData().then(ticketData => {
      const lastSession = ticketData.data()["sessions"]
      const sessionData = ticketData.data()["session#300"]
    })
  }
  
  function getData() {
    return db.collection(collect).doc("tickets").get();
  }
  
  
  function getCurrentSession(currentSessionData, sessionName) {
    let ticketSold = 0;
    let vipSold = 0;
    let differenceSold = 0;
    let ticketRevenue = 0;
  
    let chipAmount = [];
    let chipSold = 0;
    let chipRevenue = 0;
  
    let soldInCard = 0;
    let soldInCash = 0;
  
    const start = currentSessionData["start"]
    const end = currentSessionData["end"];
  
    for (let chipIndex = 0; chipIndex < chipsList.length; chipIndex++) {
      let chipValue = currentSessionData["chips"][chipsList[chipIndex]];
  
      if (chipValue == undefined) {
        chipValue = 0;
      }
      chipSold += parseInt(chipValue);
      chipRevenue += parseInt(chipValue) * chipsList[chipIndex];
      soldInCard += chipRevenue;
      chipAmount[chipIndex] = chipValue;
    }
  
    let ticketPaymentsType = ["card", "money"];
    let ticketPaymentsValue = ["10", "20"];
    for (let index = 0; index < ticketsList.length; index++) {
      const ticketType = currentSessionData[ticketsList[index]];
  
      ticketPaymentsType.forEach((type) => {
        ticketPaymentsValue.forEach((value) => {
          const ticketPayment = ticketType[type];
          const ticketSoldAmount = ticketPayment[value];
  
          ticketRevenue += parseInt(ticketSoldAmount) * parseInt(value);
  
          type == "card" ?
            (soldInCard += ticketSoldAmount * parseInt(value)) :
            (soldInCash += ticketSoldAmount * parseInt(value));
  
          if (ticketsList[index] == "vip" && value == "10") {
            differenceSold += ticketSoldAmount;
          } else {
            if (ticketsList[index] == "vip") {
              vipSold += ticketSoldAmount;
            } else {
              ticketSold += ticketSoldAmount;
            }
          }
        });
      });
    }
  
    function getInfo() {
      let currentSessionInfoObject = {};
      currentSessionInfoObject[sessionName] = {
        ticket: ticketSold,
        vip: vipSold,
        difference: differenceSold,
        ticketRevenue,
        ticketAmount: vipSold + differenceSold + ticketSold,
        chipSold,
        chipRevenue,
        chipAmount,
        soldInCard,
        soldInCash,
        totalSold: soldInCard + soldInCash,
        start,
        end
      }
      return currentSessionInfoObject
    }
  
    return {
      getInfo
    }
  }
  
  function getLastRevenue() {
  
    let lastRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
  
    let debuggingWeek = [];
    let debuggingMonth = [];
    let debuggingLastSession = [];
  
    getData().then(async ticketData => {
      const sessionsAmount = ticketData.data()["sessions"];
  
      /* START LAST REVENUE LOGIC*/
      const lastSessionData = ticketData.data()["session#" + (sessionsAmount - 1)];
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
        const currentSessionName = "session#" + currentSessionNumber;
        const currentSession = ticketData.data()["session#" + currentSessionNumber];
        const sessionDayNumber = dateManager.parseTimestampToDayNumber(currentSession["start"]);
  
        if (isSaturday) {
          if (sessionDayNumber <= currentDay) {
            if (sessionDayNumber == 0) {
              reachedSunday = true;
            }
  
            if (reachedSunday) {
              if (sessionDayNumber != 6) {
                weekRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
                if (debugging) {
                  console.log(`${currentSessionName} foi adicionado à lista pois foi iniciado no dia ${days[sessionDayNumber]}`)
                }
              } else {
                break;
              }
            } else {
              weekRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
              if (debugging) {
                console.log(`${currentSessionName} foi adicionado à lista pois foi iniciado no dia ${days[sessionDayNumber]}`)
              }
            }
          }
        } else {
          if (sessionDayNumber <= currentDay) {
            weekRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
            if (debugging) {
              console.log(`${currentSessionName} foi adicionado à lista pois foi iniciado no dia {${days[sessionDayNumber]}}`)
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
        const currentSessionName = "session#" + currentSessionNumber;
        const currentSession = ticketData.data()["session#" + currentSessionNumber];
        const sessionMonth = dateManager.parseTimestampToMonth(currentSession["start"]);
  
        if (sessionMonth == currentMonth) {
          monthRevenue += getCurrentSession(currentSession, currentSessionName).getInfo()[currentSessionName]["totalSold"];
          if (debugging) {
          console.log(`${currentSessionName} do mês ${sessionMonth} foi adicionado pois é igual à ${currentMonth}`)
          }
        } else {
          if (debugging) {
          console.log(`Break ao atingir o mês {${sessionMonth}}`)
          }
          break;
        }
      }
      /* END LAST MONTH REVENUE LOGIC */
  
  
      const returnObject = {}
      returnObject["sessionsRevenue"] = {
        lastRevenue,
        weekRevenue,
        monthRevenue,
      }
      return returnObject["sessionsRevenue"];
  
    })
  }
  
  init();
  getLastRevenue()
  
  db.collection(collect)
    .onSnapshot(docSnapshot => {
      getData().then(async ticketField => {
        const sessionsAmount = ticketField.data()["sessions"];
        const updatedSession = ticketField.data()["session#" + sessionsAmount];
        
      })
    }, err => {
      console.log(`Encountered error: ${err}`);
    })