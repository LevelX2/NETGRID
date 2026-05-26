---
activityId: act-2026-05-25-lobby-random-side-start-resolution
status: done
kind: fix
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-25
startedAt: 2026-05-25
completedAt: 2026-05-25
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/api-contracts.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "start lobby|random side|Human-vs-Human matches"
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test -- match-start.test.ts
  - git diff --check
---

# Lobby-Auslosung erst beim Spielstart

## Ziel

Die Human-vs-Human-Seitenauswahl `Auslosen` soll nicht schon beim Erstellen der Lobby sichtbar auf Runner oder Korp festgelegt werden. Wenn Teilnehmer A beide Decks angibt und `Auslosen` wählt, soll die Seite erst beim tatsächlichen Spielstart serverseitig entschieden werden. Die Lobby soll bis dahin klar zeigen, dass die Seite noch offen ist.

Zusätzlich soll die Startlobby-Verbindungsanzeige verständlicher werden, damit `online`/`offline` nicht wie eine Aussage über Spielfähigkeit oder Seitenwahl wirkt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-25: Bei Human-vs-Human mit `Auslosen`, Protheus-Kartenpool und vorgewählten Decks steht nach Lobby-Erstellung sofort `Du startest als Korp`.
- Aktueller Serverpfad: `apps/server/src/multiplayer.ts` löst `hostSide: "random"` in `createMatch` sofort über `deterministicHostSide(seed)` auf.
- Aktuelle UI: `apps/web/app/page.tsx` zeigt nach Lobby-Erstellung direkt `Du startest als <Side>`.
- Lobby-Payloads enthalten Teilnehmer-Verbindungszustände und `connectionQuality`, die im UI als `online`/`offline` erscheinen.

## Scope

- Human-vs-Human-Lobby mit `hostSide: "random"` so ändern, dass die Seitenzuweisung bis zur Lobby-Aktivierung offen bleibt.
- Serververtrag so anpassen, dass Pending-/Ready-/Countdown-Lobby den Random-Status ausdrücken kann, ohne eine Seite vorab zu leaken.
- Beim Start/Countdown-Ende die Seite deterministisch und replay-/statehash-neutral auflösen.
- Deckzuordnung nach der finalen Seitenzuweisung korrekt anwenden: Teilnehmer A/B können weiterhin Runner- und Korp-Decks vorab angeben.
- UI-Texte in Lobby und Zusammenfassung anpassen, z. B. `Seite wird beim Start ausgelost`.
- Verbindungsstatus in der Lobby sprachlich trennen:
  - eigene WebSocket-Verbindung,
  - Gegenüber/Teilnehmer verbunden oder wartet,
  - Qualitätszustand `unstable` nur als Verbindungshinweis.
- Regressionstests für Server-Create/Lobby-Aktivierung und Web-Matchstart-Zusammenfassung ergänzen.

## Nicht im Scope

- Kein Commit-Reveal- oder kryptographisches Fairness-Protokoll.
- Keine Änderung an Deckvalidierung, Kartenpool, Engine-Regeln, LegalActions, Replay oder StateHash außer der bestehenden Startsetup-Eingabe.
- Keine Public-Lobby-, Matchmaking- oder Account-Fairness-Funktion.
- Keine Änderung an Human-vs-AI-Seitenwahl, außer ein bestehender Test zeigt direkt denselben UI-Textfehler.
- Keine neue Chat- oder Invite-Funktion.

## Akzeptanzkriterien

- [x] Bei `Auslosen` zeigt die Lobby vor Aktivierung keine konkrete Host-Seite mehr.
- [x] Der Host kann durch Lobby-Erstellen nicht mehr vorab sehen, welche Seite er beim Start bekommt.
- [x] Bei Spielstart wird genau eine Runner-/Korp-Zuweisung serverseitig festgelegt und danach in Session, Payload, DeckSetup und Lobby-/Startantwort konsistent verwendet.
- [x] Teilnehmer-A- und Teilnehmer-B-Deckpaare bleiben korrekt, egal welche Seite ausgelost wird.
- [x] Die Lobby-Verbindungsanzeige unterscheidet verständlich zwischen eigener Verbindung und Gegenüber-Status.
- [x] Bestehende Hidden-Info-, Decklisten-, Token- und Snapshot-Redaction bleibt unverändert.
- [x] Tests decken mindestens `hostSide=random` mit Pending-Lobby, Ready-Aktivierung und resultierender Seiten-/Deckzuordnung ab.

## Umsetzungshinweise

- Wahrscheinlich braucht `MatchStartLobbyState.sideAssignment` einen offenen Zustand oder ein zusätzliches Feld für `sideAssignmentMode`.
- `createMatch` darf bei Human-vs-Human-`random` nicht sofort `hostSide` als Runner/Korp in UI-seitige Wahrheit zurückgeben, wenn das Match in die Pending-/Ready-Lobby geht.
- `activatePendingDeckHandshake` und `activateReadyLobby` sind relevante Serverpunkte, weil dort Teilnehmerdeckpaare und tatsächliches Spielsetup zusammengeführt werden.
- UI-Hinweis: `Du startest als ...` ist vor finaler Auslosung irreführend; besser `Seite wird beim Start ausgelost`.
- Verbindungsstatus: Der aktuelle `online/offline`-Text ist technisch WebSocket-/Teilnehmerstatus, nicht die Frage, ob der lokale Nutzer grundsätzlich reagieren kann. Die Labels sollten das ausdrücken.

## Ergebnisnotiz

Umgesetzt: Startlobby-Payloads können jetzt `sideAssignmentMode: "random_pending"` tragen. In diesem Modus veröffentlicht die Lobby vor Ready-/Countdown-/Aktivierung keine Teilnehmerseiten; Teilnehmerkarten zeigen stattdessen, dass die Seite beim Start ausgelost wird. Die Web-UI verwendet denselben Modus für Header und Erstellungsnotiz, sodass bei `Auslosen` kein `Du startest als Runner/Korp` mehr erscheint. Die Verbindungslabels trennen die eigene Verbindung (`Du: verbunden/getrennt`) von Teilnehmerstatus (`Teilnehmer verbunden`, `Wartet auf Verbindung`, `Verbindung instabil`). Die interne serverseitige Session-/Deckzuordnung bleibt konsistent und wird beim Aktivieren wie bisher für das aktive Match verwendet.
