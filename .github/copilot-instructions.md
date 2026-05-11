# DubaiBrokers Automation - Copilot Instructions

## Project Overview
This is a **Playwright-based BDD test automation framework** for the Dubai Land Department (DLD) DubaiBrokers portal. It uses Cucumber for test specification and Allure for reporting.

**Tech Stack:**
- **Test Framework:** Cucumber.js + Playwright
- **Language:** TypeScript
- **Reporting:** Allure Reports
- **Configuration:** Node.js 18+

## Architecture

### Test Structure
```
tests/
├── features/           # Gherkin feature files (user-readable test specs)
├── steps/             # Step definitions (Given/When/Then implementations)
├── pages/             # Page Object Model (POM) classes for UI interactions
└── support/           # Cucumber hooks, world context, and configuration
```

### Key Components

**World Context** ([tests/support/world.ts](tests/support/world.ts))
- Extends Cucumber's `World` class to provide shared state across steps
- Manages Playwright browser, context, and page instances
- Provides `this.page` access to all step definitions for UI interactions

**Hooks** ([tests/support/hooks.ts](tests/support/hooks.ts))
- `Before()`: Launches Chromium browser in non-headless mode for each scenario
- `After()`: Closes browser after each scenario completes
- Default timeout: 30 seconds for all steps

**Step Definitions** ([tests/steps/login.steps.ts](tests/steps/login.steps.ts))
- Implements BDD steps mapped directly to feature file scenarios
- Uses Playwright's `getByRole()` locators (accessible selectors) as primary strategy
- Always includes explicit waits (10-40 seconds) before interactions

**Page Objects** ([tests/pages/loginPage.ts](tests/pages/loginPage.ts))
- Currently defined but **not yet integrated** into step definitions
- Contains methods like `enterEmiratesID()`, `clickSendOTP()`, `enterOTP()`, etc.
- Target pattern: future refactoring should route steps → page objects → page interactions

## Developer Workflows

### Run Tests
```bash
npm test
# Executes all features in tests/features/*.feature
# Outputs: progress console + JSON report (reports/) + Allure results (allure-results/)
```

**Note on `npm test` implementation:**
- Uses explicit CLI (not `--config`) to ensure Cucumber properly discovers features, steps, and hooks
- Includes `--format allure-cucumberjs:allure-results` to generate test data for Allure reporting
- Windows glob expansion issue required this approach (config file globs were not being resolved by Cucumber)

### Generate & View Reports
```bash
npm run test:allure
# 1. Runs tests
# 2. Generates Allure HTML report (allure-report/)
# 3. Opens report in default browser
```

### Manual Report Generation
```bash
npm run allure:generate
npm run allure:open
```

## Critical Patterns & Conventions

### 1. **Step Implementation Pattern**
- Always use `async function (this: World)` signature for TypeScript context
- Always access `this.page` for Playwright Page instance
- Include explicit waits with `waitFor()` before every interaction:
  ```typescript
  When('I enter Emirates ID {string}', async function (this: World, emiratesId: string) {
    const emiratesInput = this.page.getByRole('textbox', { name: 'Emirates ID Number' });
    await emiratesInput.waitFor({ state: 'visible', timeout: 10000 });
    await emiratesInput.fill(emiratesId);
  });
  ```

### 2. **Timeout Strategy**
- Default: 10 seconds for most interactions
- OTP/Verification steps: 40 seconds (external system dependencies)
- Can override via step options: `When('...', { timeout: 40000 }, async ...)` 

### 3. **Element Locator Priority**
1. `getByRole()` - accessible/semantic selectors (preferred)
2. `getByLabel()`, `getByPlaceholder()` - user-visible attributes
3. CSS selectors (fallback only): `.class-name`, `[data-testid]`

### 4. **Assertion Pattern**
Steps ending with "Then" perform assertions via `waitForSelector()` + text validation:
```typescript
Then('I should see logged in username {string}', async function (this: World, expectedUsername: string) {
  const usernameElement = await this.page.waitForSelector('.user-name', { state: 'visible', timeout: 10000 });
  const actualUsername = (await usernameElement.textContent())?.trim();
  if (actualUsername !== expectedUsername) {
    throw new Error(`Expected "${expectedUsername}", but got "${actualUsername}"`);
  }
});
```

### 5. **Feature File Convention**
- Use `Scenario Outline` with `Examples` tables for data-driven tests
- Parameters in step definitions use `{string}` syntax for quoted arguments
- Example: [tests/features/01_Login/01_emirates_id.feature](tests/features/01_Login/01_emirates_id.feature)

## Important Files

