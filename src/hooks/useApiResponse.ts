import { useState, useCallback } from 'react';
import { ApiResponse } from '../types/response';

interface UseApiResponseState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
}

export function useApiResponse<T = any>() {
  const [state, setState] = useState<UseApiResponseState<T>>({
    data: null,
    loading: false,
    error: null,
    validationErrors: null,
  });

  const handleResponse = useCallback(async (
    responsePromise: Promise<Response>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null, validationErrors: null }));

    try {
      const response = await responsePromise;
      const result: ApiResponse<T> = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          data: result.data || null,
          loading: false,
        }));
        return result.data || null;
      } else {
        const errorMessage = result.error?.message || 'An error occurred';
        const validationErrors = result.error?.details?.validationErrors || null;
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          validationErrors,
          loading: false,
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error occurred',
        loading: false,
      }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      validationErrors: null,
    });
  }, []);

  return {
    ...state,
    handleResponse,
    reset,
  };
}
