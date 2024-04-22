const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const app = express();

const fileContent = fs.readFileSync(path.resolve(__dirname, '../src/secret.json'), "utf8");
const jsonFile = JSON.parse(fileContent);

const PORT = 443;

const DB_SETTINGS = {
    host: "localhost",
    database: "f0695925_pulse",
    user: "f0695925_pulse",
    password: jsonFile['passNet']
};

let readyGroups = null;
// const TIME_INTERVAL = 10000;
const TIME_INTERVAL = 600000;

// const MATCHES_WORDS = 4;
const MATCHES_WORDS = 5;
// const MIN_REFERENCE = 4;
const MIN_REFERENCE = 5;

const MAX_LENGTH_OF_SRC = 15;
const arrOfprepositions = [
    'на',
    'по',
    'до',
    'из-под',
    'из-за',
    'об',
    'за',
    'для',
    'не',
    'в',
    'к',
    'между'
];

const arrOfparticles = [
    'как',
    'вот',
    'даже',
    'ни',
    'же',
    'уж',
    'из'
];

const arrOfconjunctions = [
    'и',
    'а',
    'но',
    'что',
    'когда',
    'если',
    'да'
];

const hideStartSRCWords = [
    'СМИ',
    'МО РФ',
    'Politico',
    'ABC',
    'МЧС',
    'МВФ',
    'СК',
    'Минобороны',
    'Europe 1',
    'Reuters',
    'Mash',
    'SZ',
    'ЦБ'
];

const SRC_LIST = [
    {
        url: 'https://www.vedomosti.ru/rss/news.xml',
        dbname: 'vedomosti_ru_rss_news',
        errorsDir: path.resolve(__dirname, '../errors/vedomosti.txt')
    },
    {
        url: 'https://www.rg.ru/xml/index.xml',
        dbname: 'rg_ru_xml_index',
        errorsDir: path.resolve(__dirname, '../errors/rg.txt')
    },
    {
        url: 'https://tass.ru/rss/v2.xml',
        dbname: 'tass_ru_rss_v2',
        errorsDir: path.resolve(__dirname, '../errors/tass.txt')
    },
    {
        url: 'https://tvzvezda.ru/export/rss.xml',
        dbname: 'tvzvezda_ru_export_rss',
        errorsDir: path.resolve(__dirname, '../errors/tvzvezda.txt')
    },
    {
        url: 'https://russian.rt.com/rss',
        dbname: 'russian_rt_com_rss',
        errorsDir: path.resolve(__dirname, '../errors/rt.txt')
    },
    {
        url: 'https://www.cnews.ru/inc/rss/news.xml',
        dbname: 'cnews_ru_inc_rss_news',
        errorsDir: path.resolve(__dirname, '../errors/cnews.txt')
    },
    {
        url: 'https://3dnews.ru/news/rss/',
        dbname: '3dnews_ru_news_rss',
        errorsDir: path.resolve(__dirname, '../errors/3dnews.txt')
    },
    {
        url: 'https://www.ixbt.com/export/news.rss',
        dbname: 'ixbt_com_export_news',
        errorsDir: path.resolve(__dirname, '../errors/ixbt.txt')
    },
    {
        url: 'https://habr.com/ru/rss/news/?fl=ru',
        dbname: 'habr_com_ru_rss_news',
        errorsDir: path.resolve(__dirname, '../errors/habr.txt')
    },
    {
        url: 'https://ria.ru/export/rss2/archive/index.xml',
        dbname: 'ria_ru_export_rss2_archive_index',
        errorsDir: path.resolve(__dirname, '../errors/ria.txt')
    }
];

// first run
let promiseFirst = new Promise((resolve, reject) => {
    resolve(selectQueryToDB());
}).then(newObj => {
    fs.writeFileSync(path.resolve(__dirname, '../src/readyGroups.txt'), JSON.stringify(getData(newObj)));
    return 1;}
);


setInterval(() => {
    Promise.allSettled(SRC_LIST.map(ind => fetch(ind['url'], {
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
                    fs.appendFileSync(path.resolve(__dirname, '../errors/check.txt'), `\n${new Date()} ${Date.now()} ${num} ${SRC_LIST[num]['dbname']}`);
                }
                if (result.status == "rejected") {
                    fs.appendFileSync(SRC_LIST[num]['errorsDir'], `\n${new Date()} ${Date.now()} ${result.reason}`);
                }
            });
            
        })
        .then(() => selectQueryToDB())
        .then(newObj => getData(newObj));
    }, TIME_INTERVAL);

app.use(express.static(path.resolve(__dirname, 'app')));

app.use((request, response, next) => {
    SRC_LIST.forEach(item => {
        const connection = mysql.createConnection(DB_SETTINGS).promise();
        connection.query(createDB(item['dbname']))
            .finally(() => connection.end());
    });

    next();
});

app.get('/ajax', (req, res) => {
    let promise = new Promise((resolve, reject) => {
        if (!readyGroups) {
            let fileData = fs.readFileSync(path.resolve(__dirname, '../src/readyGroups.txt'), "utf8");
            readyGroups = JSON.parse(fileData);
            console.log(readyGroups)
        }

        resolve(JSON.stringify(readyGroups));
    }).then(json => res.json(json));
});

app.listen(PORT);

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
        if (resultClean.length > MAX_LENGTH_OF_SRC) {
            return item.title;
        }
        if (hideStartSRCWords.includes(resultClean)) {
            let regexpHideWord = new RegExp(`${resultFull[0]}`, 'i');
            return item.title.replace(regexpHideWord, "");
        } else {
            return item.title;
        }
    });

    // remove digits and puctuation signs
    let titlesFiltered = srcColon.map(item => item.replace(/[\d\p{Po}\p{S}«»]/gu, ""));
    let splitedWords = titlesFiltered.map(item => item.split(" "));
    // console.log(1+'___'+splitedWords[0])
    // first words from Capital chars
    splitedWords.forEach(item => item.sort());
    // console.log(2+'___'+splitedWords[0])
    splitedWords.forEach((item, index) => splitedWords[index] = item.map(i => item[i] = i.toLowerCase()));
    // console.log(3+'___'+splitedWords[0])
    let wordSet = splitedWords.map(item => new Set(item));

    // remove empty and single chars
    wordSet.forEach(item => {
        for (let i of item) {
            if (i.length <= 1) {
                item.delete(i);
            }
        }
    });

    // remove prepositions
    wordSet.forEach(item => {
        for (let i of item) {
            i = i.toLowerCase();
            if (arrOfprepositions.includes(i)) {
                item.delete(i);
            }
        }
    });

    // remove particles
    wordSet.forEach(item => {
        for (let i of item) {
            i = i.toLowerCase();
            if (arrOfparticles.includes(i)) {
                item.delete(i);
            }
        }
    });

    // remove conjunctions
    wordSet.forEach(item => {
        for (let i of item) {
            i = i.toLowerCase();
            if (arrOfconjunctions.includes(i)) {
                item.delete(i);
            }
        }
    });

    // console.log(4+'___'+Array.from(wordSet[0]))

    for (let i = 0; i < wordSet.length; i++) {
        let setA = wordSet[i];
        for (let j = i + 1; j < wordSet.length; j++) {
            let setB = wordSet[j];
            let matchWords = [];
            for (let sA of setA) {
                if (setB.has(sA)) {
                    matchWords.push(sA);
                }
                if (matchWords.length == MATCHES_WORDS) {
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
            }
        }
    }

    for (const key in groups) {
        if (groups[key].length < MIN_REFERENCE) {
            delete groups[key];
        }
    }
    readyGroups = groups;
    return groups;
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