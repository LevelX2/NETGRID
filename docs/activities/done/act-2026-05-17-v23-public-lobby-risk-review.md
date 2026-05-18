---
activityId: act-2026-05-17-v23-public-lobby-risk-review
status: done
kind: concept
area: server
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget: V2.3
blockedBy:
  - act-2026-05-17-v2-account-session-foundation
  - act-2026-05-17-v2-privacy-export-delete-contract
  - act-2026-05-17-v2-observability-redaction-baseline
  - act-2026-05-17-v2-moderation-rbac-redaction-tests
resultArtifacts:
  - docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-risk-review-2026-05-17.md
  - docs/activities/inbox/act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix.md
  - docs/activities/inbox/act-2026-05-17-v23-public-alpha-rollback-operability-contract.md
  - docs/activities/inbox/act-2026-05-17-v23-public-lobby-ui-filter-contract.md
checks:
  - Test-Path docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-risk-review-2026-05-17.md
  - Test-Path docs/activities/inbox/act-2026-05-17-v23-public-lobby-ui-filter-contract.md
  - rg --files docs/activities | rg "v23-public-lobby-(risk-review|redaction-rate-limit-matrix|ui-filter-contract)|v23-public-alpha-rollback"
  - git diff --check
---

# V2.3 Public Lobby Risk Review

## Ziel

Vor einer Public-Lobby-Alpha soll ein Public Platform Risk Review die Bedrohungsmodelle, Startverbote, Mindestgates und Rollout-Grenzen festlegen.

## Kontext und Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md`
- `docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md`
- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/account-session-auth-contract.md`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`

## Scope

- Öffentliche Lobbyrisiken gegen private LAN-Annahmen abgrenzen.
- Mindestvoraussetzungen für eine Public Alpha definieren.
- Explizite Startverbote dokumentieren.
- Handoff für Redaction-/Rate-Limit-, Rollback- und Testpakete schneiden.

## Nicht im Scope

- Keine Public-Lobby-Implementierung.
- Kein Matchmaking.
- Keine Accounts- oder Moderationsimplementierung.
- Keine Replay-, Spectator-, KI- oder Kartenfreigabe.

## Akzeptanzkriterien

- [x] Risiko- und Bedrohungsmodell liegt als Derived-Artefakt vor.
- [x] Startverbote und Mindestgates sind konkret benannt.
- [x] V2.3a-Reuse wird nur als technische Basis eingeordnet.
- [x] Folgepakete für Testmatrix, Rollback und UI-/Filtervertrag sind bestätigt oder angelegt.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-risk-review-2026-05-17.md` dokumentiert Schutzgüter, Bedrohungsmodell, Eintrittspunkte, konkrete Startverbote, Mindestgates und die enge V2.3a-Reuse-Einordnung als reine technische Basis ohne Public-Freigabe. Die vorhandenen Folgepakete für Redaction-/Rate-Limit-Testmatrix und Rollback-/Operability-Vertrag wurden bestätigt; das fehlende Folgepaket `act-2026-05-17-v23-public-lobby-ui-filter-contract` wurde neu in `docs/activities/inbox/` angelegt. Keine Implementierung, keine Public-Lobby-Freigabe, kein Matchmaking, keine Accounts-/Moderationsimplementierung und keine Replay-, Spectator-, KI-, Karten- oder Asset-Freigabe.
