---
activityId: act-2026-05-17-v2-chat-redaction-boundary-tests
status: in-progress
kind: architecture
area: server
priority: high
primaryAgent: test-quality-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
releaseTarget: V2.2
blockedBy:
  - docs/derived/V2_2_CHAT_DATA_CONTRACT.md
resultArtifacts: []
checks: []
---

# V2.2 Chat-Boundary- und Redaction-Tests planen

## Ziel

Vor Chat-Erweiterungen soll ein kleiner Testvertrag festlegen, wie Chatdaten gegen Engine, Replay, StateHash, KI und Logs abgegrenzt werden.

## Kontext und Quellen

- `docs/derived/V2_2_CHAT_DATA_CONTRACT.md`
- `docs/derived/V1_0_3_MATCHSTART_UX_PLAN.md`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

## Scope

- Testfälle für Reconnect-, WebSocket- und Server-Payloads benennen.
- Leak-Scans für Tokens, Decklisten, Hidden Cards, `cardInstances`, `AIInput` und `DecisionDebug` definieren.
- Replay-/StateHash-Negativtests skizzieren: Chat darf StateHash und Replay-Export nicht verändern.
- KI-Input-DTO-Checks benennen: keine Chattexte, Chat-IDs oder Reporttexte.

## Nicht im Scope

- Keine Chat-Implementierung.
- Keine Moderationskonsole.
- Kein globaler Chat.
- Keine LLM-Moderation.

## Akzeptanzkriterien

- [ ] Konkrete Testfälle für Chat-Payload-Redaction sind dokumentiert.
- [ ] Replay-, StateHash-, AIInput- und DecisionDebug-Negativtests sind benannt.
- [ ] Bestehender privater Lobbychat bleibt als enges V1.0.3-Verhalten referenziert.
- [ ] Keine Public-Chat- oder Moderationsfreigabe entsteht durch dieses Paket.

## Umsetzungshinweise

- Primärer Folgeagent: `test-quality-agent`.
- Dieses Paket kann in einen späteren Implementierungsslice überführt werden, sobald V2.2-Datenmodell und Retention entschieden sind.

## Ergebnisnotiz

Noch offen.
