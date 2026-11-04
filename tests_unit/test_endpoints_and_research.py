import unittest

from fastapi.testclient import TestClient

from backend.main import app
from backend.research_engine import simulate

client = TestClient(app)
IC_ROWS = [
    {"timestamp": 0, "PE_100": 1, "PE_110": 5, "CE_130": 5, "CE_140": 1},
    {"timestamp": 1, "PE_100": 1, "PE_110": 5, "CE_130": 5, "CE_140": 1},
]


class ResearchEngineTests(unittest.TestCase):
    def test_credit_is_positive_and_trade_taken(self):
        res = simulate(IC_ROWS, entry_credit_min=1)
        self.assertEqual(res["status"], "TRADE")
        self.assertEqual(res["credit"], 8)
        self.assertAlmostEqual(res["trades"][0]["pnl"], 0.0)


class EndpointTests(unittest.TestCase):
    def test_live_order_blocked_with_expected_message(self):
        r = client.post("/api/live/order")
        self.assertEqual(r.status_code, 403)
        self.assertIn("Live trading is disabled", r.json()["detail"])

    def test_health_reports_live_disabled(self):
        self.assertIs(client.get("/api/health").json()["live_trading"], False)

    def test_risk_defaults(self):
        r = client.get("/api/risk/defaults?capital=5000")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["capital"], 5000)

    def test_research_report_rejects_missing_file(self):
        r = client.post("/api/research/report", json={"path": "does-not-exist.json", "train_ratio": 0.7})
        self.assertEqual(r.status_code, 400)

    def test_research_report_rejects_path_outside_data_dir(self):
        r = client.post("/api/research/report", json={"path": "../../main.py", "train_ratio": 0.7})
        self.assertEqual(r.status_code, 400)

    def test_research_report_rejects_bad_ratio(self):
        r = client.post("/api/research/report", json={"path": "x.json", "train_ratio": 5})
        self.assertEqual(r.status_code, 400)


if __name__ == "__main__":
    unittest.main()