| File | Purpose |
|------|---------|
| [tests/support/cucumber.mjs](tests/support/cucumber.mjs) | Cucumber CLI config (paths, formatters, require modules) |
| [cucumber.js.bak](cucumber.js.bak) | Backup config - shows old path structure |
| [tests/support/world.ts](tests/support/world.ts) | Browser lifecycle & shared context |
| [tests/support/hooks.ts](tests/support/hooks.ts) | Before/After scenario hooks |
| [tsconfig.json](tsconfig.json) | TS compilation: ES2021 target, strict mode |

## Integration Points

- **Target App:** `https://trakheesiqa.dubailand.gov.ae/DubaiBrokers/#/login` (QA environment)
- **Reporting:** Allure reports stored in `allure-results/` and `allure-report/`
- **Artifacts:** Screenshots/videos can be added to Allure via hooks (currently not configured)

## Security Rules (Always Enforced — Never Skip)

These rules apply to **every** file change, new feature, new step definition, or refactor. They are non-negotiable and must be followed without being asked.

### 1. No Hardcoded Credentials or PII in Source Code
The following must **never** appear in any `.ts`, `.feature`, `.js`, `.json`, `.yml`, or `.md` file committed to the repo:
- Real email addresses (e.g. `waqas.munir@eres.ae`)
- UAE mobile numbers (e.g. `0558895363`)
- UAE Emirates ID numbers (e.g. `784-1990-12341681-2`)
- Passwords or secrets in plain text
- Database connection strings or credentials

**Rule:** All sensitive values must live in `.env` (which is gitignored) and be read at runtime via `envOrThrow()` or `envFromAliases()`.

### 2. Feature File Placeholders for PII Steps
When a Gherkin step passes user data (email, mobile, Emirates ID, password), always use the `"<placeholder>"` pattern in the `Examples:` table column rather than a real value:

```gherkin
# ✅ Correct
And broker enters email address "<emailAddress>" in contract B form
And broker enters mobile number "<mobileNumber>" in contract B form

Examples:
  | emailAddress       | mobileNumber  |
  | <emailAddress>     | <mobileNumber> |
```

The step definition resolves the placeholder to an env var:
```typescript
const resolved = value === '<emailAddress>' ? envFromAliases('BUYER_EMAIL', 'TEST_EMAIL') : value;
```

### 3. Log Masking for PII Values
Any `logger.info` / `console.log` that outputs a mobile number or email address **must** mask it using the project helpers before logging:

```typescript
// Mobile: show first 2 + last 3 digits, mask middle
const maskMobile = (v: string) => `${v.slice(0,2)}${'*'.repeat(Math.max(0,v.length-5))}${v.slice(-3)}`;

// Email: mask local part after first char
const maskEmail = (v: string) => {
  const at = v.indexOf('@');
  return at <= 0 ? '***' : `${v[0]}${'*'.repeat(at-1)}@${v.slice(at+1)}`;
};

logger.info(`📱 Entered mobile: ${maskMobile(resolvedMobile)}`);
logger.info(`📧 Entered email: ${maskEmail(resolvedEmail)}`);
```

### 4. Env Var Naming Convention
| Purpose | Primary key | Fallback key |
|---|---|---|
| Broker username | `BROKER_USERNAME` | `TEST_USERNAME` |
| Broker password | `BROKER_PASSWORD` | `TEST_PASSWORD` |
| Buyer mobile | `BUYER_MOBILE` | `TEST_MOBILE` |
| Buyer email | `BUYER_EMAIL` | `TEST_EMAIL` |
| Buyer Emirates ID | `BUYER_EMIRATES_ID` | `TEST_EMIRATES_ID` |
| DB user | `DB_USER` | — |
| DB password | `DB_PASSWORD` | — |
| DB connect string | `DB_CONNECT_STRING` | — |

Always use `envFromAliases('PRIMARY', 'FALLBACK')` so both key names work.

### 5. Secret Scanner — Run Before Every Commit
```bash
npm run scan:secrets
```
This scans `tests/` and `.github/` for patterns matching real emails, UAE mobiles, Emirates IDs, passwords, and DB strings. It exits with code 1 if any are found. Fix all violations before committing.

### 6. Artifact Hygiene
`reports/`, `allure-results/`, and `allure-report/` are gitignored but can accumulate PII in JSON/HTML output. Clear them periodically:
```bash
npm run clean:all
```

### 7. `.env.example` Must Stay Clean
[.env.example](.env.example) is committed to the repo. It must only contain safe placeholder values — never real credentials. Update it whenever a new env var is added.

---

## Next Steps for Development

1. **Refactor to POM**: Migrate step definitions to use [tests/pages/loginPage.ts](tests/pages/loginPage.ts) methods
2. **Add visual locators**: Create shared locator constants or helper methods
3. **Parallel execution**: Add Cucumber parallel plugin config
4. **Screenshots on failure**: Extend hooks to capture screen on error
5. **Username login feature**: Implement [tests/features/01_Login/02_username.feature](tests/features/01_Login/02_username.feature) steps
