const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const fs = require("fs");

const app = express();

// const PORT = 3000;
const PORT = 443;

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

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