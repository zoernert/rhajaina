interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface BaseServiceConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

class BaseService {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;

  constructor(config: BaseServiceConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  setAuthToken(token: string | null): void {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestOptions = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as T;
    } catch (error) {
      this.log(`Request failed: ${(error as Error).message}`, 'error');
      throw error;
    }
  }

  async get<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request<T>(url, {
      method: 'GET',
    });
  }

  async post<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const headers = { ...this.defaultHeaders };
    delete headers['Content-Type']; // Let browser set content-type for FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] BaseService: ${message}`);
  }
}

module.exports = BaseService;
export = BaseService;
