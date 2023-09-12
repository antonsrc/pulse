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
    let index = 0;
    for (let item in data) {
        let comDiv = document.createElement('div');
        let p0 = document.createElement('p');
        let p1 = document.createElement('p');

        index++;
        if (index % 2 == 0) {
            comDiv.classList.add("divColorA");
        } else {
            comDiv.classList.add("divColorB");
        }
       
        const currentDate = new Date(Number(item));
        const options = {
            // timeZone: "Europe/Moscow"
        }
        p0.textContent = `${currentDate.toLocaleString('ru-RU', options)}`;
        p0.classList.add("littleData");
        comDiv.append(p0);

        p1.textContent = `${data[item]['title']}`;
        comDiv.append(p1);
        
        container.append(comDiv);
    }
}

async function getNews() {
    fetch("/ajax")
    .then(res => res.json())
    .then(data => JSON.parse(data))
    .then(json => showNews(json));
}