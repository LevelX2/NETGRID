# Roadmap nach MVP 0.2

## Stand

Stand: 2026-05-03.

MVP 0.1 und MVP 0.2 sind abgeschlossen. Die bisherige Quellenlage enthielt zwei unterschiedliche V0.3-Spuren:

- V0.3 als KI-/Simulationsstufe: Runner-KI, verbesserte Corp-KI, KI-vs-KI, Erklärmodus und Simulationstests.
- V0.3 als Kartenpool-/Regelbreite-Stufe: weitere ICE-/Breaker-Varianten, Assets/Upgrades, Tags, Damage und größere Demo-Decks.

Die konsolidierte Entscheidung lautet: **V0.3 ist KI und Simulation; Kartenpool und Regelbreite folgen in V0.4.**

## Begründung

- Die Engine und der private Multiplayer sind jetzt stabil genug, um beide Seiten über Controller zu steuern.
- KI-vs-KI-Simulationen stärken Regression, Replay und StateHash-Prüfung, bevor neue Karten und Regelmechaniken hinzukommen.
- Neue Karten ohne stärkeren Simulations- und Testharness würden die Testlast erhöhen und Fehler schwerer isolierbar machen.
- Der aktuelle AI-Code ist bewusst minimal: Corp-KI mit Prioritätsliste; Runner-KI fehlt noch.

## Gestaffelte Roadmap

| Version | Kernziel | Inhalt |
|---|---|---|
| V0.2.1 | Optionaler Multiplayer-Nachlauf | SQLite-/Storage-Entscheidung, UI-Smokes, private Betriebsnotizen, Log-/Token-Härtung falls nötig. |
| V0.3 | KI und Simulation | Runner-KI, Corp-KI v2, KI-vs-KI, Controller-Modell, Erklärmodus, Simulationstests, AI-Visibility-Gates. |
| V0.4 | Kartenpool und Regelbreite | Weitere einfache Karten und Mechaniken, größere Demo-Decks, weiterhin streng kontrolliert und testgetrieben. |
| V0.5 | Kartenimport und Kartenkatalog | Import-Schema, lokaler Kartensnapshot, Kartenbrowser, Basis-/Starterset als Datenbestand, Importvalidierung, Manifest-Abgleich. |
| V0.6 | Deckeditor- und Match-Setup-Fundament | Deck speichern/laden, Import/Export, Deckvalidierung, Deckauswahl beim Matchstart, spielbar/nicht-spielbar Kennzeichnung. |
| V0.7 | UI-Neugestaltung und Designgestaltung | Neues Spielbrett, Matchfluss, Run-Flow, Action-Panel, Karten-/Deckansichten, Replay-/Log-Darstellung, KI-Erklärungen und visuelle Richtung. |
| V0.8 | Basisset-/Starterset-Spielbarkeit | Ausgewählter spielbarer Slice aus importiertem Datenbestand; Damage, Resources, Traces und Identitäten nur als Teilgates. |
| V0.9 | Bessere KI | Deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen und bessere Reason-Codes. |
| V1.0 | Private stabile Plattform | Human-vs-KI, Human-vs-Human, KI-vs-KI, Deckeditor, Kartenkatalog, Replays, kuratierter Kartenpool und private Hostingfähigkeit. |

## V0.3-Kern

V0.3 bleibt beim vorhandenen Demo-Kartenpool. Ziel ist nicht mehr Spieltiefe, sondern automatische, reproduzierbare und sichtgefilterte Spielsteuerung.

V0.3 soll liefern:

- side-neutrales AI-Input-Modell,
- Controller-Abstraktion für Human, KI und Replay,
- Runner-KI,
- verbesserte Corp-KI,
- KI-vs-KI-Simulationsharness,
- Erklärungen auf Basis sichtbarer Informationen,
- Tests gegen illegale KI-Actions,
- Tests gegen Hidden-Info-Leaks in AI-Inputs, Erklärungen und Simulationslogs,
- Replay/StateHash-Nachweise für KI-vs-KI.

## Grenzen

- Keine Kartenpool-Erweiterung in V0.3.
- Keine LLM-KI in V0.3.
- Keine KI mit FullState oder gegnerischer verdeckter Information.
- Keine öffentlichen Plattformfunktionen.
- Keine freie Deckwahl oder Deckbuilder.

## Wichtige Dokumente

- `docs/derived/POST_MVP_0.2_ROADMAP.md`
- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `docs/derived/MVP_0.3_DETAILED_PLAN.md`
- `docs/derived/MVP_0.4_DETAILED_PLAN.md`
- `docs/codex/CODEX_STATUS.md`

## V0.4-Kern

V0.4 ist als Kartenpool- und Regelbreite-Phase detailliert geplant, bleibt aber durch V0.3 gegatet.

Empfohlene Staffelung:

1. Requirements und Baseline `0.4.0`.
2. Card-System- und Datenmodell-Härtung.
3. Safe Card Batch ohne Tags/Damage.
4. Eingeschränkte Deckvalidierung für kuratierte interne Decks.
5. Tags als erste neue Regelgruppe.
6. Damage nur als eigenes Teilgate oder V0.4.x.
7. Finale Regression über KI-vs-KI, Replay, StateHash, Multiplayer, Visibility und Build/Test-Gates.

V0.4 verwendet weiterhin interne fiktive Demo-Karten. Offizielle Karten, externe Kartendatenbanken, Artworks, Card Frames, Card Backs und freier Deckbau bleiben außerhalb des V0.4-Scopes.

## Post-MVP-0.4-Entscheidung

MVP 0.3 und MVP 0.4 sind inzwischen abgeschlossen. Die UI- und Design-Neugestaltung wird bewusst nach V0.7 gelegt, weil dazu noch Analysen laufen. V0.5 fokussiert Kartenimport und Kartenkatalog; V0.6 legt Deckeditor- und Match-Setup-Fundamente.

Nächster gate-basierter Schritt ist **MVP 0.5 Requirements Freeze: Kartenimport und Kartenkatalog**. Dabei sollen aus `docs/derived/POST_MVP_0.4_ROADMAP.md` ausführbare Anforderungen für Import-Schema, lokale Snapshots, Kartenkatalog, Manifest-Abgleich und Importvalidierung abgeleitet werden.
