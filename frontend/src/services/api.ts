/**
 * API Service with Retry Logic
 * Implements exponential backoff for failed requests
 * Supports different retry strategies for different error types
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipRetry?: boolean;
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
}

export interface ApiError extends Error {
  response?: AxiosResponse;
  config?: AxiosRequestConfig;
  status?: number;
  data?: any;
}

export const isNetworkError = (error: any): boolean => {
  if (axios.isCancel(error)) return false;

  if (!error.response) {
    return true; // Network error, timeout, or axios config error
  }

  const status = error.response?.status;
  return status >= 500 || status === 429; // Server errors or rate limiting
};

export const shouldRetry = (error: any, attempt: number, config: ApiRequestConfig): boolean => {
  if (config.skipRetry) return false;

  if (attempt >= (config.maxRetries || 3)) {
    return false;
  }

  // Don't retry on client errors (4xx)
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return false;
  }

  // Don't retry on network errors for non-GET requests (to avoid duplicate actions)
  if (isNetworkError(error) && config.method && config.method.toUpperCase() !== 'GET') {
    return false;
  }

  // Retry on network errors and server errors
  return isNetworkError(error) || (error.response?.status || 0) >= 500;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * API Client with retry logic
 */
class ApiClient {
  private axiosInstance: AxiosInstance;
  private defaultConfig: ApiRequestConfig;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds default
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.defaultConfig = {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      backoffMultiplier: 2, // Double the delay each retry
    };

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.info('API Request', {
          url: config.url,
          method: config.method,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', {
          url: error.config.url,
          method: error.config.method,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const status = response.status;
        const logLevel = status >= 400 && status < 500 ? 'warn' : 'info';

        logger[logLevel]('API Response', {
          url: response.config.url,
          method: response.config.method,
          status,
          duration: response.headers['x-response-time'] || 'N/A',
        });

        return response;
      },
      (error) => {
        logger.error('API Response Error', {
          url: error.config.url,
          method: error.config.method,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute API request with retry logic
   * @param config Request configuration
   * @returns Promise with response data
   */
  async request<T = any>(config: ApiRequestConfig): Promise<T> {
    const requestConfig: ApiRequestConfig = {
      ...this.defaultConfig,
      ...config,
    };

    let attempt = 1;
    let lastError: any;

    while (attempt <= requestConfig.maxRetries) {
      try {
        logger.info(`API Request Attempt ${attempt}`, {
          url: requestConfig.url,
          method: requestConfig.method,
        });

        const response: AxiosResponse<T> = await this.axiosInstance(requestConfig);

        // Success - return response data
        return response.data;
      } catch (error: any) {
        lastError = error;
        logger.warn(`API Request Attempt ${attempt} Failed`, {
          url: requestConfig.url,
          method: requestConfig.method,
          error: error.message,
          attempt,
        });

        // Check if we should retry
        if (!shouldRetry(error, attempt, requestConfig)) {
          // Don't retry - throw the error
          throw error;
        }

        // Calculate delay for retry with exponential backoff
        const delayMs = requestConfig.initialDelay * Math.pow(requestConfig.backoffMultiplier, attempt - 1);

        logger.info(`Retrying after ${delayMs}ms...`, {
          url: requestConfig.url,
          attempt,
          nextAttempt: attempt + 1,
        });

        // Wait before retrying
        await delay(delayMs);
        attempt++;
      }
    }

    // All retries failed - throw the last error
    logger.error(`API Request Failed After ${requestConfig.maxRetries} Attempts`, {
      url: requestConfig.url,
      method: requestConfig.method,
      lastError: lastError.message,
    });

    throw lastError;
  }

  /**
   * Execute multiple API requests concurrently
   * @param configs Array of request configurations
   * @returns Promise with array of responses
   */
  async requestAll<T = any>(configs: Array<ApiRequestConfig>): Promise<T[]> {
    try {
      const responses = await Promise.all(
        configs.map(config => this.request<T>(config))
      );
      return responses;
    } catch (error: any) {
      logger.error('Batch API Request Failed', { error, requestCount: configs.length });
      throw error;
    }
  }

  /**
   * Execute multiple API requests with concurrency control
   * @param configs Array of request configurations
   * @param concurrency Maximum number of concurrent requests (default: 5)
   * @returns Promise with array of responses
   */
  async requestBatch<T = any>(
    configs: Array<ApiRequestConfig>,
    concurrency: number = 5
  ): Promise<T[]> {
    const results: Array<{ success: boolean; data?: T; error?: any }> = new Array(configs.length);

    for (let i = 0; i < configs.length; i += concurrency) {
      const batch = configs.slice(i, i + concurrency);
      const batchPromises = batch.map((config, index) => {
        const promiseIndex = i + index;
        return this.request<T>(config)
          .then(data => ({
            success: true,
            data,
            promiseIndex,
          }))
          .catch(error => ({
            success: false,
            error,
            promiseIndex,
          }));
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        results[result.promiseIndex] = result;
      });
    }

    // Check if any requests failed
    const failedRequests = results.filter(r => !r.success);
    if (failedRequests.length > 0) {
      logger.warn('Batch API Request Partially Failed', {
        totalRequests: configs.length,
        failedRequests: failedRequests.length,
      });
    }

    // Extract successful results
    return results
      .filter(r => r.success)
      .map(r => r.data as T);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config: ApiRequestConfig = {}): Promise<T> {
    return this.request<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config: ApiRequestConfig = {}): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config: ApiRequestConfig = {}): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config: ApiRequestConfig = {}): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config: ApiRequestConfig = {}): Promise<T> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    });
  }

  /**
   * Set authentication token for all requests
   */
  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    logger.info('Auth token set');
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    logger.info('Auth token cleared');
  }

  /**
   * Update default configuration
   */
  updateConfig(config: Partial<ApiRequestConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config,
    };
  }
}

// Create singleton instance
// IMPORTANT: Set VITE_API_URL in Railway environment variables for production!
// Example: VITE_API_URL=https://backend-production-c3af.up.railway.app/api
// Vite uses import.meta.env, not process.env
// In development, use relative path '/api' so Vite proxy can intercept requests
const isDevelopment = import.meta.env.DEV;
const apiBaseUrl = import.meta.env.VITE_API_URL || (isDevelopment ? '/api' : 'http://localhost:3001/api');
const apiClient = new ApiClient(apiBaseUrl);

export const api = apiClient;

export default apiClient;
