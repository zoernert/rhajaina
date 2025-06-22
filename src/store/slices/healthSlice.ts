import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HealthCheckResponse, ServiceHealth } from '../../types/health';
import {
  checkServiceHealth,
  checkSpecificService,
  startHealthMonitoring,
  stopHealthMonitoring,
} from '../actions/healthActions';

interface HealthState {
  overall: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  services: ServiceHealth[];
  lastChecked: string | null;
  isLoading: boolean;
  error: string | null;
  isMonitoring: boolean;
  monitoringInterval: number | null;
}

const initialState: HealthState = {
  overall: 'unknown',
  services: [],
  lastChecked: null,
  isLoading: false,
  error: null,
  isMonitoring: false,
  monitoringInterval: null,
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearHealthError: (state) => {
      state.error = null;
    },
    updateServiceHealth: (state, action: PayloadAction<ServiceHealth>) => {
      const index = state.services.findIndex(
        service => service.serviceName === action.payload.serviceName
      );
      if (index !== -1) {
        state.services[index] = action.payload;
      } else {
        state.services.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkServiceHealth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkServiceHealth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overall = action.payload.overall;
        state.services = action.payload.services;
        state.lastChecked = action.payload.timestamp;
      })
      .addCase(checkServiceHealth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Health check failed';
        state.overall = 'unknown';
      })
      .addCase(checkSpecificService.fulfilled, (state, action) => {
        const index = state.services.findIndex(
          service => service.serviceName === action.payload.serviceName
        );
        if (index !== -1) {
          state.services[index] = action.payload;
        } else {
          state.services.push(action.payload);
        }
      })
      .addCase(startHealthMonitoring.fulfilled, (state) => {
        state.isMonitoring = true;
      })
      .addCase(stopHealthMonitoring.fulfilled, (state) => {
        state.isMonitoring = false;
        state.monitoringInterval = null;
      });
  },
});

export const { clearHealthError, updateServiceHealth } = healthSlice.actions;
export default healthSlice.reducer;
