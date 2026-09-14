# Echo Context API

Last reviewed: 2026-09-02

Echo's context API exists to support the larger product position: preserve a human, a place, and a time. It enriches an Echo with outside-world context while keeping the private letter local.

## Privacy Boundary

The frontend calls `GET /api/context/moment` with only:

- `lat`
- `lon`
- `date`

The API does not need, accept, or store title text, letter text, mood, goals, attachments, voice, or video. The browser test suite includes a regression test that fills a letter, captures moment context, and verifies the network request contains no letter content and no request body.

## Endpoints

### `GET /api/health`

Returns service health and a small privacy contract.

### `GET /api/context/moment?lat=37.33182&lon=-122.03118&date=2026-09-02`

Returns structured context:

- captured timestamp
- source
- date
- rounded coordinates
- reverse-geocoded place label
- weather summary
- sunrise and sunset when available
- privacy contract

## External Data Sources

The server uses no browser API keys. Current public, no-key enrichment sources:

- Open-Meteo for weather and daylight context.
- BigDataCloud reverse geocode client for readable place names.

If either external request fails, the API returns partial context instead of failing the whole product story.

## Docker

Run the full prototype with:

```sh
docker compose up --build
```

Services:

- `echo-web`: static frontend on `http://localhost:4174`
- `echo-context-api`: context API on `http://localhost:8787`

The Docker layer is intentionally small. Echo remains local-first; the API enriches the moment around a letter, not the letter itself.
