# Test Suites Guide

Use the category-level suites when you want all main cases for that category.
Use the focused suites when you want only one dataset or one slice of the flow.

## Category-Level Suites

| Category | Command | Covers |
|---|---|---|
| Login | `npm run test:login` | All login basics: Emirates ID, Username, Mobile |
| Contract A | `npm run test:contracta:all` | Unit lifecycle, then Land lifecycle |
| Contract F | `npm run test:contractf:all` | Unit full Contract F flow, then Land full Contract F flow |

## Focused Suites

### Login

| Command | Covers |
|---|---|
| `npm run test:login:username` | Username login only |

### Contract A

| Command | Covers |
|---|---|
| `npm run test:contracta:unit:create` | Unit Contract A create only |
| `npm run test:contracta:unit:lifecycle` | Unit Contract A create, approve, edit, approve edit, extend, approve extension, cancel, approve cancellation |
| `npm run test:contracta:land:create` | Land Contract A create only |
| `npm run test:contracta:land` | Land Contract A create, approve, edit, approve edit, extend, approve extension, cancel, approve cancellation |

### Contract F

| Command | Covers |
|---|---|
| `npm run test:contractf:create` | Land Contract F create only |
| `npm run test:contractf:unit:create` | Unit Contract F create only |
| `npm run test:contractf:unit` | Unit Contract F full flow: prerequisites, create, seller approval, buyer approval, upload, activate |
| `npm run test:contractf:land:create` | Land Contract F create only |
| `npm run test:contractf:land` | Land Contract F full flow: prerequisites, create, seller approval, buyer approval, upload, activate |
| `npm run test:contractf:both` | Unit full flow first, then Land full flow |

## Recommended Usage

| Goal | Command |
|---|---|
| Run all login basics | `npm run test:login` |
| Run all Contract A basics | `npm run test:contracta:all` |
| Run all Contract F basics | `npm run test:contractf:all` |
| Run only Land Contract F | `npm run test:contractf:land` |
| Run only Unit Contract F | `npm run test:contractf:unit` |

## Notes

- Contract A and Contract F Unit/Land flows are split intentionally to avoid one dataset overwriting the other's saved contract numbers during the same run.
- The `:all` suites run sequentially, not in parallel.
- Explicit feature-path runs do not inherit the default suite anymore.