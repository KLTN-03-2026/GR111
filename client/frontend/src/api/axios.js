import axios from "axios";

/**
 * Next.js backend chỉ mount REST dưới `/api/*`.
 * Nếu `.env` đặt `VITE_API_URL=http://localhost:3000` (thiếu `/api`),
 * request sẽ thành `POST /owner/bookings/...` → 404.
 */
function resolveApiBaseUrl() {
  const fallback = "http://localhost:3000/api";
  const raw = (import.meta.env.VITE_API_URL ?? "").trim();
  if (!raw) return fallback;
  const base = raw.replace(/\/+$/, "");
  // Đã có tiền tố .../api/... (kể cả .../api/v2)
  if (/\/api(\/|$)/i.test(base)) return base;
  return `${base}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});
// tự động đính kèm token vào header 
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;

});
// xử lý lỗi 401 (token hết hạn hoặc không hợp lệ)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);
export default api;