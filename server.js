const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const mysql = require("mysql2");
const fs = require("fs");

const app = express();

const PORT = 443;

const fileContent = fs.readFileSync("secret.json", "utf8");
const jsonFile = JSON.parse(fileContent);

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

app.get('/ajax', (req, res) => {
	fetch(xmlSrc)
    .then(xml => xml.text())
    .then(xmlText => xml2js.parseStringPromise(xmlText))
    .then(data => extractData(data))
    .then(data => loadInDB(data))
    .then(newObj => JSON.stringify(newObj))
    .then(json => res.json(json));
});

app.listen(PORT);

async function loadInDB(data) {
    const connection = mysql.createConnection({
        host: "localhost",
        database: "f0695925_pulse",

        // user: "root",
        // password: jsonFile['passLocal']
        user: "f0695925_pulse",
        password: jsonFile['passNet']
    }).promise();

    connection.query(`CREATE TABLE 
        IF NOT EXISTS vedomosti_ru_rss_news (
            id_event INT NOT NULL AUTO_INCREMENT,
            date TIMESTAMP(6) NOT NULL,
            title VARCHAR(255) NOT NULL,
            link VARCHAR(255) NOT NULL,
            PRIMARY KEY (id_event)
        ) ENGINE=InnoDB CHARSET=utf8;`
    );

    return await connection.query(`SELECT Max (date) FROM vedomosti_ru_rss_news LIMIT 1`)
        .then(res => res[0][0]['Max (date)'])
        .then(maxDate => {
            if (maxDate == null) {
                maxDate = new Date(0);
            }

            let filteredData = Object.keys(data).filter(item => new Date(Number(item)) > maxDate);
            for (let item of filteredData) {
                let values = [new Date(data[item]['date']), data[item]['title'], data[item]['link']];
                let sqlQuery = 'INSERT INTO vedomosti_ru_rss_news(date, title, link) VALUES(?, ?, ?)';
                connection.query(sqlQuery, values);
            }
        })
        .then(async () => {
            return await connection.query(`SELECT * FROM vedomosti_ru_rss_news ORDER BY date DESC`)
            .then(res => {
                let newRes = {};
                res[0].forEach(i => {
                    let date = new Date(i['date']);
                    let dateTS = date.getTime();
                    newRes[dateTS] = {
                        'title': i['title'],
                        'link': i['link'],
                        'date': date
                    };
                });
                return newRes;
            });
        })
        .finally(() => connection.end());
}

function extractData(data) {
    let newObj = {};
    let jsonItem = data['rss']['channel'][0]['item'];
    jsonItem.forEach(i => {
        let currentDate = new Date(i['pubDate']);
        let currentDateTS = currentDate.getTime();
        newObj[currentDateTS] = {
            'title': i['title'],
            'link': i['link'],
            'date': i['pubDate']
        };
    }); 
    return newObj;
}