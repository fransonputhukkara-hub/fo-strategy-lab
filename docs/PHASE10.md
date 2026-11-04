# Phase 10 — Realistic Execution + ₹5,000 Paper Engine

Current Groww pricing lists ₹20 per executed F&O order. For equity options it currently lists 0.15% STT on premium SELL, 0.003% stamp duty on BUY, NSE option exchange transaction charge 0.03503% on premium, SEBI turnover charge 0.0001%, IPFT 0.0005%, and 18% GST on specified charges. Rates can change, so the engine keeps them configurable and should be refreshed before any real-money use.

This phase:
- calculates cost-adjusted paper P&L
- models brokerage and statutory charges
- adds per-leg slippage
- adds ₹5,000 paper capital
- adds daily loss and trade-risk gates
- keeps live execution disabled
- adds Playwright tests

Important: this is still a research/paper environment. The charge model is an approximation for backtesting and must be reconciled with actual contract notes before real trading.

Groww's historical API supports F&O contract discovery and historical candles from 2020; historical candle requests are bounded by interval-specific maximum durations. citeturn0search0turn0search1

Next:
- expiry payoff engine
- lot-size database from historical instruments
- exact per-order turnover
- historical bid/ask proxy
- portfolio equity curve
- multi-strategy comparison
- final holdout period
