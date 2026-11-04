import math, json
from pathlib import Path
from statistics import mean

def _spread_values(r, puts, calls):
    # Iron condor: short put (higher strike) and short call (lower strike) are
    # the expensive legs of each wing. Cost to close = short - long per wing.
    lp,sp=puts; sc,lc=calls
    put_wing=max(r[sp]-r[lp],0)
    call_wing=max(r[sc]-r[lc],0)
    return put_wing+call_wing

def _pnl_from_rows(rows, puts, calls, credit, cost, slippage, target, stop):
    trades=[]
    for r in rows[1:]:
        debit=_spread_values(r, puts, calls)
        pnl=credit-debit-cost-slippage
        if pnl >= credit*target:
            trades.append({"pnl":pnl,"reason":"target"}); break
        if pnl <= -credit*stop:
            trades.append({"pnl":pnl,"reason":"stop"}); break
    if not trades:
        r=rows[-1]
        debit=_spread_values(r, puts, calls)
        trades.append({"pnl":credit-debit-cost-slippage,"reason":"end"})
    return trades

def evaluate(rows, params):
    if not rows: return {"trades":0}
    keys=[k for k in rows[0] if k!="timestamp"]
    puts=sorted([k for k in keys if k.startswith("PE_")], key=lambda x:float(x.split("_")[1]))
    calls=sorted([k for k in keys if k.startswith("CE_")], key=lambda x:float(x.split("_")[1]))
    if len(puts)!=2 or len(calls)!=2:return {"trades":0}
    lp,sp=puts[0],puts[1]; sc,lc=calls[0],calls[1]
    # Credit received = premium of shorts minus premium of longs, per wing.
    credit=max(0,(rows[0][sp]-rows[0][lp])+(rows[0][sc]-rows[0][lc]))
    if credit < params["credit_min"]: return {"trades":0,"credit":credit}
    ts=_pnl_from_rows(rows,puts,calls,credit,params["cost"],params["slippage"],params["target"],params["stop"])
    pnls=[x["pnl"] for x in ts]; wins=[x for x in pnls if x>0]; losses=[x for x in pnls if x<0]
    return {"trades":len(pnls),"net_pnl":sum(pnls),"win_rate":len(wins)/len(pnls)*100,
            "expectancy":sum(pnls)/len(pnls),"profit_factor":sum(wins)/abs(sum(losses)) if losses else None}

def walk_forward(datasets, params, train_ratio=.7):
    folds=[]
    for path in datasets:
        d=json.loads(Path(path).read_text())
        maps=[]
        for leg in d["legs"]:
            maps.append({x[0]:float(x[4]) for x in leg["candles"]})
        common=sorted(set.intersection(*(set(x) for x in maps))) if maps else []
        rows=[]
        for ts in common:
            row={"timestamp":ts}
            for leg,m in zip(d["legs"],maps):
                row[f'{leg["option_type"]}_{int(leg["strike"])}']=m[ts]
            rows.append(row)
        cut=max(1,int(len(rows)*train_ratio))
        tr=evaluate(rows[:cut],params); te=evaluate(rows[cut:],params)
        folds.append({"dataset":path,"train":tr,"test":te})
    tests=[f["test"] for f in folds if f["test"].get("trades",0)>0]
    return {"folds":folds,"test_folds":len(tests),
            "test_net_pnl":sum(x.get("net_pnl",0) for x in tests),
            "test_expectancy":mean([x["expectancy"] for x in tests]) if tests else None}

def robustness(report, min_folds=5, min_expectancy=0):
    ok=(report["test_folds"]>=min_folds and
        report["test_expectancy"] is not None and
        report["test_expectancy"]>min_expectancy)
    return {"status":"SURVIVES_RESEARCH_GATES" if ok else "REJECTED",
            "gates":{"minimum_test_folds":min_folds,"minimum_test_expectancy":min_expectancy},
            "reason":"Passes configured gates." if ok else "Insufficient evidence or negative test expectancy."}
