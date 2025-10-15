import axios from "axios";
import { store } from "@/app/store";
import { logout } from "@/features/auth/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // -> https://fcom.pythonanywhere.com
  timeout: 20000,
  withCredentials: false, // true si vous utilisez les cookies de session
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ---- Injecte le token (JWT/Token) si présent dans Redux
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.token;
  if (token) {
    // Adaptable : "Bearer" ou "Token" selon le backend
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// ---- Gestion des réponses/erreurs
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    // Redirige/clean sur 401
    if (status === 401) {
      store.dispatch(logout());
      // Optionnel: window.location.href = "/login";
    }
    // Remonte une erreur propre au caller
    return Promise.reject(
      error?.response?.data ?? { message: "Network or server error", error }
    );
  }
);

export default api;
