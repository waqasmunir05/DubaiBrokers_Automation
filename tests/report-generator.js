const fs = require("fs");
const path = require("path");

// === Convert Cucumber JSON to Allure format ===
const CUCUMBER_JSON = "reports/cucumber_report.json";
const ALLURE_RESULTS_DIR = "allure-results";

function convertCucumberToAllure() {
  // Clean up allure-results if it exists as a file (not directory)
  if (fs.existsSync(ALLURE_RESULTS_DIR)) {
    const stat = fs.statSync(ALLURE_RESULTS_DIR);
    if (!stat.isDirectory()) {
      console.log(`🗑️  Removing file: ${ALLURE_RESULTS_DIR}`);
      fs.unlinkSync(ALLURE_RESULTS_DIR);
    } else {
      // Clear existing directory
      console.log(`🗑️  Clearing directory: ${ALLURE_RESULTS_DIR}`);
      const files = fs.readdirSync(ALLURE_RESULTS_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(ALLURE_RESULTS_DIR, file));
      });
    }
  }

  // Create allure-results directory
  console.log(`📁 Creating ${ALLURE_RESULTS_DIR} directory...`);
  fs.mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });

  // Check if cucumber report exists
  if (!fs.existsSync(CUCUMBER_JSON)) {
    console.error(`❌ Cucumber JSON report not found: ${CUCUMBER_JSON}`);
    process.exit(1);
  }

  console.log(`📖 Reading Cucumber JSON from: ${CUCUMBER_JSON}`);
  const cucumberJson = JSON.parse(fs.readFileSync(CUCUMBER_JSON, "utf8"));
  let testIndex = 0;

  cucumberJson.forEach((feature) => {
    if (!feature.elements) return;
    
    feature.elements.forEach((scenario) => {
      testIndex++;
      // determine overall status and capture first failure message/trace if any
      const failedStep = scenario.steps.find(s => s.result && s.result.status === 'failed');
      const status = failedStep ? 'failed' : 'passed';
      let statusDetails = {};
      if (failedStep) {
        const msg = failedStep.result && (failedStep.result.error_message || failedStep.result.message || failedStep.result.exception || '');
        const trace = failedStep.result && failedStep.result.stack || '';
        statusDetails = {
          message: msg || '',
          trace: trace || ''
        };
      }

      // description: include feature and scenario name
      const description = feature.name ? `${feature.name} — ${scenario.name}` : scenario.name;

      // parameters: attempt to extract meaningful key/value pairs from steps
      const parameters = [];
      const seenParams = new Set();
      const paramMappings = [
        { regex: /I enter Emirates ID "([^"]+)"/, name: 'emiratesId' },
        { regex: /I enter OTP "([^"]+)"/, name: 'otp' },
        { regex: /I enter username "([^"]+)"/, name: 'username' },
        { regex: /I enter password "([^"]+)"/, name: 'password' },
        { regex: /I should see logged in username "([^"]+)"/, name: 'expectedUsername' },
        { regex: /I should see logged-in username as \"([^\"]+)\"/, name: 'expectedUsername' },
        { regex: /I should see OTP error message \"([^\"]+)\"/, name: 'expectedError' }
      ];

      scenario.steps.forEach(step => {
        const stepText = (step.name || '').toString();
        paramMappings.forEach(pm => {
          const m = stepText.match(pm.regex);
          if (m && m[1] && !seenParams.has(pm.name)) {
            parameters.push({ name: pm.name, value: m[1] });
            seenParams.add(pm.name);
          }
        });
      });

      // labels: include tags (if present) and map tags to severity
      const labels = [
        { name: 'feature', value: feature.name },
        { name: 'story', value: scenario.name },
        { name: 'thread', value: 'test-thread' }
      ];

      const allTags = [];
      if (Array.isArray(feature.tags)) feature.tags.forEach(t => allTags.push(t.name || t));
      if (Array.isArray(scenario.tags)) scenario.tags.forEach(t => allTags.push(t.name || t));

      // severity mapping via tags
      let severity = 'normal';
      if (allTags.includes('@critical') || allTags.includes('@blocker')) severity = 'critical';
      else if (allTags.includes('@major') || allTags.includes('@smoke')) severity = 'major';
      else if (allTags.includes('@minor')) severity = 'minor';

      labels.push({ name: 'severity', value: severity });
      // add tags as labels
      allTags.forEach(t => labels.push({ name: 'tag', value: t }));

      // Append key parameters to the title so variants are visible in the tests list
      const titleParams = [];
      ['otp', 'emiratesId', 'expectedError', 'username', 'password', 'expectedUsername'].forEach((k) => {
        const p = parameters.find(x => x.name === k);
        if (p && p.value) titleParams.push(`${k}=${p.value}`);
      });
      const titleSuffix = titleParams.length ? ` [${titleParams.join(', ')}]` : '';

      // Build a unique suffix for this variant to keep historyIds distinct
      const paramJoin = titleParams.length ? `${titleParams.join(',')}` : '';
      const paramSlugJoin = titleParams.length ? `${titleParams.join('-')}` : '';

      const allureTest = {
        name: `${scenario.name}${titleSuffix}`,
        description,
        parameters,
        status,
        statusDetails,
        stage: "finished",
        start: Date.now(),
        stop: Date.now() + 1000,
        uuid: `test-${testIndex}`,
        // include parameter values in historyId so Allure treats parameterized examples as distinct tests
        historyId: `${feature.name}-${scenario.name}${paramJoin ? `-${paramJoin}` : ''}`,
        fullName: `${feature.name} - ${scenario.name}${titleSuffix}`,
        labels,
        steps: scenario.steps.map((step) => {
          const stepText = (step.name || '').toString();
          const displayName = stepText ? `${step.keyword}${stepText}` : `${(step.keyword || '').toString().trim()} (hook)`;
          const durationNs = (step.result && step.result.duration) ? step.result.duration : 0;
          const durationMs = Math.max(1, Math.round(durationNs / 1000000)); // convert ns->ms, ensure >=1ms
          const startMs = Date.now();
          return {
            name: displayName,
            status: (step.result && step.result.status) || 'skipped',
            stage: "finished",
            start: startMs,
            stop: startMs + durationMs
          };
        })
      };

      const filename = path.join(ALLURE_RESULTS_DIR, `${testIndex}-result.json`);

      // Attachments: look for `${slug}-attachments.json` from hooks
      const slug = `${feature.name}-${scenario.name}${paramSlugJoin ? `-${paramSlugJoin}` : ''}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0,200);
      const attachmentsMetaFile = path.join(ALLURE_RESULTS_DIR, `${slug}-attachments.json`);
      if (fs.existsSync(attachmentsMetaFile)) {
        try {
          const attachmentsMeta = JSON.parse(fs.readFileSync(attachmentsMetaFile, 'utf8'));
          if (attachmentsMeta && attachmentsMeta.length) {
            allureTest.attachments = attachmentsMeta.map(a => ({ name: a.name, type: a.type, source: a.source }));
          }
        } catch (e) {
          console.error(`❌ Failed to read attachments for ${slug}:`, e.message);
        }
      }

      try {
        fs.writeFileSync(filename, JSON.stringify(allureTest, null, 2));
        console.log(`✅ Written: ${filename}`);
      } catch (writeErr) {
        console.error(`❌ Failed to write ${filename}:`, writeErr.message);
      }
    });
  });

  console.log(`\n✅ Converted ${testIndex} scenarios to Allure format in ${ALLURE_RESULTS_DIR}/`);

  // Write default categories file if not present
  const categoriesFile = path.join(ALLURE_RESULTS_DIR, 'categories.json');
  if (!fs.existsSync(categoriesFile)) {
    const defaultCategories = [
      {
        name: 'Automation failure',
        matchedStatuses: ['failed'],
        // Match common automation errors including Cucumber timeout messages
        messageRegex: 'function timed out|timed out|Timeout|Element not found|NoSuchElement|Error: .*'
      },
      {
        name: 'Product bug',
        matchedStatuses: ['failed'],
        messageRegex: 'AssertionError|Expected.*to equal|Expected.*to contain'
      },
      {
        name: 'External dependency',
        matchedStatuses: ['failed'],
        messageRegex: 'Service unavailable|503|Timeout while connecting|connection refused'
      }
    ];
    fs.writeFileSync(categoriesFile, JSON.stringify(defaultCategories, null, 2));
    console.log(`🟦 Wrote default categories to ${categoriesFile}`);
  }

  // Write environment.properties to allure-results
  const envFile = path.join(ALLURE_RESULTS_DIR, 'environment.properties');
  const envLines = [
    `Browser=Chromium`,
    `Node=${process.version}`,
    `Platform=${process.platform}`,
    `App=https://trakheesiqa.dubailand.gov.ae/DubaiBrokers`
  ];
  fs.writeFileSync(envFile, envLines.join('\n'));
  console.log(`🟦 Wrote environment properties to ${envFile}`);

  // Write executor info
  const executorFile = path.join(ALLURE_RESULTS_DIR, 'executor.json');
  const executor = {
    name: 'local',
    type: 'local',
    url: '',
    reportName: 'DubaiBrokers Automation'
  };
  fs.writeFileSync(executorFile, JSON.stringify(executor, null, 2));
  console.log(`🟦 Wrote executor info to ${executorFile}`);
}


try {
  convertCucumberToAllure();
} catch (err) {
  console.error("❌ Allure conversion failed:", err.message);
  process.exit(1);
}
