---
activityId: act-2026-05-17-engine-hard-timeout-contract
status: done
kind: concept
area: engine
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy:
  - docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md
  - docs/activities/done/act-2026-05-17-timer-server-sync-contract.md
resultArtifacts:
  - docs/derived/ENGINE_HARD_TIMEOUT_CONTRACT_2026_05_17.md
checks:
  - rg -n "TimeoutPolicy|ServerTimeoutResolution|deadlineId|stateVersion|Replay|StateHash|Hidden-Info|Reconnect|Undo|Disconnect|AIInput|DecisionDebug" docs/derived/ENGINE_HARD_TIMEOUT_CONTRACT_2026_05_17.md docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md docs/derived/TIMER_SERVER_SYNC_CONTRACT_2026_05_17.md
  - rg -n "auto_decline|auto_pass|end_turn|forfeit|privatePayload|cardInstances|FullState|Token|Deck" docs/derived/ENGINE_HARD_TIMEOUT_CONTRACT_2026_05_17.md
  - git diff --check
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

- [x] Es ist entschieden, welche Entscheidungsfenster überhaupt harte Timeouts bekommen dürfen.
- [x] Timeout-Auflösungen sind als Engine-Vertrag, nicht als UI-/Server-Abkürzung modelliert.
- [x] Replay und StateHash bleiben deterministisch beschrieben.
- [x] Hidden-Info- und PublicEvent-Projektionen sind definiert.
- [x] Umsetzungspaket für Engine/Server/Tests kann klein und gate-sicher geschnitten werden.

## Umsetzungshinweise

- Primärer Agent: `release-planning-agent`; für spätere Umsetzung `release-implementation-agent`, für Verifikation `test-quality-agent`.
- Dieses Paket bleibt blockiert, bis der Server-Sync-Vertrag fachlich steht.

## Ergebnisnotiz

Abgeschlossen. Der Planungsvertrag `docs/derived/ENGINE_HARD_TIMEOUT_CONTRACT_2026_05_17.md` definiert harte Timeout-Auflösungen als enginevalidierte, servergenerierte `ServerTimeoutResolution` auf Basis einer von der Engine veröffentlichten `EngineTimeoutPolicy`.

Der erste spätere Umsetzungsschnitt ist bewusst eng: zulässig sind nur `auto_decline` für optionale kostenfreie Reaktionsfenster ohne Ziel-/Choiceauswahl und `auto_pass` für explizite Pass-Fenster mit enginebekannter Fallbackaction. Mandatory Choices mit verdeckten Karten, mehreren privaten Optionen, Setup/Mulligan, Discard/Handlimit, Access-Auswahl, Hidden-Zone Search/Reorder, globale Partiezeit, Chat, Disconnect und kompetitiver Forfeit bleiben außerhalb des ersten harten Slices.

Der Vertrag beschreibt Revalidation von `stateVersion`, `deadlineId`, `policyId`, `side`, Timingpunkt, Kostenfreiheit und Fallback-Legalität, Replay-/StateHash-Regeln, PublicEvent-/Hidden-Info-Grenzen, Reconnect-, Disconnect- und Undo-Verhalten sowie eine 18-Punkte-Testmatrix. Gate-Ergebnis bleibt `ready_for_engine_timeout_implementation: false`, bis Produktentscheidung zu konkreten privaten Timeoutfenstern und Disconnect-Grace vorliegt.
