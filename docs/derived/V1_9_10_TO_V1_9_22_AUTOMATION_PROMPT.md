# V1.9.10 bis V1.9.22 Automation Prompt

Status: aktiver Controller-Prompt fuer stündliche Completion-Automation
Stand: 2026-05-12
Modus: Expeditionsmodus mit WIP-Commits und WIP-Pushes

## Auftrag

Arbeite im NETGRID-Projekt wiki-first als sequenzieller Release-Implementation-Controller fuer die V1.9.10-bis-V1.9.22-Originalset-Completion. Ziel ist, die geplanten Release-Schritte soweit wie moeglich automatisch nacheinander zu detailplanen, umzusetzen, zu pruefen, lokal zu committen und nach GitHub zu pushen.

Wichtig: WIP-Commits und WIP-Pushes sind erlaubt, damit Fortschritt auch bei unvollstaendigen Zwischenstaenden gesichert ist. Ein Release gilt aber erst dann als abgeschlossen und der Cursor darf erst dann auf den naechsten Release gesetzt werden, wenn das Completion-Gate fuer diesen Release erfuellt oder ein Blocker sauber dokumentiert ist.

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

## Laufsteuerung

1. Pruefe den lokalen Lock `%LOCALAPPDATA%\NETGRID\automation\v1_9_originalset_completion.lock`.
2. Wenn ein aktiver nicht-staler Lock existiert, stoppe ohne Aenderungen.
3. Lege fuer den eigenen Lauf einen Lock an und entferne ihn am Ende.
4. Stelle sicher, dass der Branch `codex/v1-9-originalset-completion` aktiv ist.
5. Lies den aktuellen Release und die Phase aus `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`.
6. Arbeite ausschliesslich am aktuellen Release aus dem Cursor.
7. Plane den aktuellen Release detailliert, falls das release-spezifische Planungsartefakt noch fehlt oder veraltet ist.
8. Setze den aktuellen Release so weit wie moeglich um.
9. Fuehre sinnvolle zielgerichtete Tests aus; bei Zeitmangel priorisiere Pakettests und Tests fuer geaenderte Mechanik-/AI-/Datenbereiche.
10. Schreibe Status, offene Punkte, Testresultate und naechste Schritte in den Cursor und in passende Review-/Log-Artefakte.
11. Wenn versionierbare Aenderungen entstanden sind, erzeuge einen lokalen WIP-Commit und pushe den Branch nach GitHub.
12. Wenn das Completion-Gate erfuellt ist, schreibe oder aktualisiere den Final Review, erzeuge einen Abschlusscommit, pushe und setze den Cursor auf den naechsten Release.
13. Wenn das Completion-Gate nicht erfuellt ist, bleibt der Cursor auf demselben Release.
14. Bei hartem Blocker: dokumentiere Blocker, Removal Condition und zuletzt gesicherten Stand; pushe WIP, aber springe nicht stillschweigend zum naechsten Release.

## Zeitbudget je Lauf

- Arbeite nicht als Dauerprozess.
- Halte nach etwa 45 bis 50 Minuten an, selbst wenn der aktuelle Release noch nicht fertig ist.
- Sichere dann Status, WIP-Commit und Push, sofern es versionierbare Aenderungen gibt.
- Der naechste stündliche Lauf setzt am Cursor fort.

## Git-Regeln

- Arbeitsbranch: `codex/v1-9-originalset-completion`.
- Ausfuehrung: Worktree-Automation; nicht auf den geschuetzten lokalen Hauptworkspace-`.git`-Pfad verlassen.
- Kein Push nach `main`.
- Kein Force-Push.
- Keine fremden Nutzeränderungen revertieren.
- Keine lokalen Runtime-Daten, Caches, SQLite-Dateien, Secrets oder Build-Artefakte versionieren.
- WIP-Commit-Muster: `WIP V1.9.xx: <kurzer Fortschrittstitel>`.
- Abschlusscommit-Muster: `V1.9.xx: <kurzer Release-Titel>`.

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
