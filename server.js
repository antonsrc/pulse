const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch');

const app = express();

const PORT = 3000;
// const PORT = 443;

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('docs'));

app.get('/ajax', (req, res) => {
	fetch(xmlSrc)
    .then(xml => xml.text())
    .then(xmlSrc => xml2js.parseStringPromise(xmlSrc))
	.then(xml => JSON.stringify(xml))
    .then(json => res.json(json));
	// console.log(req.query);
});

app.listen(PORT);