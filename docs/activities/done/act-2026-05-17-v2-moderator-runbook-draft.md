---
activityId: act-2026-05-17-v2-moderator-runbook-draft
status: done
kind: docs
area: docs
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
releaseTarget: V2.6
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-6-moderation/moderator-runbook-draft.md
checks:
  - rg -n "V2\\.6|Moderator|Moderation|Report|Appeal|Appeals|Break-Glass|Sanktion|FullState|Hidden-Info|Audit" docs KI-Wissen-NETGRID -g "*.md"
  - rg -n "automatisierte LLM|FullState-Standardzugriff|Hidden-Info-Veröffentlichung|Break-Glass|Vier-Augen|Appeals|Review" docs/releases/v2/v2-6-moderation/moderator-runbook-draft.md docs/activities/done/act-2026-05-17-v2-moderator-runbook-draft.md
  - git diff --check
  - git diff --cached --check
---

# V2.6 Moderator-Runbook-Entwurf

## Ziel

Ein erster Moderator-Runbook-Entwurf soll klären, wie Reports bearbeitet, Evidence gesichtet, Break-Glass-Ausnahmen dokumentiert und Appeals/Reviews vorbereitet werden.

## Kontext und Quellen

- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`

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

- [x] Es gibt einen knappen Runbook-Entwurf für Moderatorhandlungen.
- [x] Break-Glass und Auditpflicht sind praktisch beschreibbar.
- [x] Hidden-Info- und KI-Debug-Grenzen sind verständlich.
- [x] Offene Policy-Fragen sind als Produktentscheidungen markiert.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Der Entwurf soll kurz bleiben und keine UI-/API-Implementierung vorwegnehmen.

## Ergebnisnotiz

Abgeschlossen mit `docs/releases/v2/v2-6-moderation/moderator-runbook-draft.md`. Der Entwurf beschreibt Reporteingang, Triage, Evidence-Sichtung, Entscheidung, Audit, Abschluss, Break-Glass mit Vier-Augen-Freigabe und Appeals/Review als offene Produktentscheidung. Die No-Go-Liste schließt automatisierte LLM-/KI-Sanktionen, FullState-Standardzugriff, Hidden-Info-Veröffentlichung, KI-Debug als Standard-Evidence sowie Engine-/Replay-/StateHash-/LegalAction-Änderungen aus.

Checks: `rg`-Kontextsuche zu V2.6/Moderation/Break-Glass/Hidden-Info, fokussierte `rg`-Pflichtbegriffsuche im neuen Runbook und Activity-Abschluss, `git diff --check`, `git diff --cached --check`.
