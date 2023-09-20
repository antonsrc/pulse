"use strict"

const VERSION = '0.5.0';

let container = document.getElementById("container");
let keywords = document.getElementById("keywords");
let updButton = document.getElementById("updButton");
let dialogNews = document.getElementById("dialogNews");
let header = document.getElementById("header");

header.textContent = `pulse v.${VERSION}`;

window.addEventListener('DOMContentLoaded', () => {
    getNews();
});

// updButton.addEventListener('click', () => {
//     getNews();
// });

function getNews() {
    let importedData = fetch("/ajax")
    .then(res => res.json())
    .then(data => JSON.parse(data))
    // importedData.then(json => showNews(json));
    .then(json => getKeywords(json))
    .then(words => showKeywords(words))
    .then(words => setEventListenersForLabels(words));
}

function showNewsMain(data) {
    container.innerHTML = '';
    let index = 1;
    let nowDay = new Date();
    let colorA = 'rgb(254, 245, 232)';
    let colorB = 'rgba(254, 245, 232, 0.7)';

    for (let item in data) {
        let comDiv = document.createElement('div');
        comDiv.classList.add("divColor");
        let p0 = document.createElement('p');
        let p1 = document.createElement('p');

        const currentDate = new Date(Number(item));
        p0.textContent = `${currentDate.toLocaleString('ru-RU')} [${index}]`;
        p0.classList.add("littleData");
        comDiv.append(p0);

        p1.textContent = `${data[item]['title']}`;
        comDiv.append(p1);
        
        if (nowDay != currentDate.getDate()) {
            let randR = randomInt(200, 255);
            let randG = randomInt(200, 255);
            colorA = `rgb(${randR}, ${randG}, 170)`;
            colorB = `rgba(${randR}, ${randG}, 170, 0.5)`;
            nowDay = currentDate.getDate();
        }
        
        index++;
        if (index % 2 == 0) {
            comDiv.style.backgroundColor = colorA;
        } else {
            comDiv.style.backgroundColor = colorB;
        }

        container.append(comDiv);
    }
}

function randomInt(min, max) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

function getKeywords(data) {
    let obj = {};
    for (let item in data) {
        let lowerCaseWords = data[item]['title'].toLowerCase();
        
        // remove all special symbols
        let filteredSymbols = lowerCaseWords.replace(/[^\p{Alpha}\p{M}\p{Nd}]+/giu, ' ');
        
        // remove all digits
        let filteredDigits = filteredSymbols.replace(/(\b|^)\d{1,2}(\b|$)/gi, ' ');
        let filteredZeros = filteredDigits.replace(/(\b|^)000(\b|$)/gi, ' ');

        // remove all spaces
        let filteredSpaces = filteredZeros.replace(/\s+/g, ' ').trim();
        let wordArr = filteredSpaces.split(' ');

        // remove all conjunctions and prepositions
        let conjuctions = [
            'в', 'по', 'над', 'у', 'из', 'за', 'к', 'под',
            'о', 'на', 'для', 'об', 'с', 'не', 'что', 'при',
            'до', 'и', 'от', 'млн', 'почти', 'могут', 'свою',
            'все', 'всё', 'год', 'году'
        ];
        let filteredArr = wordArr.filter(item => !conjuctions.includes(item));

        
        filteredArr.forEach(i => {
            let link = data[item]['link'];
            let title = data[item]['title'];
            if (obj.hasOwnProperty(i)) {
                obj[i]['count']++;
                obj[i]['links'][link] = title;
            } else {
                obj[i] = {
                    'count': 1,
                    'links': {
                        [link]: title
                    }
                };
            }
        });
    }
    return obj;
}

function showNews(idLabel, words) {
    let spanClose = document.createElement('span');
    spanClose.textContent = 'Закрыть';
    spanClose.style.backgroundColor = 'red';
    dialogNews.innerHTML = '';
    dialogNews.append(spanClose);
    spanClose.addEventListener('click', () => {
        dialogNews.close();
    });

    dialogNews.inert = true;
    dialogNews.showModal();
    dialogNews.inert = false;

    let word = decodeURIComponent(idLabel);
    
    let index = 1;
    let colorA = 'rgb(240, 211, 255)';
    let colorB = 'rgba(240, 211, 255, 0.1)';

    for (let item in words[word]['links']) {
        let divNews = document.createElement('div');
        let aNews = document.createElement('a');
        divNews.append(aNews);
        aNews.href = item;
        aNews.textContent = words[word]['links'][item];

        index++;
        if (index % 2 == 0) {
            divNews.style.backgroundColor = colorA;
        } else {
            divNews.style.backgroundColor = colorB;
        }

        dialogNews.append(divNews);
    }
}

function showKeywords(data) {
    keywords.innerHTML = '';
    for (let item in data) {
        let spanWord = document.createElement('span');
        spanWord.textContent = item;
        spanWord.style.fontSize = `${data[item]['count']*0.15}rem`;
        spanWord.id = encodeURIComponent(item);
        spanWord.classList.add("LinkNews");
        keywords.append(spanWord);
    }
    return data;
}

function setEventListenersForLabels(words) {
    keywords.addEventListener('click', e => {
        if (e.target.className == 'LinkNews') {
            showNews(e.target.id, words);
        }
    });
}
