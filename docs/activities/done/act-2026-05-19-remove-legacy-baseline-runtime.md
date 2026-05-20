---
activityId: act-2026-05-19-remove-legacy-baseline-runtime
status: done
kind: cleanup
area: shared
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy:
  - act-2026-05-19-current-rules-baseline-single-source
  - act-2026-05-19-current-baseline-test-guardrails
resultArtifacts:
  - packages/shared/src/baselines.ts
  - packages/shared/src/index.ts
  - packages/shared/src/index.test.ts
  - packages/engine/src/card-pool.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/engine/src/test-fixtures/mechanic-smoke-fixtures.ts
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - apps/server/src/deck-setup.ts
checks:
  - rg -n 'MVP_0_|baselineForCardPoolVersion|cardPoolVersionForSimulation|setupUsesExpandedRules|setupUsesMvp08Rules|expect\(summary\.cardPoolVersion\)\.toBe\("0\.(1|4|8|94|95|96|97|98)\.0"\)' packages/shared/src packages/engine/src packages/ai/src apps/server/src -g '*.ts'
  - corepack pnpm --filter @netgrid/shared exec vitest run src/index.test.ts -t "rules baseline registry"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "V0.4 games|V0.8 starter decks|V0.97 games|V0.98 games"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "simulation harness|side-safe AI smokes|quality metrics"
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "V0.6 matches|private local O:NR matches|V1.2.3 decks|creates private matches"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check -- packages/shared/src/baselines.ts packages/shared/src/index.ts packages/shared/src/index.test.ts packages/engine/src/index.ts packages/engine/src/card-pool.ts packages/engine/src/index.test.ts packages/engine/src/test-fixtures/mechanic-smoke-fixtures.ts packages/ai/src/index.ts packages/ai/src/index.test.ts apps/server/src/deck-setup.ts docs/activities/in-progress/act-2026-05-19-remove-legacy-baseline-runtime.md
---

# Legacy-Baseline-Runtime aus aktiven Pfaden entfernen

## Ziel

Nach Einführung und Absicherung der aktuellen Rules Baseline soll der alte Baseline-Overhead aus aktiven Runtime-, Server-, KI- und Testpfaden entfernt werden. Historische MVP-Baselines werden nicht mehr als aktiver Kompatibilitätsvertrag mitgeschleppt.

## Kontext und Quellen

- Nutzerentscheidung vom 2026-05-19: Der private Einanwenderbetrieb braucht keine dauerhafte Unterstützung alter Regelbaselines.
- `packages/shared/src/baselines.ts` modelliert aktuell viele alte Schema-/Snapshot-Versionen.
- `packages/engine/src/card-pool.ts` koppelt Deck-IDs/Kartenpräfixe an historische Card-Pool-Versionen.
- `packages/ai/src/index.ts` enthält eigene `cardPoolVersionForSimulation`-Heuristik und Demo-Deck-Versionstypen.
- `apps/server/src/multiplayer.ts` enthält historische `baselineForMode`-Fallbacks.
- Vorbedingung: `CURRENT_RULES_BASELINE` ist eingeführt und Tests schützen aktuelle Pfade gegen Baseline-Drift.

## Scope

- Alte `MVP_0_x_BASELINE`-Konstanten aus aktiven Exports und Runtime-Entscheidungen entfernen oder auf reine Archiv-/Dokumentationsdaten reduzieren.
- Historische Card-Pool-Versionserkennung aus aktiven `createGame`, Server-Matchstart- und AI-Simulationspfaden entfernen.
- Demo-/Snapshot-IDs, die nur zur historischen Baseline-Auswahl existieren, entweder löschen, vereinheitlichen oder als Legacy-Fixtures außerhalb aktiver Pfade isolieren.
- Alte gespeicherte Matches bewusst behandeln: entweder verwerfen, inkompatibel markieren oder über einen kleinen einmaligen Migrationshinweis auf aktuellen Regelstand heben.
- Tests bereinigen, die ausschließlich alte Baseline-Abwärtskompatibilität absichern und für den privaten Betrieb keinen Wert mehr haben.

## Nicht im Scope

- Inhaltliche Änderung der aktuellen Regelmechaniken.
- Änderung von Card Facts, Runtime-Gates oder KI-Hints, außer sie hängen direkt an alter Baseline-Auswahl.
- Entfernen historischer Release-Dokumente unter `docs/releases/` oder Wissenschronik.
- Remote-/GitHub-Integration oder Datenbank-Cleanup ohne separaten Nutzerauftrag.

## Akzeptanzkriterien

- [ ] Neue Spiele, AI-Simulationen und Server-Matches kennen in aktiven Pfaden nur noch die aktuelle Rules Baseline.
- [ ] Alte Baseline-Konstanten werden nicht mehr von Engine, Server oder AI als Runtime-Auswahl genutzt.
- [ ] Historische Deck-/Card-Pool-Heuristiken können keinen aktuellen Test oder Matchstart mehr auf alte Regelstände lenken.
- [ ] Der Umgang mit alten lokalen gespeicherten Matches ist klar: inkompatibel, verworfen oder einmalig migriert.
- [ ] Entfernte Legacy-Pfade sind durch aktuelle Baseline-Regressionstests ersetzt, nicht nur gelöscht.

## Umsetzungshinweise

- Dieses Paket ist bewusst nachgelagert und sollte nicht vor den Guardrails bearbeitet werden.
- Wahrscheinlich betroffene Module: `packages/shared/src/baselines.ts`, `packages/shared/src/index.ts`, `packages/engine/src/card-pool.ts`, `packages/engine/src/index.ts`, `packages/ai/src/index.ts`, `apps/server/src/multiplayer.ts`.
- Vor dem Löschen prüfen, ob Runtime-Daten unter `data/runtime/` oder alte Backups noch geladen werden; bei Bedarf klare lokale Inkompatibilitätsmeldung bevorzugen.

## Ergebnisnotiz

Erledigt: Die aktive Rules-Baseline ist nun nur noch `CURRENT_RULES_BASELINE`. Die alten `MVP_0_x_BASELINE`-Konstanten wurden aus Shared entfernt, Shared und Engine exportieren keine historischen Baseline-Konstanten mehr, und `createGame` nutzt den Current-Default direkt statt eine Baseline aus Card-Pool-Metadaten abzuleiten.

AI-Simulationen verwenden ebenfalls keinen Deck-ID-Heuristikpfad mehr für historische Card-Pool-Versionen. `cardPoolVersionForSimulation` wurde entfernt; Simulationsergebnisse melden den aktuellen Baseline-Stand. Server-Deck-Setup-Funktionen, die historische MVP-Regelstände aus Snapshots ableiteten, wurden entfernt.

Bewusst verbleibend: historische Deck-/Snapshot-/Formatprofil-Metadaten bleiben als Kartenpool- und Datenartefakte erhalten, damit Demo-Decks, Snapshots, Redaction und Deck-Validierung weiter funktionieren. Sie wählen aber keine alten Regelbaselines mehr aus.
