import oracledb, { Connection, Result } from 'oracledb';

interface DBConfig {
  user: string;
  password: string;
  connectString: string;
}

export class DatabaseHelper {
  private static connection: Connection | null = null;

  /**
   * Initialize database connection
   * Using DLD database credentials
   */
  static async connect(): Promise<Connection> {
    if (this.connection) {
      return this.connection;
    }

    const config: DBConfig = {
      user: process.env.DB_USER || 'ERES_USC_N',
      password: process.env.DB_PASSWORD || 'eres_usc_n_stgrac',
      connectString: process.env.DB_CONNECT_STRING || 'eres-stg-scan.eres.ae:1521/STGRAC'
    };

    try {
      this.connection = await oracledb.getConnection(config);
      console.log('✅ Database connected successfully');
      return this.connection;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Execute SQL query
   * @param sql - SQL query string
   * @param params - Bind parameters (optional)
   * @param autoCommit - Auto commit flag (default: true)
   */
  static async executeQuery(
    sql: string,
    params: any[] = [],
    autoCommit: boolean = true
  ): Promise<Result<any>> {
    const connection = await this.connect();

    try {
      console.log(`🔍 Executing SQL: ${sql}`);
      const result = await connection.execute(sql, params, { autoCommit });
      console.log(`✅ SQL executed successfully. Rows affected: ${result.rowsAffected}`);
      return result;
    } catch (error) {
      console.error('❌ SQL execution failed:', error);
      throw error;
    }
  }

  /**
   * Reset contract status for testing
   * Cancels any active Contract A row for the certificate/year to free it for a new create flow.
   * Property type is intentionally not filtered here because Land and Unit use different IDs
   * and the create flow is keyed by certificate/year dataset.
   */
  static async resetContractStatus(
    certificateNumber: string,
    certificateYear: string,
    _propertyTypeId: number = 3
  ): Promise<void> {
    const sql = `
      UPDATE ERES_USC_N.Contract
      SET CONTRACT_STATUS_ID = 3
      WHERE Certificate_number = :certNum
        AND Certificate_year = :certYear
        AND CONTRACT_TYPE_ID = 1
        AND CONTRACT_STATUS_ID <> 3
    `;

    const params = [certificateNumber, certificateYear];

    try {
      const result = await this.executeQuery(sql, params, true);
      if (result.rowsAffected && result.rowsAffected > 0) {
        console.log(`🔄 Contract A status reset for certificate ${certificateNumber}/${certificateYear}`);
      } else {
        console.log(`⚠️ No active Contract A rows found to reset for ${certificateNumber}/${certificateYear}`);
      }
    } catch (error) {
      console.error(`❌ Failed to reset contract status:`, error);
      throw error;
    }
  }

  /**
   * Reset active Contract F records for testing
   * Cancels non-cancelled Contract F rows to free the certificate for a new Contract F creation
   */
  static async resetContractFStatus(
    certificateNumber: string,
    certificateYear: string,
    _propertyTypeId: number = 3,
    contractTypeId: number = 3
  ): Promise<void> {
    const sql = `
      UPDATE ERES_USC_N.Contract
      SET CONTRACT_STATUS_ID = 3
      WHERE CERTIFICATE_NUMBER = :certNum
        AND CERTIFICATE_YEAR = :certYear
        AND CONTRACT_TYPE_ID = :contractTypeId
        AND CONTRACT_STATUS_ID <> 3
    `;

    const params = [certificateNumber, certificateYear, contractTypeId];

    try {
      const result = await this.executeQuery(sql, params, true);
      if (result.rowsAffected && result.rowsAffected > 0) {
        console.log(`🔄 Contract F status reset for certificate ${certificateNumber}/${certificateYear}`);
      } else {
        console.log(`⚠️ No active Contract F rows found to reset for ${certificateNumber}/${certificateYear}`);
      }
    } catch (error) {
      console.error(`❌ Failed to reset Contract F status:`, error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  static async close(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        console.log('✅ Database connection closed');
      } catch (error) {
        console.error('❌ Error closing database connection:', error);
      }
    }
  }
}
