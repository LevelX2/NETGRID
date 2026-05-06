# V1.0.7 Browser-E2E und Visual QA Plan

Stand: 2026-05-06
Status: planning

## Ziel

V1.0.7 macht aus den bisherigen manuellen Browser-/Playtest-Smokes einen wiederholbaren Qualitäts-Gate für die private V1.x-Oberfläche. Der Release erweitert keine Regeln, keine Karten, keine offiziellen Assets, keine Engine-Verträge und keine Plattformfunktionen.

Der Schwerpunkt liegt auf realen Browserflüssen:

- Human-vs-KI mit beobachtbarem KI-Takt und Gegner-Cues.
- Human-vs-Human mit zwei getrennten Browser-Kontexten.
- Matchstart, Join-Deck-Handshake, Ready-Lobby, Countdown und Reconnect.
- Lifecycle-Kommandos Cancel, Leave, Forfeit und Recreate.
- aktive Spieloberfläche aus V1.0.5/V1.0.6 inklusive RunTimeline, Servern, Runner-Rig, Aktionen, Credits, Kostenchips und Card-Display-Modi.
- DOM-, Text-, Screenshot- und Payload-Stichproben gegen Hidden-Info-, Token-, Decklisten- und Asset-Leaks.
- Desktop-, Tablet- und schmale Viewports.

## Prüfbasis

Aktueller Stand vor V1.0.7:

- V1.0.4 Private Match Lifecycle und Session Recovery ist umgesetzt und lokal verifiziert.
- V1.0.5 hat Requirements, Specs, Testmatrix und Browser-Smoke, aber keine eigenen formalen Finalartefakte.
- V1.0.5K kleines Karten-Nachrelease ist umgesetzt und lokal verifiziert.
- V1.0.6 Aktionen, Credits und Kartenanzeige ist umgesetzt und lokal verifiziert.
- V1.0.6 Final Review dokumentiert einen offenen schmalen Viewport-Smoke, weil das verfügbare In-App-Browser-Backend keine Viewport-Resize-API bereitstellte.
- `tests/e2e` existiert, enthält aber noch keine E2E-Implementierung.
- Playwright ist noch nicht als Projektabhängigkeit und Gate-Skript eingebunden.

Zusätzliche aktuelle UI-Anpassungen im Arbeitsstand, die V1.0.7 als Prüfgegenstand berücksichtigen muss:

- Start-Run-Aktionen können als serverbezogene Kontextaktionen direkt am Server erscheinen.
- Breaker-Pump-/Break-Aktionen können stärker an die konkrete Rig-Karte gebunden werden.
- Karten können eine sichtbare Stärke-Bonusmarke anzeigen, wenn ihre aktuelle Stärke über dem Katalogbasiswert liegt.

Diese Anpassungen sind kein eigener V1.0.7-Feature-Scope. V1.0.7 prüft nur, dass solche Oberflächenzustände lesbar, bedienbar und side-sicher bleiben.

## Produktentscheidung

V1.0.7 ist ein Qualitäts- und Testinfrastruktur-Release.

Empfohlene Werkzeugentscheidung:

- Playwright als primärer reproduzierbarer Browser-E2E-Lauf.
- Keine pixelgenauen Golden-Diffs im ersten Gate.
- Screenshots werden als Artefakte und Diagnosehilfen erzeugt.
- Layout- und Textfit-Probleme werden zunächst über DOM-/Bounding-Box-Assertions, sichtbare Textprüfungen und manuelle Screenshot-Sichtung bewertet.
- Browser-Plugin- oder In-App-Browser-Smokes bleiben ergänzende Exploration, aber nicht der Haupt-Gate.

## Scope

### Must

- Projektweiter E2E-Startpunkt für Browser-Gates unter `tests/e2e` oder äquivalent.
- Dokumentierter Befehl für den V1.0.7-Browser-Gate.
- Isolierte Testlaufdaten, damit E2E-Smokes keine normale lokale Runtime-Datei verschmutzen.
- Zwei getrennte Browser-Kontexte für Human-vs-Human.
- Desktop-, Tablet- und schmaler Viewport als feste Mindestmatrix.
- Screenshots oder Trace-Artefakte bei Fehlschlag.
- DOM-/Text-Leak-Prüfung für verdeckte Corp-Karten, Tokens, Decklisten, Deckhashes, Session-/Reconnect-Tokens, `cardDefinitionId`, private Payloads, Bild-URLs und Card-Back-Routen.
- Wiederholbare Abdeckung der bestehenden V1.0.4-, V1.0.5- und V1.0.6-Smokes in einer kleineren, automatisierten Smoke-Matrix.

