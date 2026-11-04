# Phase 7 — Research Engine

Groww historical F&O candles provide OHLC, volume and OI. Groww's option-chain API provides current chain information and Greeks; this project does NOT backfill historical Greeks that are not present in historical candle data.

The research engine therefore treats historical option prices/OI as observed data and clearly labels derived assumptions.

Current engine:
- synchronized four-leg option dataset
- entry credit approximation
- mark-to-market exit
- target/stop/end-of-sample
- costs input
- train/test split
- metrics

This is an engineering/research milestone, not evidence of a profitable strategy.

Next Phase 8:
- multiple expiry dataset builder
- underlying NIFTY historical series
- dynamic ATM/OTM selection
- entry timing
- realistic bid/ask/slippage model
- brokerage/statutory charges
- expiry payoff
- portfolio-level risk
- walk-forward optimization
- Monte Carlo / robustness tests
- final strategy leaderboard without forcing a winner
