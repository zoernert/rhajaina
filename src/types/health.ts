export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastChecked: string;
  responseTime?: number;
  details?: {
    database?: boolean;
    externalApi?: boolean;
    cache?: boolean;
    [key: string]: any;
  };
  error?: string;
}

export interface HealthCheckResponse {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  timestamp: string;
}
