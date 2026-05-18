# MVP 0.7 Requirements

Status: Requirements/Design Freeze
Stand: 2026-05-03
Phase: V0.7 UI Requirements und Design Freeze

## Kurzentscheidung

V0.7 ist die UI-Neugestaltungsphase nach bestandenem MVP-0.6-Gate. Die Anwendung wird visuell und strukturell auf eine stabile private Spieloberfläche gehoben, ohne neue Karten, neue Regelmechaniken oder öffentliche Plattformfunktionen einzuführen.

Verbindliche Designrichtung:

- Hauptstruktur: Design C, Clean High Contrast.
- Run-/Encounter-Fokus: aus Design D adaptiert.
- Diagnose-/Playtest-Information: Design B nur als einklappbarer Drawer.
- Design A bleibt höchstens spätere Dark-Skin-Inspiration.

Echte Kartenabbilder, offizielle Logos, Card Frames und Card Backs bleiben gesperrt, bis eine separate Quellen-, Nutzungs- und Asset-Freigabe dokumentiert ist. V0.7 nutzt generische Projektplatzhalter und interne/fiktive Kartenanzeigen.

## Eingangsgate

- `MVP_0.6_done: true` ist in `docs/codex/CODEX_STATUS.md` dokumentiert.
- V0.6-Deckeditor, Match Setup, Deck-Snapshots und serverseitige Matchstart-Revalidierung sind abgeschlossen.
- Bestehende V0.1- bis V0.6-Checks sind grün.
- Der Arbeitsbranch bleibt `codex/mvp-0-1-requirements`.

## Nicht-Ziele

V0.7 baut nicht:

- neue spielbare Karten,
- neue Regelmechaniken,
- automatisches Interpretieren von Kartentext,
- offizielle Kartenabbilder oder offizielle UI-Assets,
- öffentliche Lobbies, Matchmaking, Accounts, Rankings, Cloud Sync oder Turnierfunktionen,
- eine neue Regelautorität im Client,
- eine mobile-first App.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| V07-MUST-001 | Requirements Freeze | Dieses Dokument, die UI-Spezifikationen, Testmatrix und Requirements Review existieren und sind konsistent. | V07-T001 |
| V07-MUST-002 | Design-C-Hauptstruktur | Entry, Matchflow, RunnerBoard und CorpBoard folgen strukturell Design C. | V07-T002, V07-T015 |
| V07-MUST-003 | Run-/Encounter-Fokus | Aktive Runs zeigen Approach, Encounter, Break, Pass, Access und Ergebnis als klaren Fokusbereich. | V07-T003, V07-T016 |
| V07-MUST-004 | Side-sichere Datenbindung | Jede UI-Fläche ist an erlaubte Datenquellen gebunden: `PlayerView`, `LegalActions`, side-gefilterte Events, Receipts oder lokale UI-Preference. | V07-T004, V07-T009 |
| V07-MUST-005 | Kein FullState im Browser | Normale Browser-UI importiert keine Engine, hält keinen `GameState` und rendert keine `cardInstances`. | V07-T005 |
| V07-MUST-006 | Funktionserhalt V0.1-V0.6 | Katalog, Deckeditor, Deckvalidierung, Match Setup, Human-vs-KI, Human-vs-Human und KI-vs-KI bleiben erreichbar. | V07-T006, V07-T020 |
| V07-MUST-007 | Entry und Navigation | Start, Katalog, Decks, Match erstellen, Match fortsetzen, lokale Modi und Diagnostics sind klar erreichbar. | V07-T007 |
| V07-MUST-008 | RunnerBoard | Runner-View zeigt eigene Ressourcen, Grip/Stack/Heap/Rig, gegnerische Server side-gefiltert, aktuellen Run und legale Aktionen. | V07-T008, V07-T009 |
| V07-MUST-009 | CorpBoard | Corp-View zeigt eigene Ressourcen, HQ/R&D/Archives/Remotes, Runner-Public-Info, aktuellen Run, Rez-Fenster und legale Aktionen. | V07-T010, V07-T011 |
| V07-MUST-010 | LegalActions und Choices | Action- und Choice-Panels gruppieren nur aktuelle `LegalActions`, Ziele und Choices; Pending, stale und rejected sind sicher modelliert. | V07-T012 |
| V07-MUST-011 | EventLog, Undo und Reconnect | EventLog, Undo, Reconnect, Receipts und Systemzustände sind sichtbar, verständlich und side-sicher. | V07-T013 |
| V07-MUST-012 | CardView image-ready | Karten nutzen stabile `5 / 7`-Flächen, Platzhalter, Text-Fallback, Compact, Preview und Zoom/Focus ohne Asset-Leak. | V07-T014, V07-T017 |
| V07-MUST-013 | Asset-Gate | Vor Asset-Freigabe werden keine externen oder offiziellen Kartenbilder, Logos, Frames oder Card Backs geladen. | V07-T018 |
| V07-MUST-014 | Accessibility-Baseline | Fokusreihenfolge, Labels, sichtbare Fokuszustände, Kontraste und Tastaturbedienung sind spezifiziert und geprüft. | V07-T019 |
| V07-MUST-015 | Responsive Desktop/Tablet | Desktop-first Layout bleibt bei schmaleren Browsern ohne Textüberlauf, Überlagerung oder unbedienbare Actions nutzbar. | V07-T015, V07-T019 |
| V07-MUST-016 | Visual und Regression Gate | Screenshots/Smokes für Entry, Runner, Corp, aktive Runs, Katalog und Deckeditor sowie `lint`, `typecheck`, `test`, `build` bestehen. | V07-T015, V07-T020 |

## Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V07-SHOULD-001 | Design Tokens | Farben, Spacing, Radius, Typografie, Statusfarben und Fokuszustände liegen zentral vor. |
| V07-SHOULD-002 | Diagnostics Drawer | StateVersion, MatchVersion, StateHash, Receipt und Visibility-Status liegen in einem einklappbaren Drawer. |
| V07-SHOULD-003 | KI-Erklärungen | KI-Reason-Codes erscheinen als Lernhilfe, ohne versteckte Informationen zu verwenden. |
| V07-SHOULD-004 | Card Detail Panel | Bekannte und side-sichere Karten können in Preview oder Zoom fokussiert werden. |
| V07-SHOULD-005 | Screenshot-Review | Die fertigen Screens werden gegen Design C und die Realismusprüfung abgeglichen. |

## Could-Anforderungen

| ID | Idee | Bedingung |
|---|---|---|
| V07-COULD-001 | Dunkles Theme | Nur nach stabilem hellen Grundlayout, ohne V0.7-Gate zu blockieren. |
| V07-COULD-002 | leichte Animationen | Nur wenn sie keine Layoutshifts erzeugen und keinen Spielzustand verschleiern. |

## Abgrenzung der Datenquellen

Erlaubt:

- `PlayerView`
- `LegalActions`
- side-gefilterte Events
- `ActionReceipt`
- `ChoiceRequest` oder äquivalente legal-action-basierte Choices
- `OpponentStatus`
- Matchmetadaten ohne Tokens
- Katalog-/Deckdaten außerhalb laufender Hidden-Info-Matchsicht
- lokale Card-Display-Präferenz

Verboten:

- vollständiger `GameState`
- `cardInstances` als Vollobjekte im Client
- private Payloads der Gegenseite
- Session-, Join- oder Reconnect-Tokens in sichtbaren Logs
- echte Bild-URLs oder Asset-IDs für verdeckte gegnerische Karten
- Engine-Importe in der normalen Browserseite

## Gate-Ergebnis

Die Anforderungen sind reviewfähig, testbar und innerhalb des V0.7-Scopes umsetzbar.

`ready_for_implementation: true`
