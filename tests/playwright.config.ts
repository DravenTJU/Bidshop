import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const UI_BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:5173';

function selectedProjects() {
  const projects = new Set<string>();

  for (let i = 0; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg.startsWith('--project=')) {
      projects.add(arg.slice('--project='.length));
    } else if (arg === '--project' && process.argv[i + 1]) {
      projects.add(process.argv[i + 1]);
      i += 1;
    }
  }

  return [...projects].sort();
}

function htmlReportFolder() {
  const projects = selectedProjects();
  if (projects.length === 1) {
    return path.join('playwright-report', projects[0]);
  }
  return 'playwright-report';
}

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? htmlReportFolder() }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
      use: {
        baseURL: API_BASE_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
    {
      name: 'ui',
      // testMatch: 'ui/**/*.spec.ts',
      testDir: defineBddConfig({
        outputDir: '.features-gen/ui',
        features: ['features/**/*.feature', '!features/mobile.feature'],
        steps: 'features/steps/**/*.ts',
      }),
      use: {
        ...devices['Desktop Chrome'],
        baseURL: UI_BASE_URL,
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'ui-mobile',
      testDir: defineBddConfig({
        outputDir: '.features-gen/ui-mobile',
        features: 'features/mobile.feature',
        steps: 'features/steps/**/*.ts',
      }),
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        baseURL: UI_BASE_URL,
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],
});
