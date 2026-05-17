---
activityId: act-2026-05-17-v2-chat-contract-preflight
status: inbox
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.2
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Es gibt einen knappen Zielvertrag für Chatdaten und ihre Nicht-Zugehörigkeit zu GameEvents/Replay/StateHash/KI.
- [ ] Offene Datenschutz- und Moderationsentscheidungen sind sichtbar.
- [ ] Konkrete Folgepakete sind angelegt oder als blockiert begründet.
- [ ] Der bestehende private Lobbychat wird nicht still zu einem Public-Feature umgedeutet.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Dieses Paket ist bewusst ein Preflight; erst danach sollten Chat-Implementierungspakete entstehen.

## Ergebnisnotiz

Noch offen.
