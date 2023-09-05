const express = require('express');
const xml2js = require('xml2js');

const app = express();


let xmlSrc = 'https://www.vedomosti.ru/rss/news.xml';



app.use(express.static('public'));


app.get('/ajax', (req, res) => {
	importData(xmlSrc).then(xmlSrc => xml2js.parseStringPromise(xmlSrc))
	.then(xml => JSON.stringify(xml))
    .then(json => res.json(json));
	console.log(req.query);
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});


function importData(url) {
    return new Promise((resolve, reject) => {
        const http      = require('http'),
              https     = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
};