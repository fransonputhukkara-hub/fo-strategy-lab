import unittest

from backend.walk_forward import evaluate
from backend.costs import round_trip, charges
from backend.paper_engine import PaperConfig, trade_result

# Iron condor used throughout:
#   long put 100, short put 110, short call 130, long call 140
PARAMS = {"credit_min": 1, "cost": 0.0, "slippage": 0.0, "target": 0.5, "stop": 1.0}


def ic_rows(entry, later):
    return [
        {"timestamp": 0, "PE_100": entry[0], "PE_110": entry[1], "CE_130": entry[2], "CE_140": entry[3]},
        {"timestamp": 1, "PE_100": later[0], "PE_110": later[1], "CE_130": later[2], "CE_140": later[3]},
    ]


class CreditSignTests(unittest.TestCase):
    def test_credit_is_positive_for_iron_condor(self):
        # Sold 110 PE @5 and 130 CE @5, bought 100 PE @1 and 140 CE @1 => credit 8
        rows = ic_rows((1, 5, 5, 1), (1, 5, 5, 1))
        res = evaluate(rows, PARAMS)
        self.assertEqual(res["trades"], 1)
        # Flat market: credit 8 - debit 8 = 0 P&L
        self.assertAlmostEqual(res["net_pnl"], 0.0)

    def test_no_trade_when_credit_below_minimum(self):
        rows = ic_rows((1, 1.5, 1.5, 1), (1, 1.5, 1.5, 1))
        res = evaluate(rows, dict(PARAMS, credit_min=5))
        self.assertEqual(res["trades"], 0)


class CallWingDebitTests(unittest.TestCase):
    def test_put_wing_loss_is_counted(self):
        # Credit 8. Short put rises 5 -> 4 (in our favour): debit = 3 + 3 = 6, pnl = +2
        rows = ic_rows((1, 5, 5, 1), (1, 4, 4, 1))
        res = evaluate(rows, PARAMS)
        self.assertAlmostEqual(res["net_pnl"], 2.0)

    def test_call_wing_loss_is_counted(self):
        # Short call rises 5 -> 7 (against us), put wing unchanged.
        # Put debit = 5 - 1 = 4, call debit = 7 - 1 = 6, total 10, pnl = 8 - 10 = -2
        rows = ic_rows((1, 5, 5, 1), (1, 5, 7, 1))
        res = evaluate(rows, PARAMS)
        self.assertAlmostEqual(res["net_pnl"], -2.0)

    def test_call_wing_loss_triggers_stop(self):
        # Credit 8, stop at -8. Call wing blows out: short call 5 -> 15, long 1 -> 1 => debit 14 + put 4 = 18, pnl = -10
        rows = ic_rows((1, 5, 5, 1), (1, 5, 15, 1))
        res = evaluate(rows, PARAMS)
        self.assertEqual(res["trades"], 1)
        self.assertLess(res["net_pnl"], -8)


class BrokerageTests(unittest.TestCase):
    def test_eight_orders_charge_brokerage_eight_times(self):
        rt = round_trip(1000, 500, orders=8)
        self.assertEqual(rt["orders"], 8)
        self.assertEqual(rt["brokerage_total"], 160.0)
        self.assertAlmostEqual(rt["brokerage_gst"], 160.0 * 0.18)

    def test_brokerage_not_double_counted_in_legs(self):
        rt = round_trip(1000, 500, orders=8)
        leg_brokerage = sum(rt[k]["brokerage"] for k in ("entry", "entry_buy", "exit_sell", "exit_buy"))
        self.assertEqual(leg_brokerage, 0.0)

    def test_total_equals_statutory_plus_brokerage(self):
        rt = round_trip(1000, 500, orders=8)
        statutory = sum(rt[k]["total"] for k in ("entry", "entry_buy", "exit_sell", "exit_buy"))
        self.assertAlmostEqual(rt["estimated_total"], statutory + 160.0 + 160.0 * 0.18)

    def test_orders_argument_is_respected(self):
        self.assertEqual(round_trip(1000, 500, orders=4)["brokerage_total"], 80.0)

    def test_stt_only_on_sell_side(self):
        self.assertAlmostEqual(charges(1000, "SELL", brokerage=0.0)["stt"], 1.5)
        self.assertEqual(charges(1000, "BUY", brokerage=0.0)["stt"], 0.0)

    def test_paper_trade_uses_eight_orders(self):
        res = trade_result(0.0, 1000, 500, legs=4, config=PaperConfig())
        self.assertEqual(res["costs"]["orders"], 8)
        self.assertEqual(res["costs"]["brokerage_total"], 160.0)


if __name__ == "__main__":
    unittest.main()
