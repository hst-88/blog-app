import axios from 'axios'

function createHttp(key) {
  const http = axios.create({ baseURL: '/api' })
  http.interceptors.request.use((cfg) => {
    const token = localStorage.getItem(key)
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
  })
  http.interceptors.response.use(
    (r) => r.data,
    (e) => Promise.reject(e.response?.data || { message: e.message }),
  )
  return http
}

export const userHttp = createHttp('jh_user_token')
export const doctorHttp = createHttp('jh_doctor_token')
export const adminHttp = createHttp('jh_admin_token')
export default adminHttp
