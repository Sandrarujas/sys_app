import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Agregar interceptor para enviar el token en cada petición si existe
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // o donde guardes el token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
