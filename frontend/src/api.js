import axios from 'axios';

// Create an Axios instance with your backend's base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;