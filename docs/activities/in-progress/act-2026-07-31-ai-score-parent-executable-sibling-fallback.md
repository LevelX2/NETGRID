---
activityId: act-2026-07-31-ai-score-parent-executable-sibling-fallback
status: in_progress
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt:
branch: codex/act-2026-07-31-twenty-four-hour-surveillance
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/match-4d7bd0eba9138d83-complete-ai-analysis-2026-07-31.md
checks: []
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

- [ ] Ein vorbereiteter Parent mit exakt ausführbarem Score- oder
      Defense-Support-Step verdrängt die Geschwisterroute weiterhin.
- [ ] Ein blockierter Parent ohne solchen Step unterdrückt eine sonst
      zulässige `new_remote`-Geschwisterroute nicht.
- [ ] Die ausgewählte Action bleibt beim bestehenden `corp.score_agenda`-
      beziehungsweise delegierten `corp.defend_servers`-Owner; kein
      Action-Fallback entsteht.
- [ ] Fokussierte Positiv-/Negativtests, Ownership-Gates, Typecheck und
      AI-Shards sind grün.

## Ergebnisnotiz

Noch offen.
