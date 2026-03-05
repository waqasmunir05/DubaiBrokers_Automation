module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_report.json",
      "html:reports/cucumber_report.html",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/01_Login/02_username.feature",
      "tests/features/02_ContractA/01_create_contract.feature",
      "tests/features/02_ContractA/02_approve_contract.feature",
      "tests/features/02_ContractA/03_edit_contract.feature",
      "tests/features/02_ContractA/04_approve_edited_contract.feature",
      "tests/features/02_ContractA/05_extend_contract.feature",
      "tests/features/02_ContractA/06_approve_extension.feature",
      "tests/features/02_ContractA/07_cancel_contract.feature",
      "tests/features/02_ContractA/08_approve_cancellation.feature",
      "tests/features/02_ContractA/09_download_contract.feature",
      "tests/features/02_ContractA/10_negative_create_contract.feature"
    ]
  },
  contractA_core: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_report.json",
      "html:reports/cucumber_report.html",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/01_Login/02_username.feature",
      "tests/features/02_ContractA/01_create_contract.feature",
      "tests/features/02_ContractA/02_approve_contract.feature",
      "tests/features/02_ContractA/03_edit_contract.feature",
      "tests/features/02_ContractA/05_extend_contract.feature",
      "tests/features/02_ContractA/07_cancel_contract.feature"
    ]
  }
}
