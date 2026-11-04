import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { getApi, postApi } from "./api";

type Page =
  | "dashboard"
  | "market"
  | "strategy"
  | "paper"
  | "risk"
  | "reports"
  | "settings";

type HealthResponse = {
  status: string;
  build?: string;
  live_trading: boolean;
  mode: string;
};

type PaperAccount = {
  starting_capital: number;
  virtual: boolean;
  live_trading: boolean;
  daily_loss_limit: number;
  max_trade_risk: number;
  max_open_positions: number;
};

type RiskDefaults = {
  capital: number;
  daily_loss_limit: number;
  trade_risk_limit: number;
  max_open_positions: number;
};

type PaperResult = {
  gross_pnl: number;
  costs: { estimated_total: number; [key: string]: unknown };
  slippage: number;
  net_pnl: number;
  ending_capital: number;
  risk_ok: boolean;
};

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "market", label: "Market data", icon: "activity" },
  { id: "strategy", label: "Strategy lab", icon: "sliders" },
  { id: "paper", label: "Paper trading", icon: "wallet" },
  { id: "risk", label: "Risk controls", icon: "shield" },
  { id: "reports", label: "Research reports", icon: "file" },
  { id: "settings", label: "Settings", icon: "settings" }
];

const pageCopy: Record<Page, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "A clear view of system health, risk limits and research readiness."
  },
  market: {
    title: "Market data",
    subtitle: "Broker connectivity and dataset readiness. No market prices are fabricated."
  },
  strategy: {
    title: "Strategy lab",
    subtitle: "Review the current experimental NIFTY setup before it is connected to a backtest."
  },
  paper: {
    title: "Paper trading",
    subtitle: "Estimate cost-adjusted outcomes using the existing virtual risk limits."
  },
  risk: {
    title: "Risk controls",
    subtitle: "The current backend defaults for the virtual account."
  },
  reports: {
    title: "Research reports",
    subtitle: "Backtests remain blocked until suitable historical data is approved."
  },
  settings: {
    title: "Settings",
    subtitle: "Application configuration and integration status."
  }
};

type IconName =
  | "grid"
  | "activity"
  | "sliders"
  | "wallet"
  | "shield"
  | "file"
  | "settings"
  | "refresh"
  | "lock"
  | "database"
  | "clock"
  | "alert"
  | "arrow"
  | "check"
  | "server";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  let artwork: ReactNode;

  switch (name) {
    case "grid":
      artwork = <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>;
      break;
    case "activity":
      artwork = <path d="M3 12h4l3-8 4 16 3-8h4" />;
      break;
    case "sliders":
      artwork = <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" /></>;
      break;
    case "wallet":
      artwork = <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2" /></>;
      break;
    case "shield":
      artwork = <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>;
      break;
    case "file":
      artwork = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>;
      break;
    case "settings":
      artwork = <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.4-2.4 1.4-1.1A7 7 0 0 1 7 13l-1.8-.3V9.9L7 9.6a7 7 0 0 1 .7-1.7L6.3 6.8l1.4-2.4 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 .7 1.7l1.8.3v2.8l-1.8.3a7 7 0 0 1-.4 2Z" /></>;
      break;
    case "refresh":
      artwork = <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" /></>;
      break;
    case "lock":
      artwork = <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" /></>;
      break;
    case "database":
      artwork = <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>;
      break;
    case "clock":
      artwork = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
      break;
    case "alert":
      artwork = <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 17h.01" /></>;
      break;
    case "arrow":
      artwork = <><path d="M5 12h14M13 6l6 6-6 6" /></>;
      break;
    case "check":
      artwork = <path d="m5 12 4 4L19 6" />;
      break;
    case "server":
      artwork = <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" /></>;
      break;
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon"
    >
      {artwork}
    </svg>
  );
}

