import json, math, time
from pathlib import Path
from datetime import datetime, timedelta
try:
    from .groww_history import expiries, contracts, candles
except ImportError:  # groww_history.py is not included in this build
    def _groww_missing(*args, **kwargs):
        raise RuntimeError("backend/groww_history.py is missing from this build; "
                           "restore it from your own copy to download Groww data.")
    expiries = contracts = candles = _groww_missing

DATA=Path(__file__).resolve().parent.parent/"data"/"processed"
DATA.mkdir(parents=True,exist_ok=True)

def parse_symbol(s):
    p=s.split("-")
    if len(p)<5:return None
    try:strike=float(p[3])
    except:return None
    return {"groww_symbol":s,"expiry_code":p[2],"strike":strike,"option_type":p[4]}

def nearest_strike(strikes, price, step=50):
    return min(strikes,key=lambda x:abs(x-price))

def choose_legs(contract_symbols, underlying_price, short_distance=100, wing_width=100):
    opts=[parse_symbol(s) for s in contract_symbols]
    opts=[x for x in opts if x and x["option_type"] in ("CE","PE")]
    strikes=sorted({x["strike"] for x in opts})
    if not strikes:return []
    atm=nearest_strike(strikes,underlying_price)
    targets=[
        ("PE",atm-short_distance-wing_width),
        ("PE",atm-short_distance),
        ("CE",atm+short_distance),
        ("CE",atm+short_distance+wing_width)
    ]
    selected=[]
    for typ,target in targets:
        c=[x for x in opts if x["option_type"]==typ]
        if not c:return []
        selected.append(min(c,key=lambda x:abs(x["strike"]-target)))
    return selected

def get_underlying_price(underlying,start_time,end_time):
    # Historical index candles: use closing price at the requested start or first returned candle.
    payload=candles(f"NSE-{underlying}",start_time,end_time,"15minute")
    cs=payload.get("candles",[])
    if not cs: raise ValueError("No underlying candles returned.")
    return float(cs[0][4])

def build_expiry(underlying,expiry_date,start_time,end_time,short_distance=100,wing_width=100):
    price=get_underlying_price(underlying,start_time,end_time)
    cs=contracts(underlying,expiry_date).get("contracts",[])
    legs=choose_legs(cs,price,short_distance,wing_width)
    if len(legs)!=4: raise ValueError("Could not resolve four option legs.")
    result={"underlying":underlying,"expiry_date":expiry_date,"underlying_price_at_start":price,
            "start_time":start_time,"end_time":end_time,"legs":[]}
    for leg in legs:
        p=candles(leg["groww_symbol"],start_time,end_time,"15minute")
        result["legs"].append({**leg,"candles":p.get("candles",[])})
    path=DATA/f"{underlying}_{expiry_date}_dynamic_IC.json"
    path.write_text(json.dumps(result),encoding="utf-8")
    return {"path":str(path),"expiry":expiry_date,"underlying_price":price,"legs":legs}

def build_expiry_set(underlying,year,month,start_time,end_time,limit=4):
    ex=expiries(underlying,year,month).get("expiries",[])[:limit]
    out=[]
    for e in ex:
        out.append(build_expiry(underlying,e,start_time,end_time))
        time.sleep(.1)
    return out
