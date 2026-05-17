---
activityId: act-2026-05-17-engine-hard-timeout-contract
status: inbox
kind: concept
area: engine
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md
  - docs/activities/inbox/act-2026-05-17-timer-server-sync-contract.md
resultArtifacts: []
checks: []
---

# Engine-Vertrag für harte Timeout-Auflösungen

## Ziel

Harte Timerfolgen sollen erst als enginevalidierter Vertrag geschnitten werden, bevor irgendeine Regelwirkung implementiert wird.

## Kontext und Quellen

- `docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md`
- NETGRID-Prinzipien: Engine-Korrektheit, LegalAction-only, Replay/StateHash-Determinismus und Hidden-Info-Schutz.

## Scope

- Timeoutfähige Entscheidungsfenster identifizieren und priorisieren.
- Mögliche `timeoutPolicy`-Modelle bewerten: keine Wirkung, Auto-Decline, Auto-Pass, End-Turn, Forfeit.
- Servergenerierte, enginevalidierte Timeout-Auflösung mit `stateVersion`, `side`, `deadlineId` und Timingpunkt beschreiben.
- Replay-, StateHash-, stale-action-, illegal-action-, Reconnect-, Undo- und Hidden-Info-Gates definieren.

## Nicht im Scope

- Keine direkte Implementierung in `applyAction`.
- Keine pauschale globale Partiezeit mit automatischem Spielverlust.
- Keine Chat-Cooldowns oder Moderationsregeln.
- Keine KI-Zeitbudgetänderung.

## Akzeptanzkriterien

- [ ] Es ist entschieden, welche Entscheidungsfenster überhaupt harte Timeouts bekommen dürfen.
- [ ] Timeout-Auflösungen sind als Engine-Vertrag, nicht als UI-/Server-Abkürzung modelliert.
- [ ] Replay und StateHash bleiben deterministisch beschrieben.
- [ ] Hidden-Info- und PublicEvent-Projektionen sind definiert.
- [ ] Umsetzungspaket für Engine/Server/Tests kann klein und gate-sicher geschnitten werden.

## Umsetzungshinweise

- Primärer Agent: `release-planning-agent`; für spätere Umsetzung `release-implementation-agent`, für Verifikation `test-quality-agent`.
- Dieses Paket bleibt blockiert, bis der Server-Sync-Vertrag fachlich steht.

## Ergebnisnotiz

Noch offen.
