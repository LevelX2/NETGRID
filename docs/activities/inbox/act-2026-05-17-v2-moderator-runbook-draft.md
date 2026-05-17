---
activityId: act-2026-05-17-v2-moderator-runbook-draft
status: inbox
kind: docs
area: docs
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.6
blockedBy: []
resultArtifacts: []
checks: []
---

# V2.6 Moderator-Runbook-Entwurf

## Ziel

Ein erster Moderator-Runbook-Entwurf soll klären, wie Reports bearbeitet, Evidence gesichtet, Break-Glass-Ausnahmen dokumentiert und Appeals/Reviews vorbereitet werden.

## Kontext und Quellen

- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

## Scope

- Prozess für Reporteingang, Triage, Evidence-Sichtung, Entscheidung, Audit und Abschluss beschreiben.
- Break-Glass-Anforderung und Vier-Augen-Freigabe als manuellen Prozess skizzieren.
- Appeals/Review-Pfad als spätere Produktentscheidung vorbereiten.
- No-Go-Liste aufnehmen: keine automatisierte LLM-Sanktion, kein FullState-Standardzugriff, keine Hidden-Info-Veröffentlichung.

## Nicht im Scope

- Keine Moderationskonsole.
- Keine rechtliche Endfassung.
- Keine Sanktionstypen implementieren.
- Keine Public-Plattform-Freigabe.

## Akzeptanzkriterien

- [ ] Es gibt einen knappen Runbook-Entwurf für Moderatorhandlungen.
- [ ] Break-Glass und Auditpflicht sind praktisch beschreibbar.
- [ ] Hidden-Info- und KI-Debug-Grenzen sind verständlich.
- [ ] Offene Policy-Fragen sind als Produktentscheidungen markiert.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Der Entwurf soll kurz bleiben und keine UI-/API-Implementierung vorwegnehmen.

## Ergebnisnotiz

Noch offen.
