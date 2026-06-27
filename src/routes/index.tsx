import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Activity, Cloud, Gauge, MapPin, TrendingUp, Wind } from "lucide-react";

import { GlassCard } from "@/components/GlassCard";
import { ClientOnly } from "@/components/ClientOnly";
import { TrafficMap } from "@/components/TrafficMap";
import {
  CorrelationHeatmap, FeatureImportanceChart, Heatmap, HourlyLineChart,
  ModelComparisonChart, MonthlyLineChart, ResidualScatter, WeatherPieChart, WeeklyBarChart,
} from "@/components/charts/TrafficCharts";
import { generateSyntheticHourly } from "@/lib/traffic-data";
import { BEST_MODEL, MODEL_COMPARISON } from "@/lib/traffic-model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SMART TRAFFIC — Live Dashboard" },
      { name: "description", content: "Live urban traffic forecasting dashboard with hourly, weekly and weather-aware charts plus an interactive sensor map." },
      { property: "og:title", content: "SMART TRAFFIC — Live Dashboard" },
      { property: "og:description", content: "Live urban traffic forecasting dashboard with hourly, weekly and weather-aware charts plus an interactive sensor map." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const rows = useMemo(() => generateSyntheticHourly(24 * 14, 7), []);
  const best = MODEL_COMPARISON.find((m) => m.model === BEST_MODEL)!;

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.actual, 0);
    const avg = Math.round(total / rows.length);
    const peak = Math.max(...rows.map((r) => r.actual));
    const congested = rows.filter((r) => r.congestion === "High" || r.congestion === "Very High").length;
    return {
      avg,
      peak,
      congestionRate: ((congested / rows.length) * 100).toFixed(1),
    };
  }, [rows]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="glass relative rounded-3xl px-6 py-12 sm:px-10 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.78_0.16_160)]" />
              Live · {BEST_MODEL} · R² {best.r2}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Forecast urban traffic <br />
              <span className="text-gradient">before it happens.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              SMART TRAFFIC blends historical sensor data, weather, holidays and time-of-day
              signals through gradient-boosted ML to forecast congestion at the city block level.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/predict"
                className="rounded-xl bg-gradient-to-r from-[oklch(0.82_0.16_210)] to-[oklch(0.72_0.18_305)] px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_24px_oklch(0.82_0.16_210_/_0.45)] transition hover:opacity-90">
                Run a prediction
              </Link>
              <Link to="/about"
                className="rounded-xl border border-border bg-white/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10">
                How it works
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Gauge}     label="Avg volume"     value={`${stats.avg.toLocaleString()}`} hint="veh/h" tone="cyan" />
        <Stat icon={TrendingUp} label="Peak today"    value={`${stats.peak.toLocaleString()}`} hint="veh/h" tone="rose" />
        <Stat icon={Activity}   label="Congested hrs" value={`${stats.congestionRate}%`}       hint="of timeline" tone="amber" />
        <Stat icon={Wind}       label="Best model"    value={BEST_MODEL}                       hint={`RMSE ${best.rmse}`} tone="violet" />
      </section>

      {/* Charts grid */}
      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard title="Hourly volume" subtitle="Average per hour, last 14 days">
          <HourlyLineChart rows={rows} />
        </GlassCard>
        <GlassCard title="Weekly profile" subtitle="By weekday">
          <WeeklyBarChart rows={rows} />
        </GlassCard>
        <GlassCard title="Daily trend" subtitle="Volume per day">
          <MonthlyLineChart rows={rows} />
        </GlassCard>
        <GlassCard title="Weather impact" subtitle="Volume share by condition">
          <WeatherPieChart rows={rows} />
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2" title="Congestion heatmap" subtitle="Day × hour">
          <Heatmap rows={rows} />
        </GlassCard>
        <GlassCard title="Feature importance" subtitle={`From ${BEST_MODEL}`}>
          <FeatureImportanceChart />
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <GlassCard title="Model comparison" subtitle="Lower is better (RMSE / MAE)">
          <ModelComparisonChart />
        </GlassCard>
        <GlassCard title="Residuals" subtitle="Actual − predicted">
          <ResidualScatter rows={rows} />
        </GlassCard>
        <GlassCard title="Correlation matrix" subtitle="Feature × feature">
          <CorrelationHeatmap rows={rows} />
        </GlassCard>
      </section>

      {/* Map */}
      <section>
        <GlassCard
          title="Sensor network"
          subtitle="Live traffic intensity by intersection"
          action={
            <span className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline-flex">
              <MapPin className="h-3 w-3" /> 7 nodes online
            </span>
          }
        >
          <ClientOnly fallback={<div className="h-[360px] animate-pulse rounded-xl bg-white/5" />}>
            <TrafficMap />
          </ClientOnly>
        </GlassCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <FeatureTile icon={Cloud} title="Weather-aware" body="Rain, snow, cloud cover and temperature are first-class inputs." />
        <FeatureTile icon={Gauge} title="Sub-second inference" body="LightGBM model serialized for fast batch + online scoring." />
        <FeatureTile icon={Activity} title="Explainable" body="SHAP-style feature contributions on every prediction." />
      </section>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, hint, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; hint: string; tone: "cyan" | "rose" | "amber" | "violet";
}) {
  const colors: Record<string, string> = {
    cyan: "from-[oklch(0.82_0.16_210)]/30",
    rose: "from-[oklch(0.72_0.20_15)]/30",
    amber: "from-[oklch(0.82_0.16_75)]/30",
    violet: "from-[oklch(0.72_0.18_305)]/30",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`glass relative overflow-hidden rounded-2xl p-5`}
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${colors[tone]} to-transparent blur-2xl`} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}

function FeatureTile({
  icon: Icon, title, body,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="glass-soft rounded-2xl p-5">
      <Icon className="h-5 w-5 text-[oklch(0.82_0.16_210)]" />
      <p className="mt-3 font-display text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
