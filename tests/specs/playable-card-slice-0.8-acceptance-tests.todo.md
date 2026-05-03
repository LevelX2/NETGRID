# Playable Card Slice 0.8 Acceptance Tests

Status: Requirements Freeze
Stand: 2026-05-03

## Artifact und Requirements

- [ ] V08-T001: V0.8-Dokumente existieren; alle Must-IDs stehen in Requirements und Testmatrix.
- [ ] V08-T001: `MVP_0.8_REQUIREMENTS_REVIEW.md` enthält `ready_for_implementation: true`.

## Karten, Manifest und Resolver

- [ ] V08-T002: Alle V0.8-Karten sind lokale Originale ohne offizielle Assets oder externe IDs als Regelquelle.
- [ ] V08-T004: Jede neue spielbare Karte hat einen expliziten Resolver.
- [ ] V08-T005: Jede neue spielbare Karte hat Manifest, Szenario, Visibility, Replay und KI-Smoke.
- [ ] V08-T006: Jede neue spielbare Karte hat Unit-Abdeckung für Kosten, Timing und Effekt.
- [ ] V08-T018: Jede neue spielbare Karte dokumentiert `local_original`.

## Decks und Matchstart

- [ ] V08-T011: V0.8-Deck-Snapshots validieren gegen Kartenstatus und Formatprofil.
- [ ] V08-T012: Import-only oder blocked Karten können keinen Matchstart erreichen.
- [ ] V08-T013: DeckHash ist stabil und Public Metadata enthält keine Kartenliste.
- [ ] V08-T014: Server revalidiert V0.8-Snapshots beim Matchstart.

## Visibility, Replay und KI

- [ ] V08-T008: PlayerViews, PublicEvents, WebSocket-, Reconnect-, Undo- und Error-Payloads leaken keine Hidden Info.
- [ ] V08-T009: V0.8-Szenarien replayen deterministisch mit StateHash.
- [ ] V08-T010: KI verwendet mit V0.8-Decks nur LegalActions und PlayerViews.
- [ ] V08-T019: V0.8-KI-Smokes laufen über mehrere Seeds ohne illegal actions oder StateHash-Drift.

## Regression

- [ ] V08-T015: Multiplayer-Smokes mit V0.8-Decks bestehen.
- [ ] V08-T016: V0.7 UI bleibt FullState-frei und asset-gated.
- [ ] V08-T020: Performance-Budget ist geprüft oder Blocker ist dokumentiert.
- [ ] V08-T021: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.
