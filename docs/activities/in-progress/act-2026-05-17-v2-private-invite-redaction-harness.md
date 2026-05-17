---
activityId: act-2026-05-17-v2-private-invite-redaction-harness
status: in-progress
kind: fix
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-4
releaseTarget: V2.1
blockedBy: []
resultArtifacts: []
checks: []
---

# Invite-Payload-Redaction-Harness vorbereiten

## Ziel

Vor V2.1-Freundeslisten und privaten Invites soll ein kleiner Regression-Schutz entstehen, der bestehende und künftige Invite-/Join-/Lobby-Payloads gegen Token-, Decklisten-, Deckhash- und Hidden-Info-Leaks prüft.

## Kontext und Quellen

- V2.1 Roadmap: private Invite-Flows, Blockieren, Presence mit Privacy-Regeln, Einladungen ohne Token-Leaks.
- V2.3a hat bereits ein Muster für joinbare LAN-Matches mit minimalen freigegebenen Metadaten.
- Die langfristige Roadmap nennt öffentliche und soziale Funktionen als hohes Datenschutz- und Abuse-Risiko.

## Scope

- Bestehende Join-Link-, Pending-Lobby- und V2.3a-Open-Lobby-Payloads als Ausgangspunkt prüfen.
- Einen fokussierten Test oder Testhelper ergänzen, der Invite-/Lobby-Metadaten gegen verbotene Felder scannt.
- Verbotene Muster mindestens erfassen: Tokens, Session-IDs, Decklisten, Deckhashes, verdeckte Kartenidentitäten, AIInput, DecisionDebug.
- Den Harness so schneiden, dass spätere V2.1-Invite-Endpunkte ihn wiederverwenden können.

## Nicht im Scope

- Keine Freundeslisten-Implementierung.
- Keine neuen Invite-Endpunkte.
- Kein Presence-System.
- Keine öffentliche Lobby-Erweiterung.

## Akzeptanzkriterien

- [ ] Es gibt einen wiederverwendbaren Redaction-Test oder Testhelper für Lobby-/Invite-Payloads.
- [ ] Bestehende Join-/Open-Lobby-Pfade bleiben grün.
- [ ] Verbotene Felder und Muster sind im Test klar benannt.
- [ ] Der Test verändert keine Produktpayloads ohne explizite Notwendigkeit.

## Umsetzungshinweise

- Primärer Folgeagent: `test-quality-agent`.
- Gut geeignet als kleiner unabhängiger Technik-Schnitt, weil er spätere V2.1/V2.3-Arbeit absichert.
- Bei bestehenden Leak-Funden separate Fix-Activities anlegen, statt dieses Paket zu vergrößern.

## Ergebnisnotiz

Noch offen.
