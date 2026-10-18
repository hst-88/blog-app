import axios from 'axios'
const http = axios.create({ baseURL: '/api' })
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('jh_doctor_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
http.interceptors.response.use((r) => r.data, (e) => Promise.reject(e.response?.data || { message: e.message }))
export default http
