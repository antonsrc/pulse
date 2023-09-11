"use strict"

const VERSION = '0.2.1';

let container = document.getElementById("container");
let updButton = document.getElementById("updButton");

window.addEventListener('DOMContentLoaded', () => {
    getNews();
});

updButton.addEventListener('click', () => {
    getNews();
});



function showNews(data) {
    let jsonItem = data['rss']['channel'][0]['item'];
    container.innerHTML = '';
    jsonItem.forEach((item, index) => {
        let comDiv = document.createElement('div');
        let p0 = document.createElement('p');
        let p1 = document.createElement('p');

        if (index % 2 == 0) {
            comDiv.classList.add("divColorA");
        } else {
            comDiv.classList.add("divColorB");
        }
       
        const currentDate = new Date(item['pubDate']);
        const options = {
            // timeZone: "Europe/Moscow"
        }
        p0.textContent = `${currentDate.toLocaleString('ru-RU', options)}`;
        p0.classList.add("littleData");
        comDiv.append(p0);

        // currentDate.getTime()

          
        p1.textContent = `${item['title']}`;
        comDiv.append(p1);
        
        
        container.append(comDiv);
    }); 
    console.log(jsonItem);
}


async function getNews() {
    fetch("/ajax")
    .then(res => res.json())
    .then(data => JSON.parse(data))
    .then(json => showNews(json));
}


