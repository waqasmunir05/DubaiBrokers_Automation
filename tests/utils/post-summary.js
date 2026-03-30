const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(process.cwd(), 'reports', 'cucumber_report.json');

function summarizeCucumberJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Post-summary skipped: report not found at ${filePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const features = JSON.parse(raw);

  let featureCount = 0;
  let scenarioCount = 0;
  let scenarioPassed = 0;
  let scenarioFailed = 0;
  let stepPassed = 0;
  let stepFailed = 0;
  let stepSkipped = 0;
  let stepPending = 0;
  let stepUndefined = 0;
  let stepAmbiguous = 0;
  const failedScenarios = [];

  for (const feature of features) {
    featureCount += 1;
    const scenarios = feature.elements || [];

    for (const scenario of scenarios) {
      scenarioCount += 1;
      const steps = scenario.steps || [];

      let hasScenarioFailure = false;
      let firstFailureStep = null;
      for (const step of steps) {
        const status = step?.result?.status || 'unknown';
        if (status === 'passed') stepPassed += 1;
        else if (status === 'failed') {
          stepFailed += 1;
          hasScenarioFailure = true;
          if (!firstFailureStep) firstFailureStep = step;
        } else if (status === 'skipped') stepSkipped += 1;
        else if (status === 'pending') stepPending += 1;
        else if (status === 'undefined') {
          stepUndefined += 1;
          hasScenarioFailure = true;
          if (!firstFailureStep) firstFailureStep = step;
        } else if (status === 'ambiguous') {
          stepAmbiguous += 1;
          hasScenarioFailure = true;
          if (!firstFailureStep) firstFailureStep = step;
        }
      }

      if (hasScenarioFailure) {
        scenarioFailed += 1;
        const featureName = feature?.name || 'Unknown Feature';
        const scenarioName = scenario?.name || 'Unknown Scenario';
        const stepName = firstFailureStep?.name || 'Unknown Step';
        const stepStatus = firstFailureStep?.result?.status || 'failed';
        const errorText = firstFailureStep?.result?.error_message || '';
        failedScenarios.push({ featureName, scenarioName, stepName, stepStatus, errorText });
      }
      else scenarioPassed += 1;
    }
  }

  const stepTotal = stepPassed + stepFailed + stepSkipped + stepPending + stepUndefined + stepAmbiguous;

  console.log('\n================ CUCUMBER POST SUMMARY ================');
  console.log(`Features  : ${featureCount}`);
  console.log(`Scenarios : ${scenarioCount} (passed: ${scenarioPassed}, failed: ${scenarioFailed})`);
  console.log(`Steps     : ${stepTotal} (passed: ${stepPassed}, failed: ${stepFailed}, skipped: ${stepSkipped}, pending: ${stepPending}, undefined: ${stepUndefined}, ambiguous: ${stepAmbiguous})`);
  console.log(`Report    : ${filePath}`);
  if (failedScenarios.length > 0) {
    console.log('Failed Cases:');
    failedScenarios.forEach((item, index) => {
      console.log(`${index + 1}. ${item.featureName} -> ${item.scenarioName}`);
      console.log(`   Step   : ${item.stepName} [${item.stepStatus}]`);
      if (item.errorText) {
        const oneLineError = item.errorText.replace(/\s+/g, ' ').trim();
        console.log(`   Error  : ${oneLineError.slice(0, 220)}`);
      }
    });
  }
  console.log('========================================================\n');
}

if (require.main === module) {
  try {
    summarizeCucumberJson(reportPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`⚠️ Post-summary error: ${message}`);
  }
}

module.exports = {
  summarizeCucumberJson,
  reportPath
};
