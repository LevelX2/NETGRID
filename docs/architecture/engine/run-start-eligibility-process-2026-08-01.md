# Generische Run-Start-Eligibility und serverbezogene Runsperren

Status: aktiv in Umsetzung

Quelle/Vorgabe: Playtest- und Architekturprüfung der Runsperre von Roving Submarine am 1. August 2026. Die Sperre betrifft den Zielserver, während die auslösende Karte nur Quelle und fachliche Begründung ist. Der vollständige lokale Kartenpool enthält aktuell keine zweite zielserverbezogene Run-Start-Sperre, aber globale Run-Locks, Run-Umleitungen, Run-Startkosten und Einschränkungen während eines Runs müssen klar abgegrenzt bleiben.

## Zielprüfung

Die Vorgabe ist für eine direkte Umsetzung ausreichend präzise. Der Endzustand ist eine generische Engine-Abfrage für die Run-Start-Zulässigkeit je Server, eine quellengebundene PlayerView-Projektion am Server und eine kartennamenfreie Webdarstellung. Roving Submarine bleibt die erste deklarative Nutzerin des Vertrags.

## Gesamtziel

Die Engine entscheidet aus globalen Run-Locks und zielserverbezogenen Einschränkungen, ob ein Run auf einen konkreten Server begonnen werden darf. Dieselbe kanonische Abfrage steuert LegalActions, die erneute Ausführungsvalidierung und die sichtbare Serverstatusprojektion. Weder PlayerView noch Webclient werden zu einer zweiten Regelautorität.

## Annahmen

- Die gegenwärtige Roving-Submarine-Bedingung bleibt regelgleich: Der eigene Server darf nur angegriffen werden, wenn die Korp seit Beginn ihres letzten beziehungsweise laufenden Korpzugs eine Karte in oder vor diesem Server installiert oder dort eine Karte entwickelt hat.
- Die relevante Aktivität ist eine Eigenschaft des Servers und wird unabhängig davon erfasst, ob zu diesem Zeitpunkt bereits eine einschränkende Quelle aktiv ist.
- Aktive installierte Korp-Karten können eine Einschränkung für ihren eigenen Server oder über `selectedServerId` für einen ausdrücklich gebundenen anderen Server liefern. Der aktuelle Kartenpool nutzt zunächst nur den eigenen Server.
- Eine öffentlich wirksame Run-Start-Sperre darf ihre öffentlich bekannte Quellkarteninstanz und deren Titel in der PlayerView nennen.

## Nicht-Ziele

- Keine Zusammenlegung von Run-Umleitungen, Run-Startsteuern, ICE-End-the-run-Effekten oder Ressourcenbeschränkungen während eines Runs mit einer Runsperre.
- Keine kartenspezifische KI-Sonderlogik.
- Keine neue Karte und keine Erweiterung des freigeschalteten Kartenpools.
- Keine Migration historischer lokaler Version-0-Spielstände oder Replays.

## Controller-Invarianten

1. Die Rules Engine bleibt einzige Autorität für die Zulässigkeit eines Run-Starts.
2. Ein `start_run` wird bei der Erzeugung und unmittelbar vor der Ausführung gegen denselben Vertrag geprüft.
3. Einschränkungen binden `targetServerId`, `sourceCardInstanceId`, die deklarierte Fähigkeit und einen allgemeinen Sperrgrund.
4. Allgemeine Engine- und UI-Pfade verzweigen nicht auf Karten-ID oder Kartentitel.
5. Die Serveranzeige wird ausschließlich aus der side-sicheren PlayerView erzeugt.
6. Globale Run-Locks bleiben global; zielserverbezogene Sperren erscheinen nur am betroffenen Server.
7. Mehrere Quellen werden deterministisch sortiert und einzeln erhalten; eine aktive Sperre genügt zum Blockieren.

## Automatische Fehlerbehandlung

- Fokussierte Tests werden bei Fehlern eng auf den betroffenen Vertrag reduziert und vor dem nächsten Paket repariert.
- Fremde Änderungen auf `main` werden vor dem finalen Merge in den Arbeitsbranch integriert und fachlich abgeglichen.
- Ein fehlgeschlagenes Done-Gate stoppt die Paketfolge; es wird kein nachfolgendes Paket vorgezogen.

## Sicherheitsblocker

- Eine nicht öffentlich bekannte Quellkarte darf nicht durch die PlayerView offengelegt werden.
- Eine UI- oder Projektionsprüfung darf die Run-Zulässigkeit nicht selbst nachbauen.
- Ein Zielserver ohne gültige Bindung darf keine Einschränkung erzeugen.

## State Machine

