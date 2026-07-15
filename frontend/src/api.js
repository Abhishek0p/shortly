import axios from 'axios';
import { supabase } from './lib/supabase';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

// Add interceptor to inject Authorization header
API.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const shortenUrl = (data) => API.post('/api/shorten', data);
export const getLinks = (skip = 0, limit = 20) => API.get(`/api/links?skip=${skip}&limit=${limit}`);
export const getAnalytics = (code) => API.get(`/api/analytics/${code}`);
export const getStats = () => API.get('/api/stats');

export default API;
