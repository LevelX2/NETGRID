---
activityId: act-2026-07-31-ai-score-parent-executable-sibling-fallback
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/act-2026-07-31-twenty-four-hour-surveillance
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/match-4d7bd0eba9138d83-complete-ai-analysis-2026-07-31.md
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/ai/src/plans/corp-action-disposition-contributors.ts
  - packages/ai/src/runtime/plan-first-live-runtime.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/plan-first-live-runtime.test.ts src/runtime/plan-first-live-runtime-corp-card-variant-contract.test.ts src/evaluation/decision-checkpoints/latest-two-corp-match-remediation-decision-checkpoints.test.ts src/evaluation/decision-checkpoints/match-e676-decision-checkpoints.test.ts src/evaluation/decision-checkpoints/match-7bfe-decision-checkpoints.test.ts src/evaluation/decision-checkpoints/match-74e2369-corp-regression-decision-checkpoints.test.ts src/simulation/fetal-ai-install-coverage.test.ts src/evaluation/decision-checkpoints/match-a36a9664-corp-plan-decision-checkpoints.test.ts src/evaluation/decision-checkpoints/match-3bb14-corp-remediation-decision-checkpoints.test.ts (223 passed)
  - corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/corporate-downsizing-effective-zero-score-coverage.test.ts (1 passed, 17.54 s)
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm check:ai
  - corepack pnpm check:card-function-abstraction
  - corepack pnpm test:ai:shards (4450 passed)
---

# Blockierter Score-Parent verdrängt keine ausführbare Geschwisterroute

## Ziel

Ein vorbereiteter Score-Remote soll eine alternative Agenda-Installation in
einem neuen Remote nur dann verdrängen, wenn der vorbereitete Parent in der
aktuellen Stellung selbst einen exakt ausführbaren nächsten Score- oder
Defense-Support-Step besitzt. Ein bloß vorhandener, aber blockierter Parent
darf die ausführbare Geschwisterroute nicht unterdrücken und dadurch einen
Basic-Credit-/Agenda-Overflow-Loop erzeugen.

## Kontext

- Im vollständig analysierten Spiel `match_4d7bd0eba9138d83` unterdrückte in
  den späten Zügen ein vorbereiteter Remote die `new_remote`-Variante, obwohl
  für den Parent kein ausführbarer Score- oder Schutzschritt existierte.
- Die Korp nahm daraufhin wiederholt Basic Credits, behielt eine reine
  Agenda-Hand und musste schließlich Agendas abwerfen.
- Die aktuelle Disposition
  `corp_prepared_score_parent_dominates_sibling_route` prüft das Vorhandensein
  des Parents, aber nicht dessen aktuelle Ausführbarkeit.

## Scope

- Die bestehende Parent-/Sibling-Arbitration um eine exakte
  Ausführbarkeitsbedingung ergänzen.
- Als ausführbar gelten nur aktuell gebundene LegalActions des Parent-Score-
  Steps oder seines bereits delegierten Defense-Support-Steps.
- Wenn der Parent blockiert ist, bleibt eine eigenständig zulässige
  `new_remote`-Geschwisterroute dem Score-Plan zur normalen Bewertung erhalten.
- Planinstanz, Action-ID, Step, Executor und Parent-/Support-Bindung in
  Regressionstests sichern.

## Nicht im Scope

- Kein Action-over-Plan-Fallback und keine pauschale Bevorzugung neuer
  Remotes.
- Kein neuer Score-Plan, Resolver, Override oder paralleler Owner.
- Keine Karten-ID-/Titelheuristik und keine Agenda-Abwurf-Sonderregel.
- Keine Abschwächung der bestehenden Schutz-, Kosten- oder Reserveverträge
  einer Agenda-Installation.

## Akzeptanzkriterien

- [x] Ein vorbereiteter Parent mit exakt ausführbarem Score- oder
      Defense-Support-Step verdrängt die Geschwisterroute weiterhin.
- [x] Ein blockierter Parent ohne solchen Step unterdrückt eine sonst
      zulässige `new_remote`-Geschwisterroute nicht.
- [x] Die ausgewählte Action bleibt beim bestehenden `corp.score_agenda`-
      beziehungsweise delegierten `corp.defend_servers`-Owner; kein
      Action-Fallback entsteht.
- [x] Fokussierte Positiv-/Negativtests, Ownership-Gates, Typecheck und
      AI-Shards sind grün.

## Ergebnisnotiz

Die Parent-/Sibling-Arbitration prüft jetzt nur bei einer tatsächlich
konkurrierenden bestehenden und neuen Remote-Route, ob eine der beiden Seiten
einen exakt ausführbaren aktuellen Score- oder Defense-Installationsschritt
besitzt. Ein ausführbarer vorbereiteter Parent verdrängt die Geschwisterroute
weiterhin. Ist der Parent blockiert und die neue Route selbst konkret
ausführbar, bleibt sie im bestehenden Score-Portfolio und delegiert ihren
Schutzschritt wie bisher an `corp.defend_servers`.

Reines Ziehen, Ansparen oder eine nur theoretische Agenda-Installation reicht
nicht aus, um eine neue Geschwisterroute gegen andere konkrete Pläne zu
aktivieren. Dadurch bleiben Central-Defense-, Counter-Bank- und Ambush-Verträge
unverändert. Die Prüfung ist auf echte Geschwisterkonflikte begrenzt; der
betroffene vollständige Simulationsfall benötigt isoliert 17,54 statt zuvor
35,14 Sekunden und bleibt unter dem unveränderten 30-Sekunden-Testvertrag.

Die Produktionslogik enthält keine Karten-ID- oder Kartennamenverzweigung und
führt keinen neuen Plan, Resolver, Override oder Action-Fallback ein.
