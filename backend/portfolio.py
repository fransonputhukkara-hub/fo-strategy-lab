
from dataclasses import dataclass, field

@dataclass
class Portfolio:
    starting_capital: float = 5000.0
    equity: float = 5000.0
    peak_equity: float = 5000.0
    daily_pnl: float = 0.0
    trades: list = field(default_factory=list)

    def apply(self, trade):
        self.equity += float(trade["net_pnl"])
        self.daily_pnl += float(trade["net_pnl"])
        self.peak_equity=max(self.peak_equity,self.equity)
        self.trades.append(trade)

    @property
    def drawdown(self):
        return max(0.0,self.peak_equity-self.equity)

    @property
    def return_pct(self):
        return (self.equity/self.starting_capital-1)*100

    def snapshot(self):
        return {
            "starting_capital":self.starting_capital,
            "equity":round(self.equity,2),
            "peak_equity":round(self.peak_equity,2),
            "drawdown":round(self.drawdown,2),
            "return_pct":round(self.return_pct,2),
            "daily_pnl":round(self.daily_pnl,2),
            "trades":len(self.trades)
        }
