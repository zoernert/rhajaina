import { ServiceInstance } from './registry.js';

export interface LoadBalancer {
  select(services: ServiceInstance[]): ServiceInstance | null;
}

export class RoundRobinLoadBalancer implements LoadBalancer {
  private counters = new Map<string, number>();

  select(services: ServiceInstance[]): ServiceInstance | null {
    if (services.length === 0) {
      return null;
    }

    if (services.length === 1) {
      return services[0];
    }

    // Use service name as key for round-robin counter
    const serviceName = services[0].name;
    const counter = this.counters.get(serviceName) || 0;
    const index = counter % services.length;
    
    this.counters.set(serviceName, counter + 1);
    return services[index];
  }
}

export class RandomLoadBalancer implements LoadBalancer {
  select(services: ServiceInstance[]): ServiceInstance | null {
    if (services.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * services.length);
    return services[index];
  }
}

export class WeightedLoadBalancer implements LoadBalancer {
  select(services: ServiceInstance[]): ServiceInstance | null {
    if (services.length === 0) {
      return null;
    }

    // Use weight from metadata, default to 1
    const weights = services.map(service => service.metadata?.weight || 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < services.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return services[i];
      }
    }

    return services[services.length - 1];
  }
}
