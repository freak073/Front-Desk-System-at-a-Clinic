import * as mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionLimit?: number;
}

export class MysqlDriver {
  private pool: mysql.Pool | undefined;

  constructor(private config: DatabaseConfig) {}

  async createPool(): Promise<mysql.Pool> {
    if (this.pool) {
      return this.pool;
    }

    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      connectionLimit: this.config.connectionLimit || 10,
    });

    return this.pool;
  }

  async getConnection(): Promise<mysql.PoolConnection> {
    if (!this.pool) {
      await this.createPool();
    }
    return this.pool!.getConnection();
  }

  async query(sql: string, values?: any[]): Promise<any> {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.execute(sql, values);
      return results;
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = undefined;
    }
  }

  isConnected(): boolean {
    return this.pool !== undefined;
  }
}