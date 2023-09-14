const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const mysql = require("mysql2");
const fs = require("fs");

const app = express();

// const PORT = 3000;
const PORT = 443;

const fileContent = fs.readFileSync("secret.json", "utf8");
const jsonFile = JSON.parse(fileContent);

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

app.use(function(request, response, next){
    const connection = mysql.createConnection({
        host: "localhost",

        // user: "root",
        // database: "usersdb",
        // password: jsonFile['passLocal']
    
        user: "f0695925_pulse",
        database: "f0695925_pulse",
        password: jsonFile['passNet']
    });

    connection.query(`CREATE TABLE 
        IF NOT EXISTS vedomosti_ru_rss_news
        (
        id_event INT NOT NULL AUTO_INCREMENT,
        date DATETIME(6) NOT NULL,
        title VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL,
        PRIMARY KEY (id_event)
        ) 
        ENGINE=InnoDB CHARSET=utf8;`
    );

    const date = new Date();
    const diff = [date, 'temp', 'temp2'];
    const sql = 'INSERT INTO vedomosti_ru_rss_news(date, title, link) VALUES(?, ?, ?)';
    connection.query(sql, diff, function(err, results) {
        if(err) console.log(err);
        else console.log("Данные добавлены");
    });


    // connection.query(`SELECT MAX (date) FROM vedomosti_ru_rss_news`,
    //     function(err, results, fields) {
    //         console.log(results); // собственно данные
    // });



    // const user = ["Tom", 29];

    // const sql = 'INSERT INTO users(firstname, age) VALUES(?, ?)';
    // connection.query(sql, user, function(err, results) {
    //     if(err) console.log(err);
    //     else console.log("Данные добавлены");
    // });
    
    // connection.query("SELECT * FROM users",
    //     function(err, results, fields) {
    //         console.log(results); // собственно данные
    // });

    connection.end(function(err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
            console.log("Подключение закрыто");
        });
    
    next();
});

app.get('/ajax', (req, res) => {

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