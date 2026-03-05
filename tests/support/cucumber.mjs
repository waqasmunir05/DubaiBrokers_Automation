import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PROJECT ROOT
const projectRoot = path.resolve(__dirname, "../..");

console.log("🟦 __dirname:", __dirname);
console.log("🟦 projectRoot:", projectRoot);

// === DIAGNOSTICS: list feature and step files ===
import fs from 'fs';
function listFiles(dir, ext) {
  const res = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (p.endsWith(ext)) res.push(p);
    }
  }
  walk(dir);
  return res;
}
try {
  const featuresDir = path.join(projectRoot, 'tests', 'features');
  const stepsDir = path.join(projectRoot, 'tests', 'steps');
  const featuresFound = fs.existsSync(featuresDir) ? listFiles(featuresDir, '.feature') : [];
  const stepsFound = fs.existsSync(stepsDir) ? listFiles(stepsDir, '.ts') : [];
  console.log('🟦 featuresFound:', featuresFound);
  console.log('🟦 stepsFound:', stepsFound);
} catch (e) {
  console.log('🟦 diagnostic error:', e && e.message);
}

export default {
  default: {
    // === Load TS before anything ===
    requireModule: ["ts-node/register"],

    // === IMPORTANT: load step definitions ===
    // Use relative globs (avoids Windows \ vs / path separator issues)
    require: [
      'tests/steps/**/*.ts',
      'tests/support/world.ts',
      'tests/support/hooks.ts',
    ],

    // === Path for features - ORDERED EXECUTION ===
    // Core workflows: Create → Approve → Edit → Download | Extend | Cancel
    paths: [
      'tests/features/01_Login/02_username.feature',
      // === Main Flow: Create → Approve → Edit → Extend → Cancel → Download ===
      'tests/features/02_ContractA/01_create_contract.feature',
      'tests/features/02_ContractA/02_approve_contract.feature',
      'tests/features/02_ContractA/03_edit_contract.feature',
      'tests/features/02_ContractA/04_approve_edited_contract.feature',
      'tests/features/02_ContractA/05_extend_contract.feature',
      'tests/features/02_ContractA/06_approve_extension.feature',
      'tests/features/02_ContractA/07_cancel_contract.feature',
      'tests/features/02_ContractA/08_approve_cancellation.feature',
      'tests/features/02_ContractA/09_download_contract.feature',
      // === Negative Cases ===
      'tests/features/02_ContractA/10_negative_create_contract.feature'
      // TODO: Rejection workflows in separate suite - requires different approval state setup
    ],

    // === DIAGNOSTIC: echo the globs ===
    _diagnostics: {
      requireGlobs: ['tests/steps/**/*.ts', 'tests/support/hooks.ts'],
      featureGlobs: ['tests/features/**/*.feature']
    },

    format: ["progress"],

    publishQuiet: true,
  },
};
