const reporter = require("cucumber-html-reporter");

const options = {
  theme: "bootstrap",   // themes: bootstrap, simple, foundation, hierarchy
  jsonFile: "reports/cucumber_report.json",
  output: "reports/cucumber_report.html",
  reportSuiteAsScenarios: true,
  launchReport: false,
  metadata: {
    "App": "Dubai Brokers Automation",
    "Platform": "Windows 10",
    "Parallel": "4",
    "Executed": "Local"
  }
};

reporter.generate(options);

console.log("🚀 Cucumber HTML report generated at: reports/cucumber_report.html");
