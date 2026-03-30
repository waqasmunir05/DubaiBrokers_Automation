import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PROJECT ROOT
const projectRoot = path.resolve(__dirname, "../..");

console.log("🟦 Rejection Suite Config - __dirname:", __dirname);
console.log("🟦 Rejection Suite Config - projectRoot:", projectRoot);

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

    // === Path for features - REJECTION WORKFLOWS ONLY ===
    // These scenarios test decline/rejection during approval workflows
    paths: [
      'tests/features/01_Login/02_username.feature',
      'tests/features/02_ContractA/11_reject_contract.feature',
      'tests/features/02_ContractA/12_reject_edit_contract.feature',
      'tests/features/02_ContractA/13_reject_extend_contract.feature',
      'tests/features/02_ContractA/14_reject_cancel_contract.feature'
    ],

    format: [
      "progress"
    ],

    publishQuiet: true,
  },
};
