# V1.0.5 Action Board UX und Board-Klarheit

Status: requirements_ready
Stand: 2026-05-05

## Ziel

V1.0.5 macht laufende Partien besser lesbar, ohne neue Regeln oder Karten einzuführen. Der Release baut auf V1.0.2 und V1.0.3 auf: KI-Pacing, Action-Cues, Board-Highlights, opt-in Audio, Startbereitschaftslobby und das sichtbare `Runner-Rig` sind bereits vorhanden und dürfen nicht regressieren.

Der Schwerpunkt liegt auf Spielansicht, deutschen UI-Begriffen, Run-/Server-Klarheit, Runner-Rig-Struktur, Optionen im Spiel und wiederholbaren UI-Tests.

Nachträgliche Scope-Ergänzung vom 2026-05-05: V1.0.5 umfasst zusätzlich die kontextuelle Präsentation karten- und objektgebundener LegalActions. Globale Actions bleiben links sichtbar; Handkarten- und Boardkartenaktionen erscheinen im Standard als `Ausgewählte Karte`-/`Ausgewähltes Objekt`-Abschnitt im linken Action Panel, nachdem die jeweilige sichtbare Karte oder das jeweilige sichtbare Boardobjekt ausgewählt wurde. Außerdem soll das Gegneraktions-Cue-Overlay per Drag-Handle lokal verschiebbar sein; Positionspresets inklusive bewusst wählbarer Mitte und Reset sind Mindestumfang und Tastaturfallback. Aktive Runs markieren genau den angegriffenen Zielserver, statt mehrere Server gleichartig zu rahmen. Der redundante obere BoardHeader entfällt im Standard. Die RunTimeline bleibt zunächst horizontal-kompakt, bekommt aber klare Richtung/Zielkopplung; eine vertikale bzw. seitliche Variante darf nur übernommen werden, wenn sie im Browser-Smoke besser lesbar ist. Installierte Corp-Karten, besonders ICE, bekommen im Standard side-sichere Rez-/Unrez-Zustände per `Ungerezzt`-Chip, gedämpfter Darstellung und gestricheltem Rahmen; 90-Grad- oder seitliche Darstellung ist optional, aber nicht Default.

## Konsolidierungsentscheidung 2026-05-05

Dieses Dokument ist der kanonische Detailplan für V1.0.5. V1.0.5 implementiert nicht nachträglich V1.0.2, sondern härtet und poliert die bereits vorhandenen V1.0.2-Funktionen KI-Pacing, `advance_ai`, Action-Cues, Board-Highlights und opt-in Action-Audio gegen Regressionen.

Alle V1.0.4-Lifecycle-Themen wie Cancel, Leave, Forfeit, Reconnect, Recreate und Gegnernamen bleiben in `docs/releases/v1/v1-0-4-private-match-lifecycle/plan.md`.

## Requirements-Freeze-Ergänzung 2026-05-05

Die Umsetzung darf auf Basis dieses Plans starten. Die verbindlichen V1.0.5-Anforderungen, UI-Spezifikationen, Testspuren und der wiederholbare Browser-/Playtest-Smoke liegen vor:

- `docs/releases/v1/v1-0-5-action-board-ux/requirements.md`
- `docs/releases/v1/v1-0-5-action-board-ux/action-board-ux-spec.md`
- `docs/releases/v1/v1-0-5-action-board-ux/board-run-ui-spec.md`
- `docs/releases/v1/v1-0-5-action-board-ux/test-matrix.md`
- `docs/releases/v1/v1-0-5-action-board-ux/requirements-review.md`
- `docs/releases/v1/v1-0-5-action-board-ux/browser-playtest-smoke.md`

Der Requirements Review meldet `V1_0_5_requirements_freeze_done: true` und `ready_for_implementation: true`. Das deutsche UI-Glossar ist projektintern freigegeben und beansprucht keine offizielle deutsche NETGRID-Übersetzung; technische IDs bleiben unverändert.

## Muss-Anforderungen

