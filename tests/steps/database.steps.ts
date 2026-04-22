import { Given, Before, After } from '@cucumber/cucumber';
import { DatabaseHelper } from '../utils/dbHelper';

/**
 * Database-related Cucumber step definitions
 */

/**
 * Reset contract status before creating new contract
 * Cancels approved contract (status 2→3) to make certificate available for new contract
 */
Given('I reset contract status for certificate {string} year {string}', async function (
  certificateNumber: string,
  certificateYear: string
) {
  await DatabaseHelper.resetContractStatus(certificateNumber, certificateYear, 3);
});

Given('I reset Contract F status for certificate {string} year {string}', async function (
  certificateNumber: string,
  certificateYear: string
) {
  await DatabaseHelper.resetContractFStatus(certificateNumber, certificateYear, 3, 3);
});

/**
 * Execute custom SQL query
 * Usage: Given I execute SQL "UPDATE table SET column = value WHERE id = 1"
 */
Given('I execute SQL {string}', async function (sql: string) {
  await DatabaseHelper.executeQuery(sql, [], true);
});

/**
 * Hook: Close database connection after all scenarios
 */
After({ tags: '@database or @contractA' }, async function () {
  // Close connection after scenarios using database
  await DatabaseHelper.close();
});
