# Database Setup Guide

## Overview
This automation framework includes database integration to reset contract statuses before test execution.

## Database Connection Details
- **Host:** eres-stg-scan.eres.ae
- **Port:** 1521
- **Service Name:** STGRAC
- **Schema:** ERES_USC_N
- **Password:** eres_usc_n_stgrac

## How It Works

### 1. Database Helper
Location: [tests/utils/dbHelper.ts](tests/utils/dbHelper.ts)

The `DatabaseHelper` class provides methods to:
- Connect to Oracle database
- Execute SQL queries
- Reset contract status (changes status from 2 to 3)
- Close database connections

### 2. Step Definitions
Location: [tests/steps/database.steps.ts](tests/steps/database.steps.ts)

Available steps:
```gherkin
Given I reset contract status for certificate "18327" year "2019"
Given I execute SQL "UPDATE table SET column = value WHERE id = 1"
```

### 3. Feature File Integration
The create contract feature now includes database reset in the Background:

```gherkin
@contractA @database
Feature: Contract A - Create New Contract on Unit Property

Background:
  # Reset contract status in database before creating new contract
  Given I reset contract status for certificate "18327" year "2019"
  # Login once before running Contract A tests
  Given I open the DLD login page
  ...
```

## SQL Execution Details

The reset contract step executes this SQL:
```sql
UPDATE ERES_USC_N.Contract
SET CONTRACT_STATUS_ID = 3
WHERE Certificate_number = :certNum
  AND Certificate_year = :certYear
  AND property_type_id = :propType
  AND CONTRACT_STATUS_ID = 2
```

**Status Codes:**
- `2` = Approved (active contract)
- `3` = Cancelled (frees up certificate for new contract creation)

## Environment Variables (Optional)

You can override database credentials using environment variables:

Create a `.env` file in the project root:
```env
DB_USER=ERES_USC_N
DB_PASSWORD=eres_usc_n_stgrac
DB_CONNECT_STRING=eres-stg-scan.eres.ae:1521/STGRAC
```

## Prerequisites

### Oracle Instant Client (Required for Windows)

1. **Download Oracle Instant Client:**
   - Visit: https://www.oracle.com/database/technologies/instant-client/downloads.html
   - Download "Basic Package" for Windows x64
   - Version: 19.x or 21.x recommended

2. **Extract and Configure:**
   ```powershell
   # Extract to C:\oracle\instantclient_19_x
   # Add to PATH environment variable:
   $env:PATH += ";C:\oracle\instantclient_19_x"
   
   # Or set permanently:
   [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\oracle\instantclient_19_x", "Machine")
   ```

3. **Verify Installation:**
   ```powershell
   # Check if DLLs are accessible
   Test-Path "C:\oracle\instantclient_19_x\oci.dll"
   ```

## Troubleshooting

### Error: "DPI-1047: Cannot locate a 64-bit Oracle Client library"
**Solution:** Install Oracle Instant Client and add to PATH (see above)

### Error: "ORA-12154: TNS:could not resolve the connect identifier"
**Solution:** Check connectString format in dbHelper.ts:
```typescript
connectString: 'eres-stg-scan.eres.ae:1521/STGRAC'
```

### Error: "ORA-01017: invalid username/password"
**Solution:** Verify credentials in dbHelper.ts match database details

### Error: "Connection timeout"
**Solution:** 
- Check network connectivity to eres-stg-scan.eres.ae
- Verify firewall allows outbound connections on port 1521
- Test connection: `telnet eres-stg-scan.eres.ae 1521`

## Testing Database Connection

Run a simple test to verify database connectivity:

```typescript
// tests/utils/dbTest.ts
import { DatabaseHelper } from './dbHelper';

async function testConnection() {
  try {
    await DatabaseHelper.connect();
    console.log('✅ Database connection successful');
    await DatabaseHelper.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
```

Run with: `npx ts-node tests/utils/dbTest.ts`

## Usage in Tests

The database reset happens automatically when you run:
```bash
npm test
```

The sequence is:
1. **Background step executes:** Database cancels approved contract on certificate 18327/2019 (status 2→3)
2. **Test proceeds:** Create new contract on certificate 18327/2019
3. **After test:** Database connection closes automatically

## Notes

- Database connection is reused across steps in the same scenario
- Connection automatically closes after scenarios tagged with `@database` or `@contractA`
- SQL uses bind parameters to prevent SQL injection
- Auto-commit is enabled by default (changes commit immediately)
