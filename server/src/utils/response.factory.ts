/**
 * Standardized API response envelope.
 * All REST endpoints return this shape so the client can handle
 * success/error uniformly without inspecting HTTP status codes.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ResponseFactory {
  static success<T>(data: T, statusCode = 200): ApiResponse<T> {
    return { success: true, data, statusCode };
  }

  static error(message: string, statusCode: number): ApiResponse {
    return { success: false, error: message, statusCode };
  }

  static created<T>(data: T): ApiResponse<T> {
    return { success: true, data, statusCode: 201 };
  }
}
