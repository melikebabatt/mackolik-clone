"use client";

import { useEffect, useState } from "react";

function getStat(stats: any[], teamIndex: number, type: string) {
  return (
    stats?.[teamIndex]?.statistics?.find((s: any) => s.type === type)?.value ??
    "-"
  );
}

function renderEventIcon(e: any) {
  if (e.type === "Goal") return "⚽";
  if (e.detail === "Yellow Card") return "🟨";
  if (e.detail === "Red Card") return "🟥";
  return "•";
}

export default function MatchDetail({ params }: any) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:4000/api/match/${params.id}`)
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [params.id]);

  if (!data) return <p style={{ padding: 20 }}>Yükleniyor...</p>;

  const match = data.match;
  const statistics = data.statistics || [];
  const events = match?.events || [];

  if (!match) return <p style={{ padding: 20 }}>Maç bulunamadı.</p>;

  return (
    <main
      style={{
        padding: 20,
        fontFamily: "Arial",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
            <img src={match.teams.home.logo} width={50} alt="" />
            <h3>{match.teams.home.name}</h3>
          </div>

          <div style={{ textAlign: "center", fontSize: 30, fontWeight: "bold" }}>
            {match.goals.home ?? "-"} - {match.goals.away ?? "-"}
          </div>

          <div style={{ textAlign: "center" }}>
            <img src={match.teams.away.logo} width={50} alt="" />
            <h3>{match.teams.away.name}</h3>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: 20,
          marginTop: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h3>Gol / Kart Dakikaları</h3>

        {events.length === 0 && <p>Bu maç için olay bilgisi yok.</p>}

        {events.map((e: any, i: number) => (
          <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
            {e.time?.elapsed}' {renderEventIcon(e)}{" "}
            <strong>{e.player?.name || "Oyuncu"}</strong> — {e.team?.name}{" "}
            <span style={{ color: "#6b7280" }}>({e.detail})</span>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: 20,
          marginTop: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h3>İstatistikler</h3>

        {statistics.length < 2 && <p>Bu maç için istatistik bilgisi yok.</p>}

        {statistics.length >= 2 && (
          <div style={{ display: "grid", gap: 10 }}>
            {[
              "Ball Possession",
              "Total Shots",
              "Shots on Goal",
              "Corner Kicks",
              "Fouls",
              "Yellow Cards",
              "Red Cards",
              "Offsides",
            ].map((type) => (
              <div
                key={type}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 1fr",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong>{getStat(statistics, 0, type)}</strong>
                <div style={{ textAlign: "center", color: "#374151" }}>
                  {type}
                </div>
                <strong style={{ textAlign: "right" }}>
                  {getStat(statistics, 1, type)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}