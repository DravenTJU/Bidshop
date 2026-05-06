# CI/CD - Azure DevOps

The pipeline is defined in [../../azure-pipelines.yml](../../azure-pipelines.yml). It triggers on every push to `main` and every PR targeting `main`.

This pipeline is designed as a **release-quality gate**, not a bare test runner. It verifies that the backend and frontend can be installed, typechecked, built, started, tested, and investigated from CI evidence. The design intentionally focuses on fast feedback, repeatability, debuggability, and future scalability.

## Design Goals

- **Deployment readiness**: build the backend and frontend before running tests, so the test jobs validate compiled output rather than only development-mode behaviour.
- **Shift-left feedback**: run type checks and smoke tests early enough to catch defects before release or manual UAT.
- **Clear failure isolation**: split build and test phases into separate jobs so the failed phase can be rerun or diagnosed without repeating unrelated work.
- **Parallel execution readiness**: structure independent jobs so they can run in parallel when more agents are available in the Azure DevOps agent pool.
- **Debuggability**: publish JUnit results, Playwright HTML reports, traces, screenshots/videos, and service logs.
- **Report accessibility**: upload the Playwright HTML report to Azure Blob Storage static website hosting so reviewers can open the report directly in a browser without downloading artifacts.

## Agent Pool and Parallel Execution

The pipeline can run on either Microsoft-hosted agents or a self-hosted Azure DevOps agent pool. For this exercise, I used a manually configured **self-hosted Linux agent pool** because hosted parallelism may not be available by default for a new Azure DevOps organisation.

The agent pool can be scaled horizontally by registering multiple Linux servers into the same pool, for example:

| Agent | Example host | Intended workload |
|-------|--------------|-------------------|
| `bidshop-agent-01` | Linux VM / local server | Backend build and API tests |
| `bidshop-agent-02` | Linux VM / local server | Frontend build and UI tests |
| `bidshop-agent-03` | Linux VM / local server | Future browser matrix or regression jobs |

When several agents are online in the same pool, Azure DevOps can schedule independent jobs at the same time. In this pipeline, `backend_build` and `frontend_build` are independent and can run in parallel. After `backend_build` completes, `api_tests` can start immediately, while `ui_tests` waits for both backend and frontend build artifacts.

This keeps the current implementation simple while making the pipeline ready for parallel jobs later without redesigning the whole YAML structure.

## Job Decomposition

The first version of the pipeline could have been implemented as a single `build_and_test` job. I intentionally split it into multiple jobs to make the CI flow closer to a production-quality pipeline.

| Job | Purpose | Depends on | Parallelisation |
|-----|---------|------------|-----------------|
| `backend_build` | Install backend dependencies, typecheck, build, and publish `backend-dist` | None | Can run in parallel with `frontend_build` |
| `frontend_build` | Install frontend dependencies, typecheck, build, and publish `frontend-dist` | None | Can run in parallel with `backend_build` |
| `api_tests` | Download `backend-dist`, start the compiled API, run API tests, publish JUnit results and logs | `backend_build` | Can run while UI preparation continues |
| `ui_tests` | Download `backend-dist` and `frontend-dist`, start the compiled API and production frontend preview, run BDD desktop and mobile UI tests, publish JUnit results, HTML report, traces, and logs | `backend_build`, `frontend_build` | Can later be split by browser/device/tag |

This structure has several benefits:

- **Faster feedback**: backend and frontend builds do not block each other.
- **Artifact reuse**: test jobs consume the same compiled artifacts that would be candidates for deployment.
- **Clear ownership**: a backend build failure, frontend build failure, API test failure, or UI test failure appears as a separate CI signal.
- **More efficient reruns**: failed jobs can be rerun without rerunning the entire pipeline.
- **Future scalability**: UI tests can later be split into desktop, mobile, accessibility, and cross-browser jobs.

## Pipeline Flow

1. Install dependencies with `npm ci` for the relevant package in each job.
2. Typecheck and build backend and frontend in separate jobs.
3. Publish backend and frontend build outputs as pipeline artifacts.
4. Download build artifacts in the test jobs.
5. Start the compiled API with `npm start`.
6. For UI tests, start the production frontend preview with `npm run preview`.
7. Poll `/health` and the web app until both services are ready.
8. Run API tests in `api_tests`.
9. Run `bddgen`, then run the BDD UI projects in `ui_tests`:

```bash
npx bddgen
npx playwright test --project=ui --project=ui-mobile
```

10. Publish JUnit results to the Azure Pipelines test results view with `PublishTestResults@2`.
11. Stop local services with `condition: always()` so ports and processes are cleaned up even when tests fail.
12. Publish Playwright HTML reports, traces, screenshots/videos, service logs, and build artifacts.
13. Upload the Playwright HTML report to Azure Blob Storage static website hosting for direct browser preview.

