# Roadmap nach MVP 0.2

Status: konsolidierte Planungsfassung  
Stand: 2026-05-03  
Basis: vorhandene Quellen, Derived-Artefakte und Entwicklungsstand bis `MVP_0.2_done: true`

## 1. Zweck

Dieses Dokument konsolidiert die Roadmap nach MVP 0.2. Es löst die bisherige Unschärfe auf, dass V0.3 in älteren Quellen einmal als KI-/Simulationsstufe und einmal als Kartenpool-/Regelbreite-Stufe beschrieben wurde.

Die Roadmap ist noch kein vollständiger Requirements-Freeze für alle Folgeversionen. Sie legt aber fest, in welcher Reihenfolge die nächsten Phasen sinnvoll sind und welche Scope-Grenzen gelten.

## 2. Quellen und Konflikt

Gesicherter Stand:

- MVP 0.1 ist abgeschlossen: lokale Human-Runner-vs-Corp-KI-Partie mit deterministischer Engine, LegalActions, PlayerViews, EventLog, Replay/StateHash, Visibility-Tests und einfacher Weboberfläche.
- MVP 0.2 ist abgeschlossen: privater Human-vs-Human-Multiplayer mit Host/Join-Link, WebSocket-Spiel, Reconnect, Undo, Hash-only Tokens, per-Match-Lock, Idempotency, JSON-Storage-Port und side-gefilterten PlayerViews.

Quellenkonflikt:

- `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` nennt V0.3 als "Beide Seiten gegen KI spielbar" mit Runner-KI, verbesserter Corp-KI, KI-vs-KI, Erklärmodus und Simulationstests.
- `docs/NETGRID_Dokumentenpaket_MVP_0_1_0_2/05_planung/Backlog_und_Roadmap.md` nennt V0.3 als "Kartenpool und Regelbreite" mit weiteren ICE-/Breaker-Varianten, Assets/Upgrades, Tags, Damage, größeren Demo-Decks und eingeschränkter Deckvalidierung.

Entscheidung:

V0.3 wird als KI- und Simulationsstufe geführt. Kartenpool und Regelbreite werden in V0.4 verschoben.

Begründung:

- Die Engine- und Multiplayer-Basis ist jetzt stabil genug, um beide Seiten über denselben LegalAction-Pfad durch Controller zu bedienen.
- KI-vs-KI und Simulationen erhöhen die Test- und Regressionskraft, bevor der Kartenpool wächst.
- Eine Kartenpool-Erweiterung ohne stärkere Simulationstests erhöht das Risiko für ungetestete Sonderlogik.
- Der aktuelle AI-Code ist bewusst minimal: nur Corp, Prioritätsliste, LegalAction-Zwang. Runner-KI fehlt vollständig. Diese Lücke ist klarer und risikoärmer zu schließen als gleichzeitig neue Regelmechaniken einzuführen.

## 3. Leitprinzipien ab V0.3

1. Engine-Korrektheit bleibt wichtiger als UI-Komfort.
2. Jede steuernde Instanz, auch KI, wählt nur aus `LegalActions`.
3. KI erhält nie FullState und nie gegnerische verdeckte Informationen.
4. Simulationen müssen deterministisch, replaybar und per Seed reproduzierbar sein.
5. Neue Karten kommen erst nach einem stabilen KI-/Simulationsharness in die Roadmap.
6. Jede neue Karte oder Mechanik benötigt Manifest-, Unit-, Szenario-, Visibility- und Replay-Abdeckung.
7. Plattformfunktionen bleiben zurückgestellt, bis private Kernmodi stabil sind.
8. JSON-Storage ist für den aktuellen privaten Stand akzeptiert; SQLite bleibt eine spätere Härtungsaufgabe.

## 4. Gestaffelte Zielversionen

