---
activityId: act-2026-05-17-v2-cloud-deck-boundary
status: done
kind: concept
area: shared
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-0-auth-privacy-cloud-decks/cloud-deck-boundary-contract.md
checks:
  - git diff --check
---

# Cloud-Decks von Match-Snapshots trennen

## Ziel

Für V2.0 soll vorab geklärt werden, wie optionale private Cloud-Decks sauber von lokalen Decks, Match-Snapshots, Decklegalität und Hidden-Matchdaten getrennt werden.

## Kontext und Quellen

- V2.0 Roadmap: `Private Cloud-Decks als optionale Ergänzung zu lokalen Decks`.
- V2.0 Mechanikgrenze: Deck-Snapshots und Account-Decks trennen; Matchstart validiert weiter Mechanik-Coverage und Card-Status; Cloud-Decks speichern keine Hidden-Matchdaten.
- Bestehende lokale Deckbibliothek und Matchstart-Snapshots sind bereits produktiv genutzt.

## Scope

- Bestehende Deck-Draft-, Snapshot- und Matchstart-Verträge analysieren.
- Minimalen Datenvertrag für accountgebundene Deck-Drafts skizzieren.
- Import lokaler Decks als explizite Nutzerentscheidung modellieren.
- Sichtbarkeit von Decklisten, Deckhashes und Match-Snapshots im Accountkontext abgrenzen.
- Kleine Folgepakete für Schema, API oder UI anlegen, falls der Schnitt klar ist.

## Nicht im Scope

- Keine Cloud-Deck-Implementierung.
- Keine Format- oder Kartenfreigabe.
- Keine automatische Migration lokaler Decks.
- Keine öffentliche Decklisten- oder Profilfunktion.

## Akzeptanzkriterien

- [x] Account-Decks, lokale Decks und matchgebundene Snapshots sind begrifflich getrennt.
- [x] Es ist dokumentiert, welche Deckdaten niemals in Lobby-, Invite-, Replay- oder KI-Payloads erscheinen dürfen.
- [x] Matchstart-Revalidierung bleibt serverseitig und release-/mechanikgebunden.
- [x] Mindestens ein kleiner Implementierungsschnitt ist benannt oder die Blocker sind konkret.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Dieses Paket hängt fachlich am Auth-/Privacy-Schnitt; ohne dessen Ergebnis nur Analyse und keine Implementierungsfreigabe.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/v2/v2-0-auth-privacy-cloud-decks/cloud-deck-boundary-contract.md` trennt lokale Decks, Cloud-Deck-Drafts und Match-Snapshots, dokumentiert verbotene Deckdaten in Lobby-, Invite-, Replay-, Gegner- und KI-Payloads, bestätigt serverseitige Matchstart-Revalidierung und benennt die kleinen Umsetzungsschnitte `cloud-deck-schema-storage`, `cloud-deck-import-api` und `cloud-deck-matchstart-handoff` samt Blockern.
