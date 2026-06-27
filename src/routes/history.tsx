import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, FileDown, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  clearHistory, downloadFile, loadHistory, toCSV,
} from "@/lib/storage";
import { weekdayLabel, monthLabel, type PredictionResult } from "@/lib/traffic-model";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Prediction History — SMART TRAFFIC" },
      { name: "description", content: "Browse, search and export every traffic prediction you have run, with CSV and PDF download." },
      { property: "og:title", content: "Prediction History — SMART TRAFFIC" },
      { property: "og:description", content: "Browse, search and export every traffic prediction you have run." },
    ],
  }),
  component: HistoryPage,
});

const PAGE = 10;

const TONE: Record<string, string> = {
  Low: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Medium: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  High: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "Very High": "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

function HistoryPage() {
  const [entries, setEntries] = useState<PredictionResult[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.congestion, e.input.weather, String(e.volume), weekdayLabel(e.input.weekday)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [entries, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageItems = filtered.slice(page * PAGE, page * PAGE + PAGE);

  useEffect(() => { if (page >= totalPages) setPage(0); }, [page, totalPages]);

  const onCSV = () => {
    if (filtered.length === 0) return toast.error("Nothing to export");
    downloadFile("smart-traffic-history.csv", toCSV(filtered), "text/csv");
    toast.success("CSV exported");
  };

  const onPDF = () => {
    if (filtered.length === 0) return toast.error("Nothing to export");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("SMART TRAFFIC — Prediction history", 14, 16);
    doc.setFontSize(9);
    const head = ["Time", "Hour", "Day", "Month", "Weather", "Temp", "Rain", "Volume", "Level", "Conf"];
    let y = 26;
    doc.text(head.join("   |   "), 14, y);
    y += 6;
    filtered.slice(0, 40).forEach((e) => {
      doc.text(
        [
          new Date(e.timestamp).toLocaleString(),
          `${e.input.hour}h`,
          weekdayLabel(e.input.weekday),
          monthLabel(e.input.month),
          e.input.weather,
          `${e.input.temperature}C`,
          `${e.input.rain}mm`,
          String(e.volume),
          e.congestion,
          `${(e.confidence * 100).toFixed(0)}%`,
        ].join("   |   "),
        14, y,
      );
      y += 5;
      if (y > 200) { doc.addPage(); y = 16; }
    });
    doc.save("smart-traffic-history.pdf");
    toast.success("PDF exported");
  };

  const onClear = () => {
    clearHistory();
    setEntries([]);
    toast("History cleared");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            / history
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Prediction <span className="text-gradient">history</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length.toLocaleString()} prediction{entries.length === 1 ? "" : "s"} stored locally.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 w-44 bg-white/5 pl-8"
            />
          </div>
          <Button size="sm" variant="outline" onClick={onCSV} className="border-border bg-white/5">
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={onPDF} className="border-border bg-white/5">
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClear} className="border-border bg-white/5 text-rose-300">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </header>

      <GlassCard>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No predictions yet. Head to the <span className="text-foreground">Predict</span> page to run one.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Time</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Weather</TableHead>
                  <TableHead className="text-right">Temp</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((e) => (
                  <TableRow key={e.timestamp} className="border-border/60">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(e.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {weekdayLabel(e.input.weekday)} · {e.input.hour}:00 · {monthLabel(e.input.month)}
                      {e.input.holiday && <span className="ml-2 text-[10px] text-amber-300">HOL</span>}
                    </TableCell>
                    <TableCell>{e.input.weather}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{e.input.temperature}°C</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {e.volume.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${TONE[e.congestion]}`}>
                        {e.congestion}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {(e.confidence * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {page + 1} / {totalPages} · {filtered.length} record{filtered.length === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 border-border bg-white/5"
                  disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Prev
                </Button>
                <Button size="sm" variant="outline" className="h-7 border-border bg-white/5"
                  disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
