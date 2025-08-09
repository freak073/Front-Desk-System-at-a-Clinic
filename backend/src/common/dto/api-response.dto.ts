export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;

  constructor(success: boolean, data?: T, message?: string, errors?: string[] | Record<string, string[]>) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message);
  }

  static error<T>(message: string, errors?: string[] | Record<string, string[]>): ApiResponseDto<T> {
    return new ApiResponseDto(false, undefined, message, errors);
  }
}

export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  constructor(data: T[], pagination: { page: number; limit: number; total: number; totalPages: number }, message?: string) {
    super(true, data, message);
    this.pagination = pagination;
  }
}
