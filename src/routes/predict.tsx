import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { PredictionForm } from "@/components/PredictionForm";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Traffic — SMART TRAFFIC" },
      { name: "description", content: "Run the SMART TRAFFIC ML model with custom inputs: weather, hour, weekday, holiday and more." },
      { property: "og:title", content: "Predict Traffic — SMART TRAFFIC" },
      { property: "og:description", content: "Run the SMART TRAFFIC ML model with custom inputs and see congestion level + confidence." },
    ],
  }),
  component: PredictPage,
});

function PredictPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          / predict
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Traffic <span className="text-gradient">prediction panel</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Adjust the conditions and run inference. The model returns predicted volume,
          congestion level, confidence and per-feature contributions for explainability.
        </p>
      </header>

      <GlassCard>
        <PredictionForm />
      </GlassCard>
    </div>
  );
}