| Version | Kernziel | Enthalten | Nicht enthalten |
|---|---|---|---|
| V0.2.1 | Nachlaufende Härtung des privaten Multiplayer-Stands | SQLite-Entscheidung oder Migrationsplan, screenshotbasierter UI-Smoke, private Betriebsnotizen, Log-/Token-Härtung falls nötig | Neue Karten, neue KI, Plattformfeatures |
| V0.3 | KI- und Simulationsgrundlage | Runner-KI, verbesserte Corp-KI, KI-vs-KI, Controller-Modell, Erklärmodus, Simulationstests, AI-Visibility-Gates | Kartenpool-Erweiterung, LLM-KI, Deckbuilder |
| V0.4 | Kartenpool und Regelbreite kontrolliert erweitern | zusätzliche Basisaktionen, weitere ICE-/Breaker-Varianten, einfache Assets/Upgrades, ggf. erste Tags oder Damage in eng begrenztem Umfang, größere Demo-Decks | breite offizielle Kartenpools, freie Deckwahl, komplexe Viren/Hosting/Replacement-Systeme |
| V0.5 | Kartenimport und Kartenkatalog | Import-Schema, lokaler Kartensnapshot, Kartenbrowser, Basis-/Starterset als Datenbestand, Importvalidierung, Manifest-Abgleich | automatische Regelumsetzung, große UI-Neugestaltung |
| V0.6 | Deckeditor- und Match-Setup-Fundament | Deck speichern/laden, Import/Export, Deckvalidierung, Matchstart mit Deckauswahl, spielbar/nicht-spielbar Kennzeichnung | finale Designgestaltung, vollständiger Deckbuilder-Komfort |
| V0.7 | UI-Neugestaltung und Designgestaltung | neues Spielbrett, Matchfluss, Run-Flow, Action-Panel, Karten-/Deckansichten, Replay-/Log-Darstellung, KI-Erklärungen | neue Regelbreite als Hauptziel, ungetestete Kartenfreigabe |
| V0.8 | Basisset-/Starterset-Spielbarkeit | ausgewählter spielbarer Slice aus importiertem Datenbestand, Damage/Resources/Traces/Identitäten nur als Teilgates | vollständiges Basisset auf einmal, Freitext-Regelinterpretation |
| V0.9 | Bessere KI | deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen, bessere Reason-Codes | KI mit FullState, LLM-KI als Regelakteur |
| V1.0 | Private stabile NETGRID-Plattform | Human-vs-KI, KI-vs-Human, Human-vs-Human, KI-vs-KI, Deckeditor, Kartenkatalog, Replays, private Hostingfähigkeit | öffentliche Plattform nur nach neuer Scope-Entscheidung |

## 5. V0.2.1 als optionaler Härtungsstrang

V0.2.1 ist kein zwingender Feature-Meilenstein vor V0.3, aber ein sinnvoller Nachlaufstrang, wenn die private Multiplayer-Nutzung länger oder außerhalb reiner Entwicklung laufen soll.

Empfohlene Themen:

- JSON-Storage-Grenzen dokumentieren und SQLite-Migrationsentscheidung vorbereiten.
- Screenshotbasierte UI-Smokes für Host/Join, Action-Panel, Reconnect und Undo ergänzen.
- Log-Hygiene gegen Token, FullState und private Kartendetails prüfen.
- Betriebsdokumente auf HTTPS/WSS außerhalb localhost präzisieren.
- Einen privaten Demo-Smoke mit zwei Browserfenstern als wiederholbares Skript dokumentieren.

V0.2.1 blockiert V0.3 nur, wenn im Multiplayer-Betrieb ein Hidden-Info-, Replay-, Token- oder State-Konsistenzrisiko gefunden wird.

## 6. V0.3: KI und Simulation

V0.3 macht beide Seiten über KI steuerbar und nutzt KI-vs-KI als Test- und Analyseinstrument.

Hauptergebnisse:

- Seitenunabhängiges AI-Input- und Controller-Modell.
- Runner-KI für feste Demo-Decks.
- Verbesserte Corp-KI mit Difficulty-Verhalten und besseren Scoring-/Run-Abwehr-Prioritäten.
- KI-vs-KI-Simulationen über viele Seeds mit StateHash, Replay und Invariant-Checks.
- Erklärmodus für KI-Entscheidungen auf Basis sichtbarer Informationen.
- AI-Visibility-Tests für Runner, Corp, Erklärungen, Fehler und Simulationslogs.

V0.3 bleibt bewusst auf dem vorhandenen Kartenpool. Der Zweck ist nicht mehr Spieltiefe, sondern reproduzierbare automatische Partien und bessere Regressionssicherheit.

## 7. V0.4: Kartenpool und Regelbreite

V0.4 nimmt die Kartenpool-Themen aus der alten V0.3-Roadmap auf, aber erst nach dem KI-/Simulationsharness.

Der detaillierte Plan liegt in `docs/releases/mvp/mvp-0-4-card-pool-rules/plan.md`.

Mögliche Inhalte:

- weitere einfache ICE-Varianten,
- weitere Breaker-Varianten oder neutrale Utility-Programme,
- einfache Assets und Upgrades,
- zusätzliche Basisaktionen, falls für neue Karten nötig,
- begrenzte erste Tag- oder Damage-Mechanik nur mit passenden Testkarten,
- größere, aber weiterhin interne Demo-Decks.

Gate-Regel:

Keine neue `playable_mvp` Karte ohne Manifest-Eintrag, Kartentest, Szenariotest, Visibility-Test und Replay-/StateHash-Abdeckung.

Planungsentscheidung:

- V0.4 startet mit einem Safe Card Batch und eingeschränkter Deckvalidierung.
- Tags sind die bevorzugte erste neue Regelgruppe.
- Damage wird nur als eigenes Teilgate oder V0.4.x umgesetzt, weil es Hidden Information, RandomDrawRecords, Undo-Barrieren und AI-Visibility berührt.

## 8. Post-MVP-0.4-Roadmap

Nach abgeschlossenem MVP 0.4 wurde die Folge-Roadmap produktnäher neu geschnitten. Die UI- und Design-Neugestaltung wird bewusst nach V0.7 gelegt, weil dazu noch Analysen laufen.

