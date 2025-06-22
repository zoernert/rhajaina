import { ServiceInstance, ServiceRegistry } from './registry.js';

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
  endpoints: {
    http: string;
    grpc?: string;
  };
}

export class HealthChecker {
  private registry: ServiceRegistry;
  private config: HealthCheckConfig;
  private checkInterval?: NodeJS.Timeout;

  constructor(registry: ServiceRegistry, config: HealthCheckConfig) {
    this.registry = registry;
    this.config = config;
  }

  start(): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(() => {
      this.checkAllServices();
    }, this.config.interval);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  async checkService(service: ServiceInstance): Promise<boolean> {
    try {
      if (service.protocol === 'http' || service.protocol === 'https') {
        return await this.checkHttpService(service);
      } else if (service.protocol === 'grpc') {
        return await this.checkGrpcService(service);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async checkAllServices(): Promise<void> {
    const services = this.registry.getAllServices();
    
    const checks = services.map(async (service) => {
      const isHealthy = await this.checkService(service);
      this.registry.updateHealth(service.id, isHealthy ? 'healthy' : 'unhealthy');
    });

    await Promise.allSettled(checks);
  }

  private async checkHttpService(service: ServiceInstance): Promise<boolean> {
    const url = `${service.protocol}://${service.host}:${service.port}${this.config.endpoints.http}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkGrpcService(service: ServiceInstance): Promise<boolean> {
    // Placeholder for gRPC health check
    // Would implement actual gRPC health check protocol
    return true;
  }
}
