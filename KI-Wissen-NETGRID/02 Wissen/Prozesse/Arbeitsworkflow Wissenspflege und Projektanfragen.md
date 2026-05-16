# Arbeitsworkflow Wissenspflege und Projektanfragen

## Kurzfassung

Dieser Workflow beschreibt, wie Codex im Projekt NETGRID arbeiten soll: erst vorhandenes Wissen lesen, dann Quellen gezielt prüfen, danach Erkenntnisse in Wissensseiten oder Codex-Status zurückführen. NETGRID bleibt dabei fachliche Spiel- und Regelreferenz, nicht der aktive App-Name.

## Aktivitäten-Pipeline

Offene Konzepte, kleine Umsetzungspakete, Fixes, Nacharbeiten, Testlücken und Cleanup-Ideen werden in `docs/activities/` gepflegt.

- `docs/activities/inbox/`: noch nicht beanspruchte Pakete.
- `docs/activities/in-progress/`: aktuell gegriffene Pakete; beim Start werden `status`, `startedAt`, `primaryAgent` und bei Bedarf `branch` aktualisiert.
- `docs/activities/done/`: abgeschlossene Pakete mit Ergebnisnotiz, Checks und Links auf entstandene Artefakte.

Formale dauerhafte Artefakte wie Releasepläne, Requirements, Spezifikationen, Testmatrizen, Implementation Reviews und Final Reviews bleiben unter `docs/derived/`. Wenn der Nutzer sinngemäß sagt "such dir ein Paket aus", wählt Codex ein geeignetes Paket aus `docs/activities/inbox/` nach Rolle, Priorität, Klarheit und begrenztem Scope.

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
5. Bei Releaseabschlüssen vor dem Phasenwechsel die im Webclient sichtbare Versionsnummer auf den erreichten Release-Stand anheben und im Final Review dokumentieren.

## Fall 5: Abschluss

1. Offene Änderungen und untracked Dateien prüfen.
2. Relevante Setup-, Dokumentations- oder Codeänderungen sinnvoll committen.
3. Nicht versionierbare lokale Daten sichtbar benennen.
4. Bei `Finale` nur lokal nach `main` integrieren, solange kein Remote konfiguriert ist.
