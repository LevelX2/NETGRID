# Gesamttest und Testresilienz 2026-09-08

Status: P1/P2 abgeschlossen, P3 aktiv. Quelle: erneuter vergleichbarer Gesamttest auf Nutzerwunsch.

P1: AI 5.203/5.206 grün in 618 Dateien; SP-082 (Zugwechsel nicht erreicht),
Test Spin (Karte nicht erreicht), R&D Protocol (180-s-Timeout) rot.
Übrige Pakete: 3.777 Tests grün; Specs 8, Selfplay-Evidence 7, Discovery,
Typecheck und Build grün. E2E 15/15, aber Exit 1 durch SQLite-EBUSY beim Cleanup.
Gezielte Diagnose: Test Spin ohne Zahlungsfenster verliert den Choice-Ursprung.
P2: Quellbindung, Coverage-MU-Fortsetzung und Fortschreibung bis Runstart
ursächlich korrigiert. Drei breite Regressionen durch kontrollierte Engine-
Pfade ersetzt. 50 fokussierte Tests einschließlich negativer Ursprungsprüfungen,
AI-Typecheck und AI-Strukturgates grün. E2E nach begrenzter Dateifreigabe-
Wartezeit erneut 15/15 und Exit 0. Keine Timeout-Erhöhung, kein Assertion-Skip.

Ziel: Alle aktuellen Tests prüfen, Fehler ursachenbezogen beheben und lokal
nach `main` integrieren. Die vorherigen Änderungen gelten als Ausgangsvertrag.
Ein grüner Lauf allein rechtfertigt keine veränderte Erwartung.

## Arbeitsregeln

- Worktree: `C:\Projekte\NETGRID_FULL_TEST_RESILIENCE_2026_09_08`.
- Branch: `codex/full-test-resilience-2026-09-08`; Basis: `278eafc37`.
- Genau ein Paket ist aktiv. Fortschritt: P1 → P2 → P3 → abgeschlossen.
- Produktfehler, ungültige Testbindung und Laufzeit-/Infrastrukturfehler
  erhalten getrennte Ursachen. Testvoraussetzungen müssen gezielt hergestellt
  werden; Änderungen dürfen den ursprünglichen Regressionsschutz nicht verlieren.
- Kein Push, keine Änderung fremder Prozesse oder Laufzeitdaten. E2E verwendet
  den isolierten Projekt-Runner mit eigenen Ports und eigener SQLite-Datei.
- Unklare Fachverträge werden vor einem Erwartungswechsel aus Code und
  führender Architektur geklärt. Sicherheitsblocker stoppen den betroffenen Pfad.

## P1: Bestandsaufnahme und vollständige Ausgangsprüfung

Arbeit: offizielle drei AI-Shards, alle übrigen Workspace-Pakettests,
Discovery, Specs und Selfplay-Evidence. Der AI-Anteil des Workspace-Tests wird
durch die vollständigen Shards abgedeckt; keine doppelte serielle Ausführung.
Ergänzend wie beim Vergleichslauf Typecheck, Build und vollständige E2E-Suite.
Done: Ergebnisse und konkrete Fehlpfade liegen vor; jeder Fehlschlag ist erfasst.
Commit: nur bei eigenständigen Änderungen an aktuellen Testartefakten.

## P2: Ursachen und belastbare Regressionen

Arbeit: jeden Fehler fokussiert reproduzieren, den fachlichen Vertrag prüfen,
Ursachenfix oder stabile Testvoraussetzung implementieren. Insbesondere die
erneut roten SP-082-/Test-Spin-Simulationen auf unkontrollierte Voraussetzungen
prüfen. Negativnachweise sichern die wesentliche Regressionseigenschaft.
Done: alle betroffenen fokussierten Tests grün, Änderungen geprüft und
paketweise committed; wiederverwendbare Regeln in aktuelle Architektur zurückgeführt.
Commitvorschlag: `test: isolate regression prerequisites from full-game policy`.

## P3: Endnachweis und Integration

Arbeit: betroffene breite Gates nach Korrekturen wiederholen; unverändert grüne
Gates aus P1 weiterverwenden. Ergebnisse in Current-State-Artefakte zurückführen,
dieses temporäre Prozessartefakt entfernen und Dokumentation committen.
Anschließend aktuellen `main` defensiv abgleichen, lokal integrieren und den
sauberen eigenen Worktree samt Branch entfernen, Git und Dateisystem prüfen.
Done: alle beauftragten Tests abgeschlossen, Fehler behoben oder begründete
externe Blocker transparent; Main-Integration und Cleanup verifiziert.
Commitvorschlag: `docs(test): record verified regression contracts`.

Pro Paket: nur zugehörige Dateien stagen, `git diff --check`, fokussierte
Checks, Commit. Keine automatischen Erweiterungen von Kartenpool, KI-Strategie
oder Testframework. Dieses Artefakt dient nur der aktiven Durchführung;
Git bewahrt danach den Verlauf.
