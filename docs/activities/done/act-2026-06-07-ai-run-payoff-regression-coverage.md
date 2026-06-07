---
activityId: act-2026-06-07-ai-run-payoff-regression-coverage
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch: codex/activities-inbox-ai-run-mu
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-run-payoff-hints-consumer
resultArtifacts:
  - packages/ai/src/runner-run-target-evaluation.ts
  - packages/ai/src/runner-run-target-evaluation.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts
  - git diff --check
---

# AI-Run-Payoff-Regression-Coverage

## Ziel

Die neue serverbezogene Run-Payoff-Auswertung durch fokussierte AI-Regressionen absichern, damit Karten-Hints HQ-, F&E-, Remote- und Risikoentscheidungen nachvollziehbar beeinflussen, aber keine Legalität oder Hidden-Info ableiten.

## Kontext und Quellen

- Vorarbeit: `act-2026-06-07-ai-run-payoff-signal-inventory` und `act-2026-06-07-ai-run-payoff-hints-consumer`.
- `packages/ai/src/runner-run-target-evaluation.test.ts`: zentrale Testdatei für Run-Zielbewertung.
- `packages/ai/src/runner-tactical-goals.test.ts`, `packages/ai/src/tactical-plans.test.ts`, `packages/ai/src/semantic-ai-runtime-cutover.test.ts`: Folgeflächen, in denen geänderte Run-Zielbewertungen sichtbar werden können.

## Scope

- Fokussierte Tests für installierte Run-Payoff-Karten und Signalwirkung ergänzen.
- Mindestens folgende Fälle absichern:
  - HQ-Payoff-Kombination wertet HQ gegenüber neutralem F&E auf.
  - F&E-Payoff wertet F&E gegenüber neutralem HQ auf.
  - HQ- und F&E-Payoffs zusammen lassen beide Ziele als Alternativen sichtbar, aber mit nachvollziehbarer Reihenfolge.
  - Known-low oder known-no-current-payoff dämpft den passenden Serverbonus.
  - Bekannte Agenda oder frischer starker F&E-Payoff darf HQ-Doppelbonus schlagen.
  - Remote-Score-Threat darf Central-Payoff übersteuern.
  - Unbezahlbarer Pfad erzeugt keinen Run, sondern Setup-/Credit-Empfehlung.
  - Mindestens eine weitere Success-Run-/Virus-/Access-Payoff-Karte wird über Signal und nicht nur per CardId-Fallback erkannt.
- Debug-/Evidence-Prüfung für redigierte Signalhinweise ergänzen.

## Nicht im Scope

- Keine neue Runtime-Logik ohne Bezug zum Consumer-Paket.
- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.
- Keine Browser-/UI-E2E-Pflicht, solange die Änderung rein AI-intern bleibt.
- Keine Freigabe zusätzlicher Karten für AI-Decks.

## Akzeptanzkriterien

- [ ] Die fokussierten RunTargetEvaluation-Tests decken Bonus, Malus, Cap/Dämpfung und No-Legality-Grenze ab.
- [ ] Mindestens ein Test beweist, dass Signal-/Hint-Erkennung eine Karte ohne neuen CardId-Sonderfall erfasst.
- [ ] Debug-/Evidence-Ausgaben bleiben redigiert und enthalten keine verdeckten Karten oder gegnerischen Hand-/Stackinhalte.
- [ ] Die relevanten AI-Testdateien laufen erfolgreich.
- [ ] `git diff --check` läuft erfolgreich.

## Umsetzungshinweise

- Empfohlene Checks:
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
  - `git diff --check`
- Tests sollten mit synthetischen PlayerViews arbeiten und keine Runtime-Datenbank oder lokale Matchdaten benötigen.

## Ergebnisnotiz

Abgeschlossen. Die Run-Payoff-Regressionen decken jetzt HQ- und F&E-/R&D-Payoff-Vergleiche, gleichzeitige Central-Payoffs, known-low-Dämpfung, Known-Agenda-Übersteuerung, Remote-Score-Threat-Übersteuerung, unreachbare Pfade und redigierte Evidence ab.

Zusätzlich wurde der Consumer minimal ergänzt, damit künftige HQ-Info-Payoffs wie Boardwalk als `future_hq_info` bewertet werden. Die Änderung bleibt read-only und erzeugt keine Legalität.

Checks: AI-Typecheck, `runner-run-target-evaluation.test.ts`, angrenzende `runner-tactical-goals.test.ts`, `tactical-plans.test.ts`, `semantic-ai-runtime-cutover.test.ts` und `git diff --check` erfolgreich.
