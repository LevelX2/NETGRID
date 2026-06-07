---
activityId: act-2026-06-07-runner-development-tactical-mapping
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
  - act-2026-06-07-runner-hand-development-evaluation
  - act-2026-06-07-runner-credit-base-planning
resultArtifacts:
  - packages/ai/src/tactical-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/runner-tactical-goals.test.ts
checks:
  - 'PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts'
  - 'PASS: corepack pnpm --filter @netgrid/ai exec tsc --noEmit'
  - 'PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/runner-golden-deck-debug.test.ts'
  - 'PASS: git diff --check'
---

# Runner-Entwicklungsziele auf legale Install- und Setup-Aktionen mappen

## Ziel

HandDevelopment- und Creditbase-Ziele sollen die vorhandene TacticalPlan-/Action-Auswahl so beeinflussen, dass der Runner nützliche Karten tatsächlich installiert oder erst Credits aufbaut, ohne jemals Legalität selbst zu erzeugen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Der Runner trifft anscheinend selten die Zwischenentscheidung "ich baue jetzt auf" oder "ich spiele diese nützliche Karte aus".
- Vorgängerpakete:
  - `act-2026-06-07-runner-hand-development-evaluation`
  - `act-2026-06-07-runner-credit-base-planning`
- Relevante Codeanker:
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/index.ts`

## Scope

- TacticalGoals aus HandDevelopment und CreditBase in vorhandene TacticalPlan-/Action-Mapping-Pfade integrieren.
- Je nach Vertragsentscheidung bestehende Goals erweitern oder neue interne Goals ergänzen, zum Beispiel:
  - Creditbase/Economy aufbauen,
  - Plan-Enabler installieren,
  - Access-Payoff installieren,
  - Memory-Support installieren,
  - Economy-Resource installieren,
  - Defense-Support nur bei Bedarf installieren,
  - Setup-Draw/Search spielen,
  - Low-Value-Handkarte zurückstellen.
- Passende vorhandene `install_card`-, Play- oder Economy-LegalActions bevorzugen, wenn sie den priorisierten Kandidaten erfüllen.
- Übersteuerungen erhalten:
  - akuter Remote-Score-Threat,
  - bekannter Agenda-Zugriff,
  - zwingende Survival-/Tag-/Damage-Situation,
  - deutlich höherer Run-Payoff.
- Regressionen ergänzen, die belegen, dass finale Entscheidungen weiterhin aus `input.legalActions` stammen.

## Nicht im Scope

- Keine Änderung der LegalAction-Erzeugung.
- Keine Änderung daran, was eine Karte kostet, wann sie spielbar ist oder wie `applyAction` validiert.
- Keine neuen Kartenfreigaben, Hintmigrationen oder Kartensemantikänderungen.
- Keine UI-Arbeit außer eventuell bereits vorhandenen AI-Debugfacts.
- Keine Engine-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine Hidden-Info-Ausweitung.

## Akzeptanzkriterien

- [x] Ein hohes `install_access_payoff`-/Access-Payoff-Äquivalent bevorzugt eine passende legale Handkartenaktion gegenüber einem schwachen Run.
- [x] Ein hohes Memory-Support-Ziel bevorzugt passende legale Memory-Hardware bei MU-Druck.
- [x] Ein hohes Economy-/Creditbase-Ziel bevorzugt Credit-/Economy-Aktionen, wenn nützliche Karten oder Run-Kosten blockiert sind.
- [x] Defense-Karten werden ohne erkennbare Bedrohung nicht blind installiert.
- [x] Akute Score-/Agenda-/Survival-Übersteuerungen schlagen Entwicklungsziele.
- [x] Jede finale Action ist in `input.legalActions` enthalten.
- [x] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Die Mapping-Logik soll vorhandene Candidate-Semantik nutzen, soweit sie bereits stabil ist.
- Wenn ein Kandidat fachlich hoch priorisiert ist, aber keine passende LegalAction existiert, muss das als "why not" beziehungsweise Defer-Grund enden, nicht als synthetische Aktion.
- Keine globale Run-Score-Absenkung als Ersatz für gezieltes Entwicklungs-Mapping.

## Ergebnisnotiz

Abgeschlossen. `TacticalPlanBuildContext` akzeptiert jetzt `runnerHandDevelopmentEvaluations`. Die Semantic Runtime reicht diese Evaluations in `evaluateTacticalPlans` durch. `tactical-plans.ts` ergänzt zwei interne Runner-Planlinien: `runner.develop_hand_card` mit `install_development_card`-Step für bereits legale Install-/Play-/Ability-Aktionen aus eigenen Handkarten und `runner.build_credit_base` mit `gain_credits`-Step für hohe Creditbase-Priorität.

Das Mapping erzeugt keine LegalActions. `install_development_card` matched ausschließlich vorhandene LegalActions, deren Quelle/Payload auf die Zielkarte verweist. Defense-Support wird nur bei akutem Bedarf gemappt; Unknown-/Low-Value-Handkarten bleiben ausgeschlossen. Priority-Caps halten Remote-Score-Threats und starke RunTargetEvaluation-Overrides vor Entwicklungsinstallationen.

Neue Regressionen prüfen Access-Payoff-Install gegen schwachen HQ-Run, Memory-Support bei akutem Bedarf, Defense-Support ohne Bedarf, Remote-Score-Threat über Entwicklungsinstall sowie Creditbase-Economy auf vorhandene `gain_credit`-LegalAction. Alle gemappten finalen Actions werden gegen `input.legalActions` geprüft.
