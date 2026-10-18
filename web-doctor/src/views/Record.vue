<template>
  <el-card v-if="data">
    <h3>{{ data.patient.name }} · {{ data.patient.phone }}</h3>
    <p>身份证 {{ data.patient.idNo }} · 年龄 {{ data.patient.age }}</p>
    <el-timeline>
      <el-timeline-item v-for="(t, i) in data.timeline" :key="i" :timestamp="t.at">{{ t.type }}</el-timeline-item>
    </el-timeline>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import http from '../api'
const route = useRoute()
const data = ref(null)
onMounted(async () => { data.value = await http.get(`/doctor/patients/${route.params.id}/record`) })
</script>