function formatINR(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatINRPrecise(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function StatusPill({
  tone,
  children
}: {
  tone: "blue" | "amber" | "muted" | "red";
  children: ReactNode;
}) {
  return <span className={"status-pill status-" + tone}>{children}</span>;
}

function MetricCard({
  label,
  value,
  note,
  icon
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
}) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span className="metric-label">{label}</span>
        <span className="metric-icon"><Icon name={icon} size={17} /></span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function DashboardPage({
  health,
  account,
  risk,
  apiOnline,
  loading,
  onNavigate
}: {
  health: HealthResponse | null;
  account: PaperAccount | null;
  risk: RiskDefaults | null;
  apiOnline: boolean;
  loading: boolean;
  onNavigate: (page: Page) => void;
}) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow">RESEARCH WORKSPACE</div>
          <h2>Build evidence. Protect capital.</h2>
          <p>Research first. Paper trade only after the data and strategy pass the gates.</p>
        </div>
        <div className="welcome-state">
          <span className="state-dot" />
          <span>Live orders locked</span>
          <Icon name="lock" size={15} />
        </div>
      </section>

      <section className="metric-grid" aria-label="Paper account risk summary">
        <MetricCard
          label="Virtual starting capital"
          value={formatINR(account?.starting_capital)}
          note={account?.virtual ? "Paper account only" : "Account status unavailable"}
          icon="wallet"
        />
        <MetricCard
          label="Daily loss limit"
          value={formatINR(risk?.daily_loss_limit ?? account?.daily_loss_limit)}
          note="Hard stop for the virtual account"
          icon="shield"
        />
        <MetricCard
          label="Risk per trade"
          value={formatINR(risk?.trade_risk_limit ?? account?.max_trade_risk)}
          note="Reject trades above this amount"
          icon="alert"
        />
        <MetricCard
          label="Maximum open positions"
          value={risk ? String(risk.max_open_positions) : account ? String(account.max_open_positions) : "—"}
          note="Current backend default"
          icon="activity"
        />
      </section>

      <section className="content-grid">
        <article className="panel system-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">SYSTEM STATUS</div>
              <h3>Research environment</h3>
            </div>
            <StatusPill tone={apiOnline ? "blue" : "red"}>
              {loading ? "Checking" : apiOnline ? "API online" : "API offline"}
            </StatusPill>
          </div>
          <div className="status-list">
            <StatusRow
              icon="server"
              title="FastAPI backend"
              detail={health?.status === "ok" ? "Health check responded successfully" : "Health check unavailable"}
              status={apiOnline ? "Available" : "Unavailable"}
              tone={apiOnline ? "blue" : "red"}
            />
            <StatusRow
              icon="database"
              title="Historical options dataset"
              detail="Vendor sample has not been approved for research use"
              status="Not approved"
              tone="amber"
            />
            <StatusRow
              icon="activity"
              title="Broker market feed in dashboard"
              detail="Kotak API was tested separately; live feed is not integrated here"
              status="Not connected"
              tone="muted"
            />
            <StatusRow
              icon="lock"
              title="Live order placement"
              detail="The backend order endpoint rejects live orders"
              status="Blocked"
              tone="blue"
            />
          </div>
        </article>

        <article className="panel readiness-panel">
          <div className="eyebrow">RESEARCH READINESS</div>
          <h3>Do not skip the gates</h3>
          <p className="panel-copy">A strategy is not ready because the interface displays a signal. It must survive verified data, realistic costs and untouched test periods.</p>
          <div className="readiness-steps">
            <ReadinessStep number="01" title="Validate market data" detail="Waiting for vendor evidence" state="current" />
            <ReadinessStep number="02" title="Backtest with costs" detail="Blocked until data is approved" state="locked" />
            <ReadinessStep number="03" title="Out-of-sample checks" detail="Not started" state="locked" />
            <ReadinessStep number="04" title="Paper observation" detail="Not started" state="locked" />
          </div>
          <button className="text-button" onClick={() => onNavigate("reports")}>
            View research gates <Icon name="arrow" size={16} />
          </button>
        </article>
      </section>

      <section className="panel shortcuts-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">WORKSPACE</div>
            <h3>Continue in the lab</h3>
          </div>
          <span className="panel-meta">Build status: foundation</span>
        </div>
        <div className="shortcut-grid">
          <Shortcut icon="activity" title="Market data" detail="Connection and dataset status" onClick={() => onNavigate("market")} />
          <Shortcut icon="sliders" title="Strategy lab" detail="Review the experimental setup" onClick={() => onNavigate("strategy")} />
          <Shortcut icon="wallet" title="Paper trading" detail="Estimate net outcomes" onClick={() => onNavigate("paper")} />
          <Shortcut icon="shield" title="Risk controls" detail="View account limits" onClick={() => onNavigate("risk")} />
        </div>
      </section>
    </>
  );
}

