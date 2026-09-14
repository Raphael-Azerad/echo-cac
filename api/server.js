import http from "node:http";

const DEFAULT_PORT = Number(process.env.PORT || 8787);

const weatherCodes = new Map([
  [0, "Clear sky"],
  [1, "Mostly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Fog"],
  [48, "Depositing fog"],
  [51, "Light drizzle"],
  [53, "Drizzle"],
  [55, "Heavy drizzle"],
  [61, "Light rain"],
  [63, "Rain"],
  [65, "Heavy rain"],
  [71, "Light snow"],
  [73, "Snow"],
  [75, "Heavy snow"],
  [80, "Light showers"],
  [81, "Showers"],
  [82, "Heavy showers"],
  [95, "Thunderstorm"],
]);

export function createServer({ fetchImpl = globalThis.fetch } = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "echo-context-api",
        privacy: "letters-never-required",
      });
      return;
    }

    if (url.pathname === "/api/context/moment") {
      await handleMomentContext(url, response, fetchImpl);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  });
}

async function handleMomentContext(url, response, fetchImpl) {
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));
  const date = url.searchParams.get("date") || todayInputValue();

  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180) || !validDate(date)) {
    sendJson(response, 400, { error: "Valid lat, lon, and date are required." });
    return;
  }

  const [weather, place] = await Promise.all([
    readWeather({ latitude, longitude, fetchImpl }),
    readPlace({ latitude, longitude, fetchImpl }),
  ]);

  sendJson(response, 200, {
    capturedAt: new Date().toISOString(),
    source: "echo-context-api",
    date,
    coordinates: {
      latitude: roundCoordinate(latitude),
      longitude: roundCoordinate(longitude),
    },
    place,
    weather,
    daylight: weather?.daylight || null,
    privacy: {
      received: ["lat", "lon", "date"],
      letterTextAccepted: false,
    },
  });
}

async function readWeather({ latitude, longitude, fetchImpl }) {
  if (!fetchImpl) return null;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    daily: "sunrise,sunset",
    timezone: "auto",
  }).toString();

  try {
    const response = await fetchImpl(url);
    if (!response.ok) return null;
    const payload = await response.json();
    const weatherCode = Number(payload.current?.weather_code);
    const temperature = Number(payload.current?.temperature_2m);
    const description = weatherCodes.get(weatherCode) || "Weather captured";
    const unit = payload.current_units?.temperature_2m || "C";
    return {
      summary: Number.isFinite(temperature) ? `${description}, ${Math.round(temperature)}${unit}` : description,
      temperature: Number.isFinite(temperature) ? Math.round(temperature) : null,
      unit,
      daylight: {
        sunrise: payload.daily?.sunrise?.[0] || "",
        sunset: payload.daily?.sunset?.[0] || "",
      },
    };
  } catch {
    return null;
  }
}

async function readPlace({ latitude, longitude, fetchImpl }) {
  const fallback = {
    label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    city: "",
    region: "",
    country: "",
  };
  if (!fetchImpl) return fallback;

  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  }).toString();

  try {
    const response = await fetchImpl(url);
    if (!response.ok) return fallback;
    const payload = await response.json();
    const city = payload.city || payload.locality || "";
    const region = payload.principalSubdivision || "";
    const country = payload.countryName || "";
    const label = [city, region, country].filter(Boolean).join(", ");
    return {
      label: label || fallback.label,
      city,
      region,
      country,
    };
  } catch {
    return fallback;
  }
}

function validCoordinate(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T12:00:00Z`).getTime());
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function roundCoordinate(value) {
  return Number(value.toFixed(5));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(DEFAULT_PORT, () => {
    console.log(`Echo context API listening on http://localhost:${DEFAULT_PORT}`);
  });
}
