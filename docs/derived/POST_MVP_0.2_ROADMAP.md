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

- `docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` nennt V0.3 als "Beide Seiten gegen KI spielbar" mit Runner-KI, verbesserter Corp-KI, KI-vs-KI, Erklärmodus und Simulationstests.
- `docs/Netrunner_Dokumentenpaket_MVP_0_1_0_2/05_planung/Backlog_und_Roadmap.md` nennt V0.3 als "Kartenpool und Regelbreite" mit weiteren ICE-/Breaker-Varianten, Assets/Upgrades, Tags, Damage, größeren Demo-Decks und eingeschränkter Deckvalidierung.

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
| V0.5 | Replay, Bedienbarkeit und Lernqualität | bessere Replay-UI, Save/Resume im UI, verständlichere Fehler, Run-Flow-Hilfen, Erklär-/Analyseansichten, Keyboard Shortcuts | öffentliche Replay-Plattform, Zuschauer als Standardfeature |
| V0.6 | Kuratierte Lern-Decks und eingeschränkte Deckvalidierung | feste Lern-Deckpaare, eingeschränkte lokale Deckvalidierung, versionierter Kartenpool, Manifest-Abgleich | freier Deckbuilder mit Formaten, Rotation, Einfluss als voller Produktumfang |
| V0.7 | Privater Betrieb und Persistenzhärtung | SQLite als Standard oder sauberer Migrationspfad, Backups, Docker/private Server-Doku, HTTPS/WSS-Betrieb, Recovery-Tests | Hochverfügbarkeit, horizontale Skalierung, öffentlicher Betrieb |
| V1.0 | Private stabile Netrunner-Plattform | Human-vs-KI, KI-vs-Human, Human-vs-Human, KI-vs-KI, Replays, größerer kuratierter Kartenpool, gute Testsuite, private Hostingfähigkeit | öffentliche Plattform nur nach neuer Scope-Entscheidung |

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

Der detaillierte Plan liegt in `docs/derived/MVP_0.4_DETAILED_PLAN.md`.

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

## 8. V0.5: Replay, Bedienbarkeit und Lernqualität

V0.5 ist der Punkt, an dem die Anwendung für wiederholte private Nutzung deutlich angenehmer wird.

Mögliche Inhalte:

- bessere Board-Visualisierung ohne Regelduplikate im Client,
- Replay-UI mit sichtgefilterten Ansichten,
- Save/Resume im UI auf Basis der vorhandenen Persistenz,
- verständlichere, aber side-sichere Fehler,
- Run-Flow-Hilfen für Approach, Encounter, Break und Access,
- KI-Erklärungen als Lernhilfe,
- Keyboard Shortcuts und bessere Desktop-Ergonomie.

Mobile Optimierung bleibt bis dahin "nice to have", aber nicht Gate.

## 9. V0.6: Kuratierte Lern-Decks

V0.6 erweitert den kontrollierten Kartenpool nicht beliebig, sondern über kuratierte Lern-Decks.

Mögliche Lern-Deckpaare:

- Runner 1: Criminal / Run & Money
- Runner 2: Shaper / Setup & Breaker Suite
- Corp 1: Weyland / Build & Score
- Corp 2: Haas-Bioroid / Efficient ICE & Remote

Zurückstellen:

- Jinteki mit stärkerem Schadens- und Bluff-Fokus,
- NBN mit Tags und Tag-Punishment,
- komplexe Virusmechaniken,
- komplexe Hosting-Mechaniken,
- breite Kartenpools.

## 10. V0.7 und V1.0

V0.7 stabilisiert privaten Betrieb: Storage, Backups, Docker, HTTPS/WSS, Recovery und private Deployments.

V1.0 ist erreicht, wenn die Anwendung als private, stabile Netrunner-Plattform taugt:

- Human-vs-KI in beide Richtungen,
- Human-vs-Human privat,
- KI-vs-KI und Simulationen,
- Replays und Debugging,
- kuratierter größerer Kartenpool,
- robuste Tests,
- private Hostingfähigkeit,
- dokumentierte Scope-Grenzen.

Öffentliche Plattformfunktionen wie Matchmaking, Accounts, öffentliche Lobbies, Ranglisten, Chat, Zuschauer und Moderation bleiben bis zu einer expliziten Scope-Entscheidung außerhalb der Roadmap-Gates.

## 11. Release-Gates ab V0.3

| Gate | Muss bestehen |
|---|---|
| Engine | `applyAction`, `getLegalActions`, `getPlayerView`, Replay und StateHash bleiben grün. |
| Visibility | Keine Hidden-Info-Leaks in PlayerViews, AI-Inputs, Erklärungen, Simulationslogs, WebSocket, Reconnect, Undo, Errors oder Debug. |
| Determinismus | Simulationen sind per Seed reproduzierbar; StateHashes sind stabil. |
| Controller | Human, AI und Replay reichen nur `PlayerActions` ein, die aus aktuellen `LegalActions` abgeleitet sind. |
| Tests | Jede neue Funktion hat Unit-/Integration-/Szenarioabdeckung entsprechend Risiko. |
| Scope | Keine Kartenpool-, Plattform- oder UI-Ausweitung ohne dokumentierte Scope-Entscheidung. |

## 12. Entscheidungsbedarf vor V0.3-Requirements

Vor dem V0.3-Requirements-Freeze sind folgende Entscheidungen zu treffen oder bewusst als Annahme zu dokumentieren:

| ID | Entscheidung | Empfehlung |
|---|---|---|
| V03-O-001 | V0.3-Primärziel | KI/Simulation als verbindlichen Scope festlegen. |
| V03-O-002 | Hard-Difficulty | In V0.3 nur als begrenzter Lookahead oder als `Should`, kein FullState. |
| V03-O-003 | KI-Erklärungen | Debug-/Lernhilfe ja, aber nur aus sichtbaren Daten. |
| V03-O-004 | Simulationstiefe | CI klein halten, längere Soak-Läufe lokal/nightly. |
| V03-O-005 | UI-Modi | Minimal: Human Runner vs Corp AI, Human Corp vs Runner AI, KI-vs-KI Demo. |
| V03-O-006 | Kartenpool | Für V0.3 unverändert auf Demo-Decks lassen. |

## 13. Nächster empfohlener Schritt

Der nächste gate-basierte Schritt ist:

```text
MVP 0.3 Requirements Freeze: KI- und Simulationsphase
```

Diese Phase soll aus `docs/derived/MVP_0.3_DETAILED_PLAN.md` ausführbare Anforderungen, AI-Controller-Spezifikation, Simulationstestmatrix, Szenario-Fixtures und Akzeptanzkriterien ableiten. Implementierung beginnt erst nach `ready_for_implementation: true`.
