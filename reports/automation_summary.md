# DubaiBrokers Automation – Coverage Report

## Summary
This report summarizes the automated Contract A coverage implemented in the Playwright + Cucumber framework.

## Implemented Coverage
### Contract A – Core Lifecycle
- **Create Contract A** (unit property, single owner)
- **Approve Contract** (OTP verification)
- **Edit Contract**
- **Approve Edited Contract**
- **Extend Contract** (4 months from today)
- **Approve Extension**
- **Cancel Contract**
- **Approve Cancellation** (no terms checkbox)

### Database Preparation
- **Oracle DB reset step** to update contract status (Approved → Cancelled) before creating a new contract.

### Download Contract (Active)
- Search active contract using saved contract number
- Open contract details
- Read contract expiry date, remove slashes, and store as PDF password
- Click **Download Contract** in popup
- (Password entry steps available but currently excluded as requested)

## Key Behavior Updates
- **Cancellation approval** uses dedicated flow (no checkbox), with correct success message detection.
- **Download flow** uses popup-specific locators and robust waits.
- Added pause-on-failure at key steps for debugging.

## Reporting
- **Cucumber JSON**: reports/cucumber_report.json
- **Cucumber HTML**: reports/cucumber_report.html

## Current Run Set
- Configurable in cucumber.js
- Latest configuration: download-only scenario

## Notes
- Contract number is persisted in **contract-data.json** and reused across scenarios.
- Download popup is detected via **#download_pop** container and **Download Contract** button.
