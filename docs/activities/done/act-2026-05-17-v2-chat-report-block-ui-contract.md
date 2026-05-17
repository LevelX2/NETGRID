---
activityId: act-2026-05-17-v2-chat-report-block-ui-contract
status: done
kind: concept
area: web
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
releaseTarget: V2.2
blockedBy: []
outcome: completed
resultArtifacts:
  - docs/derived/V2_2_CHAT_REPORT_BLOCK_UI_CONTRACT.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
checks:
  - rg -n "V2_2_CHAT_REPORT_BLOCK_UI_CONTRACT|chat_message|blocked_by_self|evidenceRefs|globaler/öffentlicher Chat|Engine, Replay, StateHash" docs/derived/V2_2_CHAT_REPORT_BLOCK_UI_CONTRACT.md docs/codex/CODEX_STATUS.md "KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md"
  - rg -n "GameState|GameEvent|PublicGameEvent|Replay|StateHash|LegalAction|PlayerAction|AIInput|DecisionDebug|FullState|privatePayload|cardInstances" docs/derived/V2_2_CHAT_REPORT_BLOCK_UI_CONTRACT.md
  - git diff --check
  - git diff --cached --check
---

# V2.2 Chat-Report-/Block- und UI-Vertrag schneiden

## Ziel

Vor Match- oder Lobbychat-Erweiterungen soll klar sein, wie Nutzer Chatnachrichten melden, Personen blockieren und welche UI-Zustände daraus entstehen.

## Kontext und Quellen

- `docs/derived/V2_2_CHAT_DATA_CONTRACT.md`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`
- V2.2-Roadmap: Chat nur mit Report-/Block-/Retention-Modell.

## Scope

- Reportziele definieren: Nachricht, Nutzer, Match oder Lobby.
- Block-Semantik skizzieren: Anzeige ausblenden, Senden verhindern, Invite-/Friend-/Lobby-Wirkung.
- UI-Zustände und sichere Texte für Melden, Blockieren, Entblocken und bereits gemeldete Nachrichten benennen.
- Moderationshandoff als Evidence-Referenz beschreiben.

## Nicht im Scope

- Keine UI-Implementierung.
- Keine Moderationskonsole.
- Kein globaler oder öffentlicher Chat.
- Keine automatisierte LLM-Moderation oder Sanktion.
- Keine Änderung an Engine, Replay, StateHash oder KI.

## Akzeptanzkriterien

- [x] Report- und Block-Semantik sind als Produktvertrag beschrieben.
- [x] UI-Zustände sind ohne globale Chatfreigabe skizziert.
- [x] Moderationshandoff nutzt Evidence-Referenzen statt Engine-/Replay-Kopien.
- [x] Offene Policy-Fragen sind markiert.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Bei späterer Umsetzung kann ein `small-adjustments-agent`- oder `release-implementation-agent`-Paket entstehen.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/V2_2_CHAT_REPORT_BLOCK_UI_CONTRACT.md` beschreibt Reportziele (`chat_message`, `user`, `match`, `lobby`), Block-Semantik ohne Engine-/Matchwirkung, sichere UI-Zustände und Texte für Melden, Blockieren, Entblocken und gemeldete Nachrichten sowie den Moderationshandoff über Evidence-Referenzen. `docs/codex/CODEX_STATUS.md` und der Wiki-Index verweisen auf den neuen Vertrag. Keine UI-Implementierung, Moderationskonsole, globale Chatfreigabe, LLM-Sanktion oder Engine-/Replay-/StateHash-/KI-Änderung.

Checks: Referenz- und Scope-`rg`-Prüfungen, `git diff --check` und `git diff --cached --check` grün. Offene Folgeentscheidungen bleiben Retentionwerte, finales Reportkategorienschema, Kontextfenster, Session-only Blocking, Multi-User-Lobby-Zustellung, Appeals/Nutzerkommunikation und Abuse-Rate-Limits.