function StatusRow({
  icon,
  title,
  detail,
  status,
  tone
}: {
  icon: IconName;
  title: string;
  detail: string;
  status: string;
  tone: "blue" | "amber" | "muted" | "red";
}) {
  return (
    <div className="status-row">
      <span className="status-row-icon"><Icon name={icon} size={18} /></span>
      <div className="status-row-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <StatusPill tone={tone}>{status}</StatusPill>
    </div>
  );
}

function ReadinessStep({
  number,
  title,
  detail,
  state
}: {
  number: string;
  title: string;
  detail: string;
  state: "current" | "locked";
}) {
  return (
    <div className={"readiness-step " + (state === "current" ? "step-current" : "")}>
      <span className="step-number">{number}</span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {state === "locked" && <Icon name="lock" size={14} />}
    </div>
  );
}

function Shortcut({
  icon,
  title,
  detail,
  onClick
}: {
  icon: IconName;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button className="shortcut" onClick={onClick}>
      <span className="shortcut-icon"><Icon name={icon} size={19} /></span>
      <span className="shortcut-copy"><strong>{title}</strong><small>{detail}</small></span>
      <Icon name="arrow" size={16} />
    </button>
  );
}

function MarketPage({ apiOnline }: { apiOnline: boolean }) {
  return (
    <>
      <SectionHeading
        eyebrow="DATA CONNECTIONS"
        title="Market data status"
        description="The interface does not invent prices or imply that a broker stream is connected."
      />
      <div className="metric-grid metric-grid-three">
        <MetricCard label="Backend API" value={apiOnline ? "Online" : "Offline"} note="FastAPI health endpoint" icon="server" />
        <MetricCard label="Kotak market feed" value="Not connected" note="SDK tests were separate from the dashboard" icon="activity" />
        <MetricCard label="Historical dataset" value="Not approved" note="Vendor sample still under review" icon="database" />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">CONNECTION MATRIX</div>
            <h3>Available integrations</h3>
          </div>
          <StatusPill tone="amber">Integration pending</StatusPill>
        </div>
        <div className="status-list">
          <StatusRow icon="server" title="FastAPI" detail="Dashboard to backend communication" status={apiOnline ? "Connected" : "Offline"} tone={apiOnline ? "blue" : "red"} />
          <StatusRow icon="activity" title="Kotak Neo quotes" detail="Read-only quote test succeeded outside this UI; no streaming screen yet" status="Not wired" tone="amber" />
          <StatusRow icon="database" title="Historical option candles" detail="Vendor sample converted and structurally screened; accuracy is not established" status="Under review" tone="amber" />
          <StatusRow icon="database" title="NIFTY spot candles" detail="Required for the opening-range and EMA signal inputs" status="Not loaded" tone="muted" />
        </div>
      </section>
      <div className="notice notice-amber">
        <Icon name="alert" size={19} />
        <div><strong>No live market prices shown</strong><p>Quote freshness, instrument mapping, WebSocket reconnects and stale-data detection must be implemented before this page can display trading data.</p></div>
      </div>
    </>
  );
}

