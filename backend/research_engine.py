import json, math
from pathlib import Path
from statistics import mean, pstdev

def load_dataset(path):
    return json.loads(Path(path).read_text())

def close_series(candles):
    return {x[0]: float(x[4]) for x in candles}

def build_snapshots(dataset):
    maps=[]
    for leg in dataset["legs"]:
        maps.append(close_series(leg["candles"]))
    common=sorted(set.intersection(*(set(x) for x in maps)))
    out=[]
    for ts in common:
        row={"timestamp":ts}
        for leg,m in zip(dataset["legs"],maps):
            key=f'{leg["option_type"]}_{int(leg["strike"])}'
            row[key]=m[ts]
        out.append(row)
    return out

def iron_condor_mark_to_market(row, credit, short_put, long_put, short_call, long_call, multiplier=1):
    # For a short IC: received credit - current debit-to-close.
    debit=max(row[short_put]-row[long_put],0)+max(row[short_call]-row[long_call],0)
    return (credit-debit)*multiplier

def simulate(rows, entry_credit_min=10, stop_loss=1.5, target=0.5, multiplier=1,
             costs_per_trade=0.0):
    if len(rows)<2: return {"trades":[]}
    # Generic research harness: assumes the dataset already identifies four IC legs.
    keys=[k for k in rows[0] if k!="timestamp"]
    if len(keys)!=4: return {"trades":[],"error":"Expected four option legs."}
    puts=sorted([k for k in keys if k.startswith("PE_")], key=lambda x:float(x.split("_")[1]))
    calls=sorted([k for k in keys if k.startswith("CE_")], key=lambda x:float(x.split("_")[1]))
    if len(puts)!=2 or len(calls)!=2: return {"trades":[],"error":"Expected two PE and two CE legs."}
    lp,sp=puts[0],puts[1]
    sc,lc=calls[0],calls[1]
    # Entry credit from first synchronized close. This is a research approximation.
    # Credit = premium of short legs minus premium of long legs, per wing.
    credit=(rows[0][sp]-rows[0][lp])+(rows[0][sc]-rows[0][lc])
    credit=max(0,credit)
    if credit<entry_credit_min: return {"trades":[],"status":"NO_SETUP","credit":credit}
    trades=[]
    peak=0; equity=0; maxdd=0
    entry=credit
    for r in rows[1:]:
        pnl=iron_condor_mark_to_market(r,credit,sp,lp,sc,lc,multiplier)-costs_per_trade
        equity=pnl
        peak=max(peak,equity)
        maxdd=max(maxdd,peak-equity)
        if pnl >= credit*target or pnl <= -credit*stop_loss:
            trades.append({"exit":r["timestamp"],"pnl":round(pnl,2),"reason":"target_or_stop"})
            break
    if not trades:
        r=rows[-1]
        pnl=iron_condor_mark_to_market(r,credit,sp,lp,sc,lc,multiplier)-costs_per_trade
        trades.append({"exit":r["timestamp"],"pnl":round(pnl,2),"reason":"end_of_sample"})
    return {"status":"TRADE","credit":round(credit,2),"trades":trades,"max_drawdown":round(maxdd,2)}

def metrics(trades):
    pnls=[float(x["pnl"]) for x in trades]
    if not pnls:return {"trades":0}
    wins=[x for x in pnls if x>0]; losses=[x for x in pnls if x<0]
    gross_win=sum(wins); gross_loss=abs(sum(losses))
    return {
      "trades":len(pnls),"wins":len(wins),"losses":len(losses),
      "win_rate":round(len(wins)/len(pnls)*100,2),
      "net_pnl":round(sum(pnls),2),
      "profit_factor":round(gross_win/gross_loss,3) if gross_loss else None,
      "expectancy":round(mean(pnls),2),
      "avg_win":round(mean(wins),2) if wins else 0,
      "avg_loss":round(mean(losses),2) if losses else 0
    }

def research_report(path, train_ratio=.7):
    d=load_dataset(path); rows=build_snapshots(d)
    n=len(rows); cut=max(1,int(n*train_ratio))
    train=rows[:cut]; test=rows[cut:]
    a=simulate(train); b=simulate(test)
    return {
      "dataset":path,"rows":n,
      "train_rows":len(train),"test_rows":len(test),
      "train":{**a,**metrics(a.get("trades",[]))},
      "test":{**b,**metrics(b.get("trades",[]))},
      "research_status":"DATA_AND_ENGINE_CHECK_ONLY",
      "warning":"This phase is not sufficient to establish profitability. Multiple expiries, realistic fills, costs, sample size and walk-forward testing are required."
    }
