<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import Title from './Title.vue'

const VERSION = '0.15.17';
const headerHeight = '1.1rem';

onMounted(() => {
    getNews();
})

let titles = reactive({ json: 0 });
let counts = reactive([]);

async function getNews() {
    const res = await fetch("/root");
    const json = await res.json();
    titles.json = await JSON.parse(json);
    counts = Object.values(titles.json).map(i => i.length - 1);
}
</script>

<template>
    <div id="header">pulse v.{{ VERSION }}</div>
    <div id="titles">
        <Title v-for="(item, key, i) in titles.json" :id="'title_' + encodeURIComponent(key)" :title="{
            num: i + 1,
            title: item[counts[i]].title,
            countTitles: counts[i],
            allTitles: item.slice(1)
        }" :style="{ backgroundColor: 'rgba(25, 175, 100,' + 0.03 * counts[i] + ')' }" />
    </div>
</template>

<style scoped>
#header {
    padding-right: 0.5rem;
    order: 1;
    width: 100%;
    color: rgb(255, 255, 255);
    background: rgba(25, 175, 100, 0.847);
    text-align: right;
    position: fixed;
    height: v-bind('headerHeight');
    font-size: calc(v-bind('headerHeight') - 0.3rem);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
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
