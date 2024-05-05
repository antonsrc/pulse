
const dialogNews = document.getElementById("dialogNews");
const titles = document.getElementById("titles");
const innerDialogNews = document.getElementById("innerDialogNews");
const closeNewsWrapper = document.getElementById("closeNewsWrapper");
const NewsHeaderInn = document.getElementById("NewsHeaderInn");

window.addEventListener('DOMContentLoaded', () => {     //
    getNews();      //
});     //

dialogNews.addEventListener('close', () => {
    document.body.classList.remove("Scroll-lock");
});

function getNews() { //
    fetch("/root") //
        .then(res => res.json()) //
        .then(data => JSON.parse(data)) //
        .then(titles => showTitles(titles)) //
        .then(words => setEventListenersForLabels(words));
}

function setEventListenersForLabels(words) {
    titles.addEventListener('click', e => {
        const target = e.target;
        if (target.className == 'LinkNews') {
            showNews(target.id, words);
        }
    });
}

function showTitles(data) {
    titles.innerHTML = '';

    let i = 1;
    for (let item in data) {
        let spanWord = document.createElement('div');

        let lastNum = data[item].length - 1;
        let count = data[item].length - 1;
        spanWord.textContent = `${i} ` + data[item][lastNum].title + ` (${count})`;
        spanWord.style.backgroundColor = `rgba(50, 240, 115, ${0.02 * count})`;

        spanWord.id = 'title_' + encodeURIComponent(item);
        spanWord.classList.add("LinkNews");
        titles.append(spanWord);
        i++;
    }
    return data;
}

function showNews(idLabel, words) {

    let getNumOfGroup = idLabel.split('_')[1];

    console.log(words)

    innerDialogNews.innerHTML = '';
    closeNewsWrapper.addEventListener('click', () => {
        dialogNews.close();
    });

    dialogNews.inert = true;
    dialogNews.showModal();
    document.body.classList.add("Scroll-lock");
    dialogNews.inert = false;

    NewsHeaderInn.innerHTML = `Источников: ${words[getNumOfGroup].length - 1}`;

    let index = 1;
    let colorA = 'rgba(45, 115, 254, 0.3)';
    let colorB = 'rgba(45, 115, 254, 0.05)';

    for (let [ind, item] of words[getNumOfGroup].entries()) {
        if (ind == 0) {
            let divNews = document.createElement('div');
            divNews.textContent = item;
            innerDialogNews.append(divNews);
            continue;
        }

        let divNews = document.createElement('div');
        let spanTitle = document.createElement('span');
        let spanDateSrc = document.createElement('span');
        let aNews = document.createElement('a');
        spanTitle.append(aNews);
        aNews.href = item['link'];
        aNews.textContent = item['title'];

        const currentDate = new Date(item['date']);
        let dateText = currentDate.toLocaleString('ru-RU');
        let url = new URL(item['link']);
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