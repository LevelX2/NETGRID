# Roadmap nach MVP 0.4

## Stand

Stand: 2026-05-04.

MVP 0.3 und MVP 0.4 sind abgeschlossen. MVP 0.4 hat einen kleinen kontrollierten Kartenpool, V0.4-Decks, kuratierte Deckvalidierung, Hardware, ein einfaches Upgrade, Tags, `remove_tag`, Tag-Punishment und KI-Simulation geliefert.

Die neue Planungsentscheidung lautet: **UI-Neugestaltung und Designgestaltung kommen in V0.7.** Bis dahin laufen Analysen; V0.5 und V0.6 sollen nicht durch ein großes UI-Redesign blockiert werden.

Aktueller Fortschritt: V0.5 bis V0.9, V0.91 Requirements, V0.92/V0.93, V0.94 bis V0.99 und S01 sind abgeschlossen. V0.91 erlaubt private lokale O:NR-1996-Frontbilder nur als Anzeige-Artefakte; öffentliche Assetnutzung, Card Backs, standalone Frames/Logos und Engine-/KI-/Replay-/StateHash-Einfluss bleiben ausgeschlossen.

Nach der Bestandsaufnahme vom 2026-05-04 ist zusätzlich ein lokaler privater O:NR-v1-Testzugang sichtbar: Engine-Harness-Tests und Web-Overlay-Pfade existieren, aber serverseitiger Matchstart, AI-/Multiplayer-Smokes, versioniertes Manifest und Final Review fehlen noch. Das ist eine eigene Scope-Entscheidung vor weiterem Ausbau.

## Gestaffelte Roadmap

| Version | Kernziel | Inhalt |
|---|---|---|
| V0.5 | Kartenimport und Kartenkatalog | Import-Schema, lokaler Kartensnapshot, Kartenbrowser, Basis-/Starterset als Datenbestand, Importvalidierung, Manifest-Abgleich. |
| V0.6 | Deckeditor- und Match-Setup-Fundament | Deck speichern/laden, Import/Export, Deckvalidierung, Deckauswahl beim Matchstart, spielbar/nicht-spielbar Kennzeichnung. |
| V0.7 | UI-Neugestaltung und Designgestaltung | Neues Spielbrett, Matchfluss, Run-Flow, Action-Panel, Karten-/Deckansichten, Replay-/Log-Darstellung, KI-Erklärungen und visuelle Richtung. |
| V0.8 | Basisset-/Starterset-Spielbarkeit | Ausgewählter spielbarer Slice aus importiertem Datenbestand; Damage, Resources, Traces und Identitäten nur als Teilgates. |
| V0.9 | Bessere KI | Deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen und bessere Reason-Codes. |
| V0.91 | Kartenbild-Asset-Gate und Bild-Import | Quellen-/Nutzungsentscheidung, lokaler nicht versionierter Bildcache und Anzeige bekannter Kartenbilder ohne Gameplay-Einfluss. |
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
- Technische Bildmetadaten aus NETGRIDDB sind keine automatische Nutzungsfreigabe; Card Art, Frames und Card Backs bleiben ohne explizite Freigabe gesperrt.

## Nächster Schritt

Nächster gate-basierter Schritt ist eine **Scope-Entscheidung nach V0.99/S01**:

- lokalen privaten O:NR-v1-Testzugang formal integrieren, engine-only/lokal experimentell lassen oder entfernen,
- V1.0-/Stabilisierungsscope starten,
- oder ein Mechanik-Folgegate wie M2 Setup/Mulligan/Deckout, M11 Prevention/Avoid/Interrupt/Replacement oder M12 tiefere Deckbuilding-/Formatregeln wählen.

V0.91 ist für private lokale O:NR-1996-Frontbilder als Anzeige-Artefakte freigegeben, aber nicht für öffentliche Distribution oder Gameplay-Einfluss.

Wichtige Arbeitsgrundlage: `docs/releases/mvp/roadmaps/post-mvp-0-4-roadmap.md`.

Aktuelle Bestandsaufnahme: `docs/releases/roadmaps/bestandsaufnahme-2026-05-04.md`.

Detailpläne:

- `docs/releases/mvp/mvp-0-5-card-import-catalog/plan.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/plan.md`
- `docs/releases/mvp/mvp-0-7-ui-redesign/plan.md`
- `docs/releases/mvp/mvp-0-8-playable-card-slice/plan.md`
- `docs/releases/mvp/mvp-0-9-ai-difficulty/plan.md`
- `docs/releases/mvp/mvp-0-91-card-images/plan.md`
