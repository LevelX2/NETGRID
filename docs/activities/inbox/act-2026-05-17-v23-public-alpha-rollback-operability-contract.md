---
activityId: act-2026-05-17-v23-public-alpha-rollback-operability-contract
status: inbox
kind: concept
area: ops
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.3
blockedBy:
  - act-2026-05-17-v23-public-lobby-risk-review
  - act-2026-05-17-v2-observability-redaction-baseline
resultArtifacts: []
checks: []
---

# V2.3 Public Alpha Rollback- und Operability-Vertrag

## Ziel

Eine spätere Public-Lobby-Alpha soll nur starten, wenn Abschaltung, Rollback, Health, Alerting und Incident-Grenzen vorher als Vertrag dokumentiert sind.

## Kontext und Quellen

- `docs/derived/V2_3_PUBLIC_LOBBY_GAP_REVIEW_2026_05_17.md`
- `docs/derived/V2_X_PLATFORM_GATE_INVENTORY_2026_05_17.md`
- `docs/derived/PRIVATE_DEPLOYMENT_OPS_1_0_9_SPEC.md`

## Scope

- Kill-Switch-/Feature-Flag-Anforderungen für Public Lobby.
- Rollbackpfad für Listen-API, UI-Einstieg und Join-Pfade.
- Health-/Metrics-/Alerting-Signale ohne PII, Tokens, Decklisten oder Hidden Info.
- Incident-Kommunikation und Safe-Mode-Grenzen.

## Nicht im Scope

- Keine Rollback-Implementierung.
- Keine Public-Lobby-Implementierung.
- Keine neue Infrastrukturentscheidung.
- Keine Moderationskonsole.

## Akzeptanzkriterien

- [ ] Operability-Vertrag nennt Abschaltpunkte und Rückbaupfade.
- [ ] Health-/Alerting-Daten sind redigiert und hidden-info-sicher.
- [ ] Safe-Mode und Incident-Grenzen sind beschrieben.
- [ ] Public Alpha bleibt ohne diesen Vertrag blockiert.

## Ergebnisnotiz

Noch offen.
