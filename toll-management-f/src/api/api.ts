import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:9115/api",
  withCredentials: true, // Include cookies in requests
  headers: {
    "Content-Type": "multipart/form-data", // Default content type
  },
});

// Set the token
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["X-OBSERVATORY-AUTH"] = token;
}

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
