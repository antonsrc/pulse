const VERSION = '0.10.10';

const dialogNews = document.getElementById("dialogNews");
const container = document.getElementById("container");
const keywords = document.getElementById("keywords");
const titles = document.getElementById("titles");
const updButton = document.getElementById("updButton");
const innerDialogNews = document.getElementById("innerDialogNews");
const header = document.getElementById("header");
const closeNewsWrapper = document.getElementById("closeNewsWrapper");
const NewsHeaderInn = document.getElementById("NewsHeaderInn");

header.textContent = `pulse v.${VERSION}`;

window.addEventListener('DOMContentLoaded', () => {
    getNews();
});

dialogNews.addEventListener('close', () => {
    document.body.classList.remove("Scroll-lock");
});

function getNews() {
    fetch("/ajax")
        .then(res => res.json())
        .then(data => JSON.parse(data))
        .then(json => getData(json))
        .then(titles => showTitles(titles));

    // .then(words => showKeywords(words))
    // .then(words => setEventListenersForLabels(words));
}

function wordsFilter(words) {
    let lowerCaseWords = words.toLowerCase();
    return lowerCaseWords.split(' ');


    // save only words, digits and dash
    let filteredSymbols = lowerCaseWords.replace(/[^\p{Alpha}\p{Nd}\-]+/giu, ' ');

    // remove all digits
    let filteredDigits = filteredSymbols.replace(/(\s|^)\d+(|\s)/giu, ' ');
    filteredDigits = filteredDigits.replace(/\s-\d+/giu, ' ');

    // remove all singles chars
    let filteredSingles = filteredDigits.replace(/(\s|^).($|\s)/gi, ' ');

    // remove all spaces
    let filteredSpaces = filteredSingles.replace(/\s+/g, ' ').trim();
    let wordArr = filteredSpaces.split(' ');

    

    // let exceptionWords = [
    //     'в', 'по', 'над', 'у', 'из', 'за', 'к', 'под',
    //     'о', 'на', 'для', 'об', 'с', 'не', 'что', 'при',
    //     'до', 'и', 'от', 'млн', 'трлн', 'из-за', 'моя', 'без', 'со',
    //     'как', 'его', 'во', 'ли', 'ее', 'тысяч', 'всей', 'я',
    //     'тыс', 'или', 'уже', 'км'
    // ];

    // return wordArr.filter(item => !exceptionWords.includes(item));
}


function setEventListenersForLabels(words) {
    keywords.addEventListener('click', e => {
        const target = e.target;
        if (target.className == 'LinkNews') {
            showNews(target.id, words);
        }
    });
}

let MATCHES_WORDS = 5;
let MIN_REFERENCE = 5;

function getData(rssFromJson) {
    let groups = {};

    let rss = Object.values(rssFromJson);
    let titlesDigitFiltered = rss.map(item => item.title.replace(/\d/g, "")); // remove digits
    let splitedWords = titlesDigitFiltered.map(item => item.split(" "));
    splitedWords.forEach(item => item.sort()); // Сначалча прописные
    let wordSet = splitedWords.map(item => new Set(item));

    for (let i = 0; i < wordSet.length; i++) {
        let setA = wordSet[i];
        for (let j = i + 1; j < wordSet.length; j++) {
            let setB = wordSet[j];

            let matchWords = [];
            for (let sA of setA) {
                if (setB.has(sA)) {
                    matchWords.push(sA);
                }
                if (matchWords.length == MATCHES_WORDS) {
                    if (!groups.hasOwnProperty(i)) {
                        groups[i] = [];
                        groups[i].push(rss[i]);
                    }
                    groups[i].push(rss[j]);
                    wordSet[j].clear();
                    break;
                }
            }
        }
    }


    for (const key in groups) {
        if (groups[key].length < MIN_REFERENCE) {
            delete groups[key];
        }
    }
    console.log(groups)
    return groups;
}

function showTitles(data) {
    titles.innerHTML = '';

    let i = 1;
    for (let item in data) {
        let spanWord = document.createElement('div');

        let lastNum = data[item].length - 1;
        let count = data[item].length;
        spanWord.textContent = `${i} ` + data[item][lastNum].title + ` (${count})`;
        spanWord.style.backgroundColor = `rgba(50, 240, 115, ${0.02*count})`;

        spanWord.id = encodeURIComponent(item);
        spanWord.classList.add("LinkNews");
        titles.append(spanWord);
        i++;
    }
    return data;
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

        // remove all singles chars
        let filteredSingles = filteredDigits.replace(/(\s|^).($|\s)/gi, ' ');

        // remove all spaces
        let filteredSpaces = filteredSingles.replace(/\s+/g, ' ').trim();
        let wordArr = filteredSpaces.split(' ');

        let exceptionWords = [
            'в', 'по', 'над', 'у', 'из', 'за', 'к', 'под',
            'о', 'на', 'для', 'об', 'с', 'не', 'что', 'при',
            'до', 'и', 'от', 'млн', 'почти', 'могут', 'свою',
            'все', 'всё', 'сообщил', 'сообщило', 'будет', 'отношении',
            'после', 'может', 'более', 'между', 'трлн', 'въезд', 'вновь',
            'призвал', 'назвал', 'против', 'нет', 'из-за', '-м', '-х',
            '-й', 'самый', 'избран', 'среди', 'моя', 'задержали',
            'стал', 'создали', 'выросло', 'оформлении', 'решить',
            'самом', 'похитили', 'частного', 'неизвестные', 'без', 'со',
            'как', 'его', 'во', 'ли', 'ее', 'перед', 'тысяч', 'всей', 'я',
            'тыс', 'или', 'уже', 'км'
        ];

        let filteredArr = wordArr.filter(item => !exceptionWords.includes(item));

        filteredArr.forEach(i => {
            let link = data[item]['link'];
            let title = data[item]['title'];
            let date = data[item]['date'];
            if (obj.hasOwnProperty(i)) {
                obj[i]['count']++;
                obj[i]['links'][link] = {
                    'title': title,
                    'date': date
                };
                maxCount = (obj[i]['count'] > maxCount) ? obj[i]['count'] : maxCount;
            } else {
                obj[i] = {
                    'count': 1,
                    'links': {
                        [link]: {
                            'title': title,
                            'date': date
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
        spanDateSrc.textContent = ' ' + dateText + ', ' + url.hostname.replace(/^www\./, '');
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
    let ratio = 1 / maxCount;
    // const MAX_REM = 3;
    keywords.innerHTML = '';

    for (let item in data) {
        let spanWord = document.createElement('span');
        let count = data[item]['count'];
        if (count > 3) {
            spanWord.textContent = item;
            spanWord.style.backgroundColor = `rgba(45, 115, 254, ${count * ratio})`;

            // if (count < (MAX_REM - 0.8)/0.05) {
            //     spanWord.style.fontSize = `${0.8 + count*0.05}rem`;
            // } else {
            //     spanWord.style.fontSize = `${MAX_REM}rem`;
            // }

            spanWord.id = encodeURIComponent(item);
            spanWord.classList.add("LinkNews");
            keywords.append(spanWord);
        }

    }
    return data;
}

