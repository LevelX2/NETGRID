# V1.9.10 bis V1.9.22 Automation Prompt

Status: aktiver Controller-Prompt fuer stündliche Completion-Automation
Stand: 2026-05-12
Modus: Expeditionsmodus mit WIP-Commits und WIP-Pushes

## Auftrag

Arbeite im NETGRID-Projekt wiki-first als sequenzieller Release-Implementation-Controller fuer die V1.9.10-bis-V1.9.22-Originalset-Completion. Ziel ist, die geplanten Release-Schritte soweit wie moeglich automatisch nacheinander zu detailplanen, umzusetzen, zu pruefen, lokal zu committen und nach GitHub zu pushen.

Wichtig: WIP-Commits und WIP-Pushes sind erlaubt, damit Fortschritt auch bei unvollstaendigen Zwischenstaenden gesichert ist. Ein Release gilt aber erst dann als abgeschlossen und der Cursor darf erst dann auf den naechsten Release gesetzt werden, wenn das Completion-Gate fuer diesen Release erfuellt ist. Ein Blocker wird dokumentiert, setzt den Cursor aber nicht auf den naechsten Release.

## Pflichtstart je Lauf

1. Lies `AGENTS.md`, `AGENTS.local.md` falls vorhanden und `agents/release-implementation-agent.md`.
2. Lies danach:
   - `KI-Wissen-NETGRID/00 Projektstart.md`
   - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
   - `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
   - `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
   - `docs/codex/CODEX_STATUS.md`
   - `docs/derived/V1_9_10_TO_V1_9_XX_ORIGINALSET_COMPLETION_ANALYSIS.md`
   - `docs/derived/V1_9_10_TO_V1_9_XX_DETAILED_PLAN.md`
   - `docs/derived/V1_9_10_TO_V1_9_XX_CARD_FUNCTION_MATRIX.md`
   - `docs/derived/V1_9_10_TO_V1_9_XX_IMPLEMENTATION_HANDOFF.md`
   - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_CONTROLLER_PLAN.md`
   - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`
   - `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md`

## Laufsteuerung

0. Worktree-Preflight vor dem Lesen der Release-Artefakte: Fester Automations-Workspace ist `C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET`. Falls dieser Worktree fehlt, lege ihn aus `C:\Projekte\NETGRID` per `git worktree add C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET codex/v1-9-originalset-completion` an. Arbeite danach ausschliesslich im festen Automations-Worktree und wechsle nicht in den lokalen Hauptworkspace `C:\Projekte\NETGRID`.
1. Pruefe den lokalen Lock `C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET\.codex-runlogs\v1_9_originalset_completion.lock`.
2. Wenn ein aktiver nicht-staler Lock existiert, stoppe ohne Aenderungen. Ein Lock mit JSON-Status `released-delete-denied`, `released`, `stale` oder `abandoned` gilt nicht als aktiv; entferne ihn wenn moeglich, sonst ueberschreibe ihn beim Anlegen des eigenen Locks.
3. Lege fuer den eigenen Lauf einen Lock an und entferne ihn am Ende. Wenn das Loeschen am Ende trotz freigegebenem Lauf scheitert, ueberschreibe den Lock mit JSON-Status `released-delete-denied`, `releasedUtc`, `workspace` und `branch`, damit der naechste Lauf ihn sicher als freigegeben behandeln kann.
4. Stelle sicher, dass der Branch `codex/v1-9-originalset-completion` aktiv ist.
5. Pruefe `git status`. Wenn eigene, klar zum aktuellen V1.9-Cursor gehoerende WIP-Aenderungen aus einem vorherigen Automationslauf vorhanden sind, stoppe nicht allein wegen Dirty-Status, sondern klassifiziere sie im Laufbericht und arbeite am selben Cursor weiter. Fremde, unklare oder releasefremde Aenderungen bleiben ein harter Blocker.
6. Lies den aktuellen Release und die Phase aus `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`.
7. Arbeite ausschliesslich am aktuellen Release aus dem Cursor.
8. Plane den aktuellen Release detailliert, falls das release-spezifische Planungsartefakt noch fehlt oder veraltet ist.
9. Setze den aktuellen Release so weit wie moeglich um.
10. Fuehre sinnvolle zielgerichtete Tests aus; bei Zeitmangel priorisiere Pakettests und Tests fuer geaenderte Mechanik-/AI-/Datenbereiche.
11. Schreibe Status, offene Punkte, Testresultate und naechste Schritte in den Cursor und in passende Review-/Log-Artefakte.
12. Wenn versionierbare Aenderungen entstanden sind, erzeuge einen lokalen WIP-Commit und pushe den Branch nach GitHub.
13. Wenn das Completion-Gate erfuellt ist, schreibe oder aktualisiere den Final Review, erzeuge einen Abschlusscommit, pushe, setze den Cursor auf den naechsten Release und wechsle bei ausreichender Restzeit direkt in den Pipeline-Modus fuer diesen naechsten Release.
14. Wenn das Completion-Gate nicht erfuellt ist, bleibt der Cursor auf demselben Release.
15. Bei hartem Blocker: dokumentiere Blocker, Removal Condition und zuletzt gesicherten Stand; pushe WIP, aber springe nicht stillschweigend zum naechsten Release.

