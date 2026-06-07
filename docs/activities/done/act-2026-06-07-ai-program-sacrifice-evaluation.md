---
activityId: act-2026-06-07-ai-program-sacrifice-evaluation
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch: codex/activities-inbox-ai-run-mu
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-mu-install-action-surface-audit
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-hand-development.test.ts
  - git diff --check
---

# AI-Program-Sacrifice-Evaluation

## Ziel

Die Runner-KI soll Programme, die wegen voller MU vor einer Installation getrasht werden müssten, bewusst bewerten und nur dann opfern, wenn der Installationsnutzen den Verlust klar übersteigt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Programminstallation bei voller MU darf nicht wie eine normale Installation bewertet werden; das zu trashende Programm könnte ein wichtiger Breaker oder Payoff-Träger sein.
- Follow-up zu `docs/activities/done/act-2026-05-21-runner-ai-program-install-trash-policy.md`: Der vorhandene Basisschutz für redundante Programme und einzige sichtbare Breaker soll zu einer expliziteren Opferbewertung ausgebaut werden.
- Verwandte aktuelle AI-Flächen: `RunnerRunTargetEvaluation`, `RunnerHandDevelopmentEvaluation`, `DeckCapabilityProfile`, TacticalPlans und DecisionDebug.

## Scope

- Eine kleine `ProgramSacrificeEvaluation` oder gleichwertige Bewertungsroutine einführen.
- Für jedes legal auswählbare installierte Programm bewerten:
  - aktuelle Planabhängigkeit,
  - sichtbare Breaker-Coverage und Unique-Coverage,
  - Server-/Access-Payoff,
  - Counter, gespeicherte Credits oder wiederholbare Economy,
  - Search-/Draw-/Defense-/Protection-Rolle,
  - Host-/Daemon-Abhängigkeit,
  - Wiederbeschaffbarkeit,
  - Redundanz,
  - Installations-/Sunk-Cost,
  - `sacrificePenalty` und Evidence.
- Displacement-Penalty auf Programminstallationen anwenden, die Pflicht-Trash auslösen.
- Critical-/High-Opfer stark abwerten; Low-Value- oder redundante Opfer nur erlauben, wenn das neue Programm einen klaren aktuellen Bedarf löst.
- Bei keinem akzeptablen Opfer Installation abbrechen oder stark abwerten.
- Die finale Choice bleibt ausschließlich aus `pendingChoice.options`/`LegalActions`.

## Nicht im Scope

- Keine Engine-Regeländerung und keine eigene Legalitätsberechnung.
- Keine FullState-Simulation und keine verdeckten Korp-Daten.
- Keine neue Kartensemantik, keine neuen Taktiksignale und keine Strategy-ID.
- Keine pauschale Installationssperre bei voller MU.
- Keine Protheus-AI-Freigabe als Nebeneffekt.

## Akzeptanzkriterien

- [ ] Ein einziger wichtiger Breaker oder ein aktiver Planträger wird nicht leichtfertig als MU-Opfer gewählt.
- [ ] Programme mit Countern, gespeicherten Credits, Host-/Daemon-Abhängigkeiten oder klarer Payoff-Rolle erhalten einen höheren Opfer-Malus.
- [ ] Redundante oder aktuell wertarme Programme können geopfert werden, wenn das neue Programm eine erkennbare Lücke schließt.
- [ ] Wenn kein akzeptables Opfer existiert, wird die Installation nicht gewählt oder die Folge-Choice abgebrochen.
- [ ] DecisionDebug nennt side-sicher Opferkandidat, Penalty und Grundkategorien, ohne verdeckte Informationen zu leaken.

## Umsetzungshinweise

- Die erste Version darf mit einer groben Skala `critical`, `high`, `medium`, `low` arbeiten.
- Bestehende Breaker-/Coverage- und TacticalPlan-Informationen wiederverwenden, statt eine zweite Rig-Bewertung aufzubauen.
- CardId-Sonderfälle vermeiden, soweit Funktionsrolle, Kartentyp, Counter und sichtbarer Zustand reichen.

## Ergebnisnotiz

Erledigt. Die Runner-KI bewertet Pflicht-Trash-Installationen jetzt mit einer side-sicheren `ProgramSacrificeEvaluation` aus PlayerView, LegalAction und sichtbarer Rig. Die Bewertung klassifiziert Opfer als `critical`, `high`, `medium` oder `low`, beruecksichtigt eindeutige Breaker-Coverage, Rollenwert, Counter/gespeicherten Wert, Sunk-Cost und Redundanz, und liefert redigierte Evidence wie `program_sacrifice_best_category`, `program_sacrifice_best_penalty` und `program_sacrifice_reason:*`. Die Folge-Choice nutzt dieselbe Auswahlbewertung; initiale `install_card`-Actions mit `runnerProgramTrashBeforeInstall` erhalten einen Displacement-Malus oder eine Semantic-Runtime-Exclusion, wenn kein akzeptables Opfer genug MU freimachen kann.
