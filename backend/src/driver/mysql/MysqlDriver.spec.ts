import { MysqlDriver, DatabaseConfig } from './MysqlDriver';

describe('MysqlDriver', () => {
  let driver: MysqlDriver;
  let mockConfig: DatabaseConfig;

  beforeEach(() => {
    mockConfig = {
      host: 'localhost',
      port: 3306,
      username: 'test',
      password: 'test',
      database: 'test_db',
      connectionLimit: 5,
    };
    driver = new MysqlDriver(mockConfig);
  });

  afterEach(async () => {
    await driver.close();
  });

  describe('createPool', () => {
    it('should create a mysql pool with correct configuration', () => {
      const pool = driver.createPool();
      expect(pool).toBeDefined();
      expect(driver.isConnected()).toBe(true);
    });

    it('should return the same pool instance on subsequent calls', () => {
      const pool1 = driver.createPool();
      const pool2 = driver.createPool();
      expect(pool1).toBe(pool2);
    });
  });

  describe('close', () => {
    it('should close the pool and reset connection state', async () => {
      driver.createPool();
      expect(driver.isConnected()).toBe(true);
      
      await driver.close();
      expect(driver.isConnected()).toBe(false);
    });

    it('should handle closing when no pool exists', async () => {
      expect(driver.isConnected()).toBe(false);
      await expect(driver.close()).resolves.not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      expect(driver.isConnected()).toBe(false);
    });

    it('should return true after creating pool', () => {
      driver.createPool();
      expect(driver.isConnected()).toBe(true);
    });
  });
});