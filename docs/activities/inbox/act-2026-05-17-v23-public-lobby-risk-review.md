---
activityId: act-2026-05-17-v23-public-lobby-risk-review
status: inbox
kind: concept
area: server
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.3
blockedBy:
  - act-2026-05-17-v2-account-session-foundation
  - act-2026-05-17-v2-privacy-export-delete-contract
  - act-2026-05-17-v2-observability-redaction-baseline
  - act-2026-05-17-v2-moderation-rbac-redaction-tests
resultArtifacts: []
checks: []
---

# V2.3 Public Lobby Risk Review

## Ziel

Vor einer Public-Lobby-Alpha soll ein Public Platform Risk Review die Bedrohungsmodelle, Startverbote, Mindestgates und Rollout-Grenzen festlegen.

## Kontext und Quellen

- `docs/derived/V2_3_PUBLIC_LOBBY_GAP_REVIEW_2026_05_17.md`
- `docs/derived/V2_X_PLATFORM_GATE_INVENTORY_2026_05_17.md`
- `docs/derived/V2_0_ACCOUNT_SESSION_AUTH_CONTRACT.md`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

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

- [ ] Risiko- und Bedrohungsmodell liegt als Derived-Artefakt vor.
- [ ] Startverbote und Mindestgates sind konkret benannt.
- [ ] V2.3a-Reuse wird nur als technische Basis eingeordnet.
- [ ] Folgepakete für Testmatrix, Rollback und UI-/Filtervertrag sind bestätigt oder angelegt.

## Ergebnisnotiz

Noch offen.
