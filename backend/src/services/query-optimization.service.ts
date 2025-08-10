import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  PaginationParams,
  PaginatedResponse,
  paginateAndSort,
  paginateQueryBuilder,
  selectOptimizedFields,
  createOptimizedQueryBuilder,
} from '../utils/query-optimization';

@Injectable()
export class QueryOptimizationService {
  async getPaginatedData<T>(
    repository: Repository<T>,
    paginationParams: PaginationParams,
    where?: any,
    relations?: string[],
    select?: (keyof T)[]
  ): Promise<PaginatedResponse<T>> {
    return paginateAndSort(repository, { paginationParams, where, relations, select });
  }

  async getPaginatedFromQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    return paginateQueryBuilder(queryBuilder, paginationParams);
  }

  async getSelectedFields<T>(
    repository: Repository<T>,
    fields: (keyof T)[],
    where?: any
  ): Promise<Partial<T>[]> {
    return selectOptimizedFields(repository, fields, where);
  }

  createOptimizedQB<T>(
    repository: Repository<T>,
    alias: string,
    relations: Array<{ property: string; alias: string }>
  ): SelectQueryBuilder<T> {
    return createOptimizedQueryBuilder(repository, alias, relations);
  }

  /**
   * Example method fixing SonarLint `.sort()` issues
   */
  sortStringsAlphabetically(strings: string[]): string[] {
    const copy = [...strings]; // avoid mutating original array
    copy.sort((a, b) => a.localeCompare(b));
    return copy;
  }
}
