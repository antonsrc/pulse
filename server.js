let express = require('express');
let xml2js = require('xml2js');

let app = express();


function getScript(url) {
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


let xml = 'https://www.vedomosti.ru/rss/news.xml';

let json = '';



function ff(xml) {
	xml2js.parseString(xml, (err, result) => {
		if (err) {
		  throw err
		}
		json = JSON.stringify(result, null, 4)
		// console.log(json)
	});
}










app.use(express.static('public'));



// app.use(express.json()); // разрешаем обмен в формате JSON
// app.use(express.urlencoded({ extended: false })); // обработка аргументов в url

app.get('/ajax', (req, res) => {
	getScript(xml).then(xml => ff(xml))
	.then(() => res.json(json));
	console.log(req.query);
	// res.send({message:'Привет, '+req.query.name}); // отправляем ответ в формате JSON
});

app.listen(3000, () => {
	console.log('Listening on port 3000!');
});