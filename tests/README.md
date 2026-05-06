# Bidshop Test Suite

[![Build Status](https://dev.azure.com/wzha363/Bidshop/_apis/build/status%2FDravenTJU.Bidshop?branchName=main)](https://dev.azure.com/wzha363/Bidshop/_build/latest?definitionId=1&branchName=main)
[![Playwright](https://img.shields.io/badge/Playwright-1.52-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev)
[![playwright-bdd](https://img.shields.io/badge/BDD-playwright--bdd_8.5-brightgreen)](https://vitalets.github.io/playwright-bdd/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

Automated API and UI tests for the Bidshop application, written as part of the Bidfood SDET technical exercise.

---

## Run

Start the two services, then run the tests from the `tests/` directory.

```bash
# Terminal 1 — API
cd backend && npm install && npm run dev

# Terminal 2 — React web app
cd frontend && npm install && npm run dev

# Terminal 3 — Test suite
cd tests && npm install
npx playwright install --with-deps chromium
npm test
```
---

## Framework

| Layer | Tool | Rationale |
|-------|------|-----------|
| API tests | Playwright Test (`request` fixture) | Treats the API as a black box over HTTP — no in-process coupling, same runner as UI, full parallelism and retries built in |
| UI tests | **playwright-bdd** (Gherkin `.feature` + TypeScript step definitions) | Acceptance criteria written in Gherkin become the automated tests. Product owners and QA analysts can co-author `.feature` files. Scenario titles flow into Azure Test Plans natively |
| Selectors | **Page Object Model** (`tests/pages/`) | All `getByTestId` calls are encapsulated in page classes. Tests read as user stories, not DOM queries |
| Language | TypeScript | Matches both services; types from `backend/src/types.ts` can be reused |
| Reporters | HTML + JUnit | HTML for local investigation; JUnit for native Azure Test Plans integration |

**Single runner for both layers unlocks hybrid testing.** Because both API and UI tests share the same Playwright `request` fixture, a single test can freely mix the two:

- **UI action → API assertion:** click "Place order" in the browser, then call `GET /orders` via `request` to verify the order was persisted with the correct totals and stock was decremented — no mocking, no stubs, real end-to-end proof.
- **API setup → UI assertion:** register a user and exhaust a product's stock via the API, then load the catalogue in the browser and assert the "Out of stock" button is disabled — fast, deterministic setup without clicking through the UI.
- **Parallel API + UI work:** the `authedApi` fixture provides a pre-authenticated `request` context alongside the browser `page`, so a scenario can drive the browser and call the API in the same step definition without any extra configuration.

For example, `PRODUCT-UI-007` (out-of-stock) drains stock via `POST /orders` before the UI assertion, and `CHECKOUT-UI-004` (golden path) calls `GET /orders` after the browser confirms the order to cross-check the server state.

---

## Running tests

| Command | What it runs |
|---------|-------------|
| `npm test` | Full suite — API + UI (Desktop Chrome) |
| `npm run test:api` | API project only |
| `npm run test:ui` | UI BDD project only (Desktop Chrome) |
| `npm run test:mobile` | Mobile BDD project only (iPhone 13 emulation) |
| `npm test -- --grep @smoke` | Smoke gate — critical path only, fast |
| `npm test -- --grep @regression` | Broader coverage, nightly or pre-release |
| `npm test -- --grep @e2e` | Full end-to-end user flows |
| `npm test -- --grep "CHECKOUT"` | Single module by ID prefix |
| `npm run report` | Open the default full-suite HTML report |
| `npm run report:api` | Open the API-only HTML report |
| `npm run report:ui` | Open the desktop UI HTML report |
| `npm run report:mobile` | Open the mobile HTML report |

`@smoke` tests cover the critical order path. A failing smoke test means a user cannot complete a purchase — this is the quality gate that blocks deployment.

> **Note:** `npm test` does not run the mobile project by default. Run `npm run test:mobile` separately when targeting iPhone 13 viewports.

HTML reports are written per run shape: `npm test` and other multi-project runs use `playwright-report/`, while single-project scripts use `playwright-report/api`, `playwright-report/ui`, and `playwright-report/ui-mobile`. This keeps independent script runs from writing the same report directory.

---

## Test naming convention

Every test title follows `MODULE-LAYER-NNN Description @tag` so Azure Test Plans shows the failing case ID at a glance without opening the HTML report.

| Module | Scope |
|--------|-------|
| `AUTH` | Registration, login, session persistence, routing guards |
| `PRODUCT` | Catalogue listing, search, categories, out-of-stock, image loading |
| `CART` | Add item, update quantity, remove, clear, unauthenticated and token states |
| `CHECKOUT` | Form pre-fill, validation, order placement, confirmation, edge cases |
| `GST` | Known GST rate defect — intentionally failing |
| `MOBILE` | Mobile viewport (iPhone 13) — registration, cart, form layout |

Tag taxonomy:

| Tag | Meaning |
|-----|---------|
| `@smoke` | Critical path — blocks pipeline on failure |
| `@regression` | Broader coverage — nightly runs |
| `@e2e` | Full multi-page user flow |
| `@fail` | playwright-bdd expected-failure tag — scenario is known to fail |
| `@known-bug` | Documented defect; never blocks the gate |

---

## Project layout

```
tests/
├── playwright.config.ts         # Three projects: api, ui (BDD/Chromium), ui-mobile (BDD/iPhone 13)
├── package.json
├── tsconfig.json
├── .env.example                 # Copy to .env to override API_BASE_URL / UI_BASE_URL
├── .gitignore
├── pages/                       # Page Object Model — used inside BDD step definitions
│   ├── BasePage.ts              # Shared nav: user name, cart badge, logout
│   ├── AuthPage.ts              # Register / login form interactions
│   ├── CataloguePage.ts         # Product grid, search, category filter, add-to-cart
│   ├── CartPage.ts              # Cart rows, quantity controls, proceed to checkout
│   └── CheckoutPage.ts          # Delivery form, submit, order confirmation locators
├── fixtures/
│   ├── factories.ts             # uniqueEmail(), makeUser(), makeCustomer()
│   ├── api-client.ts            # HTTP wrappers: registerUser, authedContext
│   └── auth.ts                  # seedAuth() — register via API, inject token, wait for /auth/me
├── api/
│   ├── auth.spec.ts             # AUTH-API-001–010
│   ├── products.spec.ts         # PRODUCT-API-001–009
│   ├── cart.spec.ts             # CART-API-001–012
│   ├── orders.spec.ts           # CHECKOUT-API-001–008
│   └── gst-consistency.spec.ts  # GST-API-001 (known-bug, test.fail()), GST-API-002
├── features/                    # playwright-bdd UI tests (Gherkin)
│   ├── auth.feature             # AUTH-UI-001–006  (006 = @fail)
│   ├── browse.feature           # PRODUCT-UI-001–008  (008 = @fail)
│   ├── cart.feature             # CART-UI-001–006  (006 = @fail)
│   ├── checkout.feature         # CHECKOUT-UI-001–007, GST-UI-001 (GST = @fail)
│   ├── mobile.feature           # MOBILE-UI-001–003  (ui-mobile project only)
│   └── steps/
│       ├── fixtures.ts          # Extends test with POM + scenarioContext; re-exports Given/When/Then
│       ├── common.steps.ts      # Shared steps: seedAuth, navigation, add-product actions
│       ├── auth.steps.ts
│       ├── browse.steps.ts
│       ├── cart.steps.ts
│       ├── checkout.steps.ts
│       └── mobile.steps.ts
└── .features-gen/               # bddgen output — gitignored; regenerated before every run
```

---

## CI/CD - Azure DevOps

Azure DevOps pipeline details, quality gate behaviour, published artifacts, and CI/CD next steps are documented in **[docs/CI_CD.md](docs/CI_CD.md)**.

---

## Bonus task response (discount feature plan)

To address the bonus requirement in `CANDIDATE_INSTRUCTIONS.md` ("10% discount for orders over NZD 100"), the full clarification notes, API/UI/data-model impact analysis, and test strategy are documented in **[docs/DISCOUNT.md](docs/DISCOUNT.md)**.

---

## AI tooling

The suite was built with multiple AI agents in parallel, each picked for what it does best. All generated output was reviewed line-by-line, aligned with the real API contract, and hardened with explicit types and edge-case handling before commit.

| Agent / Skill | Where it helped |
|---------------|-----------------|
| **Claude Code** | Drove the multi-step refactor from raw `*.spec.ts` UI tests to the playwright-bdd structure (Gherkin `.feature` + `pages/` POM + `features/steps/`), plus large-scale doc rewrites |
| **Codex** | Authored API spec scaffolding, fixture factories (`factories.ts`, `api-client.ts`), and tightened TypeScript types and edge-case branches |
| **Cursor** | In-IDE iteration loop: targeted edits, lint/typecheck cycles, scenario tag/ID alignment with Azure Test Plans |
| **superpowers** skill | Plan-then-execute workflow for larger changes: write the spec/plan first (`docs/superpowers/`), then implement against it to keep changes auditable |
| **chrome-devtools-mcp** | Live DOM/network/console inspection while debugging UI flakiness, image-load defects, and stale-token redirect behaviour |
| **context7** | Pulled current Playwright / playwright-bdd / Azure DevOps task docs on demand instead of relying on stale training data |
| **Playwright CLI** (skill) | Quick scripted browser runs from the terminal — verifying selectors, capturing traces/snapshots, and reproducing scenarios outside the full suite |

The Page Object structure, the `MODULE-LAYER-NNN @tag` naming convention, and the BDD scenario design were authored by hand to match the Azure Test Plans integration requirements; AI tooling accelerated implementation, not the test design itself.

---

## Defects discovered

Symptoms, reproduction commands, and test strategy for each known failure are documented in **[docs/DEFECTS.md](docs/DEFECTS.md)**.

---

## Trade-offs and next steps

- **Cross-browser coverage:** Extend UI runs beyond Chromium to Firefox and WebKit to detect engine-specific rendering and interaction differences earlier.

- **Broader mobile coverage:** Add more device profiles beyond iPhone 13 (for example Android Chrome and iPad viewport) to verify responsive layout and touch behaviour under realistic breakpoints.

- **Scenario expansion:** Add higher-risk flows such as expired session during checkout, concurrent cart updates across tabs, stock race conditions near zero inventory, and order submission retry/idempotency checks.

- **Business-rule edge cases:** Expand GST and discount combinations (mixed categories, multi-quantity rounding, coupon stacking/priority rules) to prevent calculation regressions.

- **Contract testing (Pact):** Add a Pact consumer contract between the React API client and Express backend to detect API-breaking changes before integration tests run.

- **`POST /test/reset` endpoint:** Repeated runs can drain low-stock products without backend restart; a reset endpoint (behind an env flag) would provide deterministic `beforeAll`/`afterAll` setup.

- **CD handoff (minimal):** After the quality gate is stable, add a lightweight CD stage with environment approvals and deployment verification. Full CI/CD details remain in `docs/CI_CD.md`.

---

## Product code changes

None. `backend/` and `frontend/` are untouched.
