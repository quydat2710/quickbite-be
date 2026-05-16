export class ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };

  static success<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    const res = new ApiResponse<T>();
    res.success = true;
    res.data = data;
    if (meta) res.meta = meta;
    return res;
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ApiResponse<T[]> {
    return ApiResponse.success(data, { page, limit, total });
  }

  static error(code: string, message: string, details?: any[]): ApiResponse {
    const res = new ApiResponse();
    res.success = false;
    res.error = { code, message, details };
    return res;
  }
}
