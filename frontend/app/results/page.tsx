"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

// Lazy-load react-leaflet bits client-side only
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false });
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, { ssr: false });
const Tooltip = dynamic(async () => (await import("react-leaflet")).Tooltip, { ssr: false });

type Listing = {
  address: string;
  rent?: number;
  score?: number;
  reason?: string;
  coords?: { lat: number; lng: number };
  source_url?: string;
};

type PlanData = {
  status: string;
  city: string;
  summary: any;
  housing_recommendations: Listing[];
  lifestyle?: any;
  finance?: any;
  job_recommendations?: any;
};

export default function ResultsPage() {
  const [data, setData] = useState<PlanData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("nextmove_result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setData(parsed.data);
      } catch {}
    }
  }, []);

  const listings = data?.housing_recommendations ?? [];
  const markers = listings.filter(
    (l) => l.coords && typeof l.coords.lat === "number" && typeof l.coords.lng === "number"
  );

  const center = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].coords!.lat, markers[0].coords!.lng];
    // default center for “empty” map; Houston coords as fallback
    return [29.7604, -95.3698];
  }, [markers]);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", display: "grid", gap: "1.25rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Your plan for {data?.city ?? "—"}</h1>

      {data?.summary && (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: "1rem" }}>
          <strong>Summary</strong>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Cash needed: ${data.summary.cash_needed ?? "—"} • Neighborhood: {data.summary.neighborhood?.name ?? "—"}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gap: "1rem" }}>
        <strong>Apartments</strong>

        {/* Map (only shows if Leaflet loaded) */}
        <div style={{ height: 480, border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
          {/* @ts-ignore server/client type mismatch for dynamic imports is fine here */}
          <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
            {/* @ts-ignore */}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {markers.map((m, i) => (
              // @ts-ignore
              <Marker key={i} position={[m.coords!.lat, m.coords!.lng]}>
                {/* @ts-ignore */}
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div style={{ fontSize: 12 }}>
                    <strong>{m.address}</strong>
                    <br />
                    {m.rent ? `$${m.rent}/mo` : ""} {m.score ? `• score ${m.score}` : ""}
                    <br />
                    {m.reason || ""}
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* List */}
        <div style={{ display: "grid", gap: ".75rem" }}>
          {listings.map((l, i) => (
            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div><strong>{l.address}</strong></div>
                <div style={{ color: "#6b7280" }}>
                  {l.rent ? `$${l.rent}/mo` : ""} {l.score ? `• score ${l.score}` : ""}
                </div>
              </div>
              {l.reason && <div style={{ color: "#6b7280", marginTop: 6 }}>{l.reason}</div>}
              {l.source_url && (
                <a href={l.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  View listing ↗
                </a>
              )}
            </div>
          ))}
          {listings.length === 0 && <div style={{ color: "#6b7280" }}>No listings returned.</div>}
        </div>
      </section>
    </main>
  );
}
