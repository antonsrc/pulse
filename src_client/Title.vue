<script setup>
import { ref } from 'vue'
defineProps(['title']);

function getDate(date) {
    const currentDate = new Date(date);
    return currentDate.toLocaleString('ru-RU');
}

function getSrc(src) {
    let url = new URL(src);
    return url.hostname.replace(/^www\./, '');
}

const toggleTitles = ref(false);
</script>

<template>
    <div className="Title">
        <div @click="toggleTitles = !toggleTitles">
            {{ title.num }} {{ title.title }} ({{ title.countTitles }})
        </div>
        <div v-if="toggleTitles" v-for="(item, i) in title.allTitles">
            <div :style="{ backgroundColor: 'rgba(25, 175, 100,' + ((i % 2) * 0.25 + 0.15) + ')' }">
                <div>
                    <a :href="item.link">
                        {{ item.title }}
                    </a>
                </div>
                <div className="LittleText">
                    {{ getDate(item.date) }}, {{ getSrc(item.link) }}
                </div>
            </div>

        </div>
    </div>

</template>

<style scoped>
.Title {
    cursor: pointer;
    padding: 0.3rem 0.7rem 0.5rem;
    margin: 0.1rem 0.1rem;
}

.LittleText {
    color: gray;
    font-size: 0.7rem;
}
</style>