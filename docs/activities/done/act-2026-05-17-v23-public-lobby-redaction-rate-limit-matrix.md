---
activityId: act-2026-05-17-v23-public-lobby-redaction-rate-limit-matrix
status: done
kind: test
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: V2.3
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-redaction-rate-limit-test-matrix.md
checks:
  - "Test-Path docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-redaction-rate-limit-test-matrix.md"
  - "Select-String required acceptance terms in docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-redaction-rate-limit-test-matrix.md"
  - "git diff --check"
---

# V2.3 Public Lobby Redaction- und Rate-Limit-Matrix

## Ziel

Die Public-Lobby-Alpha braucht vor Codefreigabe eine Testmatrix für Lobby-Metadaten, Joinversuche, Rate Limits, Abuse-Signale und Redaction-Grenzen.

## Kontext und Quellen

- `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-gap-review-2026-05-17.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-test-matrix.md`
- `tests/specs/visibility-contract.test.ts`
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`

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

- [x] Testmatrix deckt erlaubte und verbotene Felder ab.
- [x] Rate-Limit-/Spam-Fälle sind mit erwarteten Status- und Audit-Signalen beschrieben.
- [x] Tests unterscheiden LAN-Komfort von öffentlichem Abuse-Risiko.
- [x] Handoff an einen späteren Umsetzungsslice ist eindeutig.

## Ergebnisnotiz

Erledigt am 2026-05-17. Das neue Derived-Artefakt `docs/releases/v2/v2-3-public-lobby-alpha/public-lobby-redaction-rate-limit-test-matrix.md` definiert erlaubte D0-Public-Lobby-Metadaten, verbotene Token-/Deck-/PII-/Hidden-Info-/KI-Debug-Muster, Redaction-Tests, Rate-Limit-/Spam-/Enumeration-/Stale-Entry-Fälle mit Status- und Audit-Erwartungen sowie ein Mindest-Testset für einen späteren Umsetzungsslice. Keine Test- oder API-Implementierung wurde vorgenommen. Offene Folgepunkte bleiben die spätere technische Umsetzung hinter den V2.3-Public-Gates und die getrennten Rollback-/Operability- und UI-/Filterverträge.
