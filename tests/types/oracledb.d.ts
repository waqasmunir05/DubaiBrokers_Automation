declare module 'oracledb' {
  export interface ConnectionAttributes {
    user: string;
    password: string;
    connectString: string;
  }

  export interface ExecuteOptions {
    autoCommit?: boolean;
  }

  export interface Result<T = unknown> {
    rows?: T[];
    rowsAffected?: number;
  }

  export interface Connection {
    execute<T = unknown>(
      sql: string,
      bindParams?: unknown[] | Record<string, unknown>,
      options?: ExecuteOptions
    ): Promise<Result<T>>;
    close(): Promise<void>;
  }

  export interface OracleDb {
    getConnection(config: ConnectionAttributes): Promise<Connection>;
  }

  const oracledb: OracleDb;
  export default oracledb;
}