// Synthetic dataset utilities — used when no real CSV has been uploaded.
import { predict, type PredictionInput, type Weather } from "./traffic-model";

const WEATHERS: Weather[] = ["Clear", "Clouds", "Rain", "Snow", "Mist", "Thunderstorm"];

function seeded(seed: number) {
  // small mulberry32 PRNG so the dashboard is stable per render
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticHourly(hours = 24 * 7, seed = 7) {
  const rand = seeded(seed);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Math.floor(hours / 24));
  const rows = [];
  for (let i = 0; i < hours; i++) {
    const d = new Date(start.getTime() + i * 3600_000);
    const weather = WEATHERS[Math.floor(rand() * WEATHERS.length)];
    const input: PredictionInput = {
      temperature: 8 + rand() * 22,
      rain: rand() < 0.18 ? rand() * 6 : 0,
      snow: rand() < 0.05 ? rand() * 3 : 0,
      clouds: Math.round(rand() * 100),
      holiday: rand() < 0.04,
      weather,
      hour: d.getHours(),
      weekday: (d.getDay() + 6) % 7,
      month: d.getMonth() + 1,
    };
    const p = predict(input);
    // small observational noise so the "actual" series differs from prediction
    const actual = Math.max(0, Math.round(p.volume * (0.9 + rand() * 0.2)));
    rows.push({
      ts: d.toISOString(),
      date: d.toLocaleDateString(),
      hour: d.getHours(),
      weekday: input.weekday,
      month: input.month,
      weather,
      temperature: +input.temperature.toFixed(1),
      rain: +input.rain.toFixed(2),
      snow: +input.snow.toFixed(2),
      clouds: input.clouds,
      holiday: input.holiday,
      predicted: p.volume,
      actual,
      congestion: p.congestion,
    });
  }
  return rows;
}

export type HourlyRow = ReturnType<typeof generateSyntheticHourly>[number];

export function aggregateByHour(rows: HourlyRow[]) {
  const buckets: Record<number, { hour: number; total: number; n: number }> = {};
  for (const r of rows) {
    buckets[r.hour] ??= { hour: r.hour, total: 0, n: 0 };
    buckets[r.hour].total += r.actual;
    buckets[r.hour].n += 1;
  }
  return Object.values(buckets)
    .map((b) => ({ hour: b.hour, volume: Math.round(b.total / b.n) }))
    .sort((a, b) => a.hour - b.hour);
}

export function aggregateByWeekday(rows: HourlyRow[]) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets: Record<number, { day: string; total: number; n: number }> = {};
  for (const r of rows) {
    buckets[r.weekday] ??= { day: labels[r.weekday], total: 0, n: 0 };
    buckets[r.weekday].total += r.actual;
    buckets[r.weekday].n += 1;
  }
  return Array.from({ length: 7 }, (_, i) => {
    const b = buckets[i];
    return { day: labels[i], volume: b ? Math.round(b.total / b.n) : 0 };
  });
}

export function aggregateByMonth(rows: HourlyRow[]) {
  // bucket by date and average
  const byDate: Record<string, { date: string; total: number; n: number }> = {};
  for (const r of rows) {
    byDate[r.date] ??= { date: r.date.slice(0, 5), total: 0, n: 0 };
    byDate[r.date].total += r.actual;
    byDate[r.date].n += 1;
  }
  return Object.values(byDate).map((b) => ({
    date: b.date,
    volume: Math.round(b.total / b.n),
  }));
}

export function aggregateByWeather(rows: HourlyRow[]) {
  const buckets: Record<string, { weather: string; total: number; n: number }> = {};
  for (const r of rows) {
    buckets[r.weather] ??= { weather: r.weather, total: 0, n: 0 };
    buckets[r.weather].total += r.actual;
    buckets[r.weather].n += 1;
  }
  return Object.values(buckets).map((b) => ({
    weather: b.weather,
    volume: Math.round(b.total / b.n),
  }));
}

export function heatmapData(rows: HourlyRow[]) {
  // 7 days x 24 hours, average volume
  const grid: { day: number; hour: number; value: number; n: number }[] = [];
  for (let d = 0; d < 7; d++)
    for (let h = 0; h < 24; h++) grid.push({ day: d, hour: h, value: 0, n: 0 });
  for (const r of rows) {
    const c = grid[r.weekday * 24 + r.hour];
    c.value += r.actual;
    c.n += 1;
  }
  return grid.map((c) => ({
    day: c.day,
    hour: c.hour,
    value: c.n ? Math.round(c.value / c.n) : 0,
  }));
}

export function correlationMatrix(rows: HourlyRow[]) {
  const keys: (keyof HourlyRow)[] = ["hour", "temperature", "rain", "snow", "clouds", "actual"];
  const labels = ["Hour", "Temp", "Rain", "Snow", "Clouds", "Volume"];
  const arr = keys.map((k) => rows.map((r) => Number(r[k])));
  const m = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const cor = (xs: number[], ys: number[]) => {
    const mx = m(xs), my = m(ys);
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < xs.length; i++) {
      const a = xs[i] - mx, b = ys[i] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    const d = Math.sqrt(dx * dy);
    return d === 0 ? 0 : num / d;
  };
  const out: { x: string; y: string; value: number }[] = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = 0; j < keys.length; j++)
      out.push({ x: labels[i], y: labels[j], value: cor(arr[i], arr[j]) });
  return { labels, cells: out };
}
