import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const BASE_URL = 'http://backend-server-lims-ybsnm6cnka-el.a.run.app/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('lims_access_token', access);
  localStorage.setItem('lims_refresh_token', refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('lims_access_token');
  localStorage.removeItem('lims_refresh_token');
};

export const loadTokensFromStorage = () => {
  accessToken = localStorage.getItem('lims_access_token');
  refreshToken = localStorage.getItem('lims_refresh_token');
};

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // Unwrap response.data so all API functions return data directly
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    // Normalize error message from backend response
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const withBranch = (branchId: number): AxiosRequestConfig => ({
  headers: { 'X-Branch-Id': String(branchId) },
});

export default api;
