import { createAsyncThunk } from '@reduxjs/toolkit';
import { HealthCheckResponse, ServiceHealth } from '../../types/health';
import { healthService } from '../../services/healthService';

export const checkServiceHealth = createAsyncThunk<
  HealthCheckResponse,
  void,
  { rejectValue: string }
>(
  'health/checkServiceHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await healthService.checkAllServices();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Health check failed'
      );
    }
  }
);

export const checkSpecificService = createAsyncThunk<
  ServiceHealth,
  string,
  { rejectValue: string }
>(
  'health/checkSpecificService',
  async (serviceName, { rejectWithValue }) => {
    try {
      const response = await healthService.checkService(serviceName);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Service health check failed'
      );
    }
  }
);

export const startHealthMonitoring = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>(
  'health/startMonitoring',
  async (intervalMs, { dispatch, rejectWithValue }) => {
    try {
      const intervalId = setInterval(() => {
        dispatch(checkServiceHealth());
      }, intervalMs);
      
      // Store interval ID for cleanup
      return;
    } catch (error) {
      return rejectWithValue('Failed to start health monitoring');
    }
  }
);

export const stopHealthMonitoring = createAsyncThunk<void, number>(
  'health/stopMonitoring',
  async (intervalId) => {
    clearInterval(intervalId);
  }
);
