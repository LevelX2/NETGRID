# MVP 0.91 Test Matrix

Status: Requirements Freeze mit privater lokaler Nutzungsentscheidung
Stand: 2026-05-03

| Test-ID | Deckt ab | Ebene | Erwartung |
|---|---|---|---|
| V091-T001 | V091-MUST-001 | Artifact | Alle V0.91-Derived-Dokumente, Source Registry, Policy und Requirements Review existieren. |
| V091-T002 | V091-MUST-002 | Gate | Artefakt- oder Statuscheck bestätigt `MVP_0.9_done: true`; ohne diesen Marker blockiert V0.91. |
| V091-T003 | V091-MUST-003 | Source Review | Primärquellen, O:NR-1996-Privatentscheidung und Nutzungsgrenzen sind dokumentiert; öffentliche Nutzung bleibt verboten. |
| V091-T004 | V091-MUST-004 | Data | `card-image-policy-0.91.json` ist parsebar und erlaubt nur private lokale O:NR-1996-Frontbilder; Card Backs, öffentliche Verteilung und URL-Versionierung bleiben `false`. |
| V091-T005 | V091-MUST-005 | Data | `card-image-source-registry-0.91.json` ist parsebar und enthält keine echten Bilddateien, keine per-card Bild-URLs und keine lokalen Cachepfade. |
| V091-T006 | V091-MUST-006 | Regression | Engine-, KI-, Deck-, Replay- und StateHash-Tests ändern sich durch Bildmetadaten nicht. |
| V091-T007 | V091-MUST-007 | Git/Artifact | Späterer Cache-Pfad liegt unter nicht versioniertem lokalem Ordner; Git-Status-/Artifact-Test blockiert Bilddateien im Repository. |
| V091-T008 | V091-MUST-008 | Import Unit | Spätere Bildmetadaten werden kanonisch sortiert; Hash/ETag/Last-Modified werden deterministisch ausgewertet. |
| V091-T009 | V091-MUST-009 | API Security | Bild-API-Payloads enthalten keine verbotenen Schlüssel: `GameState`, `cardInstances`, `privatePayload`, `sessionToken`, `joinToken`, `reconnectToken`, lokale Pfade. |
| V091-T010 | V091-MUST-010 | Match Visibility | Board-Bildstatus wird ausschließlich aus side-gefilterter PlayerView abgeleitet. |
| V091-T011 | V091-MUST-011 | Hidden-Info | Hidden Cards enthalten keine Bild-URL, Asset-ID, Titel, DefinitionId, `alt`-/`title`-Identität, Datenattribute oder unterscheidbaren Ladezustand. |
| V091-T012 | V091-MUST-012 | UI Fallback | Fehlende, blockierte, beschädigte oder nicht freigegebene Bilder fallen auf Textkarte oder generischen Platzhalter zurück. |
| V091-T013 | V091-MUST-013 | UI Smoke | Katalog, Deckeditor, Match-Setup, Board, Preview und Zoom nutzen getrennte Regeln für Katalogkontext und Matchkontext. |
| V091-T014 | V091-MUST-014 | Runtime | Matchstart und laufendes Match führen keine externen Bild-Fetches aus. |
| V091-T015 | V091-MUST-015 | Asset Gate | Nur O:NR-1996-Frontbilder dürfen später lokal privat importiert werden; Card Backs, standalone Frames/Logos, Android/NSG-Bilder und öffentliche Verteilung bleiben blockiert. |
| V091-T016 | V091-MUST-016 | Coverage | Jede V0.91-Must-Anforderung ist genau einer oder mehreren Testspuren zugeordnet. |

## Pflicht-Checks für späteren Implementierungsversuch

Diese Checks werden erst relevant, wenn das Asset-Gate später positiv freigegeben wird:

- JSON-Parse für `data/card-assets/*.json`.
- Artifact-Test für V0.91-Dokumente und Must-Testabdeckung.
- Git-/Artifact-Test gegen versionierte Bilddateien unter Cache-Pfaden.
- API-Sicherheitstest für Bildendpunkte.
- Visibility-Contract-Test für Hidden-Card-Payloads und DOM.
- UI-Smoke für Katalog, Deckeditor, Board, Preview und Zoom.
- Regression: `corepack pnpm lint`.
- Regression: `corepack pnpm typecheck`.
- Regression: `corepack pnpm test`.
- Regression: `corepack pnpm build`.

## Aktueller Freeze-Check

Für den aktuellen Requirements-Freeze genügen:

- V0.9-Finalgate dokumentiert.
- alle V0.91-Dokumente angelegt.
- Source Registry und Policy parsebar.
- jede Must-Anforderung hat Testspur.
- Review dokumentiert `ready_for_implementation: true` für private lokale O:NR-1996-Frontbilder und `ready_for_public_distribution: false`.