## Zeitbudget je Lauf

- Arbeite nicht als Dauerprozess.
- Ziel-Laufzeit bei offenem Release ist 45 bis 50 Minuten.
- Stoppe nicht freiwillig vor 40 Minuten Gesamtlaufzeit, solange kein harter Blocker, kein aktiver fremder Lock, keine unklaren/fremden Worktree-Aenderungen und keine ausdruecklich dokumentierte "keine sinnvolle naechste Aktion"-Lage vorliegt.
- Unter 40 Minuten Gesamtlaufzeit gibt es nur diese erlaubten Stop-Gruende: harter technischer Blocker, harter fachlicher P0-Blocker, aktiver fremder Lock, unklare/fremde Worktree-Aenderungen, alle Releases V1.9.10 bis V1.9.22 vollstaendig abgeschlossen, oder keine sinnvolle naechste Aktion mit konkreter Begruendung und Dateiverweisen. "Completion-Gate erreicht", "WIP gesichert", "Tests gruen", "Kontext komprimiert", "kleiner Fortschritt erledigt", "fehlende Volltextquelle bei vorhandenen Regelkern-Aussagen" oder "naechster Schritt waere groesser" sind keine Stop-Gruende.
- Wenn ein Lauf unter 40 Minuten stoppt, muss der Abschlussbericht explizit `Early-Stop-Reason:` mit einer der erlaubten Stop-Gruppen enthalten. Fehlt ein erlaubter Grund, war der Lauf nicht regelkonform.
- Wenn der Kontext komprimiert wird, gilt das nicht als Stoppgrund. Setze am Cursor fort, pruefe den aktuellen Stand und arbeite weiter, bis ein erlaubter Blocker, die Gesamtcompletion V1.9.10 bis V1.9.22 oder die Zeitgrenze erreicht ist.
- Halte nach etwa 45 bis 50 Minuten an, selbst wenn der aktuelle Release noch nicht fertig ist.
- Sichere dann Status, WIP-Commit und Push, sofern es versionierbare Aenderungen gibt.
- Der naechste stündliche Lauf setzt am Cursor fort.
- Stoppe nicht schon nach einem erfolgreichen WIP-Checkpoint, solange kein harter Blocker vorliegt und noch deutlich Restzeit vorhanden ist. Ein WIP-Commit ist ein Sicherungspunkt, kein automatisches Laufende.
- Wenn der aktuelle Release noch nicht abgeschlossen ist und der Lauf unter 40 Minuten Gesamtlaufzeit liegt, arbeite am selben Release weiter, bis entweder ein echter Blocker entsteht oder mindestens 40 Minuten erreicht sind. Zwischen 40 und 50 Minuten darf nur nach sauberem Status/WIP-Checkpoint gestoppt werden.
- Wenn alle urspruenglich geplanten Teilaufgaben eines WIP-Schnitts erledigt sind, waehle unter 40 Minuten automatisch die naechste offene Gate-Arbeit aus `Implementation Review`, `Test Matrix`, `Manifest`, `Coverage`, `AI-Hints`, `AI-Smokes`, `Server/Web`, `Full Checks` oder `Final Review` und arbeite daran weiter.
- Pipeline-Modus: Wenn ein Release in diesem Lauf vollstaendig abgeschlossen, gepusht und der Cursor sauber auf den naechsten Release gesetzt wurde, muss derselbe Lauf bei ausreichend Restzeit den naechsten Release beginnen. Ein Releaseabschluss ist ein Pipeline-Uebergang, kein Laufende.
- Ausreichend Restzeit bedeutet: Der Lauf ist nach eigener Einschaetzung noch klar unter etwa 40 Minuten Gesamtlaufzeit, der Lock gehoert weiterhin diesem Lauf, der Worktree ist sauber, der Push des vorherigen Release war erfolgreich und der Cursor zeigt exakt auf den naechsten Release.
- Im Pipeline-Modus wird immer nur der unmittelbar naechste Release begonnen; Releases duerfen nie uebersprungen werden. Erlaubt sind Detailplanung, Requirements/Testmatrix, erste eng begrenzte Umsetzung und ein WIP-Checkpoint. Wenn auch der naechste Release im selben Lauf vollstaendig gate-gruen wird und noch vor der 45-50-Minuten-Grenze gearbeitet werden kann, wird auch dessen Cursor auf den Folge-Release gesetzt und nach denselben Regeln weiterpipelinebar fortgesetzt. Es gibt keinen kuenstlichen Stopp nach einem erfolgreichen Releaseabschluss.
- Kein rekursiver Neustart, kein zweiter paralleler Job, kein Ueberspringen von Releases.

## Git-Regeln

