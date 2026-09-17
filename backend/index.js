import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;
const API_URL = "https://v3.football.api-sports.io/fixtures";

function getTurkeyDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

function isLive(status) {
  return ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(status);
}

app.get("/", (req, res) => {
  res.send("Mackolik Clone Backend is running");
});

app.get("/api/matches", async (req, res) => {
  try {
    const today = getTurkeyDate();

    const response = await axios.get(API_URL, {
      params: {
        date: today,
      },
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY,
      },
    });

    let matches = response.data.response.map(formatMatch);

    matches.sort((a, b) => {
      const aLive = isLive(a.status);
      const bLive = isLive(b.status);

      // Canlı maçlar en üstte
      if (aLive !== bLive) {
        return aLive ? -1 : 1;
      }

      // Sonra saate göre sırala
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    console.log(`Bugünün maçları (${today}): ${matches.length}`);

    res.json(matches);
  } catch (err) {
    console.error(
      "API ERROR:",
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "Maçlar alınamadı",
      matches: [],
    });
  }
});

app.get("/api/match/:id", async (req, res) => {
  try {
    const fixtureResponse = await axios.get(API_URL, {
      params: {
        id: req.params.id,
      },
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY,
      },
    });

    const statsResponse = await axios.get(
      "https://v3.football.api-sports.io/fixtures/statistics",
      {
        params: {
          fixture: req.params.id,
        },
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
    console.error(
      "DETAIL ERROR:",
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "API error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
