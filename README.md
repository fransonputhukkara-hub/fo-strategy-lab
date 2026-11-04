# F&O Strategy Lab

Research and paper-trading workspace for NIFTY options. This is not a live-trading application and does not promise profitable results.

## Current frontend foundation

- React 19 + Vite 8 + TypeScript 7
- Existing Python / FastAPI backend retained
- Responsive dashboard with dashboard, market data, strategy, paper calculator, risk, reports and settings screens
- Read-only health, paper-account and risk-default API integration
- Live order endpoint remains hard-blocked
- No broker credentials are collected by the browser
- No market price or backtest result is fabricated when data is unavailable

## Requirements

- Node.js 24 or newer
- Python 3.11+ (the Kotak SDK test environment uses Python 3.11)
- npm

## Run in development

Terminal 1 — backend:

    cd D:\fo_strategy_lab_fixed_v2
    kotak_test_env\Scripts\activate
    python -m pip install -r requirements.txt
    uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

Terminal 2 — frontend:

    cd D:\fo_strategy_lab_fixed_v2
    npm install
    npm run dev

Open:

    http://127.0.0.1:5173

The Vite development server proxies /api/* requests to FastAPI at 127.0.0.1:8000.

## Production-style local build

    npm run build
    uvicorn backend.main:app --host 127.0.0.1 --port 8000

Open http://127.0.0.1:8000. FastAPI serves frontend/dist when the production build exists.

## Tests

Install the browser once:

    npx playwright install chromium

Run the end-to-end tests (backend and Vite server are started by Playwright):

    npm run test:e2e

Run Python unit tests:

    python -m unittest discover -s tests_unit -v

## Safety and data policy

- Live order placement must remain disabled.
- Do not put broker API keys, MPINs, TOTP secrets or access tokens into frontend code, browser storage, Git or screenshots.
- Keep downloaded broker/vendor data outside the repository. The root .gitignore excludes CSV files, environment files and virtual environments.
- The vendor's short sample has not been approved as a historical backtesting dataset. Do not use it to claim strategy performance.
- Backtests require validated historical option candles and aligned NIFTY underlying candles, contract metadata, expiry handling and realistic costs/slippage.
- NO TRADE and REJECT are valid outcomes.

## Project status

This branch is the React dashboard foundation. Backend settings persistence, broker quote streaming, validated dataset import, full paper ledger and integrated backtesting UI are separate implementation milestones.