| ID | Muss-Anforderung |
| --- | --- |
| V105-MUST-001 | V1.0.2-KI-Pacing bleibt erhalten: `fast`, `paced`, `manual` und `advance_ai` funktionieren weiter side-authentifiziert und nur über LegalActions/`applyAction`. |
| V105-MUST-002 | V1.0.2-Action-Cues bleiben side-sicher und werden so platziert, dass sie im laufenden Spiel verständlich sind, ohne die Boardmitte unnötig zu verdecken. |
| V105-MUST-003 | Reconnect/Reload spielt alte Cues und alte Sounds nicht automatisch neu ab. |
| V105-MUST-004 | Opt-in Audio bleibt rein lokal und ist im Spiel über kompakte Optionen erreichbar; permanente Platzverschwendung durch dauerhaft offene Regler wird vermieden. |
| V105-MUST-005 | Run-Phasen werden sichtbar deutsch normalisiert, sobald ein belastbares deutsches Handbuch oder Glossar vorliegt; technische Engine-IDs bleiben unverändert. |
| V105-MUST-006 | `RunTimeline` bildet Movement/Jack-out, Encounter, Break, Access/Breach und Abschluss verständlicher ab. |
| V105-MUST-007 | Das gegnerische `Runner-Rig` bleibt für die Corp sichtbar und wird nach Programmen, Hardware und Ressourcen strukturierter dargestellt. |
| V105-MUST-008 | HQ, R&D und Archives werden als zentrale Server verständlicher dargestellt, mit sicheren Counts und Archives-Sichtbarkeit. |
| V105-MUST-009 | Server-Layout und ICE-Ausrichtung werden gegen Handbuch/Spielpraxis geprüft; Umsetzung bleibt reine Darstellung ohne Engine-, PlayerView-, Replay- oder StateHash-Änderung. |
| V105-MUST-010 | Sichtbare Hauptbegriffe werden deutsch geglättet, z. B. `LegalActions`, `Undo`, `Runner View`, `Corp View`, `Approach`, `Encounter`, `Access` nicht als normale Endnutzerlabels stehen lassen. |
| V105-MUST-011 | Zwei-Tab-, Reconnect- und KI-Pacing-Szenarien bekommen wiederholbare Browser- oder Playtest-Smokes. |
| V105-MUST-012 | Hidden-Info-, Replay-/StateHash-, PublicEvent-, AI-Input-, stale-action- und illegal-action-Tests bleiben grün. |
| V105-MUST-013 | Karten- und objektgebundene LegalActions werden kontextuell angezeigt: Das permanente Panel zeigt globale Aktionen und Pflichtentscheidungen, während Handkarten-/Boardkartenoptionen erst nach Auswahl der sichtbaren Karte oder des sichtbaren Objekts erscheinen. |
| V105-MUST-014 | Gegneraktions-Cues sind lokal positionierbar: Ziel ist Drag per Handle mit gemerkter lokaler Position; Positionsoptionen inklusive Mitte und Reset sind Mindestumfang. |
| V105-MUST-015 | Der aktuelle Run-Zielserver wird eindeutig und exklusiv markiert; andere Server erhalten nicht denselben aktiven Run-Rahmen. |
| V105-MUST-016 | Der obere BoardHeader entfällt als redundanter Kasten; nützliche Statusinformation wird kompakt in bestehende Bereiche verschoben. |
| V105-MUST-017 | Die RunTimeline bleibt im Standard horizontal-kompakt mit klarer Richtung/Zielkopplung; vertikal/seitlich darf nur nach bestandener Browserprobe umgesetzt werden. |
| V105-MUST-018 | Gerezzte und ungerezzte installierte Corp-Karten sind optisch unterscheidbar, ohne Runner-Hidden-Info zu öffnen; Standard ist Chip plus gedämpfter/gestrichelter Rahmen. |

## Nicht-Ziele

- Keine neuen Karten.
- Keine neuen offiziellen Mechaniken.
- Keine Prevention-/Avoid-/Interrupt-/Replacement-Engine.
- Kein Tutorial-System.
- Keine Erweiterung des privaten Lobbychats.
- Kein Matchmaking, Spectator-Modus, Accountsystem oder öffentliche Plattformfunktion.
- Keine externen Audio-Dateien oder offiziellen Assets.
- Keine Änderung von Engine-Determinismus, Replay oder StateHash.

