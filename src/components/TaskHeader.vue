<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore } from '@/stores/taskStore'; // 确保路径正确

// 1. 初始化 store
const taskStore = useTaskStore();

// 2. 使用 storeToRefs 解构 tasks，确保它是响应式的
// 如果直接 const { tasks } = taskStore; 进度条将不会随勾选而移动
const { tasks } = storeToRefs(taskStore);

// 3. 编写进度逻辑
const progress = computed(() => {
  const total = tasks.value.length;
  if (total === 0) return 0; // 防止除以零

  const completedCount = tasks.value.filter(t => t.isCompleted).length;
  // 计算百分比并取整
  return Math.round((completedCount / total) * 100);
});
</script>

<template>
  <header class="bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white">
    <h1 class="text-3xl font-black tracking-tight">TaskHub</h1>
   
    <div class="mt-6">
      <div class="flex justify-between items-end mb-2">
        <p class="text-blue-100/80 text-xs font-bold uppercase tracking-wider">完成进度</p>
        <span class="text-2xl font-mono font-black">{{ progress }}%</span>
      </div>
     
      <div class="h-2 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
        <div
         class="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500 ease-out"
         :style="{ width: `${progress}%` }"
       ></div>
      </div>
    </div>
  </header>
</template>