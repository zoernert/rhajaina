import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import HealthService from '../../src/services/health.service';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return healthy status', () => {
      const status = healthService.getStatus();
      expect(status).toEqual({ status: 'healthy' });
    });
  });

  describe('getUptime', () => {
    it('should return uptime in seconds', () => {
      jest.spyOn(process, 'uptime').mockReturnValue(12345);
      const uptime = healthService.getUptime();
      expect(uptime).toEqual({ uptime: 12345 });
    });
  });

  describe('checkAllServices', () => {
    it('should make request to health endpoint', async () => {
      const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
      global.fetch = mockFetch;
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      } as unknown as Response);

      const result = await healthService.checkAllServices();
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual({ status: 'healthy' });
    });

    it('should throw error when request fails', async () => {
      const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
      global.fetch = mockFetch;
      
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      } as unknown as Response);

      await expect(healthService.checkAllServices()).rejects.toThrow('Health check failed: Internal Server Error');
    });
  });
});
