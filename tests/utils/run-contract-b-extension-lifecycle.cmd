@echo off
setlocal

echo [CLEAN] Removing old lifecycle report artifacts
if exist allure-results rmdir /s /q allure-results
if exist reports\cucumber_contract_b_extension_lifecycle.json del /q reports\cucumber_contract_b_extension_lifecycle.json
if exist reports\cucumber_contract_b_extension_lifecycle.html del /q reports\cucumber_contract_b_extension_lifecycle.html

echo [RUN] Contract B extension lifecycle in one go (ordered + fail-fast)

call tests\utils\run-cucumber-task.cmd cucumber-js --order defined --fail-fast tests/features/03_ContractB/01_create_contract_b.feature tests/features/03_ContractB/02_approve_contract_b.feature tests/features/03_ContractB/05_extend_contract_b.feature tests/features/03_ContractB/06_approve_extension_contract_b.feature --tags "@createContractB or @approveContractB or @extendContractB or @approveExtensionContractB" --require-module ts-node/register --require tests/steps/**/*.ts --require tests/support/world.ts --require tests/support/hooks.ts --format progress --format json:reports/cucumber_contract_b_extension_lifecycle.json --format html:reports/cucumber_contract_b_extension_lifecycle.html --format allure-cucumberjs/reporter

if errorlevel 1 (
  echo [STOP] Contract B extension lifecycle failed.
  exit /b %errorlevel%
)

echo [DONE] Contract B extension lifecycle passed.
exit /b 0
