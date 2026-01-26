import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const CACHE_TTL = 5000;

type CachedValue<T> = {
  data: T;
  timestamp: number;
};

const requestCache = new Map<string, CachedValue<unknown>>();

const getCacheKey = (method: string, url: string, params?: any): string => {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${method}:${url}:${paramsStr}`;
};

const getCachedData = <T>(key: string): T | null => {
  const cached = requestCache.get(key) as CachedValue<T> | undefined;
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    requestCache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = <T>(key: string, data: T): void => {
  requestCache.set(key, { data, timestamp: Date.now() });
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        const isDev = import.meta.env.VITE_API_BASE_URL?.includes('localhost');
        
        if (token && config.headers && !isDev) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const cacheKey = getCacheKey('GET', url, params);
    const cached = getCachedData<T>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.client.get<T>(url, { params });
    setCachedData(cacheKey, response.data);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  clearCache(): void {
    requestCache.clear();
  }

  invalidateCache(pattern: string): void {
    const keysToDelete: string[] = [];
    
    requestCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => requestCache.delete(key));
  }
}

export const apiClient = new ApiClient();
export default apiClient;
