# Classic AI Hint Semantics Final Report

Datum: 2026-07-01

Status: abgeschlossen.

## Ergebnis

Der Classic-AI-Hint-Semantikprozess `CLASSIC-AI-00` bis `CLASSIC-AI-07` ist vollständig abgearbeitet. Alle 52 Classic-Karten haben geprüfte, side-sichere und für KI-Spielbarkeit verwertbare Hint-Angaben.

| Kennzahl | Ergebnis |
| --- | ---: |
| Classic-Karten gesamt | 52 |
| `quality.hintReviewed: true` und `needsHumanReview: false` | 52 |
| Karten mit abgeleiteten Funktionssignalen | 52 |
| Karten ohne Classic-spezifische Inspector-Warnungen | 52 |
| Karten mit echten Kartenstrategieankern | 34 |
| bewusst support-only ohne künstlichen Strategieanker | 18 |
| Corp-Karten | 26 |
| Runner-Karten | 26 |

Die 18 Karten ohne Kartenstrategieanker sind bewusst support-only modelliert. Sie liefern Funktionssignale für Economy, Coverage, Survival, Setup, Derez, Tag-Entfernung oder sonstige Utility, ohne daraus eine erfundene Decklinie abzuleiten.

## Wichtige Semantikentscheidungen

- `Indiscriminate Response Team` ist kein Access-Ambush. Die Karte erhält das neue Signal `run.successful_run_grip_reset` und stützt nur `corp.central_stabilize`.
- `Reclamation Project` erhält neben `archives.corp_recovery` das support-only Signal `ice.recovery`, damit ICE-Rekursion katalogisiert ist, ohne selbst eine neue Strategie zu tragen.
- `Schematics Search Engine` nutzt konkrete HQ-/Expose-Signale und `runner.hq_pressure`; der zu breite Descriptor `information` wurde entfernt.
- `Superglue` bleibt support-only mit `ice.derez`; Tap-/Timing-Details stehen in Mechanics, Risks und TargetProfile statt als unmapped Rollen.
- Hidden-Info-Hints bleiben auf Controller-/Public-known oder aktuelle LegalAction-Kontexte begrenzt. Es wurden keine Engine-Regeln, LegalActions, `applyAction`, Replay-, StateHash- oder Randomness-Verträge geändert.

## Aktualisierte Artefakte

- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- `data/ai/tactic-signals-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/strategy-goals-v1.json`
- `docs/reviews/ai/action-semantic-signal-catalog-2026-06-12.json`
- `packages/ai/src/ai-hint-inspector-index.test.ts`

## Verifikation

Grün:

- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-action-semantic-signal-catalog`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/ai-hint-inspector-index.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

Hinweis: Ein erster breiter Package-Testaufruf über das Package-Script wurde nach 124 Sekunden abgebrochen, weil er mehr als die gezielte Testdatei ausführen wollte. Der gezielte Regressionstest ist anschließend grün gelaufen.

## Abschlussbewertung

Das Classic Set ist semantisch KI-spielbar versorgt: Jede Classic-Karte liefert mindestens ein verwertbares Funktionssignal, alle Hints sind reviewt, die Classic-spezifischen Inspector-Warnungen sind auf 0 reduziert, und Strategieanker werden nur dort gesetzt, wo eine echte Decklinie oder ein materieller Linienbeitrag vorliegt.
