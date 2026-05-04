# Playable Card Slice 0.8 Acceptance Tests

Status: Abgeschlossen
Stand: 2026-05-03

## Artifact und Requirements

- [x] V08-T001: V0.8-Dokumente existieren; alle Must-IDs stehen in Requirements und Testmatrix.
- [x] V08-T001: `MVP_0.8_REQUIREMENTS_REVIEW.md` enthält `ready_for_implementation: true`.

## Karten, Manifest und Resolver

- [x] V08-T002: Alle V0.8-Karten sind lokale Originale ohne offizielle Assets oder externe IDs als Regelquelle.
- [x] V08-T004: Jede neue spielbare Karte hat einen expliziten Resolver.
- [x] V08-T005: Jede neue spielbare Karte hat Manifest, Szenario, Visibility, Replay und KI-Smoke.
- [x] V08-T006: Jede neue spielbare Karte hat Unit-Abdeckung für Kosten, Timing und Effekt.
- [x] V08-T018: Jede neue spielbare Karte dokumentiert `local_original`.

## Decks und Matchstart

- [x] V08-T011: V0.8-Deck-Snapshots validieren gegen Kartenstatus und Formatprofil.
- [x] V08-T012: Import-only oder blocked Karten können keinen Matchstart erreichen.
- [x] V08-T013: DeckHash ist stabil und Public Metadata enthält keine Kartenliste.
- [x] V08-T014: Server revalidiert V0.8-Snapshots beim Matchstart.

## Visibility, Replay und KI

- [x] V08-T008: PlayerViews, PublicEvents, WebSocket-, Reconnect-, Undo- und Error-Payloads leaken keine Hidden Info.
- [x] V08-T009: V0.8-Szenarien replayen deterministisch mit StateHash.
- [x] V08-T010: KI verwendet mit V0.8-Decks nur LegalActions und PlayerViews.
- [x] V08-T019: V0.8-KI-Smokes laufen über mehrere Seeds ohne illegal actions oder StateHash-Drift.

## Regression

- [x] V08-T015: Multiplayer-Smokes mit V0.8-Decks bestehen.
- [x] V08-T016: V0.7 UI bleibt FullState-frei und asset-gated.
- [x] V08-T020: Performance-Budget ist geprüft oder Blocker ist dokumentiert.
- [x] V08-T021: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.

## Abschlussnachweis

- Package-Tests: Engine, AI, Server, Decks und Catalog bestanden.
- Root-Specs: Phase-1-Artefakte und Visibility Contract bestanden.
- Lokaler V0.8-Smoke: Matchstart, Deck-/Katalogpfade und AI-Smoke über drei Seeds bestanden.
- Performance-Smoke: 500 LegalAction/View-Probes in 3,31 ms; 80 Apply-Schritte in 71,01 ms.
