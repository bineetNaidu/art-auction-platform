import { ApiResponse } from '@platform/shared-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * High-fidelity HTTP client wrapper enforcing backend generic response envelopes.
 * Handles automatic token interpolation and provides strict compile-time safety.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { token, headers, ...restOptions } = options;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', 'application/json');

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    // Parse the data layer safely under the ApiResponse envelope structure
    const result: ApiResponse<T> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network communication failure',
      error: {
        code: 'NETWORK_ERROR',
        details: error,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
