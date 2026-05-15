# Originalset-Spotcheck 2026-05-15 Hidden Access Trace Implementation

## Ergebnis

Der sequenzielle Job `spotcheck-2026-05-15-hidden-access-trace` wurde umgesetzt. Der Lauf war ein Härtungsjob für zehn bereits decklegale Originalset-Karten; es wurden keine neuen Karten promotet und keine Katalog-/AI-Statusverträge geändert.

## Umgesetzte Härtungen

- `Fortress Respecification`: Expose-Pfad für V1.9.11 dokumentiert die Hidden-Zone-Barriere und den gewählten Server source-bound; fokussierter Test prüft wrong-side, stale State, PublicPayload-Redaction und Replay.
- `Ice and Data's Guide to the Net`: Stack-Top-Reveal publiziert genau die oberste Karte; Test sichert leeren Stack, keine darunterliegenden Stack-Leaks, Corp-View-Redaction und Replay.
- `Private LDL Access`: HQ-Run mit R&D-Access-Override bleibt source-bound; Test sichert, dass HQ-Karten ungeöffnet bleiben und PublicPayloads keine HQ-Titel leaken.
- `HQ Interface`: HQ-Multiaccess dokumentiert Basis-Access, installierten HQ-Interface-Bonus und effektive Access-Zahl öffentlich, ohne HQ-Karten zu leaken.
- `Restrictive Net Zoning`: Zwei installierte Kopien stacken servergebunden auf die Corp-ICE-Installkosten; fokussierter Test sichert den Tax-Payload.
- `Polymer Breakthrough`: Mehrere gescorte Kopien geben am Corp-Zugstart exakt entsprechend viele Credits und replayen statehash-stabil.
- `Private Cybernet Police`: Trace-5-Agendaaktion ist wrong-side-/replay-gesichert und gibt bei Erfolg exakt 1 Tag.
- `Data Naga`: Ungebrochene Programtrash-Subroutine trasht deterministisch ein installiertes Programm, publiziert nur sichtbare Definitionen und endet den Run.
- `Vacuum Link`: Rewind- und No-Rewind-Würfe sind deterministisch mit Payload und Replay/StateHash abgesichert.
- `Pacifica Regional AI`: Pacifica-spezifischer Action-Economy-Test sichert 0-Click-Grenze, source-bound Revalidation, PublicPayload und Replay.

## Geänderte Bereiche

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`

## Checks

- `corepack pnpm --filter @netgrid/engine test` - grün, 370 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 14 Testdateien / 123 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 44 Tests.
- `corepack pnpm typecheck` - grün.

## Bewertung

Alle im Job lösbaren Engine-, PublicPayload-, Hidden-Info-, Revalidation- und Replay-/StateHash-Lücken sind abgedeckt. Es bleiben keine fachlichen Blocker aus diesem Job offen.
