# V1.9.21 Promotion Readiness Review

Status: ready for promotion cut, not promoted
Stand: 2026-05-13

## Gruene Vorbedingungen

- 6/6 Zielkarten haben Runtime-Definitionen ohne `WIP`-Praefix.
- 6/6 Zielkarten haben initiale deterministische Random-Probes mit `RandomDrawRecords`.
- Abgedeckte Pfade: Runner-Programm (`AI Boon`, `Boardwalk`), Runner-Event (`Playful AI`), Runner-Resource (`Quest for Cattekin`), Corp-Asset (`Schlaghund`) und Corp-Upgrade (`Rio de Janeiro City Grid`).
- PublicEvents enthalten nur oeffentliche Zufallsmetadaten.
- Replay/StateHash ist fuer alle sechs Initial-Probes stabil.
- Nicht-promotende AI-Draft-Artefakte sind vorhanden und `ai` ist gruen.
- Breiter Verify-Lauf ist gruen: JSON, catalog, engine, ai, server, web, typecheck, test, lint und build.

## Noch nicht gesetzt

- `ONR_V1_9_21_RELEASE_CARD_IDS` ist noch nicht in `packages/catalog/src/index.ts` angelegt.
- `ONR_V1_RUNTIME_RELEASE_CARD_IDS` enthaelt V1.9.21 noch nicht.
- `DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS` ist noch nicht angelegt.
- Finale AI-Artefakte ohne `draft`-Status fehlen noch.
- `apps/web/app/page.tsx` steht noch nicht auf `V1.9.21`.
- `docs/derived/V1_9_21_FINAL_REVIEW.md` fehlt noch.
- Automation-Cursor bleibt auf V1.9.21 `implementing`.

## Naechster Schnitt

1. Draft-AI-Artefakte in finale V1.9.21-Artefakte ueberfuehren.
2. Catalog-/AI-Approval-Exports fuer V1.9.21 ergaenzen.
3. Catalog-, Web- und Manifesttests auf V1.9.21 erweitern.
4. Webclient-Version auf `V1.9.21` setzen.
5. Full Checks erneut ausfuehren.
6. `docs/derived/V1_9_21_FINAL_REVIEW.md` schreiben.
7. Completion-Gate setzen, Abschlusscommit erzeugen, pushen und Cursor auf V1.9.22 setzen.
