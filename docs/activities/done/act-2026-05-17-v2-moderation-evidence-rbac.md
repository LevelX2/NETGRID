---
activityId: act-2026-05-17-v2-moderation-evidence-rbac
status: done
kind: concept
area: server
priority: high
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.6
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md
  - docs/activities/inbox/act-2026-05-17-v2-moderation-rbac-redaction-tests.md
  - docs/activities/inbox/act-2026-05-17-v2-moderation-evidence-export-contract.md
  - docs/activities/inbox/act-2026-05-17-v2-moderator-runbook-draft.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - Quellenprüfung gegen V2.x-Roadmap, Lobbychat, Replay-Projektionen, Connection-Audit und Storage-Retention
  - git diff --check
---

# Moderation: Evidence, RBAC und Hidden-Info-Policy schneiden

## Ziel

Vor Public-Lobby-, Chat- oder Replay-Ausbau soll ein kleines Moderations-Grundpaket klären, welche Evidenzdaten, Rollenrechte und Hidden-Info-Grenzen überhaupt zulässig wären.

## Kontext und Quellen

- V2.6 Roadmap: Reports, Sanktionen, Evidenz, Audit, RBAC, minimale Datenansicht, Datenschutz/Retention, Evidence-Export, Moderator-Runbook.
- V2.2, V2.3 und V2.8 hängen fachlich an Moderations- und Abuse-Pfaden.
- Moderatoren dürfen keine pauschale FullState-/Hidden-Info-Sicht bekommen.

## Scope

- Minimales Rollenmodell skizzieren: Admin, Moderator, Support/Read-only, System.
- Evidence-Quellen trennen: Chatdaten, Public Replay, Matchmetadaten, StateHash, Reports.
- Hidden-Matchdaten nur mit strenger Policy als Ausnahme behandeln.
- Audit-Log-Anforderungen und Retention-Fragen erfassen.
- Folgeactivities für RBAC-Tests, Evidence-Export oder Moderator-Runbook anlegen.

## Nicht im Scope

- Keine Moderationskonsole implementieren.
- Keine Sanktionen oder Report-Endpunkte implementieren.
- Keine Freigabe von Hidden-Daten.
- Keine automatisierte LLM-Sanktion oder KI-Moderation.

## Akzeptanzkriterien

- [x] Rollen, Datenklassen und Zugriffstypen sind als erster Vertrag dokumentiert.
- [x] Hidden-Info- und Decklisten-Zugriff sind restriktiv und nicht implizit erlaubt.
- [x] Audit- und Retention-Fragen sind sichtbar.
- [x] Konkrete nächste Pakete für Tests oder Runbook sind angelegt oder benannt.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Bei Architekturdetails kann ein Folgepaket an `architecture-review-agent` gehen.

## Ergebnisnotiz

Erledigt. `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md` definiert Rollenmodell, Datenklassen `D0` bis `D7`, Zugriffsmatrix, Evidence-Quellen, Default-Deny für FullState/Hidden-Daten/Decklisten/`AIInput`/`DecisionDebug`, Break-Glass-Policy, Auditpflichten, Retention-Vorschläge und Umsetzungsgates.

Drei Folgeactivities sind angelegt: RBAC-/Redaction-Tests, Evidence-Export-Vertrag und Moderator-Runbook-Entwurf. Bestehende angrenzende Pakete zu Observability-Redaction, Public Replay, Chat-Preflight und V2.x-Gate-Inventar bleiben passend. Verifikation: Quellenprüfung und `git diff --check`.
