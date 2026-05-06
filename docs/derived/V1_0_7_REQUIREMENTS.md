# V1.0.7 Requirements - Browser-E2E und Visual QA

Stand: 2026-05-06
Status: requirements_freeze

## Kurzfassung

V1.0.7 führt einen reproduzierbaren Browser-E2E- und Visual-QA-Gate für die private V1.x-Weboberfläche ein. Der Release bündelt die bisher dokumentierten V1.0.4-, V1.0.5- und V1.0.6-Browser-Smokes in automatisierbare Flows und ergänzt eine feste Viewport-Matrix.

V1.0.7 erweitert keine Spielregeln, Karten, offiziellen Assets, öffentlichen Plattformfunktionen, Replay- oder StateHash-Verträge.

## Anforderungen

| ID | Priorität | Anforderung | Testspur |
| --- | --- | --- | --- |
| V107-MUST-001 | Must | Es gibt einen reproduzierbaren Browser-E2E-Gate für V1.x-Smokes. | V107-T001, V107-T002 |
| V107-MUST-002 | Must | Der Gate kann lokal mit einem dokumentierten Befehl gestartet werden und startet oder nutzt Web und Server kontrolliert. | V107-T001, V107-T003 |
| V107-MUST-003 | Must | Browser-E2E nutzt isolierte Testlaufdaten und verschmutzt nicht die normale lokale Runtime-Datei unter `data/runtime`. | V107-T004 |
| V107-MUST-004 | Must | Human-vs-KI wird als echter Browserfluss geprüft: Matchstart, aktives Spiel, KI-Takt, Gegner-Cue und mindestens eine menschliche Aktion. | V107-T005 |
| V107-MUST-005 | Must | Human-vs-Human wird mit zwei getrennten Browser-Kontexten geprüft: Host, Join-Link, Joiner-Deckauswahl, Ready-Lobby, Countdown und aktives Spiel. | V107-T006 |
| V107-MUST-006 | Must | V1.0.4-Lifecycle-Flows bleiben browserseitig erreichbar und side-sicher: Cancel, Recreate, Leave, Forfeit, Fortsetzen/Reconnect und Verwerfen. | V107-T007 |
| V107-MUST-007 | Must | V1.0.5-Board-Flows bleiben browserseitig lesbar: RunTimeline, Run-Ziel, zentrale Server, Runner-Rig, Cue-Position, Rez-/Unrez-Zustand und Chronicle. | V107-T008, V107-T009 |
| V107-MUST-008 | Must | V1.0.6-Ressourcen- und Kartenanzeige bleibt browserseitig lesbar: Aktionen, Credits, Kostenchips, Card-Display-Modi, Tooltip/Fokus und Kompaktmodus. | V107-T010 |
| V107-MUST-009 | Must | Die Viewport-Matrix umfasst mindestens Desktop, Tablet und schmalen/mobile Viewport. | V107-T011 |
| V107-MUST-010 | Must | Schmale Viewports prüfen gezielt Textüberlauf, überlappende Panels, bedienbare Action-Buttons, Cue-Overlay, RunTimeline und Card Preview. | V107-T011, V107-T012 |
| V107-MUST-011 | Must | Screenshots oder gleichwertige visuelle Artefakte werden für relevante Flows und Viewports erzeugt, mindestens bei Fehlschlag. | V107-T013 |
| V107-MUST-012 | Must | Verdeckte Karten leaken im Browser keine Titel, Definition-IDs, Bild-URLs, Card-Back-Routen, kartenspezifischen CSS-Klassen oder Tooltips. | V107-T014 |
| V107-MUST-013 | Must | Browser-Storage, DOM und Netzpayload-Stichproben enthalten keine Session-/Reconnect-/Join-Tokens, Decklisten, Deckhashes, private Payloads oder verdeckte Kartendaten an der falschen Seite. | V107-T015 |
| V107-MUST-014 | Must | E2E-Tests importieren keine Engine-Regelautorität in die aktive Weboberfläche und ändern keine Runtime-Regelverträge. | V107-T016 |
| V107-MUST-015 | Must | Aktuelle UI-Anpassungen werden als QA-Ziele erfasst: direkte Server-Run-Actions, breakergebundene Kontextaktionen und Stärke-Bonusmarke. | V107-T017 |
| V107-MUST-016 | Must | Der Gate bleibt auf Qualitätsinfrastruktur begrenzt und macht keine neuen Karten, Mechaniken, offiziellen Assets oder Plattformfeatures verfügbar. | V107-T018 |
| V107-SHOULD-001 | Should | E2E-Hilfsfunktionen kapseln häufige Aktionen wie Match erstellen, Join öffnen, Decks wählen, Ready setzen, Aktion ausführen und Reconnect. | V107-T019 |
| V107-SHOULD-002 | Should | Es gibt eine kompakte Ergebnisdokumentation für den Browser-Gate, inklusive getesteter Viewports und Artefaktpfade. | V107-T020 |
| V107-SHOULD-003 | Should | Stabile Testselektoren dürfen ergänzt werden, wenn sie Produkttexte nicht technischer machen und keine Hidden Info transportieren. | V107-T021 |
| V107-COULD-001 | Could | Screenshots können als spätere Baseline abgelegt werden; V1.0.7 erzwingt noch keinen pixelgenauen Golden-Diff. | V107-T013 |

## Festgelegte Viewports

| Name | Größe | Zweck |
| --- | --- | --- |
| Desktop | 1280x720 | aktueller Standard-Smoke und breite Arbeitsansicht. |
| Tablet | 1024x768 | mittlere Breite mit stabiler Board-/Sidepanel-Prüfung. |
| Schmal | 390x844 | Ersatz für den in V1.0.6 offenen schmalen Viewport-Smoke. |

Andere Viewports dürfen ergänzt werden, blockieren aber den Requirements Freeze nicht.

## Scope-Grenzen

- Playwright oder gleichwertige Browser-Automation darf als Dev-Abhängigkeit ergänzt werden.
- Testhilfen dürfen Server/Web starten oder an bestehende Prozesse andocken.
- Testdaten-Isolation darf technische Serveroptionen oder Umgebungsvariablen ergänzen, solange normale Runtime-Pfade unverändert bleiben.
- UI-Fixes sind nur erlaubt, wenn der neue Gate konkrete Lesbarkeits-, Bedienbarkeits- oder Leak-Probleme findet.

## Nicht-Ziele

- kein neuer Spielinhalt,
- keine weitere Kartenfreigabe,
- keine neue Regelmechanik,
- keine Storage-/Backup-Härtung als Produktfeature,
- keine Internet-Härtung,
- kein Account-, Lobby-, Matchmaking-, Ranking-, Turnier- oder öffentlicher Chat-Scope,
- keine offiziellen Bilder, Frames, Logos oder Card Backs,
- keine vollständige Accessibility- oder Mobile-Excellence-Phase.

## Akzeptanz

V1.0.7 ist umsetzungsbereit, wenn diese Requirements, die Spec, die Testmatrix und das Requirements Review konsistent sind.

V1.0.7 ist abgeschlossen, wenn:

- der Browser-E2E-Gate reproduzierbar läuft,
- die Viewport-Matrix abgedeckt ist,
- relevante Screenshots/Traces oder Artefakte erzeugt werden,
- keine Hidden-Info-, Token-, Decklisten- oder Asset-Leaks festgestellt werden,
- die normalen Projektchecks grün bleiben,
- Implementation Review und Final Review den Gate dokumentieren.
