module.exports = {
  explicitPaths: {
    publishQuiet: true,
    paths: []
  },
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
  loginOnly: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_login_only.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/01_Login/01_emirates_id.feature",
      "tests/features/01_Login/02_username.feature",
      "tests/features/01_Login/03_mobile.feature"
    ]
  },
  login_username_only: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_login_username_only.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/01_Login/02_username.feature"
    ]
  },
  contractA_core: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    tags: "not @negative",
    format: [
      "progress",
      "json:reports/cucumber_report.json",
      "html:reports/cucumber_report.html",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/02_ContractA/01_create_contract.feature",
      "tests/features/02_ContractA/02_approve_contract.feature",
      "tests/features/02_ContractA/03_edit_contract.feature",
      "tests/features/02_ContractA/05_extend_contract.feature",
      "tests/features/02_ContractA/07_cancel_contract.feature"
    ]
  },
  contractA_unit_create_only: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    tags: "not @negative",
    format: [
      "progress",
      "json:reports/cucumber_contract_a_unit_create_only.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/02_ContractA/01_create_contract.feature"
    ]
  },
  contractA_unit_lifecycle: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    tags: "not @negative",
    format: [
      "progress",
      "json:reports/cucumber_contract_a_unit_lifecycle.json",
      "html:reports/cucumber_contract_a_unit_lifecycle.html",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/02_ContractA/01_create_contract.feature",
      "tests/features/02_ContractA/02_approve_contract.feature",
      "tests/features/02_ContractA/03_edit_contract.feature",
      "tests/features/02_ContractA/04_approve_edited_contract.feature",
      "tests/features/02_ContractA/05_extend_contract.feature",
      "tests/features/02_ContractA/06_approve_extension.feature",
      "tests/features/02_ContractA/07_cancel_contract.feature",
      "tests/features/02_ContractA/08_approve_cancellation.feature"
    ]
  },
  contractA_land_create_only: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    tags: "not @negative",
    format: [
      "progress",
      "json:reports/cucumber_contract_a_land_create_only.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/02_ContractA/15_create_contract_land.feature"
    ]
  },
  contractA_land_lifecycle: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    tags: "not @negative",
    format: [
      "progress",
      "json:reports/cucumber_contract_a_land_lifecycle.json",
      "html:reports/cucumber_contract_a_land_lifecycle.html",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/02_ContractA/15_create_contract_land.feature",
      "tests/features/02_ContractA/02_approve_contract.feature",
      "tests/features/02_ContractA/03_edit_contract.feature",
      "tests/features/02_ContractA/04_approve_edited_contract.feature",
      "tests/features/02_ContractA/05_extend_contract.feature",
      "tests/features/02_ContractA/06_approve_extension.feature",
      "tests/features/02_ContractA/07_cancel_contract.feature",
      "tests/features/02_ContractA/08_approve_cancellation.feature"
    ]
  },
  contractF_unit_create_only: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_contractf_unit_create_only.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/05_ContractF/11_create_contract_f_unit.feature"
    ]
  },
  contractF_land_create_only: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_contractf_land_create_only.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/05_ContractF/01_create_contract_f.feature"
    ]
  },
  contractF_direct: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_contractf_direct.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/05_ContractF/01_create_contract_f.feature",
      "tests/features/05_ContractF/03_approve_contract_f.feature"
    ]
  },
  contractF_unit_direct: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_contractf_unit_direct.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/05_ContractF/11_create_contract_f_unit.feature",
      "tests/features/05_ContractF/12_approve_contract_f_unit.feature"
    ]
  },
  contractF_land_direct: {
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.ts", "tests/support/world.ts", "tests/support/hooks.ts"],
    format: [
      "progress",
      "json:reports/cucumber_contractf_land_direct.json",
      "allure-cucumberjs/reporter"
    ],
    publishQuiet: true,
    paths: [
      "tests/features/05_ContractF/01_create_contract_f.feature",
      "tests/features/05_ContractF/03_approve_contract_f.feature"
    ]
  }
}
