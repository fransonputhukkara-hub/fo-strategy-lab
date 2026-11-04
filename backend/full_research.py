
from .portfolio import Portfolio
from .strategy_compare import final_holdout_gate

def run_paper_sequence(gross_results, starting_capital=5000):
    p=Portfolio(starting_capital=starting_capital)
    for r in gross_results:
        p.apply(r)
    return p.snapshot()

def research_status(development,test,holdout):
    return final_holdout_gate(development,test,holdout)
