import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
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
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist"
FRONTEND_FILE = FRONTEND_DIST_DIR / "index.html"
DATA_DIR = (BASE_DIR / "data" / "processed").resolve()


# --------------------------------------------------
# DASHBOARD HOMEPAGE
# --------------------------------------------------

@app.get("/", include_in_schema=False)
def dashboard():
    if FRONTEND_FILE.is_file():
        return FileResponse(FRONTEND_FILE, media_type="text/html")

    return HTMLResponse(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>F&O Strategy Lab API</title>
            <style>
              body{margin:0;background:#090e1b;color:#edf1fa;font:15px system-ui;display:grid;min-height:100vh;place-items:center}
              main{max-width:560px;margin:24px;padding:28px;background:#111a2c;border:1px solid #243149;border-radius:14px}
              a{color:#a8caff}p{color:#9ba8bd;line-height:1.6}
              code{color:#e4b978}
            </style>
          </head>
          <body>
            <main>
              <h1>F&amp;O Strategy Lab backend is running</h1>
              <p>The React dashboard is not built yet. During development, start the frontend with <code>npm run dev</code> and open:</p>
              <p><a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a></p>
              <p>API documentation: <a href="/docs">/docs</a></p>
            </main>
          </body>
        </html>
        """,
        status_code=200
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
        "build": "REACT_DASHBOARD_FOUNDATION",
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


# Serve the Vite production build after all API routes so /api/* is not shadowed.
if FRONTEND_DIST_DIR.is_dir():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIST_DIR), html=True),
        name="frontend"
    )
