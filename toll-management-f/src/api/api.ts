import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:9115/api",
  withCredentials: true, // Include cookies in requests
  headers: {
    "Content-Type": "application.json", // Default content type
  },
});

// Set the token
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["X-OBSERVATORY-AUTH"] = token;
}


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers["X-OBSERVATORY-AUTH"] = token;
  }
  return config;
});


// Response interceptor to handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
