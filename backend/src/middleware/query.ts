import { Request, Response, NextFunction } from 'express';
import { ResponseMeta } from '../interfaces/responses';

declare global {
  namespace Express {
    interface Request {
      queryOptions: {
        page: number;
        limit: number;
        offset: number;
        sort: string;
        order: 'asc' | 'desc';
        search?: string;
        fields?: string[];
      };
    }
  }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_SORTS = ['asc', 'desc'];
const DEFAULT_ORDER = 'desc';

export function queryMiddleware(req: Request, _res: Response, next: NextFunction) {
  const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
  const sort = (req.query.sort as string)?.replace(/[^a-zA-Z0-9_]/g, '') || 'created_at';
  const order = ALLOWED_SORTS.includes(req.query.order as string) 
    ? req.query.order as 'asc' | 'desc' 
    : DEFAULT_ORDER;
  
  const search = req.query.q as string || req.query.search as string;
  
  const fields = req.query.fields 
    ? (req.query.fields as string).split(',').map(f => f.trim()).filter(Boolean)
    : undefined;

  req.queryOptions = {
    page,
    limit,
    offset: (page - 1) * limit,
    sort,
    order,
    search,
    fields,
  };

  next();
}

export function getMeta(total: number, req: Request): ResponseMeta {
  return {
    total,
    page: req.queryOptions.page,
    limit: req.queryOptions.limit,
    totalPages: Math.ceil(total / req.queryOptions.limit),
    sort: req.queryOptions.sort,
    order: req.queryOptions.order,
    fields: req.queryOptions.fields,
  };
}

export function buildSearchCondition(
  columns: string[],
  search: string
): { sql: string; params: any[] } {
  if (!search || columns.length === 0) {
    return { sql: '', params: [] };
  }

  const conditions = columns.map((col) => `${col} LIKE ?`);
  const params = columns.map(() => `%${search}%`);

  return {
    sql: ` AND (${conditions.join(' OR ')})`,
    params,
  };
}

export function buildSortOrder(
  allowedColumns: string[],
  defaultSort: string = 'id',
  sort?: string,
  order?: 'asc' | 'desc'
): string {
  const sortCol = allowedColumns.includes(sort || 'created_at') 
    ? sort || 'id' 
    : defaultSort;
  const sortOrder = ALLOWED_SORTS.includes(order || 'desc') 
    ? order?.toUpperCase() 
    : DEFAULT_ORDER.toUpperCase();
  
  return ` ORDER BY ${sortCol} ${sortOrder}`;
}

export function buildSelectFields(
  allowedFields: string[],
  requestedFields?: string[]
): string {
  if (!requestedFields || requestedFields.length === 0) {
    return '*';
  }
  
  const validFields = requestedFields.filter(f => allowedFields.includes(f));
  
  if (validFields.length === 0) {
    return '*';
  }
  
  return validFields.join(', ');
}