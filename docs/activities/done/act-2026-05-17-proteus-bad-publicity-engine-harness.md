---
activityId: act-2026-05-17-proteus-bad-publicity-engine-harness
status: done
kind: test
area: engine
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-bad-publicity-loss-gate
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - packages/shared/src/api-contracts.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/page.tsx
checks:
  - "PASS: corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Bad-Publicity\""
  - "PASS: corepack pnpm --filter @netgrid/server test"
  - "PASS: corepack pnpm --filter @netgrid/shared test"
  - "PASS: corepack pnpm --filter @netgrid/engine typecheck"
  - "PASS: corepack pnpm --filter @netgrid/shared typecheck"
  - "PASS: corepack pnpm --filter @netgrid/server typecheck"
  - "PASS: corepack pnpm --filter @netgrid/web typecheck"
  - "PASS: git diff --check"
  - "FAIL (unrelated existing spotcheck): corepack pnpm --filter @netgrid/engine test -> Originalset Trace Link Post-Bid Resolver erwartet sourceDefinitionId onr_v1_181_the-springboard, bekommt onr_v1_243_fetch-4-0-1; isoliert reproduzierbar"
  - "FAIL (unrelated existing UI contract drift): corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts --passWithNoTests -> vier UI-String-Gates fehlen in apps/web/app/page.tsx"
---

# Proteus Bad-Publicity-7+-Engine-Harness

## Ziel

Der Bad-Publicity-7+-Game-End-Vertrag aus `docs/releases/proteus/bad-publicity-loss-gate-contract.md` soll durch einen engen Engine-Harness abgesichert werden, ohne Proteus-Karten zu promoten.

## Kontext und Quellen

- Vertragsartefakt: `docs/releases/proteus/bad-publicity-loss-gate-contract.md`
- Proteus-Cluster: `bad_publicity_loss_gate` in `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- Bestehende Basis: `docs/releases/mvp/mvp-0-99-hosting-virus-counters/recurring-bad-publicity-spec.md`, `docs/releases/v1/v1-1-0-setup-game-end-m2/test-matrix.md`

## Scope

- Minimalen Testpfad fuer `corp.badPublicity >= 7` als Game-End-Check definieren oder implementieren.
- Prioritaet gegen Korp-Agenda-Sieg, Runner-Agenda-Sieg, Flatline und Korp-Deckout testen.
- PublicPayload-/PlayerView-/Replay-/StateHash-Redaction fuer den neuen Ergebnisgrund absichern.

## Nicht im Scope

- Keine Proteus-Kartenpromotion.
- Keine Proteus-Decklegalitaet.
- Keine AI-Strategie fuer Bad-Publicity-Decks.
- Keine breiten Proteus-Resolver.

## Akzeptanzkriterien

- [x] Harness prueft mindestens die Matrix P-BP-T001 bis P-BP-T010 oder dokumentiert bewusst ausgelassene Faelle.
- [x] Neuer Game-End-Grund ist durch Engine-, API-/Shared-Typen und Ergebnisprojektion konsistent, falls Code umgesetzt wird.
- [x] Hidden-Info-, Replay- und StateHash-Gates bleiben gruen.

## Umsetzungshinweise

- Bevorzugt synthetische Testfixtures oder lokale Harness-Karten statt Proteus-Runtime-Promotion verwenden.
- Bei Scaldan-artigem Zufall nur Seed, `randomCounter` und `RandomDrawRecords` verwenden.
- PublicPayload darf verdeckte Hidden-Resource-Quellen nur als redigierte Quelle ausweisen.

## Ergebnisnotiz

Umgesetzt als enger Engine-/Projection-Harness ohne Proteus-Kartenpromotion: `bad_publicity_7` ist als `GameEndReason` und API-Result-Reason modelliert, `checkWinConditions` priorisiert `corp.badPublicity >= 7` vor Agenda-, Flatline- und Korp-Deckout-Ergebnissen, und PublicPayloads tragen Threshold sowie vorherigen/nachherigen Bad-Publicity-Wert. Die Tests decken P-BP-T001 bis P-BP-T010 ab: T001/T002 ueber die bestehende lokale V0.99-Bad-Publicity-Harness-Operation, T003/T004 per synthetischem Agenda-Endzustand, T005/T006 per synthetischem Flatline-/Deckout-Endzustand, T007/T010 ueber PublicPayload-/PlayerView-Leak-Assertions ohne Proteus-IDs, T008 ueber unveraenderte `randomCounter`/`RandomDrawRecords`, T009 ueber Replay/StateHash.

Keine Proteus-Karte, kein Proteus-Deck, keine AI-Hints und kein Proteus-Resolver wurden promotet. Hidden-Resource-spezifische Redaction ist im neuen Game-End-Payload-Sanitizer fuer `sourceVisibility: "redacted"` vorbereitet; ein echter Proteus-Hidden-Resource-Runtime-Pfad bleibt bewusst Nicht-Scope.

Fokussierte Checks sind gruen. Zwei breitere Bestandschecks fallen ausserhalb des Pakets: der komplette Engine-Testlauf scheitert isoliert reproduzierbar an einem bestehenden Trace-Link-Post-Bid-Spotcheck (`onr_v1_181_the-springboard` vs. `onr_v1_243_fetch-4-0-1`), und `tests/specs/visibility-contract.test.ts` scheitert an vier bestehenden UI-String-Gates in `apps/web/app/page.tsx`. Beide Befunde wurden nicht im Scope dieses Pakets behoben.
