import { ref, watch } from 'vue';

export function useLocalStorage(key, defaultValue = null) {
  // 1. 初始化数据
  const storedValue = localStorage.getItem(key);
  const data = ref(storedValue ? JSON.parse(storedValue) : defaultValue);

  // 2. 监听变化并自动同步
  watch(data, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  }, { deep: true });

  return data;
}