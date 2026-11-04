from dataclasses import dataclass
from .costs import round_trip

@dataclass
class PaperConfig:
    starting_capital:float=5000
    max_daily_loss:float=100
    max_trade_risk:float=50
    max_open_positions:int=1
    slippage_per_leg:float=0.05
    lot_size:int=25

def can_open(config, daily_pnl, risk):
    return daily_pnl > -config.max_daily_loss and risk <= config.max_trade_risk

def trade_result(gross_pnl, sell_value, buy_value, legs=4, config=None):
    config=config or PaperConfig()
    costs=round_trip(sell_value,buy_value,legs*2)
    slippage=config.slippage_per_leg*legs*2
    net=gross_pnl-costs["estimated_total"]-slippage
    return {"gross_pnl":gross_pnl,"costs":costs,"slippage":slippage,
            "net_pnl":net,"ending_capital":config.starting_capital+net,
            "risk_ok":abs(min(net,0))<=config.max_trade_risk}
