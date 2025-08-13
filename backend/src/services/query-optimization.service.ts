import { Injectable, Logger } from "@nestjs/common";
import { Repository, SelectQueryBuilder, EntityManager } from "typeorm";
import {
  PaginationParams,
  PaginatedResponse,
  paginateAndSort,
  paginateQueryBuilder,
  selectOptimizedFields,
  createOptimizedQueryBuilder,
} from "../utils/query-optimization";

@Injectable()
export class QueryOptimizationService {
  private readonly logger = new Logger(QueryOptimizationService.name);

  async getPaginatedData<T>(
    repository: Repository<T>,
    paginationParams: PaginationParams,
    where?: any,
    relations?: string[],
    select?: (keyof T)[],
  ): Promise<PaginatedResponse<T>> {
    return paginateAndSort(repository, {
      paginationParams,
      where,
      relations,
      select,
    });
  }

  async getPaginatedFromQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<T>> {
    return paginateQueryBuilder(queryBuilder, paginationParams);
  }

  async getSelectedFields<T>(
    repository: Repository<T>,
    fields: (keyof T)[],
    where?: any,
  ): Promise<Partial<T>[]> {
    return selectOptimizedFields(repository, fields, where);
  }

  createOptimizedQB<T>(
    repository: Repository<T>,
    alias: string,
    relations: Array<{ property: string; alias: string }>,
  ): SelectQueryBuilder<T> {
    return createOptimizedQueryBuilder(repository, alias, relations);
  }

  /**
   * Create optimized query with proper indexing hints
   */
  createIndexOptimizedQuery<T>(
    repository: Repository<T>,
    alias: string,
    indexHints?: string[]
  ): SelectQueryBuilder<T> {
    const qb = repository.createQueryBuilder(alias);
    
    if (indexHints && indexHints.length > 0) {
      // Add index hints for MySQL optimization
      const tableName = repository.metadata.tableName;
      const hintsString = indexHints.map(hint => `USE INDEX (${hint})`).join(' ');
      qb.from(`${tableName} ${hintsString}`, alias);
    }
    
    return qb;
  }

  /**
   * Batch process large datasets to avoid memory issues
   */
  async processBatchData<T, R>(
    repository: Repository<T>,
    batchSize: number = 1000,
    processor: (batch: T[]) => Promise<R[]>,
    where?: any
  ): Promise<R[]> {
    const results: R[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await repository.find({
        where,
        take: batchSize,
        skip: offset,
        order: { id: 'ASC' } as any,
      });

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      const processedBatch = await processor(batch);
      results.push(...processedBatch);

      offset += batchSize;
      hasMore = batch.length === batchSize;

      // Log progress for large operations
      if (offset % (batchSize * 10) === 0) {
        this.logger.log(`Processed ${offset} records`);
      }
    }

    return results;
  }

  /**
   * Execute raw SQL with proper parameter binding for complex queries
   */
  async executeOptimizedRawQuery<T = any>(
    entityManager: EntityManager,
    query: string,
    parameters: any[] = []
  ): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const result = await entityManager.query(query, parameters);
      const executionTime = Date.now() - startTime;
      
      if (executionTime > 1000) {
        this.logger.warn(`Slow query detected: ${executionTime}ms - ${query.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create materialized view-like cached query results
   */
  async createCachedAggregation<T>(
    repository: Repository<T>,
    cacheKey: string,
    aggregationQuery: () => Promise<any>,
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<any> {
    // This would integrate with the cache service
    // For now, just execute the query
    return aggregationQuery();
  }

  /**
   * Optimize joins with proper loading strategies
   */
  createOptimizedJoinQuery<T>(
    repository: Repository<T>,
    alias: string,
    joins: Array<{
      property: string;
      alias: string;
      condition?: string;
      type?: 'INNER' | 'LEFT' | 'RIGHT';
    }>
  ): SelectQueryBuilder<T> {
    const qb = repository.createQueryBuilder(alias);
    
    joins.forEach(join => {
      const joinMethod = join.type === 'INNER' ? 'innerJoin' : 'leftJoin';
      if (join.condition) {
        qb[joinMethod](`${alias}.${join.property}`, join.alias, join.condition);
      } else {
        qb[joinMethod](`${alias}.${join.property}`, join.alias);
      }
    });
    
    return qb;
  }

  /**
   * Example method fixing SonarLint `.sort()` issues
   */
  sortStringsAlphabetically(strings: string[]): string[] {
    const copy = [...strings]; // avoid mutating original array
    copy.sort((a, b) => a.localeCompare(b));
    return copy;
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQueryPerformance<T>(
    queryBuilder: SelectQueryBuilder<T>
  ): Promise<{
    query: string;
    parameters: any[];
    executionTime: number;
    suggestions: string[];
  }> {
    const startTime = Date.now();
    const query = queryBuilder.getQuery();
    const parameters = queryBuilder.getParameters();
    
    // Execute EXPLAIN for MySQL
    const explainQuery = `EXPLAIN ${query}`;
    const explainResult = await queryBuilder.connection.query(explainQuery, Object.values(parameters));
    
    const executionTime = Date.now() - startTime;
    const suggestions: string[] = [];
    
    // Analyze explain results and provide suggestions
    explainResult.forEach((row: any) => {
      if (row.type === 'ALL') {
        suggestions.push(`Full table scan detected on ${row.table}. Consider adding an index.`);
      }
      if (row.Extra && row.Extra.includes('Using filesort')) {
        suggestions.push(`Filesort detected. Consider adding an index for ORDER BY clause.`);
      }
      if (row.Extra && row.Extra.includes('Using temporary')) {
        suggestions.push(`Temporary table created. Consider optimizing GROUP BY or DISTINCT clauses.`);
      }
    });
    
    return {
      query,
      parameters: Object.values(parameters),
      executionTime,
      suggestions,
    };
  }
}
