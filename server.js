const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const mysql = require("mysql");

const app = express();

// const PORT = 3000;
const PORT = 443;


const connection = mysql.createConnection({
    host: "localhost",
    // user: "root",
    // database: "usersdb",
    // password: "12345tomskRU"

    user: "f0695925_pulse",
    database: "f0695925_pulse",
    password: "123RUdoit"
});










let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

app.get('/ajax', (req, res) => {
    const sql = 'INSERT INTO users(firstname, age) VALUES("Tomas", 19)';
    connection.query(sql, function(err, results) {
        if(err) console.log(err);
        else console.log("Данные добавлены");
    });
    
    connection.query("SELECT * FROM users",
        function(err, results, fields) {
            console.log(results); // собственно данные
    });


    connection.end(function(err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
            console.log("Подключение закрыто");
        });

	fetch(xmlSrc)
    .then(xml => xml.text())
    .then(xmlText => xml2js.parseStringPromise(xmlText))
    .then(obj => extractData(obj))
    .then(newObj => JSON.stringify(newObj))

    
    .then(json => res.json(json));
});

app.listen(PORT);

function extractData(data) {
    let newObj = {};
    let jsonItem = data['rss']['channel'][0]['item'];
    jsonItem.forEach(i => {
        let currentDate = new Date(i['pubDate']);
        let currentDateTS = currentDate.getTime();
        newObj[currentDateTS] = {
            'title': i['title'],
            'link': i['link']
        };
    }); 
    return newObj;
}