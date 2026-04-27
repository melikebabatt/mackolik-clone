"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getStat(stats: any[], teamIndex: number, type: string) {
  return (
    stats?.[teamIndex]?.statistics?.find((s: any) => s.type === type)?.value ??
    "-"
  );
}

function toNumber(value: any) {
  if (value === null || value === undefined || value === "-") return 0;
  if (typeof value === "string" && value.includes("%")) {
    return Number(value.replace("%", ""));
  }
  return Number(value) || 0;
}

function renderEventIcon(e: any) {
  if (e.type === "Goal") return "⚽";
  if (e.detail === "Yellow Card") return "🟨";
  if (e.detail === "Red Card") return "🟥";
  return "•";
}

export default function MatchDetail({ params }: any) {
  const [data, setData] = useState<any>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDark(true);

    fetch(`${API_BASE}/api/match/${params.id}`)
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [params.id]);

  const bg = dark ? "#0f172a" : "#f3f4f6";
  const card = dark ? "#111827" : "white";
  const text = dark ? "#f9fafb" : "#111827";
  const muted = dark ? "#9ca3af" : "#6b7280";
  const border = dark ? "#334155" : "#e5e7eb";

  if (!data) return <p style={{ padding: 20 }}>Yükleniyor...</p>;

  const match = data.match;
  const statistics = data.statistics || [];
  const events = match?.events || [];

  if (!match) return <p style={{ padding: 20 }}>Maç bulunamadı.</p>;

  const statTypes = [
    "Ball Possession",
    "Total Shots",
    "Shots on Goal",
    "Corner Kicks",
    "Fouls",
    "Yellow Cards",
    "Red Cards",
    "Offsides",
  ];

  return (
    <main
      style={{
        padding: 20,
        fontFamily: "Arial",
        background: bg,
        color: text,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: card,
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ textAlign: "center" }}>{match.league.name}</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 1fr",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img src={match.teams.home.logo} width={54} alt="" />
            <h3>{match.teams.home.name}</h3>
          </div>

          <div style={{ textAlign: "center", fontSize: 32, fontWeight: "bold" }}>
            {match.goals.home ?? "-"} - {match.goals.away ?? "-"}
          </div>

          <div style={{ textAlign: "center" }}>
            <img src={match.teams.away.logo} width={54} alt="" />
            <h3>{match.teams.away.name}</h3>
          </div>
        </div>
      </div>

      <div
        style={{
          background: card,
          borderRadius: 14,
          padding: 20,
          marginTop: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: `1px solid ${border}`,
        }}
      >
        <h3>Gol / Kart Dakikaları</h3>

        {events.length === 0 && <p style={{ color: muted }}>Bu maç için olay bilgisi yok.</p>}

        {events.map((e: any, i: number) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${border}` }}>
            {e.time?.elapsed}' {renderEventIcon(e)}{" "}
            <strong>{e.player?.name || "Oyuncu"}</strong> — {e.team?.name}{" "}
            <span style={{ color: muted }}>({e.detail})</span>
          </div>
        ))}
      </div>

      <div
        style={{
          background: card,
          borderRadius: 14,
          padding: 20,
          marginTop: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: `1px solid ${border}`,
        }}
      >
        <h3>İstatistikler</h3>

        {statistics.length < 2 && (
          <p style={{ color: muted }}>Bu maç için istatistik bilgisi yok.</p>
        )}

        {statistics.length >= 2 && (
          <div style={{ display: "grid", gap: 14 }}>
            {statTypes.map((type) => {
              const homeValue = getStat(statistics, 0, type);
              const awayValue = getStat(statistics, 1, type);

              const h = toNumber(homeValue);
              const a = toNumber(awayValue);
              const total = h + a || 1;

              const homePercent =
                type === "Ball Possession" ? h : Math.round((h / total) * 100);
              const awayPercent =
                type === "Ball Possession" ? a : Math.round((a / total) * 100);

              return (
                <div key={type}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 60px",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <strong>{homeValue}</strong>
                    <div style={{ textAlign: "center", color: muted }}>{type}</div>
                    <strong style={{ textAlign: "right" }}>{awayValue}</strong>
                  </div>

                  <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${homePercent}%`, background: "#2563eb" }} />
                    <div style={{ width: `${awayPercent}%`, background: "#ef4444" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}