```text
Korpzug beginnt
  -> serverbezogene Aktivitätsmenge leeren
  -> Installation/Entwicklung auf Server
  -> Server-ID deterministisch als aktiv markieren
  -> Runner möchte Run auf Zielserver beginnen
  -> globale Run-Locks auswerten
  -> aktive deklarative Einschränkungsquellen und Zielbindung ermitteln
  -> Bedingung gegen serverbezogene Aktivität auswerten
  -> erlaubt: LegalAction anbieten und bei Ausführung erneut prüfen
  -> gesperrt: keine LegalAction; serverbezogenen Status projizieren
```

## Paketfolge

### P1 – Prozess- und Zielvertrag

- Ist-Modell, Abgrenzungen, Invarianten und Paketfolge dokumentieren.
- Done-Gate: Prozessartefakt vollständig, `git diff --check` grün.
- Commit: `docs(engine): define run-start eligibility process`

### P2 – Engine und PlayerView

- Deklarativen allgemeinen Run-Start-Restriction-Vertrag einführen.
- Serveraktivität im GameState statt als Karten-Mark-Counter führen.
- Kanonische Run-Eligibility für globale und zielserverbezogene Sperren implementieren.
- LegalAction-Erzeugung und Ausführungsvalidierung anbinden.
- Quellengebundene Einschränkungen am Server in die PlayerView projizieren.
- Done-Gate: fokussierte Engine-/Shared-Tests, Typecheck und `git diff --check` grün.
- Commit: `refactor(engine): generalize server run-start restrictions`

### P3 – Generische Webdarstellung

- Runsperren-Chip aus der Kartenanzeige entfernen.
- Serverstatus aus der PlayerView generisch darstellen.
- Tooltip aus Sperrgrund und sichtbarer Quellenangabe bilden; keine Karten-ID-Verzweigung.
- Done-Gate: fokussierte Webtests, Typecheck und `git diff --check` grün.
- Commit: `refactor(web): render run restrictions on servers`

### P4 – Gesamtabnahme und Integration

- Abstraktionsguard ohne Baseline-Aufweichung ausführen.
- Relevante Pakettests und breite Workspace-Gates ausführen.
- Prozessstatus und Wissenslog aktualisieren, sofern der Projektworkflow dies verlangt.
- Arbeitsbranch mit aktuellem `main` abgleichen, final prüfen und lokal nach `main` integrieren.
- Worktree und gemergten Arbeitsbranch entfernen und beide Entfernungen verifizieren.
- Done-Gate: alle Pflichtchecks grün, `main` sauber, Cleanup vollständig.
- Commit: `test(engine): close run-start eligibility regression coverage`

## Verifikationsregeln

- Fokussierte Engine- und Webtests erhalten mindestens 180 Sekunden äußeres Zeitfenster.
- Breite Typecheck-, Test- und Build-Gates erhalten mindestens 600 Sekunden äußeres Zeitfenster.
- Jeder Paketabschluss enthält `git diff --check`, gezieltes Staging und genau einen Paketcommit.
- Die Card-Function-Abstraktionsprüfung darf nicht durch bloßes Akzeptieren neuer kartenspezifischer Fingerprints beruhigt werden.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/run-start-eligibility`
- Arbeits-Worktree: `C:\Projekte\NETGRID_RUN_START_ELIGIBILITY`
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für den finalen lokalen Merge.
- Keine Serverstarts auf den Standardports 3100 oder 8787; für diese Änderung sind keine Serverstarts vorgesehen.
- Jeder Paketcommit enthält ausschließlich den freigegebenen Scope.

## Controller-Prompt-Kern

`/Goal` Arbeite P1 bis P4 vollständig und sequenziell im festgelegten Worktree ab. Arbeite immer nur am aktiven Paket, führe dessen Checks aus, committe es und aktualisiere erst danach den Fortschritt. Bei Sicherheitsblockern stoppe mit Removal Condition. Integriere nach Abschluss aktuelles `main`, verifiziere erneut, merge lokal nach `main` und entferne Worktree sowie Branch erst nach nachgewiesen sauberer Integration.

## Abschlusskriterien

- Kein produktiver Pfad fragt für die Runsperre Karten-ID oder Kartentitel ab.
- Roving Submarine deklariert nur Quelle, Zielbindung und Bedingung.
- Serveraktivität und sichtbarer Sperrstatus sind serverbezogen.
- Globale Run-Locks und zielserverbezogene Sperren werden gemeinsam, aber unterscheidbar ausgewertet.
- LegalActions, `applyAction`-naher Ausführungspfad und PlayerView stimmen überein.
- Fokussierte Regressionstests, Guard und vereinbarte breite Gates sind grün.
- Arbeitsbranch ist nach `main` integriert; Worktree und Branch sind verifiziert entfernt.
