# Abschlussprüfung: Spielprotokoll in der Spieleübersicht

**Datum:** 21.07.2026  
**Branch:** `codex/gamebook-ui`

## Ergebnis

Abgeschlossene öffentliche Spiele bieten in der Spieleübersicht neben dem
Replay einen direkten Download des Spielprotokolls an. Der Link führt zur
bereits vorhandenen serverseitig autorisierten Gamebook-Route; die UI
übernimmt keine Berechtigungs- oder Regelentscheidung.

## Geprüft

- `corepack pnpm --filter @netgrid/web test` – 63 Testdateien, 683 Tests grün
- `corepack pnpm typecheck` – grün
- `corepack pnpm build` – grün
- `git diff --check` – grün

## Abgrenzung

Der Download wird ausschließlich bei öffentlichen, abgeschlossenen Spielen
angezeigt. Private Spielprotokolle benötigen weiterhin ihre bestehende
teilnehmergebundene Server-Autorisierung und werden deshalb nicht über die
öffentliche Spieleübersicht verlinkt.
