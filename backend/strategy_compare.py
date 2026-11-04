
def summarize(name, result):
    return {
        "strategy":name,
        "trades":result.get("trades",0),
        "net_pnl":result.get("net_pnl",0),
        "expectancy":result.get("expectancy"),
        "profit_factor":result.get("profit_factor"),
        "win_rate":result.get("win_rate")
    }

def rank_for_research(results):
    # Research ordering, not a recommendation or prediction.
    valid=[x for x in results if x.get("trades",0)>0 and x.get("expectancy") is not None]
    return sorted(valid,key=lambda x:(x["expectancy"],x.get("profit_factor") or 0),reverse=True)

def final_holdout_gate(development, test, holdout, min_trades=20):
    checks={
        "development_has_trades":development.get("trades",0)>0,
        "test_has_trades":test.get("trades",0)>=min_trades,
        "holdout_has_trades":holdout.get("trades",0)>=min_trades,
        "test_positive_expectancy":(test.get("expectancy") or 0)>0,
        "holdout_positive_expectancy":(holdout.get("expectancy") or 0)>0,
    }
    return {
        "status":"PASS" if all(checks.values()) else "REJECT",
        "checks":checks,
        "note":"A pass is research evidence only; it is not a guarantee of future profitability."
    }
