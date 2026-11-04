# Phase 8 — Multi-Expiry Walk-Forward Research

Groww's backtesting API exposes F&O expiries and contracts from 2020 and historical F&O candles with OHLC, volume and OI. 15-minute candles can be requested in windows up to 90 days. citeturn0search1

This phase adds a walk-forward research harness. It deliberately does not use current live Greeks as historical facts: Groww documents Greeks under live-data/option-chain APIs, while historical candles provide OHLC/volume/OI. citeturn0search4turn0search1

## Research gates
A candidate survives only if it has enough independent test folds and positive test expectancy under the configured gates.

This is NOT a profitability guarantee. The current engine is still an engineering/research harness and needs:
- multi-year dataset collection
- dynamic ATM selection using historical underlying prices
- correct lot sizing
- realistic bid/ask and slippage assumptions
- brokerage/statutory charges
- expiry settlement
- portfolio drawdown
- parameter sweep with untouched final holdout
- paper-trading validation

## Principle
The system is allowed to say REJECTED or NO TRADE.
