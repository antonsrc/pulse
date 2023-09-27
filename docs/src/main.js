"use strict"

const VERSION = '0.7.3';

let container = document.getElementById("container");
let keywords = document.getElementById("keywords");
let updButton = document.getElementById("updButton");
let dialogNews = document.getElementById("dialogNews");
let innerDialogNews = document.getElementById("innerDialogNews");
let header = document.getElementById("header");
let closeNewsWrapper = document.getElementById("closeNewsWrapper");
let NewsHeaderInn = document.getElementById("NewsHeaderInn");

header.textContent = `pulse v.${VERSION}`;

window.addEventListener('DOMContentLoaded', () => {
    getNews();
});

dialogNews.addEventListener('close', () => document.body.classList.remove("Scroll-lock"));

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
    let maxCount = 0;
    for (let item in data) {
        let lowerCaseWords = data[item]['title'].toLowerCase();
        
        // save only words, digits and dash
        let filteredSymbols = lowerCaseWords.replace(/[^\p{Alpha}\p{Nd}\-]+/giu, ' ');
        
        // remove all digits
        let filteredDigits = filteredSymbols.replace(/(\s|^)\d+(|\s)/giu, ' ');
        filteredDigits = filteredDigits.replace(/\s-\d+/giu, ' ');

        // remove all spaces
        let filteredSpaces = filteredDigits.replace(/\s+/g, ' ').trim();
        let wordArr = filteredSpaces.split(' ');

        let exceptionWords = [
            'в', 'по', 'над', 'у', 'из', 'за', 'к', 'под',
            'о', 'на', 'для', 'об', 'с', 'не', 'что', 'при',
            'до', 'и', 'от', 'млн', 'почти', 'могут', 'свою',
            'все', 'всё', 'сообщил', 'сообщило', 'будет', 'отношении', 
            'после', 'может', 'более', 'между', 'трлн', 'въезд', 'вновь',
            'призвал', 'назвал', 'против', 'нет', 'из-за', '-м', '-х',
            '-й', 'самый', 'избран', 'среди', 'моя', 'задержали',
            'стал', 'создали', 'выросло', 'оформлении','решить',
            'самом', 'похитили', 'частного', 'неизвестные'
        ];

        let filteredArr = wordArr.filter(item => !exceptionWords.includes(item));

        
        filteredArr.forEach(i => {
            let link = data[item]['link'];
            let title = data[item]['title'];
            let date = data[item]['date'];
            if (obj.hasOwnProperty(i)) {
                obj[i]['count']++;
                obj[i]['links'][link] = {
                    'title' : title,
                    'date' : date
                };
                maxCount = (obj[i]['count'] > maxCount) ? obj[i]['count'] : maxCount;
            } else {
                obj[i] = {
                    'count': 1,
                    'links': {
                        [link]: {
                            'title' : title,
                            'date' : date
                        }
                    }
                };
            }
        });
    }
    return [obj, maxCount];
}

function showNews(idLabel, words) {
    innerDialogNews.innerHTML = '';
    closeNewsWrapper.addEventListener('click', () => {
        dialogNews.close();
    });

    dialogNews.inert = true;
    dialogNews.showModal();
    document.body.classList.add("Scroll-lock");
    dialogNews.inert = false;

    let word = decodeURIComponent(idLabel);
    
    NewsHeaderInn.innerHTML = `${word} (${Object.keys(words[word]['links']).length}) `;

    let index = 1;
    let colorA = 'rgba(45, 115, 254, 0.3)';
    let colorB = 'rgba(45, 115, 254, 0.05)';

    for (let item in words[word]['links']) {
        let divNews = document.createElement('div');
        let spanTitle = document.createElement('span');
        let spanDateSrc = document.createElement('span');
        let aNews = document.createElement('a');
        spanTitle.append(aNews);
        aNews.href = item;
        aNews.textContent = words[word]['links'][item]['title'];
        
        const currentDate = new Date(words[word]['links'][item]['date']);
        let dateText = currentDate.toLocaleString('ru-RU');
        let url = new URL(item);
        spanDateSrc.textContent = ' '+ dateText + ', ' + url.hostname.replace(/^www\./, '');
        spanDateSrc.classList.add("littleData");

        index++;
        if (index % 2 == 0) {
            divNews.style.backgroundColor = colorA;
        } else {
            divNews.style.backgroundColor = colorB;
        }

        divNews.append(spanTitle);
        divNews.append(spanDateSrc);
        innerDialogNews.append(divNews);
    }
}

function showKeywords(maindata) {
    let [data, maxCount] = maindata;
    let ratio = 1/maxCount;
    // const MAX_REM = 3;
    keywords.innerHTML = '';
    for (let item in data) {
        let spanWord = document.createElement('span');
        let count = data[item]['count'];
        spanWord.textContent = item;
        spanWord.style.backgroundColor = `rgba(45, 115, 254, ${count*ratio})`;

        // if (count < (MAX_REM - 0.8)/0.05) {
        //     spanWord.style.fontSize = `${0.8 + count*0.05}rem`;
        // } else {
        //     spanWord.style.fontSize = `${MAX_REM}rem`;
        // }
        
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
