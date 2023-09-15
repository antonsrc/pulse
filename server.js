const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const mysql = require("mysql2");
const fs = require("fs");

const app = express();

const PORT = 3000;
// const PORT = 443;

const fileContent = fs.readFileSync("secret.json", "utf8");
const jsonFile = JSON.parse(fileContent);

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

app.get('/ajax', (req, res) => {

	fetch(xmlSrc)
    .then(xml => xml.text())
    .then(xmlText => xml2js.parseStringPromise(xmlText))
    .then(obj => extractData(obj))

    .then(data => loadInDB(data))

    .then(newObj => JSON.stringify(newObj))
    .then(json => res.json(json));
});

app.listen(PORT);

function loadInDB(data) {
    const connection = mysql.createConnection({
        host: "localhost",

        user: "root",
        database: "usersdb",
        password: jsonFile['passLocal']
    
        // user: "f0695925_pulse",
        // database: "f0695925_pulse",
        // password: jsonFile['passNet']
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


    
    connection.query(`SELECT Max (date) FROM vedomosti_ru_rss_news LIMIT 1`)
        .then(res => {
            console.log(res[0][0]['Max (date)']);
            
            for (let item in data) {
                console.log(data[item]['date']);
                if (data[item]['date'] >= res[0][0]['Max (date)']) {
                    console.log('ARR')
                }
                
            }



            return 0;
        });
    


    // const currentDate = new Date(maxDate);
    // const options = {
    // // timeZone: "Europe/Moscow"
    // }
    // const maxDateReal = currentDate.toLocaleString('ru-RU', options);
    // console.log(maxDate, ' 2');
    // console.log(maxDateReal, ' 3');

    for (let item in data) {
        let values = [data[item]['date'], data[item]['title'], data[item]['link']];
        let sqlQuery = 'INSERT INTO vedomosti_ru_rss_news(date, title, link) VALUES(?, ?, ?)';
        connection.query(sqlQuery, values, function(err, results) {
            if(err) console.log(err);
            else console.log("Данные добавлены");
        });
    }






    
    // connection.query("SELECT date, title FROM vedomosti_ru_rss_news",
    //     function(err, results, fields) {
    //         console.log(results); // собственно данные
    // });

    connection.end(function(err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
            console.log("Подключение закрыто");
        });
    
        return data;
}

function extractData(data) {
    let newObj = {};
    let jsonItem = data['rss']['channel'][0]['item'];
    jsonItem.forEach(i => {
        let date = new Date(i['pubDate']);
        let dateTS = date.getTime();
        newObj[dateTS] = {
            'title': i['title'],
            'link': i['link'],
            'date': date
        };
    }); 
    return newObj;
}