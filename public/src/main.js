"use strict"

const VERSION = '0.0.1';
let container = document.getElementById("container");

window.addEventListener('DOMContentLoaded', () => {
    // fetch('./data/t.json')
    //     .then(response => response.json())
    //     .then(json => temp(json));
});

function temp(data) {
    // console.log(data['rss']['channel']['item'][0]);
   
    let jjson = data['rss']['channel'][0]['item'];
    // let jjson = data;
    // console.log(data['rss']['channel'][0]['item']);
    for (let i = 0; i < jjson.length; i++) {
        let div0 = document.createElement('div');
        div0.textContent = `${i+1}: ${jjson[i]['title']}`;
        container.append(div0);
    } 
    // let div0 = document.createElement('div');
    // div0.textContent = `${jjson}`;
    // container.append(div0);

}







runButton.addEventListener('click', () => {
    sendUser();
    // .then(data => temp(data));
});

async function sendUser() {
    const response = await fetch("/ajax?name="+encodeURIComponent("Tomsk"));
  if (response.ok) { // Успешно?
    let data = await response.json(); // ждем результат в формате json
    let data2 = await JSON.parse(data);
    temp(data2);
    
    console.log(data); // выводим ответ
  }
}






// async function start() {
//     try {
//         const resp = await fetch('https://habr.com/ru/rss/articles/all/',{
//             // method: 'GET',
//             // headers: {'Content-Type': 'application/rss+xml'},
//             // mode: "cors",
//     });
//         console.log(await resp.json());
//     } catch(err) {
//         console.log(err);
//     }





//     try {
//             const resp = await fetch('http://localhost:5500/',{
//                 accepts: {
//                     xml: "application/rss+xml"
//                   },
                
//                   dataType: "xml",
//               });
//             console.log(resp);
//         } catch(err) {
//             console.log(err);
//         }
// }

// start()