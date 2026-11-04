# React Dashboard Foundation

## Scope

This milestone adds a React/Vite/TypeScript frontend without replacing the current FastAPI backend or enabling live execution.

## Screens

- Dashboard: backend health, virtual capital, backend risk defaults and research readiness.
- Market data: shows connection state without inventing quotes.
- Strategy lab: displays the experimental Strategy 001 assumptions and states that they are not validated or executable.
- Paper trading: cost-adjusted estimate using the existing /api/paper/trade endpoint. The current backend does not persist these estimates as trades.
- Risk controls: reads /api/risk/defaults and /api/paper/account.
- Research reports: blocks strategy conclusions while no approved dataset is loaded.
- Settings: displays current integration status and credential-handling guidance.

## Development

The root npm package uses a workspace for frontend. Run npm install at the repository root, then npm run dev.

The Vite server runs at http://127.0.0.1:5173 and proxies /api to http://127.0.0.1:8000.

## Production

Run npm run build. Vite writes the static bundle to frontend/dist. FastAPI serves that build from / only when the directory exists. API routes are declared before the static mount.

## Not included

- Broker quote/WebSocket connection in the application.
- Credential or TOTP entry in the browser.
- Persistent editable risk settings.
- Dataset import/validation pipeline in the UI.
- Historical backtesting controls.
- Persistent paper positions or order ledger.
- Live order entry.
