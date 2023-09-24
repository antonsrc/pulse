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
const createQuery = `CREATE TABLE 
    IF NOT EXISTS vedomosti_ru_rss_news (
        id_event INT NOT NULL AUTO_INCREMENT,
        date TIMESTAMP(6) NOT NULL,
        title VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL,
        PRIMARY KEY (id_event)
    ) ENGINE=InnoDB CHARSET=utf8;`;

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

app.use((request, response, next) => {
    const interval = setInterval(() => {
        
        // console.log("Middleware", new Date());

        fetch(xmlSrc)
        .then(xml => xml.text())
        .then(xmlText => xml2js.parseStringPromise(xmlText))
        .then(json => extractToObjWithKeys(json))
        .then(obj => loadToDB(obj));

      }, 300000);
      
    
    next();
});

app.get('/ajax', (req, res) => {
	// fetch(xmlSrc)
    // .then(xml => xml.text())
    // .then(xmlText => xml2js.parseStringPromise(xmlText))
    // .then(json => extractToObjWithKeys(json))
    // .then(obj => loadToDB(obj))
    // .then(() => selectQueryToDB())

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

function loadToDB(obj) {
    const connection = mysql.createConnection(DB_SETTINGS).promise();
    connection.query(createQuery);
    return connection.query(`SELECT Max (date) FROM vedomosti_ru_rss_news LIMIT 1`)
    .then(res => res[0][0]['Max (date)'])
    .then(maxDate => queryInsertData(maxDate, obj, connection))
    .finally(() => connection.end());
}

function queryInsertData(maxDate, obj, connection) {
    const maximumDate = (maxDate == null) ? new Date(0) : maxDate;
    const insertQuery = 'INSERT INTO vedomosti_ru_rss_news(date, title, link) VALUES(?, ?, ?)';
    let filteredDates = Object.keys(obj).filter(item => new Date(Number(item)) > maximumDate);
    filteredDates.forEach(i => {
        let values = [new Date(obj[i]['date']), obj[i]['title'], obj[i]['link']];
        connection.query(insertQuery, values);
    });
}

function selectQueryToDB() {
    const connection = mysql.createConnection(DB_SETTINGS).promise();
    return connection.query(`SELECT * FROM vedomosti_ru_rss_news ORDER BY date DESC`)
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