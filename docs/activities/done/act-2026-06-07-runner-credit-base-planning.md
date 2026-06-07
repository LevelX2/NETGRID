---
activityId: act-2026-06-07-runner-credit-base-planning
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-runner-hand-development-creditbase-contract
  - act-2026-06-07-runner-hand-development-evaluation
resultArtifacts:
  - packages/ai/src/runner-run-target-evaluation.ts
  - packages/ai/src/index.ts
  - packages/ai/src/runner-tactical-goals.ts
  - packages/ai/src/tactical-plans.ts
  - packages/ai/src/runner-run-target-evaluation.test.ts
  - packages/ai/src/runner-tactical-goals.test.ts
checks:
  - 'PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/runner-golden-deck-debug.test.ts'
  - 'PASS: corepack pnpm --filter @netgrid/ai exec tsc --noEmit'
  - 'PASS: git diff --check'
---

# Runner-Creditbasis für Runs und Handentwicklung planen

## Ziel

Die Runner-KI soll Credits nicht nur für einen konkreten Run-FundingNeed aufbauen, sondern auch als Basis für Eisbrecherkosten, nützliche Handkarten und mittelfristigen Boardausbau.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Der Runner hängt oft bei 0 Credits und kommt dadurch nie in die Lage, kostenpflichtige nützliche Handkarten auszuspielen.
- Vorgängerpakete:
  - `act-2026-06-07-runner-hand-development-creditbase-contract`
  - `act-2026-06-07-runner-hand-development-evaluation`
- AI-STRAT-2 deckt `RunnerEconomyPosture` bereits für RunTargetEvaluation und Low-Credit-Situationen ab; dieses Paket erweitert die Perspektive auf Boardentwicklung.
- Relevante Codeanker:
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/tactical-plans.ts`

## Scope

- `RunnerCreditBasePlan` oder gleichwertige Erweiterung an `RunnerEconomyPosture` ergänzen.
- Neben aktuellem Run-FundingNeed berücksichtigen:
  - currentCredits,
  - minimumCreditFloor,
  - desiredCreditReserve,
  - usefulHandCardsBlockedByCredits,
  - beste HandDevelopment-Kandidaten mit FundingNeed,
  - Eisbrecher-/Run-Kostenreserve, soweit aus vorhandenen side-sicheren Daten ableitbar.
- Heuristik konservativ kalibrieren:
  - 0-2 Credits: Credit/Economy stark bevorzugen, außer High-Urgency-Run oder Survival/Agenda-Override greift.
  - 3-5 Credits: nützliche Setup-/Handkarte erlauben, wenn sie StrategicIntent und CurrentNeed klar unterstützt.
  - 6+ Credits: Druckplan eher zulassen, sofern ein gutes Ziel existiert.
- Bestehende oder vertraglich definierte TacticalGoals mit Creditbase-Evidence versorgen.
- Fokussierte AI-Tests ergänzen:
  - 0 Credits, gute 4-Kosten-Handkarte, kein hoher Run-Payoff -> Credit/Economy statt Low-Value-Run.
  - 2 Credits, aktiver High-Value-Agenda-/Remote-Score-Threat -> Notfall-Run darf Economy überstimmen.
  - 5 Credits, nützliche Setupkarte bezahlbar -> Install-/Setupziel darf schwachen Run schlagen.
  - Creditbase-Plan bleibt konservativ, wenn HandDevelopment nur Unknown-/Low-Value-Karten findet.

## Nicht im Scope

- Keine Handkarten-Rollentaxonomie selbst; die kommt aus dem Vorgängerpaket.
- Keine Action-Mapping-Umsetzung für konkrete `install_card`-LegalActions; dafür gibt es ein Folgepaket.
- Keine globale Economy-Übergewichtung und keine pauschale Run-Abwertung.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine Hidden-Info-Ausweitung.

## Akzeptanzkriterien

- [x] Creditbase-Plan nennt Credit-Floor, Reserve und Grund für Economy-/Setup-Vorrang.
- [x] Nützliche, aber aktuell zu teure Handkarten erzeugen einen FundingNeed statt ignoriert zu werden.
- [x] Low-Credit-Runner bevorzugt Credit/Economy gegen schwache Runs ohne Payoff.
- [x] High-Urgency-Runs, bekannte Agenda-Chancen und Survival-Situationen können Creditbase übersteuern.
- [x] Finale Action bleibt aus `input.legalActions`.
- [x] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Das Ziel ist ein stabiler Credit-Floor, nicht maximale Sparsamkeit.
- Wenn vorhandene EconomyPosture-Felder reichen, lieber erweitern als eine parallele zweite Economy-Welt bauen.
- Zahlenwerte testbar halten und in Evidence erklären, damit spätere Playtests leichter kalibrieren können.

## Ergebnisnotiz

Abgeschlossen. `RunnerEconomyPosture` enthält jetzt einen side-sicheren `RunnerCreditBasePlan` mit CurrentCredits, Minimum-Floor, DesiredReserve, Run-Kostenreserve, FundingNeed, nützlichen durch Credits blockierten Handkarten, bezahlbaren nützlichen Handkarten und redigierter Top-Kandidaten-Evidence. Die Heuristik bleibt konservativ: 0-2 Credits beziehungsweise echte FundingNeeds erzeugen hohe Economy-Priorität, 3-5 Credits erlauben nützliche Setup-Ausgaben, und Pressure wird erst ab 6 Credits oder durch bestehende High-Payoff-/Score-Threat-RunTargetEvaluation bevorzugt.

Die Semantic Runtime bewertet Runner-Handentwicklung nun vor EconomyPosture/RunTargetEvaluation und reicht die Evaluations in den Creditbase-Plan ein. TacticalGoals und TacticalPlan-Debugfacts führen Creditbase-Evidence redigiert weiter; konkrete Install-Action-Mapping bleibt wie vorgesehen dem Folgepaket `act-2026-06-07-runner-development-tactical-mapping` vorbehalten.

Neue Regressionen decken ab: gute 4-Kosten-Handkarte bei 0 Credits erzeugt FundingNeed und `gain_credits_first`; 5 Credits mit nützlicher legaler Setupkarte erzeugen `allow_setup_spend`; Unknown-/Low-Value-Handkarten erzeugen keinen FundingNeed; sichtbarer Remote-Score-Threat darf Creditbase übersteuern; der gemappte Economy-Schritt wählt eine vorhandene `gain_credit`-LegalAction aus `input.legalActions`.
