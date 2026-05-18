---
activityId: act-2026-05-17-v23-public-alpha-rollback-operability-contract
status: done
kind: concept
area: ops
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget: V2.3
blockedBy: []
resultArtifacts:
  - docs/derived/V2_3_PUBLIC_ALPHA_ROLLBACK_OPERABILITY_CONTRACT_2026_05_17.md
  - docs/derived/V2_3_PUBLIC_LOBBY_RISK_REVIEW_2026_05_17.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
  - docs/codex/CODEX_STATUS.md
checks:
  - rg -n "V2_3_PUBLIC_ALPHA_ROLLBACK_OPERABILITY_CONTRACT|ready_for_public_alpha|Kill-Switch|Safe Mode|redigierte Health" docs/derived KI-Wissen-NETGRID docs/codex docs/activities
  - rg -n "sessionToken|reconnectToken|joinToken|tokenHash|deckHash|AIInput|DecisionDebug|privatePayload|cardInstances|FullState|Hidden Cards" docs/derived/V2_3_PUBLIC_ALPHA_ROLLBACK_OPERABILITY_CONTRACT_2026_05_17.md
  - git diff --check
---

# V2.3 Public Alpha Rollback- und Operability-Vertrag

## Ziel

Eine spätere Public-Lobby-Alpha soll nur starten, wenn Abschaltung, Rollback, Health, Alerting und Incident-Grenzen vorher als Vertrag dokumentiert sind.

## Kontext und Quellen

- `docs/derived/V2_3_PUBLIC_LOBBY_GAP_REVIEW_2026_05_17.md`
- `docs/derived/V2_3_PUBLIC_LOBBY_RISK_REVIEW_2026_05_17.md`
- `docs/derived/V2_X_PLATFORM_GATE_INVENTORY_2026_05_17.md`
- `docs/derived/V2_7_OBSERVABILITY_REDACTION_BASELINE.md`
- `docs/releases/v1/v1-0-9-private-internet-hardening/private-deployment-ops-spec.md`

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

- [x] Operability-Vertrag nennt Abschaltpunkte und Rückbaupfade.
- [x] Health-/Alerting-Daten sind redigiert und hidden-info-sicher.
- [x] Safe-Mode und Incident-Grenzen sind beschrieben.
- [x] Public Alpha bleibt ohne diesen Vertrag blockiert.

## Ergebnisnotiz

Abgeschlossen. Der neue planning-only Vertrag `docs/derived/V2_3_PUBLIC_ALPHA_ROLLBACK_OPERABILITY_CONTRACT_2026_05_17.md` definiert serverwirksame Kill-Switches für Public-Liste, UI-Einstieg und Public-Join-Adapter, Rollbackpfade für Listen-API, UI, Join und laufende Matches, redigierte Health-/Metrics-/Alerting-Signale, Safe-Mode-Stufen und P0/P1/P2-Incident-Grenzen.

Public Alpha bleibt ausdrücklich blockiert: `ready_for_public_alpha: false` und `ready_for_implementation_slice: false`, bis der Vertrag in Code, Tests, Runbook und Final Review nachgewiesen ist. Es wurde keine Implementierung, keine Infrastrukturentscheidung, keine Public-Lobby-Freigabe, keine Moderationskonsole und keine Engine-/Replay-/StateHash-/KI-Änderung vorgenommen.

Checks: Dokumentations-/Referenzsuche, Redaction-Begriffssuche im Vertrag und `git diff --check`.
