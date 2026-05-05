# V1.0.5 Requirements Freeze

Stand: 2026-05-05
Status: frozen_for_implementation

## Zweck

Dieses Dokument friert die V1.0.5-Anforderungen für Action Board UX und Board-Klarheit ein. Es ergänzt den kanonischen Detailplan `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md` und macht den Scope testbar.

V1.0.5 ist ein UI-/Präsentations- und Regression-Release. Die Phase verbessert die Lesbarkeit laufender Partien, härtet V1.0.2-Cues und KI-Pacing gegen Rückschritte und normalisiert sichtbare UI-Begriffe. Sie erweitert keine Engine-Regeln, keinen Kartenpool, keine offiziellen Mechaniken, keine Replay-/StateHash-Verträge und keine öffentlichen Plattformfunktionen.

## Verbindliche Quellen

- `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md`
- `docs/derived/V1_0_2_REQUIREMENTS.md`
- `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`
- `docs/derived/V1_0_2_TEST_MATRIX.md`
- `docs/derived/V1_0_2_FINAL_REVIEW.md`
- `docs/derived/V1_0_4_REQUIREMENTS.md`
- `docs/derived/V1_0_4_FINAL_REVIEW.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `apps/web/app/action-cues.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/chronicle.ts`
- `tests/specs/visibility-contract.test.ts`

Die lokale V1.0.5-UI-Terminologie in diesem Dokument ist ein projektintern freigegebenes UI-Glossar. Sie ist keine Behauptung einer offiziellen deutschen Netrunner-Übersetzung. Technische Engine-IDs, Action-Typen, Event-Typen, Test-IDs und Code-Symbole bleiben englisch.

## Scope

V1.0.5 umfasst:

- V1.0.2-KI-Pacing-Regression für `fast`, `paced`, `manual` und `advance_ai`.
- V1.0.2-Cue-, Redaction-, Queue-, Highlight- und opt-in-Audio-Regression.
- Kompaktere und weniger verdeckende Gegneraktions-Cues.
- RunTimeline mit verständlicher Movement-/Jack-out-/Encounter-/Breach-/Access-Darstellung.
- Strukturierte gegnerische Runner-Rig-Darstellung für die Corp-Sicht.
- Verständlichere zentrale Serverdarstellung für HQ, R&D/F&E und Archive mit side-sicheren Counts.
- Layout-/ICE-Ausrichtungsprüfung als reine Darstellung.
- Deutsche sichtbare UI-Hauptbegriffe im aktiven Spiel.
- Wiederholbare Browser-/Playtest-Smokes für KI, zwei Tabs, Reconnect, Run, verdeckte Installation und schmalen Viewport.

## Nicht-Ziele

- Keine neuen Karten.
- Keine neuen offiziellen Mechaniken.
- Keine Prevention-, Avoid-, Interrupt-, Replacement-, Set-Aside-, Remove-from-Game- oder Ownership-/Control-Engine.
- Keine Änderung der Rules Engine als einziger Regelautorität.
- Keine Änderung von `GameState`, Replay, RandomDrawRecords oder StateHash durch UI, Audio, Cues oder Layout.
- Kein Tutorial-System.
- Keine Erweiterung des privaten Lobbychats.
- Kein Spectator-Modus.
- Kein Matchmaking.
- Keine Accounts, Rankings, Turniere oder öffentlichen Plattformfunktionen.
- Keine externen Audio-Dateien.
- Keine offiziellen Artworks, Card Frames, Logos, Card Backs oder neue externe Kartendatenbank-Abhängigkeiten.
- Kein automatischer Browser-E2E-Framework-Zwang; falls Playwright oder Browser-Automation noch nicht eingeführt wird, genügt für V1.0.5 ein wiederholbarer, dokumentierter Smoke mit klaren Prüfpunkten.

## Projektinternes UI-Glossar

| Technischer Begriff | Sichtbares V1.0.5-Label | Verwendung |
| --- | --- | --- |
| `LegalActions` | Mögliche Aktionen | Panel-Überschrift und aktive Entscheidungsbereiche. |
| `Undo` | Zurücknehmen | Panel, Button und Meldungen. |
| `Runner View` | Deine Runner-Sicht | BoardHeader, nur als Spielerperspektive. |
| `Corp View` | Deine Corp-Sicht | BoardHeader, nur als Spielerperspektive. |
| `Approach` / `approach_ice` | Annäherung | RunTimeline und Chronicle-Chip. |
| `Encounter` / `encounter_ice` | Begegnung | RunTimeline, Encounter-Fokus und Chronicle-Chip. |
| `Break` | Brechen | RunTimeline. |
| `Movement` / `movement` | Bewegung | RunTimeline nach passiertem ICE; Jack-out-Fenster. |
| `Jack-out` / `jack_out` | Run abbrechen (Jack-out) | Actionlabel darf den etablierten englischen Begriff in Klammern behalten. |
| `Access` / `access` | Zugriff | RunTimeline, Zugriff-Fenster und Chronicle. |
| `Breach` | Zugriffsphase | UI-Beschreibung des erfolgreichen Run-/Access-Abschnitts. |
| `Complete` / `complete` | Abschluss | RunTimeline. |
| `HQ` | HQ | Zentraler Server, als bekanntes Netrunner-Kürzel erlaubt. |
| `R&D` | F&E (R&D) | Zentraler Server; erste Anzeige deutsch, Kürzel zur Wiedererkennung. |
| `Archives` | Archive | Zentraler Server. |
| `Runner-Rig` | Runner-Rig | Erlaubt, weil im Projekt bereits etabliert; intern nach Programm, Hardware, Ressource gruppieren. |
| `AI` | KI | Sichtbare UI-Texte. |
| `Reconnect` | Wieder verbinden | Button/Panel, technischer Begriff darf in Tooltip vorkommen. |

Nicht als normale Endnutzerlabels erlaubt sind `LegalActions`, `Runner View`, `Corp View`, `Approach`, `Encounter`, `Access`, `Breach` und rohe Action-Type-Gruppen wie `install card`, `start run` oder `trash resource`.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
| --- | --- | --- | --- |
| V105-MUST-001 | V1.0.2-KI-Pacing bleibt erhalten. | `fast`, `paced`, `manual` und `advance_ai` funktionieren weiter side-authentifiziert, zustandsgebunden und nur über LegalActions/`applyAction`. | V105-T009, V105-T010, V105-T011 |
| V105-MUST-002 | Action-Cues bleiben side-sicher und besser platziert. | Gegner-Cues werden aus side-sicheren PublicEvents/PlayerViews abgeleitet, leaken keine verdeckten Daten und verdecken die Boardmitte nicht dauerhaft. | V105-T001, V105-T002, V105-T003, V105-T020 |
| V105-MUST-003 | Reconnect/Reload spielt alte Cues und Sounds nicht neu ab. | Bootstrap-/Reconnect-EventTail bleibt im Chronicle sichtbar, erzeugt aber keine alte Overlay-/Audio-Wiedergabe. | V105-T004, V105-T018 |
| V105-MUST-004 | Opt-in Audio bleibt lokal und kompakt erreichbar. | Audio-Einstellung ist im aktiven Spiel erreichbar, verschwendet keinen permanenten Platz und schreibt nicht in Server, Engine, Replay oder StateHash. | V105-T005, V105-T017 |
| V105-MUST-005 | Sichtbare UI-Hauptbegriffe verwenden das V1.0.5-Glossar. | Aktives Spiel zeigt keine rohen Labels `LegalActions`, `Runner View`, `Corp View`, `Approach`, `Encounter`, `Access`, `Breach` als normale Endnutzertexte. | V105-T006, V105-T019 |
| V105-MUST-006 | RunTimeline bildet Movement, Jack-out, Encounter, Break, Zugriff/Zugriffsphase und Abschluss verständlich ab. | Aktiver Run zeigt Zielserver, aktuelle Phase, mögliches Jack-out-Fenster, Encounter-Fokus, Zugriff-/Breach-Fortschritt und Abschlussstatus side-sicher. | V105-T007, V105-T014, V105-T021 |
| V105-MUST-007 | Das gegnerische Runner-Rig bleibt für die Corp sichtbar und wird strukturiert. | Corp-Sicht gruppiert öffentlich installierte Runner-Karten nach Programmen, Hardware und Ressourcen; leere Gruppen sind kompakt und leaken keine Hand-/Stack-Daten. | V105-T008, V105-T015, V105-T020 |
| V105-MUST-008 | HQ, R&D/F&E und Archive werden als zentrale Server verständlicher dargestellt. | Zentrale Server haben klare Labels, side-sichere Counts, ICE-/Root-Lanes und Archives-/Archive-Sichtbarkeit ohne verdeckte Titel-Leak. | V105-T012, V105-T016, V105-T020 |
| V105-MUST-009 | Server-Layout und ICE-Ausrichtung bleiben reine Darstellung. | Layout-/CSS-/Komponentenänderungen importieren keine Engine in den Browser und verändern PlayerView, Replay, StateHash oder Action-Verträge nicht. | V105-T013, V105-T017, V105-T020 |
| V105-MUST-010 | Boardlayout bleibt auf Desktop und schmalem Viewport nutzbar. | Runner-Rig, RunTimeline, zentrale Server, Actions, Undo und Cues überlappen nicht unlesbar und wichtige Buttons bleiben bedienbar. | V105-T021 |
| V105-MUST-011 | Wiederholbare Browser-/Playtest-Smokes existieren. | Ein dokumentierter V1.0.5-Smoke deckt Runner-vs-KI, zwei Tabs, verdeckte Installation, Run, Reconnect und schmalen Viewport mit Prüfpunkten ab. | V105-T022 |
| V105-MUST-012 | Bestehende Verträge bleiben grün. | Hidden-Info-, PublicEvent-, AI-Input-, Replay-/StateHash-, stale-action-, illegal-action-, V1.0.4-Lifecycle- und Build/Test-Gates bleiben bestanden. | V105-T017, V105-T020, V105-T023 |

## Daten- und Autoritätsgrenzen

- Die UI rendert weiterhin nur `PlayerView`, `LegalActions`, side-gefilterte Eventdaten, side-sichere Match-Payloads und lokale UI-Einstellungen.
- `apps/web/app/page.tsx`, `action-cues.ts` und `chronicle.ts` dürfen keine Engine-Regelmodule importieren.
- V1.0.5 darf keine Felder in `GameState`, `PlayerAction`, `GameEvent`, `RandomDrawRecord`, Replay oder StateHash ergänzen, nur um UI-Politur zu ermöglichen.
- Cues, Highlights, Audio, Layout und Textlabels sind lokale Präsentation.
- Verdeckte Karten dürfen nicht über Titel, Definition-ID, Instance-ID, Bild-URL, DOM-Daten, CSS-Klassen, Tooltip, Audio-Unterscheidung oder Count-Differenzen verraten werden.
- KI-Pacing bleibt Server-Orchestrierung und darf keine KI-Aktion außerhalb LegalActions/`applyAction` ausführen.

## Betroffene Codebereiche

- `apps/web/app/action-cues.ts`
  - Cue-Ableitung, Redaction, Highlight-Zuordnung und Reconnect-/Audio-Regression.
- `apps/web/app/action-cues.test.ts`
  - Cue-Mapping, Redaction, eigene/gegnerische Actions, Reconnect-Fortsetzung und lokale Aufmerksamkeit.
- `apps/web/app/page.tsx`
  - BoardHeader, RunTimeline, RunnerRigStrip, zentrale Server, LegalActionsPanel, UndoPanel, Audio-Menü, AI-Pacing-Controls und aktive Spieloberfläche.
- `apps/web/app/chronicle.ts`
  - sichtbare deutsche Begriffe und konsistente Eventtexte.
- `apps/web/app/globals.css`
  - stabile Boardbereiche, responsive Zonen, Cue-Overlay, Highlight-Layer und Textfit.
- `apps/server/src/multiplayer.ts`
  - nur Regression: `advance_ai`, KI-Pacing-Payloads und side-sichere Payloads dürfen nicht geöffnet werden.
- `apps/server/src/multiplayer.test.ts`
  - AI-Pacing-/Advance-/Payload-Regression.
- `tests/specs/visibility-contract.test.ts`
  - Browser-Autoritätsgrenze, Terminologie-, Hidden-Info-, Token-, Decklisten-, Cue- und Layout-Verträge.
- `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`
  - wiederholbarer manueller oder später automatisierbarer Browser-Smoke.

## Risiken und Entscheidungen

| Risiko | Entscheidung |
| --- | --- |
| Deutsche Labels verändern technische IDs. | Nur sichtbare Labels ändern; IDs, ActionTypes, EventTypes und Testsymbole bleiben technisch. |
| Runner-Rig-Gruppierung leakt Karten aus Grip/Stack. | Nur `view.opponent.rig` bzw. vorhandene sichtbare PlayerView-Karten verwenden. Keine Nachladepfade für verdeckte Zonen. |
| Zentrale Server-Counts verraten Hidden Info. | Counts ausschließlich aus vorhandenen side-sicheren PlayerView-Counts und sichtbaren Zonen ableiten. |
| Reconnect erzeugt Cue-/Sound-Sturm. | `lastPresentedEventId` bleibt tab-lokaler Wiedergabemarker; Bootstrap-Events sind Chronicle-only. |
| Layout-Politur führt Browser-Engine-Importe wieder ein. | Visibility-Contract-Test bleibt Blocker. |
| Browser-Smoke bleibt zu vage. | V1.0.5 bekommt ein eigenes Smoke-Dokument mit festen Prüfpunkten und erwarteten Beobachtungen. |

## Pflichtchecks

- `corepack pnpm --filter @netrunner/web test`
- `corepack pnpm --filter @netrunner/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`
- V1.0.5 Browser-/Playtest-Smoke nach `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`

## Gate

`V1_0_5_requirements_freeze_done: true`

`ready_for_implementation: true`