## Betroffene Codebereiche

- `apps/web/app/action-cues.ts`
  - Cue-Ableitung, Redaction und Highlight-Zuordnung gegen Regression sichern.
- `apps/web/app/page.tsx`
- RunTimeline, BoardHeader, OpponentPanel, RunnerRigStrip, LegalActionsPanel, UndoPanel, Audio-Menü, AI-Pacing-Controls.
- Kontextfilterung und `Ausgewählte Karte`-/`Ausgewähltes Objekt`-Actionabschnitt für karten-/objektgebundene Actions, ohne LegalAction- oder PlayerAction-Vertrag zu ändern.
- lokale Cue-Positionierung per Drag-Handle oder mindestens Positions-Preset, ohne Match-/Engine-/Replay-Wirkung.
- aktive Run-Zielmarkierung auf Basis von `PlayerView.run.attackedServerId`, getrennt von Cue-/Hover-Highlights.
- BoardHeader-Review: überflüssige Sicht-/Fenster-Wiederholung entfernen; Statusinformation in Topbar, Action Panel, RunTimeline oder KI-Takt erhalten.
- RunTimeline-Layoutentscheidung: horizontal-kompakt als Default, vertikal/seitlich nur bei besserer Browserprobe.
- Rez-/Unrez-Darstellung für ICE und Root-Karten: `Ungerezzt`-Chip plus gedämpfter/gestrichelter Rahmen als Standard; Rotation nur optional.
- `apps/web/app/chronicle.ts`
  - deutsche sichtbare Begriffe und konsistente Eventtexte.
- `apps/web/app/globals.css`
  - stabile Boardbereiche, responsive Rig-/Server-Zonen, Highlight-Layer ohne Layoutsprünge.
- `apps/server/src/multiplayer.ts`
  - nur Regressionstest-/Payloadsicht: AI-Pacing und `advance_ai` dürfen nicht verändert oder geöffnet werden.
- `tests/specs/visibility-contract.test.ts`
  - keine Hidden-Info-Leaks durch Cues, Audio, Highlights, Runner-Rig oder deutsche Labels.

## Risiken

| Risiko | Gegenmaßnahme |
| --- | --- |
| UI-Polish verändert versehentlich Datenverträge. | PlayerView bleibt einzige UI-Datenquelle; keine FullState- oder Engine-Imports im Browser. |
| Deutsche Begriffe verändern technische IDs. | Nur sichtbare Labels ändern; Engine-, Shared- und Test-IDs bleiben englisch. |
| Runner-Rig- oder Serverdarstellung leakt verdeckte Informationen. | Nur vorhandene PlayerView-Daten rendern; Visibility-Tests für Corp-/Runner-Sicht ergänzen. |
| Reconnect erzeugt Ton-/Cue-Sturm. | zuletzt präsentierte Event-ID tab-lokal halten; alte Events nur im Chronicle anzeigen. |
| Boardlayout wird auf schmalen Fenstern unlesbar. | Screenshot-/Browser-Smokes für Desktop und schmale Viewports. |

## Testszenarien

### Web

- Cue-Mapping aus V1.0.2 bleibt grün.
- Verdeckte Corp-Installation erzeugt weiter redacted Cue ohne Titel, Definition-ID, Bild-URL oder Assetdaten.
- Cues für neue gegnerische Events erscheinen; alte Reconnect-Events spielen nicht erneut.
- Audio spielt nur bei Opt-in und nur für neue Cues.
- RunTimeline zeigt deutsche sichtbare Phasen nach freigegebenem Glossar.
- Runner-Rig trennt Programme, Hardware und Ressourcen.
- Corp-Sicht zeigt öffentliches Runner-Rig, aber keine verdeckten Karten.
- HQ/R&D/Archives-Darstellung bleibt side-sicher.
- LegalActions-/Undo-/View-Labels werden endnutzertauglich deutsch angezeigt.
- Das Action Panel zeigt keine mehrdeutigen Serien gleich benannter Handkartenaktionen; nach Klick auf eine eigene Karte erscheinen nur die Actions dieser Karte, z. B. ICE-Installationsziele für genau dieses ICE.

