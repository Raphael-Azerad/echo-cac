import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "../api/server.js";

test("context API returns place, weather, and an explicit privacy contract", async () => {
  const calls = [];
  const server = createServer({
    fetchImpl: async (url) => {
      calls.push(String(url));
      if (String(url).startsWith("https://api.open-meteo.com")) {
        return jsonResponse({
          current: { temperature_2m: 18.4, weather_code: 2 },
          current_units: { temperature_2m: "C" },
          daily: { sunrise: ["2026-09-02T06:39"], sunset: ["2026-09-02T19:33"] },
        });
      }
      if (String(url).startsWith("https://api.bigdatacloud.net")) {
        return jsonResponse({
          city: "Cupertino",
          principalSubdivision: "California",
          countryName: "United States",
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });
  const baseUrl = await listen(server);

  const response = await fetch(`${baseUrl}/api/context/moment?lat=37.33182&lon=-122.03118&date=2026-09-02`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.source, "echo-context-api");
  assert.equal(payload.place.label, "Cupertino, California, United States");
  assert.equal(payload.weather.summary, "Partly cloudy, 18C");
  assert.deepEqual(payload.privacy.received, ["lat", "lon", "date"]);
  assert.equal(payload.privacy.letterTextAccepted, false);
  assert.equal(calls.length, 2);

  await close(server);
});

test("context API rejects invalid coordinates before calling external services", async () => {
  let externalCalls = 0;
  const server = createServer({
    fetchImpl: async () => {
      externalCalls += 1;
      return jsonResponse({});
    },
  });
  const baseUrl = await listen(server);

  const response = await fetch(`${baseUrl}/api/context/moment?lat=300&lon=-122&date=2026-09-02`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, "Valid lat, lon, and date are required.");
  assert.equal(externalCalls, 0);

  await close(server);
});

function jsonResponse(payload) {
  return {
    ok: true,
    async json() {
      return payload;
    },
  };
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
