import { ServiceInstance, ServiceRegistry } from './registry';
import { LoadBalancer, RoundRobinLoadBalancer } from './load-balancer';

export interface ServiceDiscoveryConfig {
  registry?: ServiceRegistry;
  loadBalancer?: LoadBalancer;
  cacheTimeout: number;
}

export class ServiceDiscoveryClient {
  private registry?: ServiceRegistry;
  private loadBalancer: LoadBalancer;
  private serviceCache = new Map<string, { services: ServiceInstance[]; cachedAt: Date }>();
  private config: ServiceDiscoveryConfig;

  constructor(config: ServiceDiscoveryConfig) {
    this.config = config;
    this.registry = config.registry;
    this.loadBalancer = config.loadBalancer || new RoundRobinLoadBalancer();
  }

  async discoverService(serviceName: string, useCache = true): Promise<ServiceInstance | null> {
    const services = await this.discoverServices(serviceName, useCache);
    return this.loadBalancer.select(services);
  }

  async discoverServices(serviceName: string, useCache = true): Promise<ServiceInstance[]> {
    if (useCache) {
      const cached = this.serviceCache.get(serviceName);
      if (cached && this.isCacheValid(cached.cachedAt)) {
        return cached.services;
      }
    }

    let services: ServiceInstance[] = [];

    if (this.registry) {
      services = this.registry.discover(serviceName);
    }

    // Cache the results
    this.serviceCache.set(serviceName, {
      services,
      cachedAt: new Date()
    });

    return services;
  }

  async getServiceUrl(serviceName: string): Promise<string | null> {
    const service = await this.discoverService(serviceName);
    if (!service) {
      return null;
    }

    return `${service.protocol}://${service.host}:${service.port}`;
  }

  async getHealthyServices(serviceName: string): Promise<ServiceInstance[]> {
    const services = await this.discoverServices(serviceName);
    return services.filter(service => 
      service.health?.status === 'healthy' || service.health?.status === 'unknown'
    );
  }

  clearCache(serviceName?: string): void {
    if (serviceName) {
      this.serviceCache.delete(serviceName);
    } else {
      this.serviceCache.clear();
    }
  }

  private isCacheValid(cachedAt: Date): boolean {
    const now = Date.now();
    const cacheTime = cachedAt.getTime();
    return (now - cacheTime) < this.config.cacheTimeout;
  }
}
