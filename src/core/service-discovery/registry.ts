export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
  metadata?: Record<string, any>;
  health?: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
  };
  registeredAt: Date;
  lastHeartbeat: Date;
}

export interface ServiceRegistryConfig {
  heartbeatInterval: number;
  healthCheckInterval: number;
  serviceTimeout: number;
}

export class ServiceRegistry {
  private services = new Map<string, ServiceInstance>();
  private config: ServiceRegistryConfig;

  constructor(config: ServiceRegistryConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  register(service: Omit<ServiceInstance, 'id' | 'registeredAt' | 'lastHeartbeat'>): string {
    const id = `${service.name}-${service.host}-${service.port}-${Date.now()}`;
    const instance: ServiceInstance = {
      ...service,
      id,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      health: {
        status: 'unknown',
        lastCheck: new Date()
      }
    };

    this.services.set(id, instance);
    return id;
  }

  deregister(serviceId: string): boolean {
    return this.services.delete(serviceId);
  }

  heartbeat(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (service) {
      service.lastHeartbeat = new Date();
      return true;
    }
    return false;
  }

  discover(serviceName: string): ServiceInstance[] {
    return Array.from(this.services.values())
      .filter(service => service.name === serviceName)
      .filter(service => this.isServiceAlive(service));
  }

  getService(serviceId: string): ServiceInstance | undefined {
    return this.services.get(serviceId);
  }

  getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values());
  }

  updateHealth(serviceId: string, status: 'healthy' | 'unhealthy'): boolean {
    const service = this.services.get(serviceId);
    if (service) {
      service.health = {
        status,
        lastCheck: new Date()
      };
      return true;
    }
    return false;
  }

  private isServiceAlive(service: ServiceInstance): boolean {
    const now = Date.now();
    const lastHeartbeat = service.lastHeartbeat.getTime();
    return (now - lastHeartbeat) < this.config.serviceTimeout;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.heartbeatInterval);
  }

  private cleanup(): void {
    for (const [id, service] of this.services.entries()) {
      if (!this.isServiceAlive(service)) {
        this.services.delete(id);
      }
    }
  }
}
