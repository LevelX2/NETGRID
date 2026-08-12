# Aktivitäten-Pipeline

`docs/activities/` ist das leichte Arbeitsboard für konkrete NETGRID-Funde, Fixes, Nacharbeiten, Testlücken, Cleanup-Ideen und kleine Umsetzungspakete.

## Ordner

- `inbox/`: noch nicht beanspruchte Pakete.
- `in-progress/`: aktuell beanspruchte Pakete. Beim Start werden Status, Startzeit und primärer Agent gesetzt.
- `done/`: kurzlebiger Abschluss-Slot für ein fertig bearbeitetes Paket.
- `templates/`: Vorlagen für neue Pakete.

Es gibt keinen eigenen `locked/`-Ordner. Ein blockiertes Paket bleibt in `in-progress/` mit `status: blocked`, `blockerReason` und `nextAction`.

## Wann eine Activity sinnvoll ist

Eine Activity ist passend für:

- einen klar abgegrenzten Bug oder Playtest-Fund;
- eine kleine oder mittlere Änderung;
- eine konkrete Nacharbeit aus Review oder Analyse;
- einen begrenzten Architektur- oder Cleanup-Schnitt;
- eine Testlücke oder Regression-Sicherung.

Dauerhafte Architektur-, Entscheidungs-, Release-, Review- oder Betriebsinformation gehört dagegen in den jeweils fachlich zuständigen Bereich unter `docs/` oder in die Wissensbasis.

## Statusmodell

- `inbox`: bereit zur Auswahl.
- `in_progress`: beansprucht und in Arbeit.
- `blocked`: begonnen, aber durch eine konkrete Removal Condition blockiert.
- `done`: umgesetzt oder bewusst abgeschlossen.
- `superseded`: durch ein anderes Paket ersetzt.

Prioritäten: `hotfix`, `critical`, `high`, `normal`, `low`.

## Ablauf

1. Neues Paket aus `templates/activity.md` in `inbox/` anlegen.
2. Beim Start nach `in-progress/` verschieben und Status/Agent/Branch aktualisieren.
3. Bei Blockern dort sichtbar bleiben oder in kleinere Folgepakete schneiden.
4. Beim Abschluss Ergebnis, Checks und dauerhafte Folgeartefakte dokumentieren.
5. Wiederverwendbare Erkenntnisse in Wissensbasis, Architektur, Review, Decision, Runbook, Releaseartefakt oder Tests zurückführen.
6. Das abgeschlossene Activity-Paket danach löschen, sobald kein aktueller Link-, Gate-, Removal-Condition- oder Arbeitsnutzen mehr besteht.

## Retention

`docs/activities/` ist kein Dokumentationsarchiv.

- `done/` darf und soll im Normalzustand leer sein; `.gitkeep` hält nur die Workflow-Struktur.
- Ein abgeschlossenes Paket bleibt nur solange erhalten, wie sein Ergebnis noch nicht in die eigentliche dauerhafte Quelle übertragen wurde oder es selbst noch eine konkrete aktuelle Gate-/Removal-Condition-Funktion besitzt.
- Monatsrollups sind keine Voraussetzung für die Löschung abgeschlossener Pakete.
- Git-Historie ist der historische Nachweis für entfernte Activity-Dateien.
- Neue Arbeit wird nie in einem alten erledigten Paket versteckt; dafür entsteht ein neues Follow-up in `inbox/`.

Activity-Pakete bleiben klein: klarer Befund, begrenzter Scope, expliziter Nicht-Scope, prüfbare Akzeptanzkriterien und genau ein primärer Folgeagent.

## Auswahlregel

Wenn kein konkretes Paket genannt ist, wird aus `inbox/` nach passender Rolle und Priorität gewählt: zuerst `hotfix`, dann `critical`, `high`, ältere `normal` und zuletzt `low`.
