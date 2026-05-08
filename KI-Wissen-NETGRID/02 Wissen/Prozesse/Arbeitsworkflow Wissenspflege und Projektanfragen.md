# Arbeitsworkflow Wissenspflege und Projektanfragen

## Kurzfassung

Dieser Workflow beschreibt, wie Codex im Projekt NETGRID arbeiten soll: erst vorhandenes Wissen lesen, dann Quellen gezielt prüfen, danach Erkenntnisse in Wissensseiten oder Codex-Status zurückführen. NETGRID bleibt dabei fachliche Spiel- und Regelreferenz, nicht der aktive App-Name.

## Fall 1: Projektfrage beantworten

1. [[../00 Uebersichten/Index]] lesen.
2. Relevante Wissensseiten im Zusammenhang lesen.
3. `docs/codex/CODEX_STATUS.md` prüfen, wenn es um aktuellen Stand oder nächste Schritte geht.
4. Nur bei Bedarf die Rohquellen oder Workspace-Dateien hinzuziehen.
5. Antwort mit klarer Trennung von gesichertem Wissen, Annahme, Lücke und offenem Punkt formulieren.

## Fall 2: Neue Quelle aufnehmen

1. Quelle unverändert in `docs/source/` oder als Rohquellen-Referenz erfassen.
2. Quelle vollständig lesen oder vollständig auswerten.
3. Quellenpriorität und mögliche Widersprüche prüfen.
4. Betroffene Wissensseiten aktualisieren.
5. `docs/codex/CODEX_STATUS.md` aktualisieren, wenn sich Phasenstand, Blocker oder nächste Schritte ändern.
6. Log nach Relevanzregel ergänzen.

## Fall 3: Erkenntnisse aus Umsetzung zurückführen

1. Prüfen, ob die Erkenntnis wiederverwendbar oder entscheidungsrelevant ist.
2. Passende Wissensseite aktualisieren oder eine neue Seite anlegen.
3. Bei konkreten wiederkehrenden Abläufen ein Runbook oder eine Prozessseite bevorzugen.
4. Statuswissen verdichtet in `Aktueller Projektstatus` einarbeiten.
5. Entscheidung, Verifikation oder Risiko im passenden Monatsarchiv unter `03 Betrieb/` eintragen; neueste Logeinträge stehen oben. `03 Betrieb/Log.md` bleibt der Archivindex.

## Fall 4: Phase wechseln

1. Aktuellen Phasenstand in `docs/codex/CODEX_STATUS.md` prüfen.
2. Gate-Kriterien der laufenden Phase prüfen.
3. Fehlende Quellen, Tests, Abweichungen oder Risiken dokumentieren.
4. Erst nach bestandenem oder ausdrücklich akzeptiertem Gate die nächste Phase beginnen.

## Fall 5: Abschluss

1. Offene Änderungen und untracked Dateien prüfen.
2. Relevante Setup-, Dokumentations- oder Codeänderungen sinnvoll committen.
3. Nicht versionierbare lokale Daten sichtbar benennen.
4. Bei `Finale` nur lokal nach `main` integrieren, solange kein Remote konfiguriert ist.
