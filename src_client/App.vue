<script setup>
import { ref, onMounted, reactive, computed } from 'vue'

const VERSION = '0.14.17';
const headerHeight = '1.1rem';

onMounted(() => {
    getNews();
})

let titles = reactive({ json: 0 });

async function getNews() {
    const res = await fetch("/root");
    const json = await res.json();
    titles.json = await JSON.parse(json);
    // .then(titles => showTitles(titles))
    //     .then(words => setEventListenersForLabels(words));
}

function showTitles(data) {
    // titles.innerHTML = '';

    // let i = 1;
    for (let item in data) {
        // let spanWord = document.createElement('div');

        let lastNum = data[item].length - 1;
        let count = data[item].length - 1;
        spanWord.textContent = data[item][lastNum].title + ` (${count})`;
        spanWord.style.backgroundColor = `rgba(50, 240, 115, ${0.02 * count})`;

        spanWord.id = 'title_' + encodeURIComponent(item);
        // spanWord.classList.add("LinkNews");
        titles.append(spanWord);
        // i++;
    }
    return data;
}



</script>

<template>
    <div id="header">pulse v.{{ VERSION }}</div>
    <div id="titles">
        <div className="LinkNews" v-for="(item, key, index) in titles.json" :id="'title_' + encodeURIComponent(key)"
            :style="{ backgroundColor: `rgba(0, 153, 255, ${0.02 * (item.length - 1)})` }">{{ index + 1 }} {{
                item[item.length - 1].title }} ({{ item.length - 1 }})</div>
    </div>
</template>

<style scoped>
#header {
    padding-right: 0.5rem;
    order: 1;
    width: 100%;
    color: rgb(255, 255, 255);
    background: rgba(0, 153, 255, 0.5);
    text-align: right;
    position: fixed;
    height: v-bind('headerHeight');
    font-size: calc(v-bind('headerHeight') - 0.3rem);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}

.LinkNews {
    cursor: pointer;
    padding: 0.3rem 0.7rem 0.5rem;
    margin: 0.1rem 0.1rem;
}

#titles {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-items: flex-start;
    padding-top: 1.7rem;
    align-content: flex-start;
}
</style>
