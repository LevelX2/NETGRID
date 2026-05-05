# V1.0.5 Test Matrix - Action Board UX und Board-Klarheit

Stand: 2026-05-05
Status: Requirements-Freeze-Testmatrix

## Coverage

| Test-ID | Bereich | Requirement-IDs | Erwartung |
| --- | --- | --- | --- |
| V105-T001 | Unit/Web Cue Mapping | V105-MUST-002 | Bestehende V1.0.2-Cue-Mappings bleiben stabil; Gegneraktionen erzeugen side-sichere Cues mit nutzerverständlichem deutschem Titel. |
| V105-T002 | Unit/Web Redaction | V105-MUST-002 | Verdeckte Corp-Installation erzeugt redacted Cue ohne Titel, `cardDefinitionId`, private `cardInstanceId`, Bild-URL, Assetdaten oder unterscheidbare Hidden-Card-DOM-Daten. |
| V105-T003 | Unit/Web Cue Placement Contract | V105-MUST-002, V105-MUST-010 | Cue-Overlay ist dismissbar, kompakt und als Overlay/Toast modelliert; es darf keine Boardsektion dauerhaft als Layoutinhalt verschieben. |
| V105-T004 | Unit/Web Reconnect Queue | V105-MUST-003 | Bootstrap-/Reconnect-EventTail wird im Chronicle sichtbar, erzeugt aber keine automatische alte Overlay- oder Audio-Wiedergabe. |
| V105-T005 | Unit/Web Audio | V105-MUST-004 | Audio ist opt-in, lokal, über kompaktes Popover erreichbar und spielt nur für neue Cues. |
| V105-T006 | Unit/Contract UI Glossary | V105-MUST-005 | Aktive Spieloberfläche zeigt keine gesperrten Endnutzerlabels `LegalActions`, `Runner View`, `Corp View`, `Approach`, `Encounter`, `Access`, `Breach` als normale Haupttexte. |
| V105-T007 | Unit/Web RunTimeline Labels | V105-MUST-006 | RunTimeline nutzt `Ziel`, `Annäherung`, `Begegnung`, `Brechen`, `Bewegung`, `Zugriff`, `Abschluss` und zeigt Zielserver side-sicher. |
| V105-T008 | Unit/Web Runner Rig Grouping | V105-MUST-007 | RunnerRigStrip gruppiert sichtbare Runner-Karten nach `Programme`, `Hardware`, `Ressourcen` und optional `Sonstiges`; leere Gruppen leaken nichts. |
| V105-T009 | Server AI Pacing Regression | V105-MUST-001 | `fast`, `paced` und `manual` bleiben verfügbar; Human-vs-KI startet nicht unbemerkt im Bulk-Standard. |
| V105-T010 | Server Advance-AI Auth | V105-MUST-001 | `advance_ai` bleibt nur für aktive KI-Seite, richtige menschliche Session und passende State-/Match-Version erlaubt. |
| V105-T011 | Server AI LegalActions | V105-MUST-001 | KI-Schritt wählt nur aktuelle LegalActions und läuft durch `applyAction`; falsche/stale Aktionen werden side-sicher abgelehnt oder resynct. |
| V105-T012 | Unit/Web Central Servers | V105-MUST-008 | HQ, F&E/R&D und Archive erscheinen als zentrale Server mit klaren Labels, Lanes und side-sicheren Counts. |
| V105-T013 | Static/Web Authority Boundary | V105-MUST-009, V105-MUST-012 | Web-Code für Board, Cues, Audio und Chronicle importiert keine Engine-Regelmodule, verwendet keinen FullState und schreibt keine Replay-/StateHash-Daten. |
| V105-T014 | Unit/Web Jack-out/Movement | V105-MUST-006 | Wenn `jack_out` legal ist, zeigt die Timeline das Bewegungsfenster und einen verständlichen Hinweis; ohne LegalAction wird kein falscher Button suggeriert. |
| V105-T015 | Visibility Runner Rig | V105-MUST-007, V105-MUST-012 | Corp-Sicht zeigt nur öffentlich installierte Runner-Rig-Karten und keine Runner-Grip-/Stack-Titel. |
| V105-T016 | Visibility Archives/Central Counts | V105-MUST-008, V105-MUST-012 | Runner-/Corp-Sichten leaken über HQ/R&D/Archive-Counts, Lanes und Archive-Karten keine verdeckten Titel oder künftigen Queue-Einträge. |
| V105-T017 | Replay/StateHash Regression | V105-MUST-004, V105-MUST-009, V105-MUST-012 | Audio, Cues, Highlights, Labels, Layout und KI-Pacing-Präsentation verändern Replay, RandomDrawRecords und StateHash nicht. |
| V105-T018 | Browser Smoke Reconnect | V105-MUST-003, V105-MUST-011 | Nach Reload/Fortsetzen bleibt Chronicle sichtbar, aber alte Cues und Sounds werden nicht erneut abgespielt. |
| V105-T019 | Browser/Text Smoke German UI | V105-MUST-005, V105-MUST-011 | Aktives Spiel zeigt deutsche Labels für Sicht, Aktionen, Zurücknehmen, Runphasen, Zugriff und KI-Takt. |
| V105-T020 | Visibility Payload Scan | V105-MUST-002, V105-MUST-007, V105-MUST-008, V105-MUST-012 | SidePayloads, Cues, Reconnect, Fehler, AI-Payloads und UI-DOM enthalten keine `cardInstances`, privaten Decklisten, Tokens, privaten Payloads oder verdeckten gegnerischen Titel. |
| V105-T021 | Browser/Visual Viewports | V105-MUST-006, V105-MUST-010, V105-MUST-011 | Desktop und schmaler Viewport zeigen RunTimeline, Runner-Rig, zentrale Server, Actions, Zurücknehmen und Cues ohne unlesbare Überlappung oder auslaufende Buttons. |
| V105-T022 | Browser/Playtest Runbook | V105-MUST-011 | `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md` existiert und enthält wiederholbare Schritte für KI, zwei Tabs, verdeckte Installation, Run, Reconnect und schmalen Viewport. |
| V105-T023 | Scope/Regression Gate | V105-MUST-012 | `corepack pnpm lint`, `typecheck`, `test`, `build`, Web-/Server-Tests, Visibility-Vertrag und V1.0.4-Lifecycle-Regression bleiben grün; keine neuen Karten, Mechaniken, Assets oder Plattformfeatures. |
| V105-T024 | Unit/Web Contextual Actions | V105-MUST-013 | Das permanente Action Panel trennt globale Aktionen von karten-/objektgebundenen Actions; ausgewählte eigene Karten zeigen nur Actions, die über `source` oder side-sichere Payload-Referenzen zu genau dieser Karte gehören. |
| V105-T025 | Browser Smoke Corp ICE Hand Actions | V105-MUST-013, V105-MUST-010 | Bei mehreren ICE auf der Corp-Hand zeigt die Standardliste keine ununterscheidbaren `ICE installieren`-Serien; nach Klick auf ein bestimmtes ICE sind dessen Zieloptionen eindeutig sichtbar und ausführbar. |
| V105-T026 | Unit/Web Cue Position Preference | V105-MUST-014, V105-MUST-004 | Cue-Position ist eine lokale UI-Einstellung, wird nicht an Server/Engine/Replay/StateHash weitergegeben, kann auf `Oben rechts` zurückgesetzt werden und fällt bei ungültigen Daten auf diesen Default zurück. |
| V105-T027 | Browser/Visual Draggable Cue | V105-MUST-014, V105-MUST-010 | Cue-Overlay kann per Drag-Handle oder mindestens per Positionspreset verschoben werden; spätere Cues erscheinen an der lokalen Position, bleiben dismissbar und werden im schmalen Viewport nicht außerhalb des sichtbaren Bereichs angezeigt. |
| V105-T028 | Unit/Web Run Target Highlight | V105-MUST-015, V105-MUST-006 | Die aktive Run-Zielmarkierung wird genau aus `PlayerView.run.attackedServerId` abgeleitet; bei aktivem Run hat genau ein Server den Run-Zielzustand. |
| V105-T029 | Browser/Visual Run Target Frame | V105-MUST-015, V105-MUST-010 | Ein Run auf HQ, F&E/R&D, Archive oder Remote markiert sichtbar nur diesen Server; andere Server erhalten nicht denselben aktiven Run-Rahmen, Cue-/Hover-Highlights bleiben unterscheidbar. |
| V105-T030 | Unit/Web BoardHeader Utility | V105-MUST-016, V105-MUST-005 | Der separate gerahmte BoardHeader mit bloßer Sicht-/Fenster-Wiederholung ist entfernt; falls ein neuer Header existiert, liefert er konkrete Aufgabe/Statusinformation. |
| V105-T031 | Browser/Visual Timeline Orientation | V105-MUST-017, V105-MUST-006, V105-MUST-010 | Die horizontale V1.0.5-Default-Timeline oder eine begründet ersetzende vertikale/hybride Timeline ist auf Desktop und schmalem Viewport nutzbar und verdrängt Runner-Rig, Server, Actions und aktuelle Entscheidungen nicht. |
| V105-T032 | Review Timeline Decision | V105-MUST-017 | Implementation oder Final Review dokumentiert kurz, ob horizontal, vertikal/seitlich oder hybrid gewählt wurde und warum. |
| V105-T033 | Unit/Web Rez State Styling | V105-MUST-018, V105-MUST-008 | Card-/Server-Darstellung unterscheidet gerezzte und ungerezzte installierte Corp-Karten in der Corp-Sicht mit `Ungerezzt`-Chip, gedämpfter Darstellung und gestricheltem Rahmen, nutzt aber für Runner-Sicht auf ungerezzte Karten nur einheitliche verdeckte Platzhalter. |
| V105-T034 | Browser/Visual ICE Rez Orientation | V105-MUST-018, V105-MUST-010, V105-MUST-012 | Corp sieht eigene ungerezzte ICE eindeutig als ungerezzt; Rotation ist optional und nur zulässig, wenn Text/Tooltip und Layout lesbar bleiben. Runner sieht vor Rez keine Titel/Typen/Bilder und nach Rez den sichtbaren Statuswechsel. |

