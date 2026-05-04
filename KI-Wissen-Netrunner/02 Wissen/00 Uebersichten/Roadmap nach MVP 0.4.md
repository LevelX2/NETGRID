# Roadmap nach MVP 0.4

## Stand

Stand: 2026-05-03.

MVP 0.3 und MVP 0.4 sind abgeschlossen. MVP 0.4 hat einen kleinen kontrollierten Kartenpool, V0.4-Decks, kuratierte Deckvalidierung, Hardware, ein einfaches Upgrade, Tags, `remove_tag`, Tag-Punishment und KI-Simulation geliefert.

Die neue Planungsentscheidung lautet: **UI-Neugestaltung und Designgestaltung kommen in V0.7.** Bis dahin laufen Analysen; V0.5 und V0.6 sollen nicht durch ein großes UI-Redesign blockiert werden.

Aktueller Fortschritt: V0.5 bis V0.9 sind abgeschlossen. V0.91 ist für private lokale Kartenscans/lokale Kartenbilder als reine Anzeige-Artefakte entschieden. V0.92 und V0.93 sind abgeschlossen. Die Detailplanung für V0.94 bis V0.99 liegt vor; der nächste empfohlene Gate-Schritt ist V0.94 Requirements Freeze für Damage/Flatline.

## Gestaffelte Roadmap

| Version | Kernziel | Inhalt |
|---|---|---|
| V0.5 | Kartenimport und Kartenkatalog | Import-Schema, lokaler Kartensnapshot, Kartenbrowser, Basis-/Starterset als Datenbestand, Importvalidierung, Manifest-Abgleich. |
| V0.6 | Deckeditor- und Match-Setup-Fundament | Deck speichern/laden, Import/Export, Deckvalidierung, Deckauswahl beim Matchstart, spielbar/nicht-spielbar Kennzeichnung. |
| V0.7 | UI-Neugestaltung und Designgestaltung | Neues Spielbrett, Matchfluss, Run-Flow, Action-Panel, Karten-/Deckansichten, Replay-/Log-Darstellung, KI-Erklärungen und visuelle Richtung. |
| V0.8 | Basisset-/Starterset-Spielbarkeit | Ausgewählter spielbarer Slice aus importiertem Datenbestand; Damage, Resources, Traces und Identitäten nur als Teilgates. |
| V0.9 | Bessere KI | Deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen und bessere Reason-Codes. |
| V0.91 | Kartenbild-Asset-Gate und Bild-Import | Quellen-/Nutzungsentscheidung, lokaler nicht versionierter Bildcache und Anzeige bekannter Kartenbilder ohne Gameplay-Einfluss. |
| V0.92 | Mechanik-Inventar und M1-Spezifikation | Coverage-Matrix, M1-Requirements, Effect-/Timing-/Choice-/Eventklassifikations-Spezifikation. |
| V0.93 | M1-Engine-Fundament und M2-Requirements | Additive Effects, Abilities, `pendingChoice`, Eventklassifikation; M2 nur als Requirements. |
| V0.94 | Damage und Flatline | Random Grip-Trash, Flatline-Grundvertrag, Hidden-Info-Barrieren, Replay/StateHash. |
| V0.95 | Resources und Tag-Interaktion | Runner-Resources, Resource-Install, tagbasierter Resource-Trash. |
| V0.96 | Trace, Link und Bidding | Interaktive Choice-Sequenz für Corp-/Runner-Bids mit Link und Folgeeffekten. |
| V0.97 | Run, Jack-out, Breach und Multiaccess | Breach-State, Access-Queue, Jack-out und Multiaccess für zentrale Server. |
| V0.98 | Identitätsfähigkeiten und Hidden-Zone-Tools | Identity-Trigger/Modifier sowie Search, Reveal, Expose, Arrange, Shuffle und Swap. |
| V0.99 | Hosting, Viren, Purge und Counter-Familien | Counter-API, Hosting, Virus/Purge, Recurring Credits, Bad Publicity und Spezialcounter nach Bedarf. |
| V1.0 | Private stabile Plattform | Human-vs-KI, Human-vs-Human, KI-vs-KI, Deckeditor, Kartenkatalog, Replays, kuratierter Kartenpool und private Hostingfähigkeit. |

## Leitprinzipien

- Kartenimport bedeutet nicht automatisch Spielbarkeit.
- Importierte Karten werden lokal versioniert und validiert.
- Offizielle oder externe Kartendaten sind Datenquelle, nicht Regelinterpreter.
- Eine Karte wird erst spielbar, wenn Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke bestehen.
- Der Deckeditor darf nicht implementierte Karten anzeigen, aber nicht für spielbare Decks freigeben.
- V0.7 ist der bewusste UI- und Design-Schnitt; vorher nur funktionale UI-Anpassungen.
- V0.8 braucht vor Kartenfreigabe harte Eingangsgates, Quellenentscheidung, Kandidaten-Scoring, Resolver-Registry und Per-Card-Deviation.
- V0.91 kommt bewusst erst nach V0.9, damit echte Kartenbilder nicht mit Kartenpool-, KI- oder UI-Gates vermischt werden.
- Kartenbilder sind lokale Anzeige-Artefakte, keine Regelquelle, kein Decklegalitätskriterium und kein Match-State.
- Technische Bildmetadaten aus NetrunnerDB sind keine automatische Nutzungsfreigabe; Card Art, Frames und Card Backs bleiben ohne explizite Freigabe gesperrt.

## Nächster Schritt

Nächster gate-basierter Schritt ist **V0.94 Requirements Freeze für Damage/Flatline**, sofern die Reihenfolge nicht ausdrücklich geändert wird. V0.95 bis V0.99 sind detailliert geplant, aber noch nicht implementierungsfreigegeben.

Wichtige Arbeitsgrundlage: `docs/derived/POST_MVP_0.4_ROADMAP.md`.

Detailpläne:

- `docs/derived/MVP_0.5_DETAILED_PLAN.md`
- `docs/derived/MVP_0.6_DETAILED_PLAN.md`
- `docs/derived/MVP_0.7_DETAILED_PLAN.md`
- `docs/derived/MVP_0.8_DETAILED_PLAN.md`
- `docs/derived/MVP_0.9_DETAILED_PLAN.md`
- `docs/derived/MVP_0.91_DETAILED_PLAN.md`
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`
- `docs/derived/MVP_0.96_DETAILED_PLAN.md`
- `docs/derived/MVP_0.97_DETAILED_PLAN.md`
- `docs/derived/MVP_0.98_DETAILED_PLAN.md`
- `docs/derived/MVP_0.99_DETAILED_PLAN.md`
- `docs/derived/MVP_0.94_0.99_PLANNING_REVIEW.md`
