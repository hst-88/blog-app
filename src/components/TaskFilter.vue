<script setup>
// 定义 v-model，父组件传来的值会自动同步
const modelValue = defineModel();

const filters = ['all', 'active', 'completed'];
</script>

<template>
  <div class="flex p-1 bg-slate-100 rounded-xl mb-6">
    <button 
      v-for="f in filters" 
      :key="f"
      @click="modelValue = f"
      :class="[
        'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize',
        modelValue === f ? 'bg-white text-brand shadow-sm' : 'text-slate-500'
      ]"
    >
      {{ f }}
    </button>
  </div>
</template>