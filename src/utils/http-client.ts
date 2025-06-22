import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { Agent } from 'https';
import { withRetry, RetryConfig } from './retry-logic';

// Extend Axios request config to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  maxConnections?: number;
  retryConfig?: Partial<RetryConfig>;
  headers?: Record<string, string>;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: Partial<RetryConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      retryCondition: this.isRetryableError,
      ...config.retryConfig
    };

    const httpsAgent = new Agent({
      maxSockets: config.maxConnections || 100,
      keepAlive: true,
      keepAliveMsecs: 1000
    });

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const duration = response.config.metadata?.startTime 
          ? Date.now() - response.config.metadata.startTime 
          : 0;
        console.log(`HTTP ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        return response;
      },
      (error) => {
        const duration = error.config?.metadata?.startTime 
          ? Date.now() - error.config.metadata.startTime 
          : 0;
        console.error(`HTTP ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'TIMEOUT'} (${duration}ms)`);
        return Promise.reject(error);
      }
    );
  }

  private isRetryableError(error: any): boolean {
    if (!error.response) {
      return true; // Network errors
    }

    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => 
      this.axiosInstance.get(url, config).then(response => response.data)
    );
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => 
      this.axiosInstance.post(url, data, config).then(response => response.data)
    );
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => 
      this.axiosInstance.put(url, data, config).then(response => response.data)
    );
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => 
      this.axiosInstance.delete(url, config).then(response => response.data)
    );
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return withRetry(operation, this.retryConfig);
  }

  setAuthHeader(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthHeader(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}
