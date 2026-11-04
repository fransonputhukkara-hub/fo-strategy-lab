# Full F&O Strategy Lab Build

This build consolidates the research and paper-trading foundation through Phase 10 and adds the final research/portfolio layer.

## Included
- Groww historical-data adapters
- expiry and contract discovery
- dynamic ATM/OTM strike selection
- synchronized option datasets
- strategy/backtest harness
- walk-forward framework
- final untouched-holdout gate
- configurable transaction-cost model
- per-leg slippage
- ₹5,000 virtual paper account
- daily loss / trade-risk gates
- portfolio/equity foundation
- strategy comparison
- mobile-first dashboard
- Playwright desktop + mobile tests
- hard-disabled live order endpoint

## IMPORTANT
This is NOT a promise of profitability and not a live-trading system.

The research pipeline should only produce a candidate for paper trading after:
1. sufficient multi-expiry data
2. realistic execution assumptions
3. development/test/holdout separation
4. robustness checks
5. paper-trading observation

Even a passing historical test can fail in future markets.

## Run
Backend:
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn backend.main:app --reload

Tests:
    npm install
    npx playwright install chromium
    npm run test:e2e

## Suggested morning workflow
1. Extract this ZIP.
2. Install Python requirements.
3. Install Playwright.
4. Run the automated tests first.
5. Only then configure Groww API credentials.
6. Download a very small historical sample.
7. Verify dataset integrity.
8. Expand to multiple expiries.
9. Run research.
10. Paper trade only if the research gates survive.

Never commit .env or Groww credentials to Git.