### Should

- E2E-Hilfsfunktionen für Match erstellen, Join-Link öffnen, Decks wählen, Ready setzen, WebSocket-/REST-Reconnect und einfache Aktionen ausführen.
- Screenshot-Ordnung nach Flow, Seite und Viewport.
- Optionaler lokaler HTML-/Markdown-Report mit Gate-Zusammenfassung.
- Stabile Testselektoren, wenn sie die UI nicht sichtbarer oder technischer machen.

### Could

- Optionaler manueller Ergänzungsrun im In-App-Browser für subjektive UI-Sichtung.
- Ein einfacher Textfit-Helfer, der überlaufende Buttons, Chips und Panels meldet.
- Ein Screenshot-Baseline-Ordner für spätere visuelle Regression, aber noch ohne hartes Pixel-Gate.

### Non-Scope

- Keine neue Karte.
- Keine neue Mechanik.
- Keine Änderung an Replay, StateHash, Randomness oder Engine-Autorität.
- Keine offiziellen Artworks, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine Accounts, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier- oder Chat-Erweiterungen.
- Keine Storage-/Backup-Härtung über die für E2E notwendige Testdaten-Isolation hinaus.
- Keine vollständige Accessibility-Prüfung; nur Basis-Kontrollen für Fokus, Bedienbarkeit und Textüberlauf.

## Umsetzungsreihenfolge

1. Testinfrastruktur auswählen und einbinden.
2. Testdaten-Isolation für Server-Runtime festlegen.
3. Start-/Stop-Harness für Web und Server bauen oder dokumentieren.
4. Kleine E2E-Helfer für REST, WebSocket und UI-Flows ergänzen.
5. Human-vs-KI-Smoke automatisieren.
6. Human-vs-Human-Zwei-Kontext-Smoke automatisieren.
7. Lifecycle- und Reconnect-Smoke automatisieren.
8. Hidden-Info-/Token-/DOM-Leak-Scans ergänzen.
9. Viewport-Matrix und Screenshots ergänzen.
10. Gate-Skript, Runbook, Implementation Review und Final Review dokumentieren.

## Risiken

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| E2E wird instabil durch echte Timer, Countdown oder KI-Pacing. | mittel | feste Seeds, kontrollierte Wartebedingungen, kleine Flows, Timeouts konservativ wählen. |
| E2E verschmutzt lokale Matchdaten. | hoch | temporärer Runtime-Pfad oder Testservice mit isolierter Storage-Datei. |
| Screenshot-Gate wird spröde. | mittel | in V1.0.7 Screenshots als Artefakt, harte Assertions nur für Struktur, Sichtbarkeit und Textfit. |
| Browser-Test braucht sichtbare UI-Selektoren. | niedrig | stabile `data-testid` nur dort ergänzen, wo sie keine Produkttexte verändern. |
| Hidden-Info-Leak nur in DOM/CSS/Bildpfad sichtbar. | hoch | DOM-Text, Attribute, Bildquellen und lokale Storage-Werte explizit scannen. |
| Aktuelle kleine UI-Anpassungen verschieben Layout oder Kontextactions. | mittel | Server-Run-Button, Breaker-Kontextactions und Stärke-Bonusmarke als konkrete QA-Ziele aufnehmen. |

## Done

V1.0.7 ist vorbereitet, wenn Requirements, Spec, Testmatrix und Requirements Review vorliegen und die Umsetzung ohne weitere Produktentscheidung beginnen kann.

V1.0.7 ist umgesetzt, wenn der neue Browser-Gate wiederholbar läuft, die Viewport-Matrix abdeckt, relevante Screenshots/Trace-Artefakte erzeugt, keine Hidden-Info- oder Token-Leaks findet und die normalen Projektchecks weiterhin grün sind.
