---
activityId: act-2026-05-19-current-baseline-test-guardrails
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy:
  - act-2026-05-19-current-rules-baseline-single-source
resultArtifacts:
  - packages/engine/src/index.test.ts
  - apps/server/src/multiplayer.test.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/shared exec vitest run src/index.test.ts -t "rules baseline registry"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "V0.97 games"
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "waits for an explicit Human Corp rez|Krash breaking Filter"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "visible Archives cards"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check -- apps/server/src/multiplayer.test.ts packages/ai/src/index.test.ts packages/engine/src/index.test.ts docs/activities/in-progress/act-2026-05-19-current-baseline-test-guardrails.md
---

# Guardrails gegen Regressionstests auf falscher Baseline

## Ziel

Neue und bestehende Regressionstests sollen für aktuelles Engine-, Server- und KI-Verhalten sichtbar gegen die aktuelle Rules Baseline laufen. Ein Test darf nur dann eine historische Baseline nutzen, wenn er ausdrücklich Legacy-Kompatibilität, Migration oder Archivverhalten testet.

## Kontext und Quellen

- Nutzerentscheidung vom 2026-05-19: Für aktive Arbeit zählt die aktuelle Baseline; alte Baselines sollen später raus.
- Vorbefund: Ein Runner-KI-Test konnte einen realen Serverpfad verfehlen, weil der erzeugte Zwischenzustand nicht den aktuellen Run-/Jack-out-/Breach-Baseline-Pfad traf.
- `packages/ai/src/index.test.ts`, `apps/server/src/multiplayer.test.ts` und `packages/engine/src/index.test.ts` enthalten viele Fixture-Pfade mit expliziten oder impliziten Baselines.
- `packages/engine/src/card-pool.ts` und `packages/ai/src/index.ts` enthalten historische Card-Pool-/Simulation-Versionserkennung über Deck-IDs.

## Scope

- Test-Helfer oder Assertions einführen, die bei aktuellen Runtime-/AI-/Server-Regressionsfixtures die aktuelle Baseline prüfen.
- Runner-KI- und Server-Advance-Regressionsfälle für Run-/Jack-out-/Access explizit auf die aktuelle Baseline absichern.
- Bestehende historische Tests benennen oder gruppieren, damit sie nicht mit aktiven Verhaltenstests verwechselt werden.
- Eine kleine Such-/Check-Konvention dokumentieren, wie künftige Tests Baseline-Drift vermeiden.

## Nicht im Scope

- Vollständiges Entfernen alter Baseline-Implementierungen.
- Großflächiges Umschreiben aller historischen Tests in einem Schritt.
- Änderung der KI-Entscheidungslogik selbst, außer ein Testhelper braucht minimale Anpassung.
- Migration alter Runtime-Daten.

## Akzeptanzkriterien

- [ ] Aktuelle AI-/Engine-/Server-Regressionsfixtures schlagen fehl, wenn sie versehentlich auf einer historischen Baseline laufen.
- [ ] Der Runner-KI-Jack-out-/Access-Pfad ist mindestens in AI- und Server-Testpfad gegen `CURRENT_RULES_BASELINE` abgesichert.
- [ ] Tests mit absichtlich alter Baseline sind als Legacy-/Migration-/Archivtests erkennbar.
- [ ] Es gibt keine stillen Custom-Deck-Testpfade mehr, die durch Deck-ID-Heuristik unbemerkt auf alte Run-/Breach-Regeln fallen.
- [ ] Hidden-Info-, LegalAction-, Replay- und StateHash-Grenzen bleiben unverändert.

## Umsetzungshinweise

- Dieses Paket sollte nach `act-2026-05-19-current-rules-baseline-single-source` bearbeitet werden, damit es auf dem neuen zentralen Baseline-Namen aufbauen kann.
- Geeignete Startpunkte: `packages/ai/src/index.test.ts`, `apps/server/src/multiplayer.test.ts`, `packages/engine/src/index.test.ts`.
- Bei vielen Treffern lieber kleine Helper nutzen als überall manuelle String-Assertions einzubauen.

## Ergebnisnotiz

Erledigt: Die angefassten Runner-AI-, Server- und Engine-Regressionspfade haben explizite Guardrails auf `CURRENT_RULES_BASELINE` beziehungsweise den strukturell gleichen aktuellen Baseline-Stand. Der Serverpfad prüft den Human-Corp-Rez-Decline mit anschließendem aktuellem Runner-Jack-out-Fenster sowie den Krash/Filter-Zugriffspfad auf aktueller Baseline. Der Engine-Test stellt sicher, dass V0.97-Demo-Decks und Default-Run-Fixtures nicht mehr unbemerkt auf historische Baselines zurückfallen.

Auf Nutzerhinweis umgesetzt: Keine neuen Legacy-Rule-Tests. Der betroffene AI-Archives-Test wurde auf aktuellen Regelstand umformuliert und prüft jetzt eine aktuelle sichtbare Archives-Niedrigwert-Situation, statt eine alte 0.94-Baseline explizit weiterzutragen.

Konvention für künftige Tests: Aktuelle Runtime-/AI-/Server-Regressionen sollen `CURRENT_RULES_BASELINE` verwenden oder die erzeugte Baseline strukturell dagegen prüfen. Alte Baselines sollen nicht als neue Produkt-Regressionstests fortgeschrieben werden; vorhandene Tests werden bei Berührung auf aktuelle Regeln gehoben.
