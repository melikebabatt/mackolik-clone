import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;
const cache = {};

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
    let allMatches = [];

    const liveResponse = await axios.get("https://v3.football.api-sports.io/fixtures", {
      params: { live: "all" },
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
    });

    allMatches.push(...liveResponse.data.response.map(formatMatch));

    for (let i = 0; i < 7; i++) {
      const response = await axios.get("https://v3.football.api-sports.io/fixtures", {
        params: { date: getTurkeyDate(i) },
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
      });

      allMatches.push(...response.data.response.map(formatMatch));
    }

    const uniqueMatches = Array.from(
      new Map(allMatches.map((m) => [m.id, m])).values()
    );

    if (uniqueMatches.length > 0) {
      cache.all = uniqueMatches;
      return res.json(uniqueMatches);
    }

    return res.json(cache.all || []);
  } catch (err) {
    console.error("API ERROR:", err.response?.data || err.message);
    return res.json(cache.all || []);
  }
});

app.get("/api/match/:id", async (req, res) => {
  try {
    const fixtureResponse = await axios.get("https://v3.football.api-sports.io/fixtures", {
      params: { id: req.params.id },
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
    });

    const statsResponse = await axios.get("https://v3.football.api-sports.io/fixtures/statistics", {
      params: { fixture: req.params.id },
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
    });

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