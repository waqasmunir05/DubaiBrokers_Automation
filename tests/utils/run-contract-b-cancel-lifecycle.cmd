@echo off
setlocal

echo [CLEAN] Removing old Contract B cancel lifecycle report artifacts
if exist allure-results rmdir /s /q allure-results
if exist reports\cucumber_contract_b_cancel_lifecycle.json del /q reports\cucumber_contract_b_cancel_lifecycle.json
if exist reports\cucumber_contract_b_cancel_lifecycle.html del /q reports\cucumber_contract_b_cancel_lifecycle.html

echo [RUN] Contract B create -> approve -> cancel request -> approve cancellation flow (ordered + fail-fast)

call tests\utils\run-cucumber-task.cmd cucumber-js --order defined --fail-fast tests/features/01_Login/02_username.feature tests/features/03_ContractB/01_create_contract_b.feature tests/features/03_ContractB/02_approve_contract_b.feature tests/features/03_ContractB/07_cancel_contract_b.feature tests/features/03_ContractB/08_approve_cancellation_contract_b.feature --tags "@createContractB or @approveContractB or @cancelContractB or @approveCancelContractB" --require-module ts-node/register --require tests/steps/**/*.ts --require tests/support/world.ts --require tests/support/hooks.ts --format progress --format json:reports/cucumber_contract_b_cancel_lifecycle.json --format html:reports/cucumber_contract_b_cancel_lifecycle.html --format allure-cucumberjs/reporter

if errorlevel 1 (
  echo [STOP] Contract B cancel lifecycle failed.
  exit /b %errorlevel%
)

echo [DONE] Contract B cancel lifecycle passed.
exit /b 0
