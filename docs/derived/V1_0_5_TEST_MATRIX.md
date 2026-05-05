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
- Visibility-Test für Runner-Rig- und zentrale Server-Darstellung ohne Hidden-Info-Leak.
- Server-Regressionstest oder bestehender Testnachweis für `advance_ai`, KI-Pacing-Modi und Forfeit/Lifecycle-Schutz nach V1.0.4.

## Browser-/Visual-Gate

Falls noch kein automatisches Browser-E2E-Framework eingeführt wird, ist für V1.0.5 ein dokumentierter Smoke ausreichend, aber er muss wiederholbar sein und konkrete Prüfpunkte enthalten:

- Human-vs-KI-Pacing.
- Human-vs-Human mit zwei Tabs.
- verdeckte Corp-Installation ohne Titel-Leak.
- Runner-Run mit RunTimeline und Encounter-/Zugriff-Fokus.
- Reconnect/Reload ohne alte Cues/Sounds.
- zentrale Server und Archive-Counts je Seite.
- schmaler Viewport ohne unlesbare Überlappung.

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V1_0_5_REQUIREMENTS.md` haben mindestens eine Testspur in dieser Matrix.
