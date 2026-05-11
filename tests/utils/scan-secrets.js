#!/usr/bin/env node
/**
 * scan-secrets.js
 * Scans committed source files (tests/, .github/) for hardcoded PII or credentials.
 * Run via: npm run scan:secrets
 * Exits with code 1 if violations are found (blocks commit when used as pre-commit hook).
 */

const fs = require('fs');
const path = require('path');

// ── Patterns that should never appear in source code ──────────────────────────
const FORBIDDEN_PATTERNS = [
  // Real email addresses (not placeholders)
  { label: 'hardcoded email', re: /[a-zA-Z0-9._%+-]+@(?!example\.com|yourdomain\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?=['"`\s])/g },
  // UAE mobile numbers (05x-xxxxxxx style)
  { label: 'UAE mobile number', re: /\b05\d{8}\b/g },
  // UAE Emirates ID (784-xxxx-xxxxxxxx-x or 784xxxxxxxxxxxxxxx)
  { label: 'Emirates ID', re: /\b784[-\s]?\d{4}[-\s]?\d{7,8}[-\s]?\d\b/g },
  // Passwords in plain text (common patterns)
  { label: 'potential password', re: /(?:password|passwd|secret|pwd)\s*[:=]\s*["'][^"']{3,}["']/gi },
  // DB connection strings
  { label: 'DB connect string', re: /\b\w[\w.-]+:\d{4}\/\w+\b/g },
  // Allure/test result UUIDs aren't secrets, but real credential tokens (long hex strings)
  // Skip — too noisy
];

// ── Files / directories to scan ───────────────────────────────────────────────
const SCAN_ROOTS = ['tests', '.github'];

// ── Extensions to include ─────────────────────────────────────────────────────
const INCLUDE_EXTS = new Set(['.ts', '.js', '.json', '.feature', '.md', '.yml', '.yaml']);

// ── Paths/files to always skip ────────────────────────────────────────────────
const SKIP_PATHS = [
  'tests/utils/scan-secrets.js',  // this file
  'node_modules',
  '.env',
];

let violations = 0;

function shouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return SKIP_PATHS.some(s => normalized.includes(s));
}

function scanFile(filePath) {
  if (shouldSkip(filePath)) return;
  const ext = path.extname(filePath).toLowerCase();
  if (!INCLUDE_EXTS.has(ext)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const { label, re } of FORBIDDEN_PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(content)) !== null) {
      // Find line number
      const before = content.slice(0, match.index);
      const lineNum = before.split('\n').length;
      const lineText = lines[lineNum - 1]?.trim() ?? '';

      const relative = filePath.replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/') + '/', '');
      console.error(`[VIOLATION] ${label} found in ${relative}:${lineNum}`);
      console.error(`  > ${lineText}`);
      violations++;
    }
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else {
      scanFile(full);
    }
  }
}

console.log('🔍 Scanning for hardcoded secrets and PII...\n');

for (const root of SCAN_ROOTS) {
  walkDir(path.resolve(root));
}

if (violations === 0) {
  console.log('✅ No secrets or PII found. Safe to commit.');
  process.exit(0);
} else {
  console.error(`\n❌ ${violations} violation(s) found. Commit blocked.`);
  console.error('   Fix the issues above or move values to .env and use envOrThrow() / envFromAliases().');
  process.exit(1);
}
