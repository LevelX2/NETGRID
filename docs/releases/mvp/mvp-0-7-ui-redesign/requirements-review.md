# MVP 0.7 Requirements Review

Status: bestanden
Stand: 2026-05-03

## Ergebnis

`ready_for_implementation: true`

Der V0.7 Requirements/Design Freeze ist abgeschlossen. Die Anforderungen sind aus `docs/releases/mvp/mvp-0-7-ui-redesign/plan.md`, `docs/ui-designsets/README.md` und `docs/ui-designsets/REALISM_REVIEW.md` abgeleitet und auf den aktuellen V0.6-Stand begrenzt.

## Geprüfte Punkte

| Check | Ergebnis |
|---|---|
| V0.6 Eingangsgate | pass |
| Designrichtung Design C/D/B | pass |
| Keine neuen Karten oder Mechaniken | pass |
| Kein offizielles Asset ohne Freigabe | pass |
| Side-sichere Datenbindung spezifiziert | pass |
| FullState-Verbot im Client spezifiziert | pass |
| Jede Must-Anforderung mit Testspur | pass |
| Funktionserhalt V0.1 bis V0.6 gefordert | pass |
| V0.8 und V0.9 nicht vorweggenommen | pass |

## Annahmen

- V0.7 darf bestehende Web-UI-Dateien strukturell umbauen, solange die erlaubten Datenquellen und bestehenden Features erhalten bleiben.
- Echte Kartenabbilder bleiben deaktiviert; CardView wird nur image-ready vorbereitet.
- Diagnoseinformationen sind für private Entwicklung erlaubt, aber nur side-gefiltert und ohne Klartexttokens.

## Risiken

- Die bestehende Webseite ist groß und sollte bei der Umsetzung in kleinere Komponenten aufgeteilt werden.
- Visual QA braucht lokale Browser-Smokes, weil reine Unit-Tests Textüberlauf und Layoutüberlagerungen nicht zuverlässig finden.
- CardView-Platzhalter dürfen nicht wie offizielle Card Frames oder Card Backs wirken.

## Nächster Schritt

V0.7 Implementierung starten:

1. Web-UI in stabile Komponenten und Tokens schneiden.
2. Design-C-Entry, RunnerBoard, CorpBoard und CardView umsetzen.
3. Run-/Encounter-Fokus, EventLog, Undo/Reconnect und Diagnostics side-sicher integrieren.
4. Tests, Visibility-Checks, Browser-Smoke, Dokumentation und Final Review ausführen.
