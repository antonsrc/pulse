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
    for (let i = 0; i < jsonItem.length; i++) {
        let div0 = document.createElement('div');

        if (i % 2 == 0) {
            div0.classList.add("divColorA");
        }
       
        const currentDate = new Date(jsonItem[i]['pubDate']);
        const options = {
            hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'long'
        }
          
        div0.textContent = `${i+1}: ${jsonItem[i]['title']} | ${currentDate.toLocaleDateString('ru-RU', options)}`;
        container.append(div0);
    }
    // console.log(jsonItem) 
}


async function getNews() {
    fetch("/ajax")
    .then(res => res.json())
    .then(data => JSON.parse(data))
    .then(json => showNews(json));
}


