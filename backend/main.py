
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .portfolio import Portfolio
from .strategy_compare import final_holdout_gate, rank_for_research
from .paper_engine import PaperConfig, can_open, trade_result
from .research_engine import research_report
from .risk_model import portfolio_limits


# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

app = FastAPI(title="F&O Strategy Lab — Full Research")

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_FILE = BASE_DIR / "frontend" / "index.html"
DATA_DIR = (BASE_DIR / "data" / "processed").resolve()


# --------------------------------------------------
# DASHBOARD HOMEPAGE
# --------------------------------------------------

@app.get("/", include_in_schema=False)
def dashboard():
    if not FRONTEND_FILE.is_file():
        raise HTTPException(
            status_code=500,
            detail="Dashboard HTML file is missing."
        )

    return FileResponse(
        FRONTEND_FILE,
        media_type="text/html"
    )


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class PaperTrade(BaseModel):
    gross_pnl: float
    sell_value: float
    buy_value: float
    daily_pnl: float = 0


class Gate(BaseModel):
    development: dict
    test: dict
    holdout: dict
    min_trades: int = 20


class Compare(BaseModel):
    results: list[dict]


class ResearchReport(BaseModel):
    path: str
    train_ratio: float = 0.7


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "build": "FULL",
        "live_trading": False,
        "mode": "RESEARCH_PAPER"
    }


# --------------------------------------------------
# PAPER ACCOUNT
# --------------------------------------------------

@app.get("/api/paper/account")
def account():
    return {
        "starting_capital": 5000,
        "virtual": True,
        "live_trading": False,
        "daily_loss_limit": 100,
        "max_trade_risk": 50,
        "max_open_positions": 1
    }


@app.post("/api/paper/trade")
def paper(t: PaperTrade):
    c = PaperConfig()

    risk = abs(min(t.gross_pnl, 0))

    if not can_open(c, t.daily_pnl, risk):
        raise HTTPException(
            status_code=409,
            detail="Paper risk gate blocked this trade."
        )

    return trade_result(
        t.gross_pnl,
        t.sell_value,
        t.buy_value,
        4,
        c
    )


# --------------------------------------------------
# RESEARCH VALIDATION
# --------------------------------------------------

@app.post("/api/research/final-gate")
def final_gate(g: Gate):
    return final_holdout_gate(
        g.development,
        g.test,
        g.holdout,
        g.min_trades
    )


@app.post("/api/research/compare")
def compare(c: Compare):
    return {
        "count": len(c.results),
        "research_order": rank_for_research(c.results)
    }


# --------------------------------------------------
# RESEARCH REPORT
# --------------------------------------------------

@app.post("/api/research/report")
def research_report_endpoint(r: ResearchReport):

    if not (0.1 <= r.train_ratio <= 0.9):
        raise HTTPException(
            status_code=400,
            detail="train_ratio must be between 0.1 and 0.9."
        )

    # Resolve and restrict dataset access to the processed data directory.
    candidate = (DATA_DIR / r.path).resolve()

    if (
        DATA_DIR not in candidate.parents
        or not candidate.is_file()
    ):
        raise HTTPException(
            status_code=400,
            detail="Dataset not found in the data directory."
        )

    try:
        return research_report(
            str(candidate),
            r.train_ratio
        )

    except (
        ValueError,
        KeyError,
        TypeError,
        json.JSONDecodeError
    ):
        raise HTTPException(
            status_code=400,
            detail="Dataset is malformed."
        )


# --------------------------------------------------
# RISK DEFAULTS
# --------------------------------------------------

@app.get("/api/risk/defaults")
def risk_defaults(capital: float = 5000):

    if capital <= 0:
        raise HTTPException(
            status_code=400,
            detail="capital must be positive."
        )

    return portfolio_limits(capital)


# --------------------------------------------------
# LIVE TRADING SAFETY LOCK
# --------------------------------------------------

@app.post("/api/live/order")
def live_order():

    raise HTTPException(
        status_code=403,
        detail="Live trading is disabled. This research build permanently blocks live orders."
    )
