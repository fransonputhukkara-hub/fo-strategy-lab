# Playwright Automated Testing

## Install

From this folder:

    npm install
    npx playwright install chromium

## Run all tests

    npm run test:e2e

## Run with browser visible

    npm run test:e2e:headed

## Interactive test runner

    npm run test:e2e:ui

## View report

    npm run test:report

## What is covered

- FastAPI health check
- Dashboard load
- Mobile viewport smoke test
- Research endpoint error handling
- Live order safety lock
- Explicit live_trading=false state

## Safety principle

Automated tests must prove that the current research build cannot place live orders.

Do not put Groww access tokens in Playwright test files.
Do not use a real trading account for E2E tests.
Real Groww historical-data tests should be a separate controlled suite.
