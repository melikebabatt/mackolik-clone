import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

function getTurkeyDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatMatch(m) {
  return {
    id: m.fixture.id,
    date: m.fixture.date,
    status: m.fixture.status.short,
    minute: m.fixture.status.elapsed,
    league: m.league.name,
    country: m.league.country,
    home: m.teams.home.name,
    away: m.teams.away.name,
    homeLogo: m.teams.home.logo,
    awayLogo: m.teams.away.logo,
    homeScore: m.goals.home,
    awayScore: m.goals.away,
    events: m.events || [],
  };
}

app.get("/", (req, res) => {
  res.send("Mackolik Clone Backend is running");
});

app.get("/api/matches", async (req, res) => {
  try {
    let matches = [];

    // 1) Önce canlı maçları getir
    const liveResponse = await axios.get(
      "https://v3.football.api-sports.io/fixtures",
      {
        params: { live: "all" },
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY,
        },
      }
    );

    matches = liveResponse.data.response.map(formatMatch);

    // 2) Canlı yoksa bugünkü maçları getir
    if (matches.length === 0) {
      const today = getTurkeyDate(0);

      const todayResponse = await axios.get(
        "https://v3.football.api-sports.io/fixtures",
        {
          params: { date: today },
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY,
          },
        }
      );

      matches = todayResponse.data.response.map(formatMatch);
    }

    // 3) Bugün de yoksa sadece dünkü maçları getir
    if (matches.length === 0) {
      const yesterday = getTurkeyDate(1);

      const yesterdayResponse = await axios.get(
        "https://v3.football.api-sports.io/fixtures",
        {
          params: { date: yesterday },
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY,
          },
        }
      );

      matches = yesterdayResponse.data.response.map(formatMatch);
    }

    return res.json(matches);
  } catch (err) {
    console.error("API ERROR:", err.response?.data || err.message);
    return res.json([]);
  }
});

app.get("/api/match/:id", async (req, res) => {
  try {
    const fixtureResponse = await axios.get(
      "https://v3.football.api-sports.io/fixtures",
      {
        params: { id: req.params.id },
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY,
        },
      }
    );

    const statsResponse = await axios.get(
      "https://v3.football.api-sports.io/fixtures/statistics",
      {
        params: { fixture: req.params.id },
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY,
        },
      }
    );

    res.json({
      match: fixtureResponse.data.response[0],
      statistics: statsResponse.data.response || [],
    });
  } catch (err) {
    console.error("DETAIL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "API error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});