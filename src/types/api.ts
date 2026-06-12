/**
 * Common API response format according to the API contract
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};