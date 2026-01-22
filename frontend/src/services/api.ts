import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.client.defaults.headers.Authorization;
  }

  async get<T = unknown>(url: string, config?: Parameters<typeof axios.get>[1]) {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof axios.post>[2]) {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof axios.put>[2]) {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof axios.patch>[2]) {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config?: Parameters<typeof axios.delete>[1]) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
