const express = require('express');
const xml2js = require('xml2js');

const app = express();

let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';

app.use(express.static('public'));

app.get('/ajax', (req, res) => {
	fetch(xmlSrc)
    .then(xml => xml.text())
    .then(xmlSrc => xml2js.parseStringPromise(xmlSrc))
	.then(xml => JSON.stringify(xml))
    .then(json => res.json(json));
	console.log(req.query);
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
