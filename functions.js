const puppeteer = require('puppeteer');
const request = require('sync-request');
const fs = require('fs');
const { Parser } = require('json2csv'); 

/* function - async run()
*  Desc : Scrap and retrieve from LoLAlytics
*  • champion : champion name (IN LOWER CASE)
*  • lane : lane name (IN LOWER CASE) 
*/
async function run(champion, lane){
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
    })
    let page = await browser.newPage();
  
    await page.goto('https://lolalytics.com/lol/lux/counters/?lane='+lane+'&vslane='+lane, {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    let link = await page.$('.Counters_counters__9aMZk');
    let linkW = await link.$$('.Counter_wrapper__F52aP');
    
    for (const HTMLMatchUp of linkW){
        LoA_data.push(await getDataFromHTML(HTMLMatchUp, champion, lane))
    }

    await browser.close();
}

/* function - async getDataFromHTML()
*  Desc : Extract data from HTML DOM
*  • html : DOM Object
*  • champion : champion name (IN LOWER CASE)
*  • lane : lane name (IN LOWER CASE)
*   returns : JSON Object with data extracted
*/
async function getDataFromHTML(html, champion, lane){
    
    let opponent = await html.evaluate((evalVar) => {
        imgURL = evalVar.querySelector("img").src;
        const regex = /\/([^/]+)\.\w+$/;
        const resultat = regex.exec(imgURL);
        return resultat[1];
    });

    const winrateMatchup = await html.evaluate((evalVar) => {
        return evalVar.querySelector(".Counter_wr__fzjtG").innerText
    });

    const winrateAll = await html.evaluate((evalVar) => {
        return evalVar.querySelector(".Counter_wr2__zZDl3").innerText
    });

    const delta1 = await html.evaluate((evalVar) => {
        return evalVar.querySelector(".Counter_delta__sJfkF").innerText.replaceAll("Δ","").replaceAll("•","").replace(/\s+/g, ' ').trim().split(" ")[1]
    });

    const delta2 = await html.evaluate((evalVar) => {
        return evalVar.querySelector(".Counter_delta__sJfkF").innerText.replaceAll("Δ","").replaceAll("•","").replace(/\s+/g, ' ').trim().split(" ")[3]
    });

    const games = await html.evaluate((evalVar) => {
        return evalVar.querySelector(".Counter_games__9JfXq").innerText.replaceAll(" Games","").replaceAll(" ", "")
    });

    await id++;
    
    switch(opponent){
        case "renataglasc":
            opponent="renata";
            break;
    }

    return {
        id: parseInt(id),
        c_ID: parseInt(championListLower[champion.toLowerCase()].key),
        c_Name: champion.toLowerCase(),
        c_OpponentID: parseInt(championListLower[opponent.toLowerCase()].key),
        c_OpponentName: opponent.toLowerCase(),
        c_WinrateInMatchup: parseFloat(winrateMatchup.replaceAll("%","")).toFixed(2),
        c_OthersWinrateInMatchup: parseFloat(winrateAll.replaceAll("%","")).toFixed(2),
        c_Delta1: parseFloat(delta1).toFixed(2),
        c_Delta2: parseFloat(delta2).toFixed(2),
        c_Ngames: parseInt(games),
        LANE: lane.toUpperCase()
    }
}

/* function - getFileFromURL()
*  Desc : Download JSON file data on the web
*  • url : url of the JSON file
*/
function getFileFromURL(url){
    const response = request('GET', url);
    if (response.statusCode === 200) {
    const json = JSON.parse(response.getBody());
    return json;
    } else {
    console.log("Impossible de récupérer les données JSON.");
    exit()
    }
}

/* function - prepareChampionList()
*  Desc : Prepare the champion list, by putting all keys to lower case
*  • obj : JSON Object to put keys to lower case
*/
function prepareChampionList(obj) {
    var key, keys = Object.keys(obj);
    var n = keys.length;
    var newobj={}
    while (n--) {
        key = keys[n];
        newobj[key.toLowerCase()] = obj[key];
    }
    return newobj;
}

/* function - jsonToCreateCSV()
*  Desc : Extract the JSON Data, convert them to CSV, and save a new CSV file
*  • data : JSON Object of data
*/
function jsonToCreateCSV(data){
    const fields = ['id', 'c_ID', 'c_Name', 'c_OpponentID', 'c_OpponentName', 'c_WinrateInMatchup', 'c_OthersWinrateInMatchup', 'c_Delta1', 'c_Delta2', 'c_Ngames', 'LANE'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csvData = parser.parse(data);
    fs.mkdirSync('./data/', { recursive: true });
    fs.writeFileSync('./data/dataChamp.csv', csvData)
}

module.exports = { run, getDataFromHTML,getFileFromURL, prepareChampionList, jsonToCreateCSV}