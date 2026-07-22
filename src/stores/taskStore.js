import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useTaskStore = defineStore('task-store', () => {
  // --- 1. 状态 (State) ---
  // 尝试从 LocalStorage 读取初始值
  const savedTasks = localStorage.getItem('my-tasks')
  const tasks = ref(savedTasks ? JSON.parse(savedTasks) : [])
  const filter = ref('all')

  // --- 2. 派生状态 (Getters) ---
  const filteredTasks = computed(() => {
    if (filter.value === 'active') return tasks.value.filter(t => !t.isCompleted)
    if (filter.value === 'completed') return tasks.value.filter(t => t.isCompleted)
    return tasks.value
  })

  // --- 3. 动作 (Actions) ---
  const addTask = (title) => {
    tasks.value.unshift({ id: crypto.randomUUID(), title, isCompleted: false })
  }

  const removeTask = (id) => {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  const toggleTask = (id) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) task.isCompleted = !task.isCompleted
  }

  // --- 4. 持久化 (Persistence) ---
  // 监听 tasks 的变化，一旦变化就写入 LocalStorage
  watch(tasks, (newVal) => {
    localStorage.setItem('my-tasks', JSON.stringify(newVal))
  }, { deep: true }) // 深度监听数组内部对象的变化

  return {
    tasks,
    filter,
    filteredTasks,
    addTask,
    removeTask,
    toggleTask
  }
})