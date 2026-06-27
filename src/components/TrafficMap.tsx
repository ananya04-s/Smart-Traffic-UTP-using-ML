import { useEffect, useRef } from "react";

interface Sensor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  volume: number; // 0..6000
}

const SENSORS: Sensor[] = [
  { id: "s1", name: "Downtown Bridge",    lat: 40.7128, lng: -74.006,  volume: 4900 },
  { id: "s2", name: "Midtown Tunnel",     lat: 40.7549, lng: -73.9706, volume: 4200 },
  { id: "s3", name: "Riverside Ramp",     lat: 40.789,  lng: -73.962,  volume: 2800 },
  { id: "s4", name: "Harbor Interchange", lat: 40.7029, lng: -74.014,  volume: 3600 },
  { id: "s5", name: "North Avenue",       lat: 40.78,   lng: -73.992,  volume: 1500 },
  { id: "s6", name: "East Corridor",      lat: 40.738,  lng: -73.95,   volume: 5200 },
  { id: "s7", name: "Civic Loop",         lat: 40.72,   lng: -73.99,   volume: 900  },
];

function color(v: number) {
  if (v >= 4500) return "#fb7185"; // rose
  if (v >= 3000) return "#fbbf24"; // amber
  if (v >= 1500) return "#22d3ee"; // cyan
  return "#34d399";                // emerald
}

export function TrafficMap() {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<unknown>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !ref.current || map.current) return;
      const m = L.map(ref.current, { zoomControl: true, attributionControl: true })
        .setView([40.74, -73.99], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(m);

      SENSORS.forEach((s) => {
        const radius = 8 + (s.volume / 6000) * 14;
        const c = color(s.volume);
        L.circleMarker([s.lat, s.lng], {
          radius,
          color: c,
          fillColor: c,
          fillOpacity: 0.55,
          weight: 2,
        })
          .bindPopup(
            `<div style="font-family:Space Grotesk,sans-serif">
               <strong style="color:#22d3ee">${s.name}</strong><br/>
               <span style="font-family:JetBrains Mono,monospace;font-size:11px">
                 ${s.volume.toLocaleString()} veh/h
               </span>
             </div>`,
          )
          .addTo(m);
      });

      map.current = m;
    })();
    return () => {
      disposed = true;
      const m = map.current as { remove?: () => void } | null;
      if (m && typeof m.remove === "function") m.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="h-[360px] w-full overflow-hidden rounded-xl ring-1 ring-white/10"
      />
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Legend color="#34d399" label="Low" />
        <Legend color="#22d3ee" label="Medium" />
        <Legend color="#fbbf24" label="High" />
        <Legend color="#fb7185" label="Very High" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
      {label}
    </span>
  );
}
