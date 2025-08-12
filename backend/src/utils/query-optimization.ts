/**
 * Utility functions for optimizing database queries
 */
import {
  Repository,
  SelectQueryBuilder,
  FindManyOptions,
  FindOptionsWhere,
} from "typeorm";

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/**
 * Interface for the paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Apply pagination, sorting, and filtering to a TypeORM repository query
 */
export async function paginateAndSort<T>(
  repository: Repository<T>,
  options: {
    paginationParams: PaginationParams;
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    relations?: string[];
    select?: (keyof T)[];
  },
): Promise<PaginatedResponse<T>> {
  const { paginationParams, where, relations, select } = options;

  const page = paginationParams.page || 1;
  const limit = paginationParams.limit || 10;
  const skip = (page - 1) * limit;

  const findOptions: FindManyOptions<T> = {
    where,
    relations,
    skip,
    take: limit,
  };

  if (select) {
    findOptions.select = select as any;
  }

  if (paginationParams.sortBy) {
    findOptions.order = {
      [paginationParams.sortBy]: paginationParams.sortOrder || "ASC",
    } as any;
  }

  const [data, total] = await repository.findAndCount(findOptions);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Apply pagination, sorting, and filtering to a custom TypeORM query builder
 */
export async function paginateQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  paginationParams: PaginationParams,
): Promise<PaginatedResponse<T>> {
  const page = paginationParams.page || 1;
  const limit = paginationParams.limit || 10;
  const skip = (page - 1) * limit;

  if (paginationParams.sortBy) {
    queryBuilder.orderBy(
      paginationParams.sortBy,
      paginationParams.sortOrder || "ASC",
    );
  }

  const total = await queryBuilder.clone().getCount();
  queryBuilder.skip(skip).take(limit);

  const data = await queryBuilder.getMany();
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Optimize a query by selecting only necessary fields
 */
export async function selectOptimizedFields<T>(
  repository: Repository<T>,
  fields: (keyof T)[],
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
): Promise<Partial<T>[]> {
  return repository.find({
    select: fields as any,
    where,
  });
}

/**
 * Create an optimized query builder with eager loading for related entities
 */
export function createOptimizedQueryBuilder<T>(
  repository: Repository<T>,
  alias: string,
  relations: Array<{ property: string; alias: string }> = [],
): SelectQueryBuilder<T> {
  const queryBuilder = repository.createQueryBuilder(alias);

  relations.forEach((relation) => {
    queryBuilder.leftJoinAndSelect(
      `${alias}.${relation.property}`,
      relation.alias,
    );
  });

  return queryBuilder;
}
