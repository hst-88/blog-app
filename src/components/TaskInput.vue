<script setup>
import { ref } from 'vue';

// 定义组件向外抛出的事件名
const emit = defineEmits(['add-task']);

const title = ref('');

const handleSubmit = () => {
  const value = title.value.trim();
  if (!value) return;
  
  // 发送事件，并将数据作为参数传递
  emit('add-task', value);
  title.value = '';
};
</script>

<template>
  <div class="flex gap-2 mb-8">
    <input 
      v-model="title"
      @keyup.enter="handleSubmit"
      placeholder="今天要完成什么？"
      class="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/50 outline-none transition-all"
    />
    <button @click="handleSubmit" class="bg-brand text-white px-6 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all">
      +
    </button>
  </div>
</template>