## Playwright Report Publishing

The Playwright HTML report is published in two ways:

| Destination | Purpose |
|-------------|---------|
| Azure Pipeline Artifact | Preserves the report, traces, screenshots/videos, and raw test results with the pipeline run |
| Azure Blob Storage static website | Provides a direct URL for browser-based report review without downloading artifacts |

The Blob upload uses a build-specific path to avoid overwriting previous reports:

```text
reports/<Build.BuildId>-attempt-<System.JobAttempt>/index.html
```

The pipeline writes the final URL to the job log, for example:

```text
https://<storage-account>.<static-website-endpoint>/reports/<build-id>-attempt-<attempt>/index.html
```

This makes the CI output easier to review during code review or technical assessment, because reviewers can open the Playwright report directly and inspect failed steps, screenshots, traces, and scenario details.

Required pipeline variables:

| Variable | Purpose | Secret? |
|----------|---------|---------|
| `AZURE_STORAGE_ACCOUNT` | Azure Storage account name used for report publishing | No |
| `AZURE_STORAGE_KEY` | Storage account key used by `az storage blob upload-batch` | Yes |
| `AZURE_STATIC_SITE_URL` | Static website primary endpoint used to print the final report URL | No |

For a production system, I would replace the storage account key with a service connection or managed identity/RBAC-based access.

## Quality Gate

`@smoke` tests cover the critical order path: authentication, adding items to cart, and completing checkout. A failing `@smoke` test fails the pipeline step and can be wired to block PR merges via Azure DevOps branch policies.

Known-bug scenarios such as `GST-API-001`, `GST-UI-001`, and other `@fail @known-bug` cases are excluded from `@smoke`. They do not block the gate because Playwright treats `test.fail()` / `@fail` cases as expected failures. They turn green automatically once the underlying bug is fixed.

This keeps the release gate focused on customer-critical confidence while still documenting known defects and regression risks.

## Published Outputs

| Output | Producer | Purpose |
|--------|----------|---------|
| `backend-dist` | `backend_build` | Compiled API used by test jobs and future deployment stages |
| `frontend-dist` | `frontend_build` | Production frontend bundle used by UI tests and future deployment stages |
| API JUnit results | `api_tests` | Azure Pipelines test reporting for API checks |
| UI JUnit results | `ui_tests` | Azure Pipelines test reporting for BDD desktop and mobile scenarios |
| Playwright HTML report artifact | `ui_tests` | Downloadable browser-based investigation report |
| Playwright HTML report URL | `ui_tests` | Direct static website URL for quick review |
| Playwright traces/videos/screenshots | `ui_tests` | Failure debugging evidence |
| Service logs | `api_tests`, `ui_tests` | Backend/frontend startup and runtime logs |

## CI/CD Design Trade-offs

- The pipeline currently uses local services because the exercise application runs without Docker, database, or cloud infrastructure.
- The UI test job uses a production frontend preview rather than Vite dev server to better match release behaviour.
- The self-hosted agent requires one-time server preparation, such as Node.js, Azure CLI, and Playwright browser system dependencies.
- Storage account key authentication is simple for a small exercise, but a real team should prefer Azure service connections, managed identity, or scoped RBAC.
- The current test suite is intentionally small. The goal is to demonstrate clean structure and high-value scenarios rather than chase coverage percentage.

## CI/CD Next Steps

- Add `@smoke` as a required Azure DevOps branch policy so PRs cannot merge when the quality gate fails.
- Use path filters so backend-only changes do not unnecessarily trigger frontend-only jobs, and vice versa.
- Add `Cache@2` for npm cache directories to reduce repeated install time.
- Split UI tests into separate jobs by browser, device profile, or tag, for example `ui_desktop`, `ui_mobile`, `ui_accessibility`, and `ui_regression`.
- Add Playwright sharding for larger suites so long-running UI tests can run across multiple agents.
- Add a scheduled nightly regression run that includes non-smoke scenarios and known-risk areas.
- Add a post-deploy synthetic check that runs the golden-path order flow against a deployed environment.
- Add a CD stage after the quality gate. The current pipeline builds backend and frontend artifacts but does not deploy them.
- Add environment approvals before production deployment.
- Publish a short pipeline summary with links to the Blob-hosted HTML report, JUnit results, and key artifacts.
- Replace storage account key usage with Azure service connection or managed identity-based access.
- Add security checks such as dependency audit, secret scanning, and OWASP-focused API checks before release.
- Add accessibility checks for critical UI journeys.
- Add lightweight performance checks for critical endpoints or checkout flow using tools such as k6.
- Add test trend dashboards to track failure rate, flaky tests, duration, and escaped defects over time.
- Containerise backend and frontend services so CI can start consistent environments with Docker Compose or deployment slots.
