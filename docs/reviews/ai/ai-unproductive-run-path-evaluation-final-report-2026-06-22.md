# AI Unproductive Run Path Evaluation Final Report 2026-06-22

Status: `completed`

Branch: `codex/ai-unproductive-run-path-evaluation`

## Ergebnis

AIRUN-0 bis AIRUN-5 wurden sequenziell umgesetzt. Die Runner-KI klassifiziert sichtbare Run-Pfade mit hartem ungebrochenem Run-Lock-/Action-Tax-Effekt jetzt als unproduktiven sichtbaren Run-Pfad, wenn der Pfad keinen Access erreichen kann. Der konkrete R&D-Fall mit offen sichtbarem `Trace 5`, Runner 4 Credits und Run-Lock-Folge wird dadurch vor dem Run als `do_not_run_now` bewertet.

Die Änderung ergänzt die vorherige Trace-Bid-Effizienz: Der Trace-Bid-Fix spart Credits im Trace-Fenster; dieser Fix verhindert bereits die unnütze Run-Auswahl, wenn die sichtbare Trace-Basis mit aktuellen Runner-Credits nicht erreichbar ist.

## Umsetzung

- `packages/ai/src/visible-run-analysis.ts` trägt jetzt `knownPathBlockedByUnavoidableTraceRunLock` und unterscheidet Run-Lock-Effekte aus `initiate_trace` nach aktueller sichtbarer Runner-Credit-Kapazität.
- `packages/ai/src/runner-run-target-evaluation.ts` priorisiert harte unproduktive sichtbare Pfade vor generischem `find_breaker_first` und gibt `unproductive_visible_run_path` sowie `visible_trace_end_run_lock_unavoidable` als Evidence aus.
- `packages/ai/src/runner-run-target-evaluation.test.ts` deckt den Screenshot-nahen R&D-Fall, den bezahlbaren Trace-Gegenfall und unrezzed/unknown-safe Verhalten ab.

## Sicherheitsgrenzen

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung: Die Bewertung nutzt nur sichtbare PlayerView-ICE-/Subroutine-Daten, aktuelle Runner-Credits und vorhandene LegalActions.
- Kein `Asp`-Sonderfall: Die Klassifikation läuft über sichtbare Subroutine- und `unbrokenRunEffect`-Eigenschaften.
- Unrezzed oder nicht sicher sichtbare ICE-Pfade werden nicht als harter unproduktiver Trace-Run-Lock blockiert.

## FINAL-GREEN

Ausgeführt am 2026-06-22 im Worktree `C:\Projekte\NETGRID_AI_UNPRODUCTIVE_RUN_PATH_EVALUATION`:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts --maxWorkers=1 --testTimeout=30000
# Ergebnis: 1 Test File passed, 48 Tests passed

corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-guidance.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000
# Ergebnis: 2 Test Files passed, 46 Tests passed

corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "non-ETR harmful visible subroutine|harmful visible subroutine|visible ICE and breakers|projects known rezzed ICE paths" --maxWorkers=1 --testTimeout=30000
# Ergebnis: 1 Test File passed, 4 Tests passed, 513 skipped

corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts src/decision/semantic-shadow-decision.test.ts --maxWorkers=1 --testTimeout=30000
# Ergebnis: 2 Test Files passed, 24 Tests passed

corepack pnpm --filter @netgrid/ai test
# Ergebnis: 132 Test Files passed, 1531 Tests passed

corepack pnpm --filter @netgrid/ai typecheck
# Ergebnis: passed

git diff --check
# Ergebnis: passed
```

## Abschlussstand

Der Arbeitsbranch enthält Paketcommits für Prozess, Reproduktion, Fix und Abschlussdokumentation. Dieser Bericht ist der führende Abschlussstand für den Nutzerbefund "Run auf R&D trotz sichtbarem Trace-5-Run-Lock mit 4 Runner-Credits".
