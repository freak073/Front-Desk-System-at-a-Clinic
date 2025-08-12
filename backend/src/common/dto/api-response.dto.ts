export class ApiResponseDto<T> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly message?: string,
    public readonly errors?: string[] | Record<string, string[]>,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>(true, data, message);
  }

  static error<T = never>(
    message: string,
    errors?: string[] | Record<string, string[]>,
  ): ApiResponseDto<T> {
    return new ApiResponseDto<T>(false, undefined, message, errors);
  }
}

export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  constructor(
    data: T[],
    public readonly meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string,
  ) {
    super(true, data, message);
  }

  // Backward compatibility accessor if older code expects `.pagination`
  get pagination() {
    return this.meta;
  }
}
