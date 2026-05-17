---
activityId: act-2026-05-17-v2-chat-data-model-retention-policy
status: done
kind: architecture
area: server
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
releaseTarget: V2.2
blockedBy:
  - docs/derived/V2_2_CHAT_DATA_CONTRACT.md
resultArtifacts:
  - docs/derived/V2_2_CHAT_DATA_CONTRACT.md
checks:
  - rg -n "^## (Chatdatenmodell V2\\.2|Retention-Vertrag|Export- und Löschvertrag|Architekturgrenzen für Implementierungsslices)|chatMessageId|retentionClass|reported_chat_evidence|deleted_chat_pointer|Account-Self-Export|StateHash|AIInput|DecisionDebug" docs/derived/V2_2_CHAT_DATA_CONTRACT.md
  - rg -n "GameState|GameEvent|PublicGameEvent|ReplayView|StateHash|AIInput|DecisionDebug|FullState|privatePayload|cardInstances|Roh-Tokens|Token-Hashes" docs/derived/V2_2_CHAT_DATA_CONTRACT.md
  - rg -n "Retention|Export|Löschung|Backups|Audit|Moderation|Evidence|V2\\.0|V2\\.6" docs/derived/V2_2_CHAT_DATA_CONTRACT.md
  - git diff --check
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

- [x] Felder, Datenklassen und Referenzen sind tabellarisch dokumentiert.
- [x] Retention unterscheidet unberichteten Chat, Report-Evidence, Audit und Backups.
- [x] Export-/Löschgrenzen sind mit V2.0 und V2.6 kompatibel.
- [x] Chat bleibt getrennt von Engine-State, Replay, StateHash und KI.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Ergebnis sollte als `docs/derived/`-Vertrag oder Ergänzung zu `V2_2_CHAT_DATA_CONTRACT.md` entstehen.

## Ergebnisnotiz

V2.2-Chatdatenmodell, Referenzgrenzen, Retentionklassen, Account-Self-Export, Account-Löschung, Chatlöschung, Backup-Auslauf und Moderationsretention wurden in `docs/derived/V2_2_CHAT_DATA_CONTRACT.md` konkretisiert. Chat bleibt ausdrücklich außerhalb von Engine-State, Replay, StateHash, `AIInput` und `DecisionDebug`.

Offen bleiben konkrete Retention-Fristen, UI-Texte für Export-/Löschstatus, Report-/Block-Modell und spätere Redaction-/Boundary-Tests.
