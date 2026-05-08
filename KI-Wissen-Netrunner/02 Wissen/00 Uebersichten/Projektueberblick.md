# Projektüberblick

## Zielbild

NETGRID ist eine private Webapplikation für regelgeführtes, deterministisches Netrunner-Spiel und spätere Simulation. Der erste spielbare Kern blieb bewusst klein: Ein Mensch spielt als Runner gegen eine einfache Corp-KI. Danach folgte privates Human-vs-Human-Multiplayer über dieselbe Engine.

## MVP-Phasen

| Phase | Ziel | Grenze |
|---|---|---|
| Setup | Repository, Codex-Regeln, Wissensbasis, Quellenstruktur und Monorepo-Hülle einrichten. | Keine Engine-, UI-, Server-, KI- oder Testimplementierung. |
| MVP 0.1 Requirements | Quellen in ausführbare Anforderungen, Datenartefakte, Szenarien und Testmatrix überführen. | Noch kein Implementierungscode. |
| MVP 0.1 Implementation | Human Runner gegen einfache Corp-KI mit festen Demo-Decks umsetzen. | Kein Human-vs-Human-Multiplayer. |
| MVP 0.2 Requirements | Multiplayer-Anforderungen, WebSocket-Protokoll, Persistenz, Reconnect und Undo spezifizieren. | Erst nach MVP-0.1-Gate. |
| MVP 0.2 Implementation | Private Human-vs-Human-Partien über Einladungslink ermöglichen. | Keine öffentliche Plattform, kein Matchmaking, kein breiter Kartenpool. |
| MVP 0.3 Requirements | KI- und Simulationsphase ausführbar spezifizieren. | Noch keine Kartenpool-Erweiterung und keine LLM-KI. |
| MVP 0.3 Implementation | Runner-KI, verbesserte Corp-KI, KI-vs-KI-Simulation, Controller-Modell und Erklärmodus umsetzen. | Abgeschlossen; KI nutzt nur PlayerViews, LegalActions und side-gefilterte Events. |
| MVP 0.4 | Kontrollierte Kartenpool- und Regelbreite-Erweiterung. | Abgeschlossen: Safe Card Batch, eingeschränkte Deckvalidierung, Hardware, einfaches Upgrade und Tags; Damage nur späteres Teilgate. |
| MVP 0.5 | Kartenimport und Kartenkatalog. | Importierte Karten werden nicht automatisch spielbar. |
| MVP 0.6 | Deckeditor- und Match-Setup-Fundament. | Keine finale UI-Neugestaltung; kein Matchstart ohne validierte Deck-Snapshots. |
| MVP 0.7 | UI-Neugestaltung und Designgestaltung. | Keine ungetestete Regel- oder Kartenpool-Erweiterung. |
| MVP 0.8+ | Basisset-/Starterset-Spielbarkeit, bessere KI und private Plattformhärtung gestaffelt erweitern. | Keine Plattformfeatures ohne explizite Scope-Entscheidung. |

## Architekturgrundsätze

- Die Rules Engine ist die einzige Regelautorität.
- UI, KI und Server reichen Absichten ein, legen aber keine Spielregeln aus.
- Der vollständige GameState bleibt serverseitig oder engine-intern.
- PlayerViews, PublicEvents, KI-Inputs, Fehler, Logs, Reconnect, Undo und Replay dürfen keine verdeckten Informationen leaken.
- Jede erfolgreiche Transition erzeugt Event, StateVersion und StateHash.
- Zufall wird über Seed, RandomCounter und RandomDrawRecords reproduzierbar.
- Der Kartenpool bleibt für MVP 0.1 und 0.2 auf feste Demo-Decks begrenzt.
- V0.3 bleibt ebenfalls beim vorhandenen Demo-Kartenpool und erweitert zuerst KI, Controller und Simulation.
- V0.4 erweitert nur interne fiktive Karten mit Manifest-, Test-, Visibility- und Replay-Pflicht.
- Ab V0.5 sind Kartenimport, Deckeditor und Match-Setup getrennte Produktbausteine; UI-Neugestaltung ist bewusst V0.7.

## Technisches Zielmodell

- Node 24 LTS
- pnpm Workspaces
- TypeScript strict
- Vitest
- Next.js/React für die Web-UI
- Reines TypeScript-Engine-Paket ohne UI-, Netzwerk-, Datenbank- oder KI-Abhängigkeiten
- SQLite bevorzugt für MVP 0.2

## Git- und Arbeitsmodell

- Lokales Git ohne Remote.
- `main` ist der lokale Integrationsbranch.
- Laufende Arbeit nach dem Initialstand erfolgt auf `codex/`-Arbeitsbranches.
- Kein Push und kein Pull Request ohne später eindeutig konfiguriertes Remote-Modell.
