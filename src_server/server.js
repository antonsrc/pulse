"use strict"

const express = require('express');
const xml2js = require('xml2js');
const fetchNode = require('node-fetch');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();

let timeInterval = 600000;
let port = 443;
let matchesWords = 4;
let minReference = 4;
let maxLengthOfSrc = 15;

let mode = process.argv[2];
if (mode == 'dev' || mode == 'development') {
    timeInterval = 6000;
    port = 443;
    matchesWords = 3;
    minReference = 2;
    maxLengthOfSrc = 15;
}

const passFile = fs.readFileSync(path.resolve(__dirname, 'secret.json'), "utf8");
const pass = JSON.parse(passFile);
const DB_SETTINGS = {
    host: "localhost",
    database: "f0695925_pulse",
    user: "f0695925_pulse",
    password: pass['passNet']
};

let readyGroups = {};

let exceptionWordsFiles = fs.readdirSync(path.resolve(__dirname, 'assets', 'exceptionWords'));
let exceptionWords = exceptionWordsFiles.map(file => {
    let words = fs.readFileSync(path.resolve(__dirname, 'assets', 'exceptionWords', file), "utf8");
    return JSON.parse(words);
});

let startSRCWords = fs.readFileSync(path.resolve(__dirname, 'assets', 'wordsStartSRCWords.json'), "utf8");
startSRCWords = JSON.parse(startSRCWords);

let SRC_LIST = fs.readFileSync(path.resolve(__dirname, 'assets', 'srcList.json'), "utf8");
SRC_LIST = JSON.parse(SRC_LIST);

// first run
new Promise((resolve, reject) => {
    resolve(selectQueryToDB());
}).then(newObj => {
    fs.writeFileSync(path.resolve(__dirname, 'readyGroups.txt'), JSON.stringify(getData(newObj)));
    return 1;
}
);

setInterval(() => {
    Promise.allSettled(SRC_LIST.map(ind => fetchNode(ind['url'], {
        headers: { "Content-Type": "text/xml; charset=UTF-8" }
    })
        .then(xml => xml.text())
        .then(xmlText => xml2js.parseStringPromise(xmlText))
        .then(json => extractToObjWithKeys(json))
    ))
        .then(res => {
            res.forEach((result, num) => {
                if (result.status == "fulfilled") {
                    loadToDB(result.value, SRC_LIST[num]['dbname']);
                }
                else if (result.status == "rejected") {
                    // todo: add in table of tb rejected results 
                }
            });

        })
        .then(() => selectQueryToDB())
        .then(newObj => getData(newObj));
}, timeInterval);

app.use(express.static(path.resolve(__dirname, '../build_client')));

app.use((request, response, next) => {
    SRC_LIST.forEach(item => {
        const connection = mysql.createConnection(DB_SETTINGS).promise();
        connection.query(createDB(item['dbname']))
            .finally(() => connection.end());
    });
    next();
});

app.get('/root', (req, res) => {
    let promise = new Promise((resolve, reject) => {
        if (!Object.keys(readyGroups).length) {
            let fileData = fs.readFileSync(path.resolve(__dirname, 'readyGroups.txt'), "utf8");
            readyGroups = JSON.parse(fileData);
        }
        resolve(JSON.stringify(readyGroups));
    }).then(json => res.json(json));
});

app.listen(port);

