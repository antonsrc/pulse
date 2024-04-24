<script setup>
import { ref, reactive, computed } from 'vue'

const count = ref(0);


</script>

<template>
    <div>{{ count }}</div>
    <button @click="count++">
        {{ count }}
    </button>
</template>

<style scoped>

</style>
