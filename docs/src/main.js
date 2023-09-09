"use strict"

const VERSION = '0.1.0';

let container = document.getElementById("container");
let runButton = document.getElementById("runButton");

runButton.addEventListener('click', () => {
    sendUser();
});



function temp(data) {
    let jjson = data['rss']['channel'][0]['item'];
    container.innerHTML = '';
    for (let i = 0; i < jjson.length; i++) {
        let div0 = document.createElement('div');
        div0.textContent = `${i+1}: ${jjson[i]['title']}`;
        container.append(div0);
    } 
}


async function sendUser() {
    const response = await fetch("/ajax");
    let data = await response.json();
    let data2 = await JSON.parse(data);
    temp(data2);

}


