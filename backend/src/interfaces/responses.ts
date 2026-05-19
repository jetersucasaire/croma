export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  mensaje?: string;
  meta?: ResponseMeta;
  error?: string;
  code?: string;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  fields?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: ResponseMeta;
}

export function success<T>(data: T, meta?: ResponseMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

export function paginated<T>(
  data: T,
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function error(
  mensaje: string,
  code?: string,
  statusCode: number = 400
): ApiResponse {
  return {
    success: false,
    mensaje,
    code,
  };
}