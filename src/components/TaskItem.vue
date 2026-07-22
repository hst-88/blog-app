<script setup>
// 接收父组件传递的任务对象
defineProps({
  task: {
    type: Object,
    required: true
  }
});

// 定义通知父组件的事件
const emit = defineEmits(['toggle', 'remove']);
</script>

<template>
  <li class="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white transition-all">
    <div class="flex items-center gap-3">
      <input 
        type="checkbox" 
        :checked="task.isCompleted" 
        @change="emit('toggle', task.id)"
        class="w-5 h-5 accent-brand cursor-pointer"
      />
      <span :class="['text-slate-700 font-medium', task.isCompleted ? 'line-through text-slate-400 opacity-50' : '']">
        {{ task.title }}
      </span>
    </div>
    <button @click="emit('remove', task.id)" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1">
      ✕
    </button>
  </li>
</template>