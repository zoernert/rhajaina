export type { ServiceRegistry, ServiceInstance, ServiceRegistryConfig } from './registry';
export type { ServiceDiscoveryClient, ServiceDiscoveryConfig } from './client';
export type { LoadBalancer, RoundRobinLoadBalancer, RandomLoadBalancer, WeightedLoadBalancer } from './load-balancer';
export type { HealthChecker, HealthCheckConfig } from './health-checker';
export type { ServiceRegistration, ServiceRegistrationConfig, RegisterService } from './service-registration';

// Default configuration
export const DEFAULT_SERVICE_DISCOVERY_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  healthCheckInterval: 60000, // 1 minute
  serviceTimeout: 90000, // 1.5 minutes
  cacheTimeout: 10000, // 10 seconds
  healthCheck: {
    interval: 60000,
    timeout: 5000,
    retries: 3,
    endpoints: {
      http: '/health'
    }
  }
};
