import { ServiceRegistry, ServiceInstance } from './registry.js';

export interface ServiceRegistrationConfig {
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
  metadata?: Record<string, any>;
  heartbeatInterval: number;
}

export class ServiceRegistration {
  private registry: ServiceRegistry;
  private serviceId?: string;
  private heartbeatTimer?: NodeJS.Timeout;
  private config: ServiceRegistrationConfig;

  constructor(registry: ServiceRegistry, config: ServiceRegistrationConfig) {
    this.registry = registry;
    this.config = config;
  }

  register(): string {
    if (this.serviceId) {
      throw new Error('Service already registered');
    }

    this.serviceId = this.registry.register({
      name: this.config.name,
      host: this.config.host,
      port: this.config.port,
      protocol: this.config.protocol,
      metadata: this.config.metadata
    });

    this.startHeartbeat();
    return this.serviceId;
  }

  deregister(): void {
    if (this.serviceId) {
      this.stopHeartbeat();
      this.registry.deregister(this.serviceId);
      this.serviceId = undefined;
    }
  }

  updateMetadata(metadata: Record<string, any>): void {
    if (this.serviceId) {
      const service = this.registry.getService(this.serviceId);
      if (service) {
        service.metadata = { ...service.metadata, ...metadata };
      }
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.serviceId) {
        this.registry.heartbeat(this.serviceId);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

// Decorator for automatic service registration
export function RegisterService(config: Omit<ServiceRegistrationConfig, 'heartbeatInterval'>) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      private serviceRegistration?: ServiceRegistration;

      async startService(registry: ServiceRegistry) {
        this.serviceRegistration = new ServiceRegistration(registry, {
          ...config,
          heartbeatInterval: 30000 // 30 seconds default
        });
        
        this.serviceRegistration.register();
      }

      async stopService() {
        if (this.serviceRegistration) {
          this.serviceRegistration.deregister();
        }
      }
    };
  };
}
