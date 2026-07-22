import { ref } from 'vue';

export function useNotification() {
  const message = ref('');
  const isVisible = ref(false);

  const notify = (msg, duration = 2000) => {
    message.value = msg;
    isVisible.value = true;
    setTimeout(() => {
      isVisible.value = false;
    }, duration);
  };

  return { message, isVisible, notify };
}