Der detaillierte aktuelle Plan liegt in `docs/releases/mvp/roadmaps/post-mvp-0-4-roadmap.md`.

### V0.5: Kartenimport und Kartenkatalog

V0.5 schafft eine saubere lokale Kartendatenbasis:

- Import-Schema,
- lokaler versionierter Kartensnapshot,
- Kartenbrowser,
- Basis-/Starterset als Datenbestand,
- Importvalidierung,
- Manifest-Abgleich.

Importierte Karten werden dadurch nicht automatisch spielbar.

### V0.6: Deckeditor- und Match-Setup-Fundament

V0.6 macht Decks als eigenes Produktobjekt nutzbar:

- Deck speichern/laden,
- Import/Export,
- Deckvalidierung,
- Matchstart mit Deckauswahl,
- Kennzeichnung spielbarer und nicht spielbarer Karten.

Die UI bleibt hier funktional; die große Gestaltung folgt in V0.7.

### V0.7: UI-Neugestaltung und Designgestaltung

V0.7 nutzt die laufenden Analysen und bündelt:

- neues Spielbrett,
- Matchfluss,
- Run-Flow,
- Action-Panel,
- Karten-/Deckansichten,
- Replay-/Log-Darstellung,
- KI-Erklärungen,
- visuelle Richtung und Designsystem.

### V0.8: Basisset-/Starterset-Spielbarkeit

V0.8 macht aus dem importierten Datenbestand einen kuratierten spielbaren Slice. Damage, Resources, Traces, Identitätsfähigkeiten und weitere Mechaniken werden nur als getrennte Teilgates aufgenommen.

### V0.9: Bessere KI

V0.9 verbessert die KI über deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen und bessere Reason-Codes, ohne verdeckte Informationen zu verwenden.

## 9. V1.0

V1.0 ist erreicht, wenn die Anwendung als private, stabile NETGRID-Plattform taugt:

- Human-vs-KI in beide Richtungen,
- Human-vs-Human privat,
- KI-vs-KI und Simulationen,
- Kartenkatalog und Deckeditor,
- Replays, Logs und Debugging,
- kuratierter spielbarer Kartenpool,
- robuste Tests,
- private Hostingfähigkeit,
- dokumentierte Scope-Grenzen.

Öffentliche Plattformfunktionen wie Matchmaking, Accounts, öffentliche Lobbies, Ranglisten, Chat, Zuschauer und Moderation bleiben bis zu einer expliziten Scope-Entscheidung außerhalb der Roadmap-Gates.

## 10. Release-Gates ab V0.3

| Gate | Muss bestehen |
|---|---|
| Engine | `applyAction`, `getLegalActions`, `getPlayerView`, Replay und StateHash bleiben grün. |
| Visibility | Keine Hidden-Info-Leaks in PlayerViews, AI-Inputs, Erklärungen, Simulationslogs, WebSocket, Reconnect, Undo, Errors oder Debug. |
| Determinismus | Simulationen sind per Seed reproduzierbar; StateHashes sind stabil. |
| Controller | Human, AI und Replay reichen nur `PlayerActions` ein, die aus aktuellen `LegalActions` abgeleitet sind. |
| Tests | Jede neue Funktion hat Unit-/Integration-/Szenarioabdeckung entsprechend Risiko. |
| Scope | Keine Kartenpool-, Plattform- oder UI-Ausweitung ohne dokumentierte Scope-Entscheidung. |

## 11. Historischer Entscheidungsbedarf vor V0.3-Requirements

Vor dem V0.3-Requirements-Freeze sind folgende Entscheidungen zu treffen oder bewusst als Annahme zu dokumentieren:

| ID | Entscheidung | Empfehlung |
|---|---|---|
| V03-O-001 | V0.3-Primärziel | KI/Simulation als verbindlichen Scope festlegen. |
| V03-O-002 | Hard-Difficulty | In V0.3 nur als begrenzter Lookahead oder als `Should`, kein FullState. |
| V03-O-003 | KI-Erklärungen | Debug-/Lernhilfe ja, aber nur aus sichtbaren Daten. |
| V03-O-004 | Simulationstiefe | CI klein halten, längere Soak-Läufe lokal/nightly. |
| V03-O-005 | UI-Modi | Minimal: Human Runner vs Corp AI, Human Corp vs Runner AI, KI-vs-KI Demo. |
| V03-O-006 | Kartenpool | Für V0.3 unverändert auf Demo-Decks lassen. |

## 12. Nächster empfohlener Schritt

Der nächste gate-basierte Schritt ist:

```text
MVP 0.5 Requirements Freeze: Kartenimport und Kartenkatalog
```

Diese Phase soll aus `docs/releases/mvp/roadmaps/post-mvp-0-4-roadmap.md` ausführbare Anforderungen für Import-Schema, lokale Snapshots, Kartenkatalog, Manifest-Abgleich und Importvalidierung ableiten. Implementierung beginnt erst nach `ready_for_implementation: true`.
