def position_size(capital,risk_per_trade,max_loss_per_unit):
    if max_loss_per_unit<=0:return 0
    return max(0,int((capital*risk_per_trade)/max_loss_per_unit))

def portfolio_limits(capital,daily_loss_pct=.02,trade_risk_pct=.01,max_positions=1):
    return {"capital":capital,"daily_loss_limit":capital*daily_loss_pct,
            "trade_risk_limit":capital*trade_risk_pct,"max_open_positions":max_positions}

def should_trade(current_daily_pnl,limits):
    return current_daily_pnl > -limits["daily_loss_limit"]