## Pflichtchecks für Implementierung

- `corepack pnpm --filter @netrunner/web test`
- `corepack pnpm --filter @netrunner/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`
- V1.0.5 Browser-/Playtest-Smoke aus `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`

## Empfohlene automatisierte Ergänzungen

Die Umsetzung sollte mindestens ergänzen:

- Web-Unit-Test für RunTimeline-Labelmapping und gesperrte Rohlabels.
- Web-Unit-Test für RunnerRig-Gruppierung.
- Web-/Contract-Test, der `LegalActions`, `Runner View`, `Corp View`, `Approach`, `Encounter`, `Access` und `Breach` nicht mehr als normale Hauptlabels akzeptiert.
- Web-Unit-Test für die Trennung von globalen Aktionen und karten-/objektgebundenen Kontextaktionen.
- Web-Unit-Test für lokale Cue-Positionspräferenz, Reset und fehlende Server-/Replay-Wirkung.
- Web-Unit-Test für exakt eine aktive Run-Zielmarkierung.
- Web-/Contract-Test, der redundante BoardHeader-Rohtexte wie `Runner View`, `Corp View` und bloßes `Dein Fenster` aus der normalen aktiven Spieloberfläche entfernt oder auf konkrete Statusfunktion begrenzt.
- Web-Unit-Test für Rez-/Unrez-Darstellung ohne Hidden-Info-Leak.
- Visibility-Test für Runner-Rig- und zentrale Server-Darstellung ohne Hidden-Info-Leak.
- Server-Regressionstest oder bestehender Testnachweis für `advance_ai`, KI-Pacing-Modi und Forfeit/Lifecycle-Schutz nach V1.0.4.

