import axios from 'axios';
import { message } from 'antd';

const API_BASE = 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动附加 JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.error || error.response?.data?.message || '请求失败';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      message.error(msg);
    }
    return Promise.reject(error);
  }
);

export default client;
