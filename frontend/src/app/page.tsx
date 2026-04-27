"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
        <div key={i} style={{ fontSize: 12, opacity: 0.85 }}>
          {e.time?.elapsed}'{" "}
          {e.type === "Goal" && "⚽"}
          {e.detail === "Yellow Card" && "🟨"}
          {e.detail === "Red Card" && "🟥"}{" "}
          <strong>{e.player?.name || "Oyuncu bilgisi yok"}</strong>
          {" - "}
          {e.team?.name || "Takım bilgisi yok"}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const previousScores = useRef<Record<number, string>>({});

  function playGoalSound() {
    try {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);

      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch {}
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Tarayıcın bildirim desteklemiyor.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setNotificationsEnabled(true);
      playGoalSound();
    }
  }

  function checkGoalNotifications(newMatches: Match[]) {
    newMatches.forEach((m) => {
      const currentScore = `${m.homeScore}-${m.awayScore}`;
      const oldScore = previousScores.current[m.id];

      if (oldScore && oldScore !== currentScore && isLive(m.status)) {
        if (notificationsEnabled && "Notification" in window) {
          new Notification("Gol oldu! ⚽", {
            body: `${m.home} ${m.homeScore} - ${m.awayScore} ${m.away}`,
          });
        }

        playGoalSound();
      }

      previousScores.current[m.id] = currentScore;
    });
  }

  async function loadMatches() {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/matches`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const sorted = data.sort((a: Match, b: Match) => {
          const aLive = isLive(a.status);
          const bLive = isLive(b.status);
          return aLive === bLive ? 0 : aLive ? -1 : 1;
        });

        checkGoalNotifications(sorted);
        setMatches(sorted);
      }
    } catch (err) {
      console.error("Frontend error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 30000);
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const filteredMatches = matches.filter((m) => {
    if (filter === "live") return isLive(m.status);
    if (filter === "finished") return m.status === "FT";
    if (filter === "ns") return m.status === "NS";
    return true;
  });

  const bg = dark ? "#0f172a" : "#f3f4f6";
  const card = dark ? "#111827" : "white";
  const text = dark ? "#f9fafb" : "#111827";
  const muted = dark ? "#9ca3af" : "#6b7280";
  const border = dark ? "#334155" : "#e5e7eb";

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Mackolik Demo</h1>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={enableNotifications}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              cursor: "pointer",
            }}
          >
            🔔 Bildirimleri Aç
          </button>

          <button
            onClick={() => setDark(!dark)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              cursor: "pointer",
            }}
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: filter === f.key ? "#2563eb" : card,
              color: filter === f.key ? "white" : text,
              cursor: "pointer",
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      {loading && <p>Yükleniyor...</p>}

      {!loading && filteredMatches.length === 0 && (
        <p>Maç bulunamadı. API şu an veri döndürmüyor olabilir.</p>
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
                background: card,
                borderRadius: 12,
                padding: 14,
                boxShadow: dark
                  ? "0 2px 10px rgba(0,0,0,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.06)",
                border: isLive(m.status)
                  ? "2px solid #ef4444"
                  : `1px solid ${border}`,
              }}
            >
              <div style={{ fontSize: 12, color: muted }}>
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

                <div style={{ textAlign: "center", fontSize: 22, fontWeight: "bold" }}>
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
                  color: isLive(m.status) ? "#ef4444" : muted,
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