function getData(rssFromJson) {
    let groups = {};
    let rss = Object.values(rssFromJson);

    // remove sources in titles (e.g. Lenta:...)
    let srcColon = rss.map(item => {
        let regexp = new RegExp('(^|^"|^«)[а-я a-z0-9]+(»:|":|:)', 'i');
        let resultFull = item.title.match(regexp) || [];
        if (!resultFull[0]) {
            return item.title;
        }
        let resultClean = resultFull[0].replace(/[«»":]/g, "");
        if (resultClean.length > maxLengthOfSrc) {
            return item.title;
        }
        if (startSRCWords.includes(resultClean)) {
            let regexpHideWord = new RegExp(`${resultFull[0]}`, 'i');
            return item.title.replace(regexpHideWord, "");
        } else {
            return item.title;
        }
    });

    // remove digits and puctuation signs
    let titlesFiltered = srcColon.map(item => item.replace(/[\d\p{Po}\p{S}«»]/gu, ""));
    let splitedWords = titlesFiltered.map(item => item.split(" "));
    // first words from Capital chars
    splitedWords.forEach(item => item.sort());
    splitedWords.forEach((item, index) => splitedWords[index] = item.map(i => item[i] = i.toLowerCase()));
    let wordSet = splitedWords.map(item => new Set(item));

    // remove empty and single chars
    wordSet.forEach(item => {
        for (let j of Array.from(item.values())) {
            let i = j.toString();
            if (i.length <= 1) {
                item.delete(i);
            }
        }
    });

    exceptionWords.forEach(words => {
        filterWords(wordSet, words)
    });

    for (let i = 0; i < wordSet.length; i++) {
        let setA = wordSet[i];
        for (let j = i + 1; j < wordSet.length; j++) {
            let setB = wordSet[j];
            let matchWords = [];
            let index = 0;

            for (let sA of Array.from(setA.values())) {
                if (index >= matchesWords) break;
                if (setB.has(sA)) {
                    matchWords.push(sA);
                }
                if (matchWords.length == matchesWords) {
                    if (!groups.hasOwnProperty(i)) {
                        groups[i] = [];
                        groups[i].push(matchWords);
                        groups[i].push(rss[i]);
                    }
                    groups[i].push(rss[j]);
                    wordSet[j].clear();
                    setA = new Set(matchWords);
                    break;
                }
                index++;
            }
        }
    }

    for (const key in groups) {
        if (groups[key].length < minReference) {
            delete groups[key];
        }
    }
    readyGroups = groups;
    return groups;
}

function filterWords(inputWords, forbiddenWords) {
    inputWords.forEach(item => {
        for (let j of Array.from(item.values())) {
            let i = j.toString();
            i = i.toLowerCase();
            if (forbiddenWords.includes(i)) {
                item.delete(i);
            }
        }
    });
    return inputWords;
}

function extractToObjWithKeys(json) {
    let obj = {};
    let jsonItem = json['rss']['channel'][0]['item'];
    jsonItem.forEach(i => {
        let currentDate = new Date(i['pubDate']);
        let currentDateTS = currentDate.getTime();
        obj[currentDateTS] = {
            'title': i['title'],
            'link': i['link'],
            'date': i['pubDate']
        };
    });
    return obj;
}

function loadToDB(obj, dbname) {
    const connection = mysql.createConnection(DB_SETTINGS).promise();
    return connection.query(`SELECT Max (date) FROM ${dbname} LIMIT 1`)
        .then(res => res[0][0]['Max (date)'])
        .then(maxDate => queryInsertData(maxDate, obj, connection, dbname))
        .finally(() => connection.end());
}

function queryInsertData(maxDate, obj, connection, dbname) {
    const maximumDate = (maxDate == null) ? new Date(0) : maxDate;
    const insertQuery = `INSERT INTO ${dbname}(date, title, link) VALUES(?, ?, ?)`;
    let filteredDates = Object.keys(obj).filter(item => new Date(Number(item)) > maximumDate);

    filteredDates.forEach(i => {
        let values = [new Date(obj[i]['date']), obj[i]['title'], obj[i]['link']];
        connection.query(insertQuery, values);
    });
}

function selectQueryToDB() {
    const connection = mysql.createConnection(DB_SETTINGS).promise();

    let [firstArr, ...restArr] = SRC_LIST;
    // let qAll = restArr.reduce((concat, current) => {
    //     return concat + ` UNION ALL SELECT * FROM ${current['dbname']} `;
    // }, `SELECT * FROM ${firstArr['dbname']} `);
    // let queryAllDB = qAll + ' ORDER BY date DESC';

    let qAll = restArr.reduce((concat, current) => {
        return concat + ` UNION ALL (SELECT * FROM ${current['dbname']} WHERE date > DATE_SUB(now(), INTERVAL 1 DAY)) `;
    }, `(SELECT * FROM ${firstArr['dbname']} WHERE date > DATE_SUB(now(), INTERVAL 1 DAY))`);
    let queryAllDB = qAll + ` ORDER BY date DESC`;

    return connection.query(queryAllDB)
        .then(res => {
            let filteredRes = {};
            res[0].forEach(i => {
                let date = new Date(i['date']);
                let dateTS = date.getTime();
                filteredRes[dateTS] = {
                    'title': i['title'],
                    'link': i['link'],
                    'date': date
                };
            });
            return filteredRes;
        })
        .finally(() => connection.end());
}

function createDB(dbname) {
    return `CREATE TABLE 
        IF NOT EXISTS ${dbname} (
            id_event INT NOT NULL AUTO_INCREMENT,
            date TIMESTAMP(6) NOT NULL,
            title VARCHAR(255) NOT NULL,
            link VARCHAR(255) NOT NULL,
            PRIMARY KEY (id_event)
        ) ENGINE=InnoDB CHARSET=utf8;`;
}