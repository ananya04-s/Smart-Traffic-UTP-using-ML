import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { MODEL_COMPARISON, BEST_MODEL } from "@/lib/traffic-model";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SMART TRAFFIC" },
      { name: "description", content: "How the SMART TRAFFIC machine learning pipeline forecasts urban congestion: features, models, evaluation and architecture." },
      { property: "og:title", content: "About — SMART TRAFFIC" },
      { property: "og:description", content: "How the SMART TRAFFIC machine learning pipeline forecasts urban congestion." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">/ about</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          How <span className="text-gradient">SMART TRAFFIC</span> works
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          A full ML pipeline — from data cleaning and feature engineering to model comparison
          and explainable predictions — wrapped in a glassmorphism dashboard.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard title="Feature engineering">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Hour, day, weekday, month, weekend, rush-hour, peak-hour, holiday flags",
              "Categorical encoding for weather conditions",
              "Min-max normalization for temperature, rain, snow, clouds",
              "Outlier removal + missing-value imputation",
            ].map((t) => <li key={t} className="flex gap-2"><span className="text-[oklch(0.82_0.16_210)]">▸</span>{t}</li>)}
          </ul>
        </GlassCard>

        <GlassCard title="Models trained">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {MODEL_COMPARISON.map((m) => (
              <li key={m.model} className="flex items-center justify-between gap-2">
                <span className={m.model === BEST_MODEL ? "text-foreground" : ""}>
                  {m.model}
                  {m.model === BEST_MODEL && <span className="ml-2 rounded-full bg-[oklch(0.82_0.16_210)]/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[oklch(0.82_0.16_210)]">best</span>}
                </span>
                <span className="font-mono text-xs">RMSE {m.rmse} · R² {m.r2}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard title="Stack">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Frontend", "React 19 · TypeScript · Tailwind v4"],
              ["Charts", "Recharts · Leaflet"],
              ["Animation", "Framer Motion"],
              ["Backend", "FastAPI · Python 3.11"],
              ["ML", "scikit-learn · XGBoost · LightGBM"],
              ["Data", "Pandas · NumPy"],
              ["Storage", "SQLite"],
              ["Deploy", "Docker"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-white/5 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{k}</p>
                <p className="mt-1 text-sm">{v}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="API endpoints (FastAPI backend)">
          <div className="space-y-2 font-mono text-xs">
            {[
              ["GET",  "/dashboard", "Aggregate KPIs + recent rows"],
              ["POST", "/predict",   "Run inference on input features"],
              ["GET",  "/history",   "Paginated prediction log"],
              ["POST", "/upload",    "Upload CSV traffic dataset"],
              ["POST", "/retrain",   "Retrain the model from latest data"],
            ].map(([m, p, d]) => (
              <div key={p} className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${m === "GET" ? "bg-cyan-500/20 text-cyan-300" : "bg-violet-500/20 text-violet-300"}`}>{m}</span>
                  <span>{p}</span>
                </span>
                <span className="text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <GlassCard title="Project layout">
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
{`smart-traffic/
├─ frontend/           # this app — React + TanStack Start
├─ backend/
│  ├─ api/             # FastAPI routes
│  ├─ ml/              # training, preprocessing, feature engineering
│  ├─ models/          # serialized LightGBM model
│  ├─ dataset/         # synthetic + uploaded CSV
│  ├─ database.py      # SQLite layer
│  ├─ main.py          # FastAPI entry
│  ├─ requirements.txt
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md`}
        </pre>
      </GlassCard>
    </div>
  );
}
