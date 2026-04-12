import { IPaginationMeta, IPaginatedResponse } from '../types/pagination.types';

export class PaginationHelper {
  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static formatResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): IPaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit) || 0;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }
}
