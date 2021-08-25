const {
    remote,
    ipcRenderer
} = require("electron");

const { jsPDF } = require("jspdf");
const html2canvas = require("html2canvas");
const fs = require("fs")

const chipsList = ["1", "2", "5", "10", "30", "50", "100", "300", "500"];

createPdf = () => {
    const sessionInfo = remote.getGlobal("sessionInfo");
    const user = remote.getGlobal("username")

    document.getElementById("headerText").innerText = "Resumo da Sessão " + sessionInfo["session"]

    // document.getElementById("couvertCard").innerText = parseToBRL(sessionInfo["ticketCard"])
    // document.getElementById("couvertCash").innerText = parseToBRL(sessionInfo["ticketCash"])

    document.getElementById("womenCard").innerText = parseToBRL(sessionInfo["womenCard"])
    document.getElementById("womenCash").innerText = parseToBRL(sessionInfo["womenCash"])

    document.getElementById("menCard").innerText = parseToBRL(sessionInfo["menCard"])
    document.getElementById("menCash").innerText = parseToBRL(sessionInfo["menCash"])

    document.getElementById("differenceCard").innerText = parseToBRL(sessionInfo["differenceCard"])
    document.getElementById("differenceCash").innerText = parseToBRL(sessionInfo["differenceCash"])

    document.getElementById("vipCard").innerText = parseToBRL(sessionInfo["vipCard"])
    document.getElementById("vipCash").innerText = parseToBRL(sessionInfo["vipCash"])

    document.getElementById("chipSold").innerText = parseToBRL(sessionInfo["chipRevenue"]);

    document.getElementById("totalCash").innerText = parseToBRL(sessionInfo["soldInCash"])
    document.getElementById("totalCard").innerText = parseToBRL(sessionInfo["soldInCard"])
    document.getElementById("totalSold").innerText = parseToBRL(sessionInfo["totalSold"])

    chipsList.forEach((chipValue, index) => {
        document.getElementById("chip" + chipValue).innerText = sessionInfo["chipAmount"][index].toString().padStart(3, "0");
    });

    document.getElementById("menAmount").innerText = sessionInfo["menAmount"].toString().padStart(3, "0")
    document.getElementById("womenAmount").innerText = sessionInfo["womenAmount"].toString().padStart(3, "0")
    document.getElementById("vipAmount").innerText = sessionInfo["vip"].toString().padStart(3, "0")
    document.getElementById("differenceAmount").innerText = sessionInfo["difference"].toString().padStart(3, "0")

    document.getElementById("date").innerText = "Data: " + formatDate(Date.now());
    document.getElementById("user").innerText = "Impresso por " + user[0].toUpperCase() + user.slice(1).toLowerCase();

    var pdf = new jsPDF("l")

    var qrCode = new VanillaQR({
        url: `${sessionInfo["uuid"]}`,
        width: 400,
        height: 400,
        ecclevel: 1,
        noBorder: false,
        borderSize: 14,
    });
    var imageElement = qrCode.toImage("png");


    html2canvas(document.body).then(function (bodyContent) {
        var canvas = bodyContent
        pdf.addImage(canvas.toDataURL("image/jpeg"), 'JPEG', 0, 0);
        pdf.addImage(imageElement, "PNG", 250, 167, 50, 50, undefined, "fast");

        pdf.autoPrint()
        var docBuffer = pdf.output("arraybuffer");

        var path = __dirname + "\\" + "session" + sessionInfo["session"] + ".pdf"

        fs.writeFileSync(path, Buffer.from(docBuffer));
        ipcRenderer.send("createPDF", path);
    })

}

parseToBRL = (text) => {
    const revenueNumber = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(text);

    return revenueNumber
}

formatDate = (seconds) => {
    if (seconds) {
        const datevalues = {};
        const timestamp = seconds;

        date = new Date(timestamp);

        datevalues.hours = twoChar(date.getHours());
        datevalues.minutes = twoChar(date.getMinutes());
        datevalues.seconds = twoChar(date.getSeconds());
        datevalues.year = date.getFullYear();
        datevalues.month = twoChar(date.getMonth() + 1);
        datevalues.day = twoChar(date.getDate());

        return `${datevalues.day}/${datevalues.month}/${datevalues.year} ${datevalues.hours}:${datevalues.minutes}:${datevalues.seconds}`;
    } else {
        return `Nenhum`;
    }
};

const twoChar = (i) => {
    return `0${i}`.slice(-2);
};


function backToPanel() {
    ipcRenderer.send("backToPanel")
}