## Browser-/Visual-Gate

Falls noch kein automatisches Browser-E2E-Framework eingeführt wird, ist für V1.0.5 ein dokumentierter Smoke ausreichend, aber er muss wiederholbar sein und konkrete Prüfpunkte enthalten:

- Human-vs-KI-Pacing.
- Human-vs-Human mit zwei Tabs.
- verdeckte Corp-Installation ohne Titel-Leak.
- Runner-Run mit RunTimeline und Encounter-/Zugriff-Fokus.
- Reconnect/Reload ohne alte Cues/Sounds.
- kontextuelle Karte-zu-Action-Auswahl für mehrere gleichartige Handkarten, insbesondere Corp-ICE-Installationen.
- per Drag-Handle oder mindestens per Preset positionierbares Cue-Overlay mit lokal gemerkter Position.
- eindeutiger aktiver Run-Zielrahmen für den angegriffenen Server.
- entfernter redundanter BoardHeader oder neuer Header mit echter Statusfunktion.
- horizontale Default-RunTimeline oder begründet ersetzte vertikale/hybride Ausrichtung mit Desktop-/Schmalviewport-Begründung.
- Rez-/Unrez-Zustand von ICE und Root-Karten side-sicher unterscheidbar; Standard ist Chip plus Rahmen, Rotation nur bei bestandener Lesbarkeit.
- zentrale Server und Archive-Counts je Seite.
- schmaler Viewport ohne unlesbare Überlappung.

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V1_0_5_REQUIREMENTS.md` haben mindestens eine Testspur in dieser Matrix.
