const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const mysql = require("mysql2");
const fs = require("fs");

const app = express();

const fileContent = fs.readFileSync("secret.json", "utf8");
const jsonFile = JSON.parse(fileContent);

const PORT = 443;
const DB_SETTINGS = {
    host: "localhost",
    database: "f0695925_pulse",
    user: "f0695925_pulse",
    password: jsonFile['passNet']
};
const SRC_LIST = [
    {
        url: 'https://www.vedomosti.ru/rss/news.xml',
        dbname: 'vedomosti_ru_rss_news',
        errorsDir: './errors/vedomosti.txt'
    },
    {
        url: 'https://www.rg.ru/xml/index.xml',
        dbname: 'rg_ru_xml_index',
        errorsDir: './errors/rg.txt'
    },
    {
        url: 'https://tass.ru/rss/v2.xml',
        dbname: 'tass_ru_rss_v2',
        errorsDir: './errors/tass.txt'
    },
    {
        url: 'https://tvzvezda.ru/export/rss.xml',
        dbname: 'tvzvezda_ru_export_rss',
        errorsDir: './errors/tvzvezda.txt'
    },
    {
        url: 'https://russian.rt.com/rss',
        dbname: 'russian_rt_com_rss',
        errorsDir: './errors/rt.txt'
    },
    {
        url: 'https://www.cnews.ru/inc/rss/news.xml',
        dbname: 'cnews_ru_inc_rss_news',
        errorsDir: './errors/cnews.txt'
    },
    {
        url: 'https://3dnews.ru/news/rss/',
        dbname: '3dnews_ru_news_rss',
        errorsDir: './errors/3dnews.txt'
    },
    {
        url: 'https://www.ixbt.com/export/news.rss',
        dbname: 'ixbt_com_export_news',
        errorsDir: './errors/ixbt.txt'
    },
    {
        url: 'https://habr.com/ru/rss/news/?fl=ru',
        dbname: 'habr_com_ru_rss_news',
        errorsDir: './errors/habr.txt'
    },
    {
        url: 'https://ria.ru/export/rss2/archive/index.xml',
        dbname: 'ria_ru_export_rss2_archive_index',
        errorsDir: './errors/ria.txt'
    } 
];

app.use(express.static('docs'));

app.use((request, response, next) => {
    
    SRC_LIST.forEach(item => {
        const connection = mysql.createConnection(DB_SETTINGS).promise();
        connection.query(createQuery(item['dbname']))
        .finally(() => connection.end());
    });

    let index = 0;
    const interval = setInterval(() => {
        if (index >= SRC_LIST.length) {
            index = 0;
        }

        fetch(SRC_LIST[index]['url'], {
            headers: {"Content-Type": "text/xml; charset=UTF-8"}
        })
        .then(xml => xml.text())
        .then(xmlText => xml2js.parseStringPromise(xmlText))
        .then(json => extractToObjWithKeys(json))
        .then(obj => loadToDB(obj, SRC_LIST[index]['dbname']))
        .catch(err => {
            fs.appendFileSync(SRC_LIST[index]['errorsDir'], `\n${new Date()} ${Date.now()} ${err}`);
        })
        .finally(() => {
            fs.appendFileSync('./errors/check.txt', `\n${new Date()} ${Date.now()} ${SRC_LIST[index]['dbname']}`);
            index++;
        });
    }, 60000);

    next();
});

app.get('/ajax', (req, res) => {
    let promise = new Promise((resolve, reject) => {
        resolve(selectQueryToDB());
    })

    .then(newObj => JSON.stringify(newObj))
    .then(json => res.json(json));
});
app.listen(PORT);

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
    // connection.query(createQuery(dbname));
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
        return concat + ` UNION ALL (SELECT * FROM ${current['dbname']} WHERE date > DATE_SUB(curdate(), INTERVAL 1 DAY)) `;
    }, `(SELECT * FROM ${firstArr['dbname']} WHERE date > DATE_SUB(curdate(), INTERVAL 1 DAY))`);
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

function createQuery(dbname) {
    return `CREATE TABLE 
        IF NOT EXISTS ${dbname} (
            id_event INT NOT NULL AUTO_INCREMENT,
            date TIMESTAMP(6) NOT NULL,
            title VARCHAR(255) NOT NULL,
            link VARCHAR(255) NOT NULL,
            PRIMARY KEY (id_event)
        ) ENGINE=InnoDB CHARSET=utf8;`;
}