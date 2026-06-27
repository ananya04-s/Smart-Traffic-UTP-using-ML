import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { motion } from "framer-motion";
import {
  aggregateByHour, aggregateByMonth, aggregateByWeather, aggregateByWeekday,
  correlationMatrix, heatmapData, type HourlyRow,
} from "@/lib/traffic-data";
import { FEATURE_IMPORTANCE, MODEL_COMPARISON } from "@/lib/traffic-model";

const C = {
  cyan: "oklch(0.82 0.16 210)",
  violet: "oklch(0.72 0.18 305)",
  amber: "oklch(0.82 0.16 75)",
  emerald: "oklch(0.78 0.16 160)",
  rose: "oklch(0.72 0.20 15)",
  grid: "oklch(1 0 0 / 0.08)",
  axis: "oklch(0.72 0.03 260)",
};

const tooltipStyle = {
  background: "oklch(0.20 0.05 268 / 0.95)",
  border: "1px solid oklch(1 0 0 / 0.12)",
  borderRadius: 12,
  color: "white",
  fontFamily: "Space Grotesk, sans-serif",
  fontSize: 12,
  backdropFilter: "blur(8px)",
} as const;

export function HourlyLineChart({ rows }: { rows: HourlyRow[] }) {
  const data = aggregateByHour(rows);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gHour" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.cyan} stopOpacity={0.7} />
            <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="hour" stroke={C.axis} fontSize={11} tickFormatter={(h) => `${h}h`} />
        <YAxis stroke={C.axis} fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="volume" stroke={C.cyan} strokeWidth={2} fill="url(#gHour)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeeklyBarChart({ rows }: { rows: HourlyRow[] }) {
  const data = aggregateByWeekday(rows);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="day" stroke={C.axis} fontSize={11} />
        <YAxis stroke={C.axis} fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
        <Bar dataKey="volume" radius={[8, 8, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i >= 5 ? C.rose : C.violet} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyLineChart({ rows }: { rows: HourlyRow[] }) {
  const data = aggregateByMonth(rows);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="date" stroke={C.axis} fontSize={10} />
        <YAxis stroke={C.axis} fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="volume" stroke={C.emerald} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeatherPieChart({ rows }: { rows: HourlyRow[] }) {
  const data = aggregateByWeather(rows);
  const palette = [C.cyan, C.violet, C.amber, C.emerald, C.rose, "oklch(0.6 0.1 260)"];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: C.axis }} />
        <Pie
          data={data} dataKey="volume" nameKey="weather"
          innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function FeatureImportanceChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={[...FEATURE_IMPORTANCE].sort((a, b) => a.importance - b.importance)}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" stroke={C.axis} fontSize={11} />
        <YAxis type="category" dataKey="feature" stroke={C.axis} fontSize={11} width={80} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
        <Bar dataKey="importance" radius={[0, 8, 8, 0]} fill={C.cyan} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ModelComparisonChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={MODEL_COMPARISON} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="model" stroke={C.axis} fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis stroke={C.axis} fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="rmse" fill={C.violet} radius={[6, 6, 0, 0]} />
        <Bar dataKey="mae" fill={C.cyan} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResidualScatter({ rows }: { rows: HourlyRow[] }) {
  const data = rows.map((r) => ({ predicted: r.predicted, residual: r.actual - r.predicted }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} />
        <XAxis dataKey="predicted" stroke={C.axis} fontSize={11} name="Predicted" />
        <YAxis dataKey="residual" stroke={C.axis} fontSize={11} name="Residual" />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} fill={C.amber} fillOpacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function Heatmap({ rows }: { rows: HourlyRow[] }) {
  const cells = heatmapData(rows);
  const max = Math.max(1, ...cells.map((c) => c.value));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid" style={{ gridTemplateColumns: "auto repeat(24, minmax(14px, 1fr))", gap: 3 }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center font-mono text-[10px] text-muted-foreground">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {days.map((d, di) => (
            <Row key={d} day={d} di={di} cells={cells} max={max} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ day, di, cells, max }: { day: string; di: number; cells: { day: number; hour: number; value: number }[]; max: number; }) {
  return (
    <>
      <div className="pr-2 text-right font-mono text-[10px] text-muted-foreground">{day}</div>
      {Array.from({ length: 24 }, (_, h) => {
        const cell = cells.find((c) => c.day === di && c.hour === h)!;
        const t = cell.value / max;
        const bg = `color-mix(in oklab, oklch(0.82 0.16 210) ${Math.round(t * 100)}%, transparent)`;
        return (
          <motion.div
            key={h}
            title={`${day} ${h}:00 — ${cell.value} veh/h`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (di * 24 + h) * 0.002 }}
            className="aspect-square rounded-[3px] ring-1 ring-white/5"
            style={{ background: bg }}
          />
        );
      })}
    </>
  );
}

export function CorrelationHeatmap({ rows }: { rows: HourlyRow[] }) {
  const { labels, cells } = correlationMatrix(rows);
  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `auto repeat(${labels.length}, minmax(48px, 1fr))`, gap: 3 }}>
        <div />
        {labels.map((l) => (
          <div key={l} className="text-center font-mono text-[10px] text-muted-foreground">{l}</div>
        ))}
        {labels.map((row, ri) => (
          <>
            <div key={`r-${row}`} className="pr-2 text-right font-mono text-[10px] text-muted-foreground">{row}</div>
            {labels.map((_, ci) => {
              const c = cells.find((x) => x.x === row && x.y === labels[ci])!;
              const v = c.value;
              const intensity = Math.min(1, Math.abs(v));
              const color = v >= 0 ? "oklch(0.82 0.16 210)" : "oklch(0.72 0.20 15)";
              const bg = `color-mix(in oklab, ${color} ${Math.round(intensity * 100)}%, transparent)`;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className="flex aspect-square items-center justify-center rounded-md font-mono text-[10px] ring-1 ring-white/5"
                  style={{ background: bg }}
                >
                  {v.toFixed(2)}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