function StrategyPage() {
  const rules = [
    ["Underlying signal", "NIFTY index · 5-minute candles"],
    ["Opening range", "First 15 minutes of the session"],
    ["Trend filter", "EMA 9 / EMA 21"],
    ["Entry confirmation", "Close beyond opening range, volume confirmation and next-candle confirmation"],
    ["Entry window", "09:30–14:30 IST"],
    ["Trade frequency", "Maximum 2 entries per day"],
    ["Initial stop", "20% of option premium"],
    ["Target", "40% of option premium"],
    ["Time exit", "15:15 IST"]
  ];

  return (
    <>
      <SectionHeading
        eyebrow="STRATEGY 001 · EXPERIMENTAL"
        title="Opening-range breakout"
        description="These are proposed research parameters, not a tested or recommended trading system."
      />
      <div className="notice notice-blue">
        <Icon name="alert" size={19} />
        <div><strong>Configuration preview only</strong><p>The current backend does not expose a strategy configuration or execution endpoint. Nothing on this page can trigger a backtest or broker order.</p></div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div><div className="eyebrow">CURRENT DESIGN</div><h3>Rule summary</h3></div>
          <StatusPill tone="amber">Not validated</StatusPill>
        </div>
        <div className="rule-grid">
          {rules.map(([label, value]) => (
            <div className="rule-item" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="eyebrow">RESEARCH REQUIREMENTS</div>
        <h3>What must be added before testing</h3>
        <div className="requirement-list">
          <Requirement text="Historical NIFTY spot candles aligned to the option timestamps" />
          <Requirement text="Actual option contract candles for each selected expiry and strike" />
          <Requirement text="Lot size and contract metadata by historical date" />
          <Requirement text="Bid/ask or a defensible spread and slippage model" />
          <Requirement text="Brokerage, statutory charges, expiry handling and no-trade rules" />
        </div>
      </section>
    </>
  );
}

function Requirement({ text }: { text: string }) {
  return <div className="requirement-row"><span className="requirement-mark" /><span>{text}</span></div>;
}

function PaperPage({
  account,
  onEstimate
}: {
  account: PaperAccount | null;
  onEstimate: (values: { gross_pnl: number; sell_value: number; buy_value: number; daily_pnl: number }) => Promise<PaperResult>;
}) {
  const [grossPnl, setGrossPnl] = useState("100");
  const [sellValue, setSellValue] = useState("1000");
  const [buyValue, setBuyValue] = useState("1000");
  const [dailyPnl, setDailyPnl] = useState("0");
  const [result, setResult] = useState<PaperResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);

    try {
      const values = {
        gross_pnl: Number(grossPnl),
        sell_value: Number(sellValue),
        buy_value: Number(buyValue),
        daily_pnl: Number(dailyPnl)
      };

      if (Object.values(values).some((value) => !Number.isFinite(value))) {
        throw new Error("Enter valid numbers in all fields.");
      }
      if (values.sell_value < 0 || values.buy_value < 0) {
        throw new Error("Turnover values cannot be negative.");
      }

      const response = await onEstimate(values);
      setResult(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not calculate the estimate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionHeading
        eyebrow="VIRTUAL ACCOUNT"
        title="Paper outcome calculator"
        description="This calculates a cost estimate. It does not create a persistent trade or send an order."
      />
      <section className="metric-grid metric-grid-three">
        <MetricCard label="Starting capital" value={formatINR(account?.starting_capital)} note="Virtual only" icon="wallet" />
        <MetricCard label="Daily loss limit" value={formatINR(account?.daily_loss_limit)} note="Backend default" icon="shield" />
        <MetricCard label="Max risk per trade" value={formatINR(account?.max_trade_risk)} note="Backend default" icon="alert" />
      </section>
      <section className="panel calculator-panel">
        <div className="panel-heading">
          <div><div className="eyebrow">ESTIMATE ONLY</div><h3>Enter hypothetical trade values</h3></div>
          <StatusPill tone="blue">Paper mode</StatusPill>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>Gross P&amp;L (₹)</span>
              <input type="number" step="0.01" value={grossPnl} onChange={(event) => setGrossPnl(event.target.value)} required />
            </label>
            <label className="field">
              <span>Sell turnover (₹)</span>
              <input type="number" min="0" step="0.01" value={sellValue} onChange={(event) => setSellValue(event.target.value)} required />
            </label>
            <label className="field">
              <span>Buy turnover (₹)</span>
              <input type="number" min="0" step="0.01" value={buyValue} onChange={(event) => setBuyValue(event.target.value)} required />
            </label>
            <label className="field">
              <span>Current daily P&amp;L (₹)</span>
              <input type="number" step="0.01" value={dailyPnl} onChange={(event) => setDailyPnl(event.target.value)} required />
            </label>
          </div>
          <div className="form-footer">
            <p>Uses the current backend cost model and risk gate. Charges are estimates, not a contract-note calculation.</p>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Calculating…" : "Calculate net outcome"} <Icon name="arrow" size={16} /></button>
          </div>
        </form>
        {error && <div className="inline-error" role="alert">{error}</div>}
        {result && (
          <div className="result-panel" aria-live="polite">
            <div className="result-top">
              <div><span className="eyebrow">ESTIMATED NET P&amp;L</span><strong className={result.net_pnl >= 0 ? "number-positive" : "number-negative"}>{formatINRPrecise(result.net_pnl)}</strong></div>
              <StatusPill tone={result.risk_ok ? "blue" : "red"}>{result.risk_ok ? "Within trade-risk check" : "Risk check failed"}</StatusPill>
            </div>
            <div className="result-breakdown">
              <span>Gross P&amp;L <strong>{formatINRPrecise(result.gross_pnl)}</strong></span>
              <span>Estimated charges <strong>{formatINRPrecise(result.costs.estimated_total)}</strong></span>
              <span>Estimated slippage <strong>{formatINRPrecise(result.slippage)}</strong></span>
              <span>Illustrative ending capital <strong>{formatINRPrecise(result.ending_capital)}</strong></span>
            </div>
            <p className="result-caution">This estimate is not saved to the account ledger. The current backend does not maintain persistent paper positions or trade history.</p>
          </div>
        )}
      </section>
    </>
  );
}

function RiskPage({
  account,
  risk
}: {
  account: PaperAccount | null;
  risk: RiskDefaults | null;
}) {
  return (
    <>
      <SectionHeading
        eyebrow="CAPITAL PROTECTION"
        title="Risk limits"
        description="Read-only values from the existing FastAPI endpoints. Editable, persisted controls are a later milestone."
      />
      <section className="metric-grid metric-grid-three">
        <MetricCard label="Virtual capital" value={formatINR(risk?.capital ?? account?.starting_capital)} note="Starting balance" icon="wallet" />
        <MetricCard label="Daily loss limit" value={formatINR(risk?.daily_loss_limit ?? account?.daily_loss_limit)} note="2% of configured capital" icon="shield" />
        <MetricCard label="Risk per trade" value={formatINR(risk?.trade_risk_limit ?? account?.max_trade_risk)} note="1% of configured capital" icon="alert" />
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div><div className="eyebrow">CURRENT BACKEND DEFAULTS</div><h3>Risk policy</h3></div>
          <StatusPill tone="blue">Read only</StatusPill>
        </div>
        <div className="rule-grid">
          <div className="rule-item"><span>Maximum open positions</span><strong>{risk?.max_open_positions ?? account?.max_open_positions ?? "—"}</strong></div>
          <div className="rule-item"><span>Live trading</span><strong>Disabled</strong></div>
          <div className="rule-item"><span>Position sizing helper</span><strong>Backend function exists</strong></div>
          <div className="rule-item"><span>Persistent risk settings</span><strong>Not implemented</strong></div>
        </div>
      </section>
      <div className="notice notice-amber">
        <Icon name="alert" size={19} />
        <div><strong>Important backend limitation</strong><p>The current paper endpoint performs a basic risk check using the submitted gross loss. It is not yet a complete portfolio-level risk engine and should not be treated as one.</p></div>
      </div>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <SectionHeading
        eyebrow="EVIDENCE, NOT ASSUMPTIONS"
        title="Research reports"
        description="The report endpoint exists, but there is no approved dataset loaded into the application."
      />
      <section className="empty-state panel">
        <span className="empty-icon"><Icon name="database" size={27} /></span>
        <StatusPill tone="amber">Backtesting on hold</StatusPill>
        <h3>No approved dataset available</h3>
        <p>The vendor sample is only three trading days and has unresolved missing-minute, zero-volume and OI questions. It is not sufficient for a strategy conclusion.</p>
        <div className="empty-checks">
          <span><Icon name="check" size={15} /> File structure screened</span>
          <span><Icon name="clock" size={15} /> Vendor data accuracy not verified</span>
          <span><Icon name="lock" size={15} /> Backtest execution withheld</span>
        </div>
      </section>
    </>
  );
}

function SettingsPage({ health, apiOnline }: { health: HealthResponse | null; apiOnline: boolean }) {
  return (
    <>
      <SectionHeading
        eyebrow="APPLICATION"
        title="Settings and integrations"
        description="A safe read-only overview of the current application setup."
      />
      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">ENVIRONMENT</div><h3>Application configuration</h3></div><StatusPill tone="blue">Research only</StatusPill></div>
        <div className="rule-grid">
          <div className="rule-item"><span>Frontend</span><strong>React + Vite + TypeScript</strong></div>
          <div className="rule-item"><span>Backend</span><strong>Python + FastAPI</strong></div>
          <div className="rule-item"><span>API status</span><strong>{apiOnline ? "Connected" : "Unavailable"}</strong></div>
          <div className="rule-item"><span>Backend mode</span><strong>{health?.mode ?? "—"}</strong></div>
          <div className="rule-item"><span>Build label</span><strong>{health?.build ?? "—"}</strong></div>
          <div className="rule-item"><span>Live order support</span><strong>Hard blocked</strong></div>
        </div>
      </section>
      <div className="notice notice-blue">
        <Icon name="lock" size={19} />
        <div><strong>Keep broker credentials out of the browser</strong><p>Broker authentication and tokens must remain in a protected backend environment. This dashboard intentionally has no input for MPIN, TOTP seed or access tokens.</p></div>
      </div>
      <section className="panel">
        <div className="eyebrow">NEXT CONFIGURATION WORK</div>
        <h3>Not yet editable from this screen</h3>
        <div className="requirement-list">
          <Requirement text="Persist paper-capital and risk settings in the backend" />
          <Requirement text="Add a protected broker connection service and quote freshness checks" />
          <Requirement text="Add validated dataset import and provenance records" />
          <Requirement text="Add audit logs for settings and paper activity" />
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [risk, setRisk] = useState<RiskDefaults | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardData() {
      setLoading(true);
      setLoadError("");

      const healthResult = await getApi<HealthResponse>("/api/health", controller.signal)
        .then((value) => ({ ok: true as const, value }))
        .catch((error: unknown) => ({ ok: false as const, error }));

      if (controller.signal.aborted) return;

      if (healthResult.ok) {
        setHealth(healthResult.value);
        setApiOnline(true);
      } else {
        setApiOnline(false);
        setLoadError(healthResult.error instanceof Error ? healthResult.error.message : "Backend API is unavailable.");
      }

      const [accountResult, riskResult] = await Promise.allSettled([
        getApi<PaperAccount>("/api/paper/account", controller.signal),
        getApi<RiskDefaults>("/api/risk/defaults?capital=5000", controller.signal)
      ]);

      if (controller.signal.aborted) return;

      if (accountResult.status === "fulfilled") setAccount(accountResult.value);
      if (riskResult.status === "fulfilled") setRisk(riskResult.value);
      setLoading(false);
    }

    void loadDashboardData();

    return () => controller.abort();
  }, [refreshKey]);

  async function estimatePaperTrade(values: {
    gross_pnl: number;
    sell_value: number;
    buy_value: number;
    daily_pnl: number;
  }): Promise<PaperResult> {
    return postApi<PaperResult>("/api/paper/trade", values);
  }

  const currentPage = pageCopy[page];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FO</div>
          <div className="brand-copy"><strong>Strategy Lab</strong><span>MARKET RESEARCH</span></div>
        </div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={"nav-item " + (page === item.id ? "nav-active" : "")}
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-current={page === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.id === "reports" && <span className="nav-lock"><Icon name="lock" size={12} /></span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-mode"><span className="mode-dot" /><div><strong>Paper mode</strong><small>Live orders blocked</small></div></div>
          <div className="sidebar-version">F&amp;O STRATEGY LAB <span>·</span> 0.2</div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>F&amp;O Strategy Lab</span><span className="breadcrumb-divider">/</span><strong>{currentPage.title}</strong></div>
          <div className="topbar-actions">
            <StatusPill tone={apiOnline ? "blue" : "amber"}><span className="pill-dot" />{apiOnline ? "API connected" : loading ? "Checking API" : "API unavailable"}</StatusPill>
            <button className="icon-button" aria-label="Refresh dashboard data" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
              <Icon name="refresh" size={17} />
            </button>
            <div className="profile-chip"><span>R</span><strong>Research</strong></div>
          </div>
        </header>

        <main className="main-content">
          <div className="page-heading">
            <div><h1>{currentPage.title}</h1><p>{currentPage.subtitle}</p></div>
            <div className="page-heading-tag"><span className="mode-dot" />RESEARCH / PAPER ONLY</div>
          </div>

          {loadError && (
            <div className="inline-error api-error" role="alert">
              <Icon name="alert" size={17} />{loadError}
            </div>
          )}

          {page === "dashboard" && (
            <DashboardPage
              health={health}
              account={account}
              risk={risk}
              apiOnline={apiOnline}
              loading={loading}
              onNavigate={setPage}
            />
          )}
          {page === "market" && <MarketPage apiOnline={apiOnline} />}
          {page === "strategy" && <StrategyPage />}
          {page === "paper" && <PaperPage account={account} onEstimate={estimatePaperTrade} />}
          {page === "risk" && <RiskPage account={account} risk={risk} />}
          {page === "reports" && <ReportsPage />}
          {page === "settings" && <SettingsPage health={health} apiOnline={apiOnline} />}

          <footer className="app-footer">
            <span>Research software — not investment advice.</span>
            <span><Icon name="lock" size={13} /> Live order placement is disabled by the backend.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
