// IMPORT LIBRARIES
const fs = require('fs');
const async = require('async');

// IMPORT FUNCTIONS
const { run, getFileFromURL, prepareChampionList, jsonToCreateCSV} = require("./functions.js")

// CONSTANTES
const maxThreads = 2;
const lane = ["top", "jungle", "middle", "bottom", "support"];
const version = getFileFromURL("https://ddragon.leagueoflegends.com/api/versions.json")[0]
const championList = getFileFromURL("https://ddragon.leagueoflegends.com/cdn/"+version+"/data/en_US/champion.json").data
const championListLower = prepareChampionList(championList)
const operations = Object.keys(championListLower).length * Object.keys(lane).length

// GLOBAL
global.id = -1;
global.LoA_data = [];
global.championList = championList;
global.championListLower = championListLower;

// SCRIPT
countOperations=0;

lane.forEach(laneKey => { // ForEach Lane
    async.eachLimit(Object.keys(championListLower), maxThreads, async (item) => { // ForEach champion / 2 Threads max per lane
        await run(item, laneKey) //Scrapping and extract data
        await console.log(item, laneKey, "OK | ",countOperations,"/",operations,"|",operations-countOperations,"more to go")
        await countOperations++;
        if(countOperations == operations){ // When all operations done
            await fs.mkdirSync('./data/', { recursive: true }); //Create the folder if it's not done
            await fs.writeFileSync('./data/dataChamp.json', JSON.stringify(LoA_data)) // Create JSON file
            await jsonToCreateCSV(LoA_data) // Convert JSON into CSV File
        }
    });
}) 