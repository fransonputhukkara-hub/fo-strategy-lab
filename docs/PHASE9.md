# Phase 9 — Dynamic Historical Data + Paper Risk Foundation

Groww documents historical expiry and contract discovery for F&O from 2020, and historical candles containing OHLC, volume and OI. The backtesting API uses Groww symbols that identify option expiry, strike and CE/PE. citeturn0search0

This phase adds:
- historical underlying price lookup
- dynamic ATM strike selection
- automatic four-leg Iron Condor construction
- multiple-expiry dataset builder
- paper-capital risk-limit helper
- Playwright smoke/safety tests

Important:
- This is still not a profitability claim.
- Entry credit and fills require a more realistic execution model.
- Historical Greeks are not assumed from the current live option-chain/Greeks endpoints. citeturn0search2
- Live order placement remains blocked.

Next phase should implement the execution model: bid/ask proxy, slippage, lot size, brokerage/statutory charges, expiry settlement, daily loss rules, and portfolio-level backtesting.