- Arbeitsbranch: `codex/v1-9-originalset-completion`.
- Ausfuehrung: fester lokaler Automations-Worktree `C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET`; nicht in `C:\Projekte\NETGRID` zurueckwechseln.
- Fuer WIP- und Abschluss-Checkpoints nutze bevorzugt das freigegebene Skript: `C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET\scripts\automation\v1-9-checkpoint.ps1 -Message "<Commit-Message>" -Push`.
- Kein Push nach `main`.
- Kein Force-Push.
- Keine fremden Nutzeränderungen revertieren.
- Keine lokalen Runtime-Daten, Caches, SQLite-Dateien, Secrets oder Build-Artefakte versionieren.
- WIP-Commit-Muster: `WIP V1.9.xx: <kurzer Fortschrittstitel>`.
- Abschlusscommit-Muster: `V1.9.xx: <kurzer Release-Titel>`.

## Installations- und Test-Regeln

- Fuer Dependency-Installation und Paketchecks nutze bevorzugt das freigegebene Skript `C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET\scripts\automation\v1-9-install-and-check.ps1 -Task <task>`.
- Erlaubte Tasks: `install`, `catalog`, `engine`, `ai`, `web`, `server`, `typecheck`, `test`, `lint`, `build`.
- Wenn `node_modules` fehlt, fuehre zuerst `-Task install` aus.

## Completion-Gate je Release

Ein Release darf nur dann als abgeschlossen markiert werden, wenn mindestens gilt:

- release-spezifischer Detailplan, Requirements/Testmatrix oder dokumentierte Entbehrlichkeitsentscheidung liegt vor
- Umsetzung ist auf den aktuellen Release-Scope begrenzt
- Kartenaktivierungen erfolgen nicht durch Datenimport allein
- alle aktivierten Karten haben passende Resolver/Ability-Anbindung oder begruendete generische Mechanikabdeckung
- `LegalActions` und `applyAction` bleiben die einzige PlayerAction-Autorität
- side-sichere KI-Unterstuetzung ist fuer alle neu `ai_supported` Karten vorhanden
- Visibility, PlayerView, PublicEvents, Reconnect, Undo, Replay und StateHash sind fuer betroffene Mechaniken bedacht und soweit noetig getestet
- Manifest, Mechanics-Coverage, Szenarien und AI-Hints sind aktualisiert
- relevante Tests wurden ausgeführt und das Ergebnis ist im Review dokumentiert
- keine bekannten P0-Blocker offen
- Final Review existiert

Tests duerfen im Expeditionsmodus fehlschlagen und trotzdem als WIP gesichert werden. Fehlgeschlagene Tests duerfen aber nicht als Release-Abschluss gewertet werden.

## Kartenaktivierung

Aktiviere Karten nur, wenn die jeweilige Mechanikfamilie im aktuellen Release tatsaechlich implementiert und side-sicher testbar ist. Setze `human_playable`, `deck_legal` und `ai_supported` nur mit passender Engine-, Daten-, KI- und Testabdeckung. Keine pauschale Freigabe des O:NR-v1-Kartenpools.

## Anzeige- und Release-Texte

Fehlende versionierte lokale Volltextquellen im Automations-Worktree sind kein harter P0-Stopgrund, wenn fuer die Zielkarten lokal bestaetigte Regelkern-Aussagen in den fuehrenden V1.9.10-bis-V1.9.xx-Planungsartefakten vorliegen. In diesem Fall muss die Automation die `V1.9.xx WIP:`-Texte selbst zu finalen, knappen Anzeige-/Release-Texten ohne WIP-Praefix finalisieren und im Review dokumentieren, dass diese Texte display-only sind.

Kartentext bleibt Anzeige-/Kataloginformation und darf nicht als Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet verwendet werden. Nur wenn weder versionierte Volltextquelle noch lokal bestaetigte Regelkern-Aussage vorliegt, ist fehlender Kartentext ein fachlicher Blocker.

## Release-Reihenfolge

1. V1.9.10 Status-, Manifest- und Katalog-Konsolidierung
2. V1.9.11 Hidden-Zone Search, Reveal, Reorder und Shuffle
3. V1.9.12 Counter, Virus, Purge und Recurring Pools
4. V1.9.13 Damage, Prevention, Avoid und Replacement Longtail
5. V1.9.14 Trace, Link, Tags und Resource-Tag-Interaktionen
6. V1.9.15 Run Flow, Access, Multiaccess und Ambush on Access
7. V1.9.16 Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy
8. V1.9.17 Generische Asset/Node-Faehigkeiten
9. V1.9.18 Generische Upgrade-, Root-, Grid- und Server-Faehigkeiten
10. V1.9.19 Agenda Difficulty, Scored Agenda Abilities und Overadvance
11. V1.9.20 Globale Modifier, Handgroesse, Action Economy und persistente Sonderzustaende
12. V1.9.21 Deterministischer Zufall und Wuerfelkarten
13. V1.9.22 Per-card Resolver Longtail und Originalset Completion Gate

## Abschluss je Lauf

Der sichtbare Abschlussbericht des Automationslaufs muss enthalten:

- bearbeiteter Release
- Phase vor und nach dem Lauf
- geaenderte Hauptartefakte
- Testresultate
- Commit-Hash, falls committed
- Push-Ergebnis, falls gepusht
- ob der Cursor auf den naechsten Release gesetzt wurde
- offene Blocker oder naechster sinnvoller Schritt
