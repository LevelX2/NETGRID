---
activityId: act-2026-05-17-v2-chat-report-block-ui-contract
status: inbox
kind: concept
area: web
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.2
blockedBy:
  - docs/derived/V2_2_CHAT_DATA_CONTRACT.md
resultArtifacts: []
checks: []
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

- [ ] Report- und Block-Semantik sind als Produktvertrag beschrieben.
- [ ] UI-Zustände sind ohne globale Chatfreigabe skizziert.
- [ ] Moderationshandoff nutzt Evidence-Referenzen statt Engine-/Replay-Kopien.
- [ ] Offene Policy-Fragen sind markiert.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Bei späterer Umsetzung kann ein `small-adjustments-agent`- oder `release-implementation-agent`-Paket entstehen.

## Ergebnisnotiz

Noch offen.
