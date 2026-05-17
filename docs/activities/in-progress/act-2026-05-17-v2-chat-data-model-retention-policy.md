---
activityId: act-2026-05-17-v2-chat-data-model-retention-policy
status: in-progress
kind: architecture
area: server
priority: high
primaryAgent: architecture-review-agent
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

# V2.2 Chat-Datenmodell und Retention festlegen

## Ziel

Chatnachrichten brauchen vor jeder Erweiterung einen knappen Datenmodell-, Retention-, Export- und Löschvertrag.

## Kontext und Quellen

- `docs/derived/V2_2_CHAT_DATA_CONTRACT.md`
- `docs/derived/V2_0_PRIVACY_EXPORT_DELETE_CONTRACT.md`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

## Scope

- Chatnachrichtenfelder und Referenzen festlegen.
- Unberichteten Chat, berichteten Chat, gelöschten Chat, Backups und Audit getrennt behandeln.
- Export-/Löschverhalten für Account-Self-Export und Account-Löschung skizzieren.
- Moderationsretention als Ausnahme sichtbar machen.

## Nicht im Scope

- Keine Storage- oder API-Implementierung.
- Keine Rechtsberatung und keine fertige Datenschutzerklärung.
- Kein Public Replay und kein globaler Chat.
- Keine Chatdaten in Replay, AIInput oder DecisionDebug.

## Akzeptanzkriterien

- [ ] Felder, Datenklassen und Referenzen sind tabellarisch dokumentiert.
- [ ] Retention unterscheidet unberichteten Chat, Report-Evidence, Audit und Backups.
- [ ] Export-/Löschgrenzen sind mit V2.0 und V2.6 kompatibel.
- [ ] Chat bleibt getrennt von Engine-State, Replay, StateHash und KI.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Ergebnis sollte als `docs/derived/`-Vertrag oder Ergänzung zu `V2_2_CHAT_DATA_CONTRACT.md` entstehen.

## Ergebnisnotiz

Noch offen.
