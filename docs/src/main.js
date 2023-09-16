"use strict"

const VERSION = '0.2.2';

let container = document.getElementById("container");
let updButton = document.getElementById("updButton");

window.addEventListener('DOMContentLoaded', () => {
    getNews();
});

updButton.addEventListener('click', () => {
    getNews();
});

function showNews(data) {
    container.innerHTML = '';
    let index = 1;
    let nowDay = new Date();
    let colorA = 'rgb(254, 245, 232)';
    let colorB = 'rgba(254, 245, 232, 0.5)';

    for (let item in data) {
        let comDiv = document.createElement('div');
        comDiv.classList.add("divColor");
        let p0 = document.createElement('p');
        let p1 = document.createElement('p');

        const currentDate = new Date(Number(item));
        const options = {
            // timeZone: "Europe/Moscow"
        }
        p0.textContent = `${currentDate.toLocaleString('ru-RU', options)} [${index}]`;
        p0.classList.add("littleData");
        comDiv.append(p0);

        p1.textContent = `${data[item]['title']}`;
        comDiv.append(p1);
        
        if (nowDay != currentDate.getDate()) {
            let randR = randomInt(200, 255);
            let randG = randomInt(200, 255);
            // let randB = randomInt(50, 255);
            colorA = `rgb(${randR}, ${randG}, 200)`;
            colorB = `rgba(${randR}, ${randG}, 200, 0.5)`;
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

async function getNews() {
    fetch("/ajax")
    .then(res => res.json())
    .then(data => JSON.parse(data))
    .then(json => showNews(json));
}

function randomInt(min, max) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }