# Roadmap nach MVP 0.4

## Stand

Stand: 2026-05-03.

MVP 0.3 und MVP 0.4 sind abgeschlossen. MVP 0.4 hat einen kleinen kontrollierten Kartenpool, V0.4-Decks, kuratierte Deckvalidierung, Hardware, ein einfaches Upgrade, Tags, `remove_tag`, Tag-Punishment und KI-Simulation geliefert.

Die neue Planungsentscheidung lautet: **UI-Neugestaltung und Designgestaltung kommen in V0.7.** Bis dahin laufen Analysen; V0.5 und V0.6 sollen nicht durch ein großes UI-Redesign blockiert werden.

## Gestaffelte Roadmap

| Version | Kernziel | Inhalt |
|---|---|---|
| V0.5 | Kartenimport und Kartenkatalog | Import-Schema, lokaler Kartensnapshot, Kartenbrowser, Basis-/Starterset als Datenbestand, Importvalidierung, Manifest-Abgleich. |
| V0.6 | Deckeditor- und Match-Setup-Fundament | Deck speichern/laden, Import/Export, Deckvalidierung, Deckauswahl beim Matchstart, spielbar/nicht-spielbar Kennzeichnung. |
| V0.7 | UI-Neugestaltung und Designgestaltung | Neues Spielbrett, Matchfluss, Run-Flow, Action-Panel, Karten-/Deckansichten, Replay-/Log-Darstellung, KI-Erklärungen und visuelle Richtung. |
| V0.8 | Basisset-/Starterset-Spielbarkeit | Ausgewählter spielbarer Slice aus importiertem Datenbestand; Damage, Resources, Traces und Identitäten nur als Teilgates. |
| V0.9 | Bessere KI | Deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen und bessere Reason-Codes. |
| V1.0 | Private stabile Plattform | Human-vs-KI, Human-vs-Human, KI-vs-KI, Deckeditor, Kartenkatalog, Replays, kuratierter Kartenpool und private Hostingfähigkeit. |

## Leitprinzipien

- Kartenimport bedeutet nicht automatisch Spielbarkeit.
- Importierte Karten werden lokal versioniert und validiert.
- Offizielle oder externe Kartendaten sind Datenquelle, nicht Regelinterpreter.
- Eine Karte wird erst spielbar, wenn Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke bestehen.
- Der Deckeditor darf nicht implementierte Karten anzeigen, aber nicht für spielbare Decks freigeben.
- V0.7 ist der bewusste UI- und Design-Schnitt; vorher nur funktionale UI-Anpassungen.

## Nächster Schritt

Nächster gate-basierter Schritt ist **MVP 0.5 Requirements Freeze: Kartenimport und Kartenkatalog**.

Wichtige Arbeitsgrundlage: `docs/derived/POST_MVP_0.4_ROADMAP.md`.

Detailpläne:

- `docs/derived/MVP_0.5_DETAILED_PLAN.md`
- `docs/derived/MVP_0.6_DETAILED_PLAN.md`
