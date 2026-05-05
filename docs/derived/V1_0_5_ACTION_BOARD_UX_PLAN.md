# V1.0.5 Action Board UX und Board-Klarheit

Status: requirements_ready
Stand: 2026-05-05

## Ziel

V1.0.5 macht laufende Partien besser lesbar, ohne neue Regeln oder Karten einzuführen. Der Release baut auf V1.0.2 und V1.0.3 auf: KI-Pacing, Action-Cues, Board-Highlights, opt-in Audio, Startbereitschaftslobby und das sichtbare `Runner-Rig` sind bereits vorhanden und dürfen nicht regressieren.

Der Schwerpunkt liegt auf Spielansicht, deutschen UI-Begriffen, Run-/Server-Klarheit, Runner-Rig-Struktur, Optionen im Spiel und wiederholbaren UI-Tests.

## Konsolidierungsentscheidung 2026-05-05

Dieses Dokument ist der kanonische Detailplan für V1.0.5. V1.0.5 implementiert nicht nachträglich V1.0.2, sondern härtet und poliert die bereits vorhandenen V1.0.2-Funktionen KI-Pacing, `advance_ai`, Action-Cues, Board-Highlights und opt-in Action-Audio gegen Regressionen.

Alle V1.0.4-Lifecycle-Themen wie Cancel, Leave, Forfeit, Reconnect, Recreate und Gegnernamen bleiben in `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`.

## Requirements-Freeze-Ergänzung 2026-05-05

Die Umsetzung darf auf Basis dieses Plans starten. Die verbindlichen V1.0.5-Anforderungen, UI-Spezifikationen, Testspuren und der wiederholbare Browser-/Playtest-Smoke liegen vor:

- `docs/derived/V1_0_5_REQUIREMENTS.md`
- `docs/derived/ACTION_BOARD_UX_1_0_5_SPEC.md`
- `docs/derived/BOARD_RUN_UI_1_0_5_SPEC.md`
- `docs/derived/V1_0_5_TEST_MATRIX.md`
- `docs/derived/V1_0_5_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`

Der Requirements Review meldet `V1_0_5_requirements_freeze_done: true` und `ready_for_implementation: true`. Das deutsche UI-Glossar ist projektintern freigegeben und beansprucht keine offizielle deutsche Netrunner-Übersetzung; technische IDs bleiben unverändert.

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

## Dokumentationsbedarf

- Requirements, Spezifikationen, Testmatrix, Requirements Review und Browser-/Playtest-Smoke sind erstellt.
- Nach Umsetzung: Implementation Review und Final Review.

## Akzeptanzkriterien

V1.0.5 ist done, wenn:

- V1.0.2-KI-Pacing und Action-Cues nicht regressieren,
- Run-Anzeige, Runner-Rig und zentrale Server deutlich verständlicher sind,
- sichtbare Hauptbegriffe deutsch normalisiert sind,
- Audio- und Spieloptionen kompakt erreichbar bleiben,
- Zwei-Tab-Smokes für KI, Human-vs-Human, Reconnect, Run und verdeckte Installation bestanden sind,
- Hidden-Info-, Replay-/StateHash-, PublicEvent-, AI-Input-, stale-action- und illegal-action-Tests grün bleiben,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden sind.