### Server/Regression

- `advance_ai` bleibt nur erlaubt, wenn die aktive Seite KI ist.
- AI-Step verwendet nur LegalActions und `applyAction`.
- Fast/Paced/Manual bleiben deterministisch und replaybar.
- AI-Step-Payloads enthalten keine `cardInstances`, Tokens, privaten Decklisten oder verdeckten Titel.

### Browser/Playtest

1. Runner-vs-Corp-KI: einzelne Corp-Schritte sichtbar, Audio-Opt-in testbar, Runner-Turn stoppt korrekt.
2. Human-vs-Human zwei Tabs: Corp installiert verdeckt, Runner sieht redacted Cue und keinen Titel.
3. Human-vs-Human zwei Tabs: Runner startet Run, Corp sieht Run-Cue und korrektes Runner-Rig.
4. Reconnect im laufenden Match: Chronicle bleibt sichtbar, keine alten Sounds/Cues werden abgespielt.
5. Run durch ICE: Timeline zeigt verständliche Phasen und Encounter-Fokus.
6. Archives/HQ/R&D-Stichprobe: Counts und sichtbare Karten stimmen je Seite.
7. Schmaler Viewport: Runner-Rig, RunTimeline, Actions und zentrale Server überlappen nicht.
8. Kontextaktionen: Corp klickt eine eigene ICE-Handkarte und sieht eindeutig die legalen Installationsziele für diese Karte; ohne Auswahl bleibt das linke Panel auf globale Aktionen und Pflichtentscheidungen reduziert.
9. Cue-Position: Gegneraktions-Cue verschieben oder Positionsoption wählen; nach neuer gegnerischer Aktion erscheint der Cue an der gemerkten lokalen Position.
10. Run-Zielhighlight: Runner startet einen Run auf genau einen Server; nur dieser Server erhält den aktiven Run-Rahmen, andere Server bleiben ohne gleichartige Zielmarkierung.
11. BoardHeader: Separater Sichtkasten ist entfernt oder zeigt nachweislich hilfreiche Zustands-/Aufgabeninformation.
12. Timeline-Ausrichtung: horizontale und vertikale/seitliche Variante wurden in Desktop und schmalem Viewport bewertet; die gewählte Variante ist begründet.
13. Rez-/Unrez-Darstellung: Corp sieht eigene ungerezzte ICE klar als ungerezzt; Runner sieht dieselben Karten bis zum Rez weiterhin anonym. Nach Rez ist der Statuswechsel klar erkennbar.

## Dokumentationsbedarf

- Requirements, Spezifikationen, Testmatrix, Requirements Review und Browser-/Playtest-Smoke sind erstellt.
- Nach Umsetzung: Implementation Review und Final Review.

## Akzeptanzkriterien

V1.0.5 ist done, wenn:

- V1.0.2-KI-Pacing und Action-Cues nicht regressieren,
- Run-Anzeige, Runner-Rig und zentrale Server deutlich verständlicher sind,
- sichtbare Hauptbegriffe deutsch normalisiert sind,
- karten- und objektgebundene Actions nicht mehr als mehrdeutige flache Standardliste erscheinen,
- Gegneraktions-Cues lokal positionierbar sind und diese Position keine Matchdaten verändert,
- der angegriffene Run-Zielserver eindeutig und exklusiv markiert ist,
- der obere BoardHeader nicht mehr als redundanter Platzhalter steht,
- die RunTimeline-Ausrichtung bewusst und browsergeprüft gewählt ist,
- gerezzte und ungerezzte Corp-Karten side-sicher und deutlich unterscheidbar sind,
- Audio- und Spieloptionen kompakt erreichbar bleiben,
- Zwei-Tab-Smokes für KI, Human-vs-Human, Reconnect, Run und verdeckte Installation bestanden sind,
- Hidden-Info-, Replay-/StateHash-, PublicEvent-, AI-Input-, stale-action- und illegal-action-Tests grün bleiben,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden sind.
