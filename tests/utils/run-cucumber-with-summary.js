const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { summarizeCucumberJson, reportPath } = require('./post-summary');

const args = process.argv.slice(2);
const cucumberBin = path.resolve(process.cwd(), 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js');

const hasProgressFormat = args.some((arg, index) => {
  return arg === '--format' && args[index + 1] === 'progress';
});

const formatArgs = hasProgressFormat
  ? []
  : ['--format', 'progress'];

const cucumberArgs = [
  ...args,
  ...formatArgs,
  '--format',
  'json:reports/cucumber_report.json'
];

if (fs.existsSync(reportPath)) {
  fs.unlinkSync(reportPath);
}

console.log(`▶ Running: ${process.execPath} ${cucumberBin} ${cucumberArgs.join(' ')}`);

const runResult = spawnSync(process.execPath, [cucumberBin, ...cucumberArgs], {
  stdio: 'inherit',
  shell: false
});

if (runResult.error) {
  const message = runResult.error instanceof Error ? runResult.error.message : String(runResult.error);
  console.log(`⚠️ Cucumber process error: ${message}`);
}

try {
  if (fs.existsSync(reportPath)) {
    summarizeCucumberJson(reportPath);
  } else {
    console.log('⚠️ No fresh cucumber JSON report was generated in this run.');
    console.log(`Report expected at: ${reportPath}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`⚠️ Post-summary error: ${message}`);
}

if (typeof runResult.status === 'number') {
  process.exit(runResult.status);
}

process.exit(1);
