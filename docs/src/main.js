"use strict"

const VERSION = '0.4.1';

let container = document.getElementById("container");
let keywords = document.getElementById("keywords");
let updButton = document.getElementById("updButton");
let dialogNews = document.getElementById("dialogNews");

window.addEventListener('DOMContentLoaded', () => {
    getNews();
});

updButton.addEventListener('click', () => {
    getNews();
});

function getNews() {
    let importedData = fetch("/ajax")
    .then(res => res.json())
    .then(data => JSON.parse(data));
    // importedData.then(json => showNews(json));
    importedData.then(json => getKeywords(json))
        .then(words => showKeywords(words))
        .then(words => setEventListenersForLabels(words));
}

function showNews(data) {
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
        let withoutSpecSymbols = lowerCaseWords.replace(/[^\p{Alpha}\p{M}\p{Nd}]+/gu, ' ');
        let withoutSpaces = withoutSpecSymbols.replace(/\s+/g, ' ').trim();
        let arr = withoutSpaces.split(' ');
        arr.forEach(i => {
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

function setEventListenersForLabels(words) {
    document.querySelectorAll('.LinkNews').forEach(item => {
        item.addEventListener('click', e => {
            let idLabel = e.target.id;
            showNews(encodeURIComponent(idLabel), words);
        });
    });
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
        let spanWord = document.createElement('div');
        spanWord.style.display = 'inline-block';
        spanWord.textContent = item;
        spanWord.style.fontSize = `${data[item]['count']*0.1}rem`;
        spanWord.id = item;
        spanWord.classList.add("LinkNews");
        keywords.append(spanWord);
    }
    return data;
}
