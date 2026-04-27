"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Match = {
  id: number;
  status: string;
  minute: number | null;
  date: string;
  league: string;
  country: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  events?: any[];
};

const filters = [
  { name: "Tümü", key: "all" },
  { name: "Canlı", key: "live" },
  { name: "Biten", key: "finished" },
  { name: "Başlamadı", key: "ns" },
];

function isLive(status: string) {
  return ["LIVE", "1H", "2H", "HT", "ET", "P"].includes(status);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR");
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(m: Match) {
  if (m.status === "NS") return "Başlamadı";
  if (m.status === "FT") return "Bitti";
  if (m.status === "HT") return "Devre arası";
  if (isLive(m.status)) return `CANLI ${m.minute ?? 0}'`;
  return m.status;
}

function renderEvents(events: any[] = []) {
  const important = events.filter(
    (e) =>
      e.type === "Goal" ||
      (e.type === "Card" &&
        (e.detail === "Yellow Card" || e.detail === "Red Card"))
  );

  if (important.length === 0) return null;

  return (
    <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
      {important.slice(0, 6).map((e, i) => (
        <div key={i} style={{ fontSize: 12, color: "#374151" }}>
          {e.time?.elapsed}'{" "}
          {e.type === "Goal" && "⚽"}
          {e.detail === "Yellow Card" && "🟨"}
          {e.detail === "Red Card" && "🟥"}{" "}
          {e.player?.name || "Oyuncu"} - {e.team?.name}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function loadMatches() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/matches");
      const data = await res.json();

      if (Array.isArray(data)) {
        setMatches(data);
      }
    } catch (err) {
      console.error("Frontend error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (filter === "live") return isLive(m.status);
    if (filter === "finished") return m.status === "FT";
    if (filter === "ns") return m.status === "NS";
    return true;
  });

  return (
    <main
      style={{
        padding: 20,
        fontFamily: "Arial",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <h1>Mackolik Demo</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: filter === f.key ? "#111827" : "white",
              color: filter === f.key ? "white" : "#111827",
              cursor: "pointer",
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      {loading && <p>Yükleniyor...</p>}

      {!loading && filteredMatches.length === 0 && (
        <p>Bu filtrede maç bulunamadı.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filteredMatches.map((m) => (
          <Link
            key={m.id}
            href={`/match/${m.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: isLive(m.status)
                  ? "2px solid #ef4444"
                  : "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {m.league} • {formatDate(m.date)} - {formatTime(m.date)}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 1fr",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={m.homeLogo} width={28} height={28} alt="" />
                  <strong>{m.home}</strong>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: "bold",
                  }}
                >
                  {m.homeScore ?? "-"} - {m.awayScore ?? "-"}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <strong>{m.away}</strong>
                  <img src={m.awayLogo} width={28} height={28} alt="" />
                </div>
              </div>

              {renderEvents(m.events)}

              <div
                className={isLive(m.status) ? "liveBlink" : ""}
                style={{
                  marginTop: 8,
                  color: isLive(m.status) ? "#dc2626" : "#6b7280",
                  fontWeight: isLive(m.status) ? "bold" : "normal",
                }}
              >
                {formatStatus(m)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .liveBlink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          50% {
            opacity: 0.35;
          }
        }
      `}</style>
    </main>
  );
}