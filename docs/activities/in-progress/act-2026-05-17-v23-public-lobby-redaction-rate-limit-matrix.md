---
activityId: act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix
status: in_progress
kind: test
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: V2.3
blockedBy:
  - act-2026-05-17-v23-public-lobby-risk-review
resultArtifacts: []
checks: []
---

# V2.3 Public Lobby Redaction- und Rate-Limit-Matrix

## Ziel

Die Public-Lobby-Alpha braucht vor Codefreigabe eine Testmatrix für Lobby-Metadaten, Joinversuche, Rate Limits, Abuse-Signale und Redaction-Grenzen.

## Kontext und Quellen

- `docs/derived/V2_3_PUBLIC_LOBBY_GAP_REVIEW_2026_05_17.md`
- `docs/derived/V2_3A_TEST_MATRIX.md`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

## Scope

- Matrix für erlaubte Public-Lobby-Metadaten.
- Negative Tests für Token, Token-Hashes, Decknamen, Decklisten, PII, `AIInput`, `DecisionDebug`, `privatePayload`, `cardInstances` und FullState.
- Rate-Limit- und Abuse-Event-Testfälle für Listenabruf, Refresh, Joinversuche und Stale Entries.
- Anforderungen an auditierbare, redigierte Ops-Signale.

## Nicht im Scope

- Keine Testimplementierung.
- Keine Public-Lobby-API-Implementierung.
- Kein LLM- oder automatisierter Moderationspfad.

## Akzeptanzkriterien

- [ ] Testmatrix deckt erlaubte und verbotene Felder ab.
- [ ] Rate-Limit-/Spam-Fälle sind mit erwarteten Status- und Audit-Signalen beschrieben.
- [ ] Tests unterscheiden LAN-Komfort von öffentlichem Abuse-Risiko.
- [ ] Handoff an einen späteren Umsetzungsslice ist eindeutig.

## Ergebnisnotiz

Noch offen.
