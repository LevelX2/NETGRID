---
activityId: act-2026-05-17-v2-chat-contract-preflight
status: done
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
releaseTarget: V2.2
blockedBy: []
resultArtifacts:
  - docs/derived/V2_2_CHAT_DATA_CONTRACT.md
  - docs/activities/inbox/act-2026-05-17-v2-chat-redaction-boundary-tests.md
  - docs/activities/inbox/act-2026-05-17-v2-chat-data-model-retention-policy.md
  - docs/activities/inbox/act-2026-05-17-v2-chat-report-block-ui-contract.md
checks:
  - Quellenprüfung gegen V1.0.3-Lobbychat, V2.2-Roadmap, V2.0-Datenschutz und V2.6-Moderationsvertrag
  - rg-basierte Code-/Doku-Prüfung zu chatMessages, Replay, StateHash, AIInput und DecisionDebug
  - git diff --check
---

# Minimal-Chat-Gate als Datenvertrag prüfen

## Ziel

Der bestehende private Lobbychat und die V2.2-Roadmap sollen zu einem kleinen Chat-Datenvertrag verdichtet werden, bevor Match-/Lobbychat erweitert wird.

## Kontext und Quellen

- V2.2 Roadmap: Chat nur mit Report-/Block-/Retention-Modell, kein globaler öffentlicher Chat, Chat-Payloads getrennt von GameEvents, keine Chatdaten in Replays ohne Entscheidung.
- Bestehender privater V1.0.3-Lobbychat verschwindet nach Matchstart und ist bewusst begrenzt.

## Scope

- Bestehenden Lobbychat-Vertrag aufnehmen.
- Zielvertrag für V2.2 skizzieren: Chat ist kein `PublicGameEvent`, nicht im StateHash, kein KI-Input, kein Action-Kanal.
- Retention, Export/Löschung, Report/Block und Moderationszugriff als offene Entscheidungen markieren.
- Prüfen, welche kleinen Folgepakete sinnvoll sind: Redaction-Test, Datenmodell, UI-Meldepfad oder Retention-Policy.

## Nicht im Scope

- Keine Chat-Erweiterung in Code.
- Kein globaler Chat.
- Keine LLM-Moderation.
- Keine Chatdaten in Replay, AIInput oder DecisionDebug.

## Akzeptanzkriterien

- [x] Es gibt einen knappen Zielvertrag für Chatdaten und ihre Nicht-Zugehörigkeit zu GameEvents/Replay/StateHash/KI.
- [x] Offene Datenschutz- und Moderationsentscheidungen sind sichtbar.
- [x] Konkrete Folgepakete sind angelegt oder als blockiert begründet.
- [x] Der bestehende private Lobbychat wird nicht still zu einem Public-Feature umgedeutet.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Dieses Paket ist bewusst ein Preflight; erst danach sollten Chat-Implementierungspakete entstehen.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/V2_2_CHAT_DATA_CONTRACT.md` definiert Chat als berechtigungsgebundene UGC-Schicht außerhalb von `GameState`, `GameEvent`, `PublicGameEvent`, Replay, StateHash, `PlayerAction`, `LegalAction`, `AIInput` und `DecisionDebug`.

Offene Entscheidungen zu Retention, Export/Löschung, Reportmodell, Block-Semantik, Moderationszugriff, Hidden-Info in Chat, Rate Limits, UI-Meldung und LLM-Moderation sind dokumentiert. Der V1.0.3-Lobbychat bleibt ausdrücklich private Zwei-Personen-Startlobby und wird nicht zu globalem oder öffentlichem Chat umgedeutet.

Drei Folgeactivities wurden angelegt: Chat-Boundary-/Redaction-Tests, Chat-Datenmodell/Retention und Chat-Report-/Block-/UI-Vertrag. Verifikation: Quellenprüfung, rg-basierte Boundary-Prüfung und `git diff --check`.
