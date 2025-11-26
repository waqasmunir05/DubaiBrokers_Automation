// tests/support/cucumber.mjs
export default {
  default: {
    // Path to feature files
    paths: ['tests/features/**/*.feature'],

    // Step definitions, hooks, and world
    require: [
      'tests/steps/**/*.ts',
      'tests/support/hooks.ts',
      'tests/support/world.ts'
    ],

    // Formatters
    format: [
      'json:reports/cucumber_report.json',
      'html:reports/cucumber_report.html'
    ]
  }
};
