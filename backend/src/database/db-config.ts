/**
 * Centralized database name resolution to keep runtime, CLI, and seed aligned.
 * Rules:
 *  - NODE_ENV === 'test' -> clinic_test (isolated, may be dropped between runs)
 *  - Else -> DB_NAME env var or default 'front_desk_system'
 */
export function resolveDatabaseName(env: NodeJS.ProcessEnv): string {
  if (env.NODE_ENV === "test") return "clinic_test";
  return env.DB_NAME || "front_desk_system";
}

export interface ResolvedDbConfigLog {
  nodeEnv: string | undefined;
  dbHost: string | undefined;
  dbName: string;
  dbUser: string | undefined;
  allowDbReset: boolean;
  ignoreSeedLock: boolean;
  hasSeedLock: boolean;
}

export function buildRuntimeDbLog(): ResolvedDbConfigLog {
  // Use require to avoid adding fs/path types overhead in consumers
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("fs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require("path");
  return {
    nodeEnv: process.env.NODE_ENV,
    dbHost: process.env.DB_HOST,
    dbName: resolveDatabaseName(process.env),
    dbUser: process.env.DB_USERNAME,
    allowDbReset: process.env.ALLOW_DB_RESET === "true",
    ignoreSeedLock: process.env.IGNORE_SEED_LOCK === "true",
    hasSeedLock: fs.existsSync(path.resolve(process.cwd(), "SEED_LOCK")),
  };
}
