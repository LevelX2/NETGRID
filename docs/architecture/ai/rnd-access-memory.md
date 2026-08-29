# R&D-Zugriffsgedächtnis

Status: Umsetzung im Arbeitsbranch `codex/rnd-multiaccess-memory`  
Stand: 2026-08-29

## Quelle und Zielprüfung

Auslöser ist `match_09873465d9adde7d`: Der Runner kannte nach einem
Fünffachzugriff, zwei gestohlenen Agendas und der folgenden Corp-Pflichtkarte
die nächsten beiden R&D-Karten weiterhin. Das bestehende Belief-State-Modell
reduzierte die Beobachtung jedoch auf eine einzelne Karte, invalidierte dieses
Restwissen beim Corp-Draw und ließ `runner.pressure_central` deshalb einen
wertlosen Wiederholungsrun als vollständig neu bewerten.

Der Endzustand ist hinreichend bestimmt. Die Engine liefert für jeden
R&D-Zugriff eine side-sichere Definition, `accessIndex` und den unveränderten
Snapshot der Breach-Queue. Der Runner darf genau das erinnern, was er selbst
gesehen hat. Unbekannte Karten, Instanz-IDs und verdeckte künftige
R&D-Reihenfolgen bleiben außerhalb des Modells.

## Gesamtziel

Das Runner-Belief-State führt eine geordnete, side-sichere Sequenz der durch
einen R&D-Multiaccess tatsächlich gesehenen Karten. Entfernte Karten werden
an ihrer beobachteten Zugriffsposition aus dieser Sequenz entfernt. Ein
folgender Corp-Draw schiebt die Sequenz um genau eine Karte weiter. Der
bestehende Owner `runner.pressure_central` konsumiert dieses Wissen über
`evaluateKnownCentralAccessPayoff`; der TurnPlanner, Choice-Resolver und die
Engine erhalten keine zweite Entscheidungsautorität.

## Annahmen

- Die von der Engine beim Runstart erzeugte Breach-Queue ist für diesen Run
  positionsstabil; `accessIndex` bezeichnet den Eintrag dieses Snapshots.
- R&D-Root-Upgrades können vor den R&D-Karten in derselben Queue liegen. Das
  Gedächtnis zählt deshalb nur tatsächliche R&D-Kartenzugriffe in
  Beobachtungsreihenfolge und verwendet `accessIndex` zur Batch-Abgrenzung,
  nicht als direkten Index in R&D.
- Eine Steal-/Trash-/Remove-Auflösung gehört zur unmittelbar zuvor
  zugegriffenen R&D-Karte. Fehlt diese eindeutige Bindung, wird kein anderer
  Sequenzeintrag geraten oder entfernt.
- Definitionen dürfen mehrfach vorkommen. Entfernt wird daher der gebundene
  Beobachtungseintrag, niemals eine über den Kartennamen gesuchte Kopie.

## Nicht-Ziele

- keine Änderung an Run-, Breach-, Access- oder Kartenregeln;
- keine Speicherung gegnerischer Instanz-IDs oder nicht beobachteter
  R&D-Positionen;
- keine neue Run-Auswahl, kein Score-Override und kein zusätzlicher Plan;
- keine Rückwärtskompatibilität für alte Traces oder lokale Laufzeitdaten;
- kein breiter AI-Shard-, Workspace-, Build- oder E2E-Lauf in diesem Prozess.

## Controller-Invarianten

1. `BeliefState` ist alleiniger Produzent des beobachteten R&D-Wissens.
2. `runner.pressure_central` bleibt alleiniger Owner der Central-Runwahl.
3. `evaluateKnownCentralAccessPayoff` bewertet nur die produzierte Sequenz und
   erzeugt keine eigene Erinnerung.
4. `runner.convert_run_window` löst weiterhin nur die bereits gebundene
   Access-Fortsetzung auf.
5. Jede ausgeführte Action bleibt eine aktuelle `LegalAction` derselben
   StateVersion; Planinstanz, Step, Route und Executor werden nicht verändert.
6. Gleiches side-sicheres Eventpräfix erzeugt dieselbe Sequenz, Evidence und
   Entscheidung.
7. Eine widersprüchliche oder unvollständige Beobachtungsfolge verwirft nur
   den nicht mehr belegten Suffix. Sie wird nie mit geratenen Karten ergänzt.

## Zustandsmodell

```text
invalidated
  -> erster beobachteter R&D-Zugriff
observing_access_batch
  -> weitere Zugriffe: geordnet anhängen
  -> Steal/Trash/Remove: exakt gebundenen Eintrag als entfernt markieren
  -> Batchende: nicht entfernte Einträge als bekannte R&D-Sequenz führen
stale_known_same_top
  -> Corp-Draw: erstes Element nach HQ fortschreiben, Restsequenz behalten
  -> erneuter Zugriff: bekannten Prefix bestätigen und vertiefen
  -> Shuffle/Reorder/Swap: invalidated
fresh_after_top_removed
  -> nächster beobachteter Zugriff: neue Sequenz beginnen
```

Die öffentliche `RndTopFreshnessMemory` bleibt der Consumer-Vertrag. Der
laufende Access-Batch ist ausschließlich ein deterministischer lokaler
Rekonstruktionszustand während der Auswertung des side-sicheren Eventpräfixes.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Fehlt einer R&D-Access-Beobachtung die Kartendefinition, wird der davon
  abhängige unbekannte Suffix nicht weitergeführt.
- Springt oder widerspricht die beobachtete Reihenfolge dem bekannten Prefix,
  bleibt nur der neu belegte Prefix erhalten.
- Eine Removal-Auflösung ohne gebundenen letzten R&D-Zugriff entfernt keine
  Karte aus dem Gedächtnis.
- Eine explizite R&D-Shuffle-, Reorder- oder Swap-Mutation invalidiert die
  gesamte Positionsfolge.
- Ein Hidden-Info-Leak, eine zweite Runautorität oder eine notwendige Änderung
  am Engine-Regelvertrag ist ein Sicherheitsblocker. Der Prozess stoppt dann
  mit konkreter Removal Condition statt eines Fallbacks.

## Paketfolge

### P1 – Vertrag und Prozessartefakt

- Ziel: Owner, Zustandsmodell, Sicherheitsgrenzen und Paketprozess festlegen.
- Kernartefakt: dieses Dokument.
- Check: Architektur-Preflight, `git diff --check`.
- Done-Gate: alle Pflichtfragen des Änderungskompasses sind beantwortet.
- Commit: `docs(ai): define ordered R&D access memory contract`.

### P2 – Belief-State-Produzent

- Ziel: geordnete Multiaccess-Batches, gebundene Entfernungen, Prefix-Abgleich
  und Corp-Draw-Fortschreibung implementieren.
- Kernartefakte: `packages/ai/src/belief-state.ts` und der direkte Test.
- Checks: fokussierte `belief-state.test.ts`, `git diff --check`.
- Done-Gate: Fünffachzugriff mit zwei gestohlenen Agendas und Corp-Draw lässt
  exakt die beiden beobachteten Restkarten in R&D; Shuffle und widersprüchlicher
  Prefix bleiben fail-closed.
- Commit: `fix(ai): retain ordered R&D multiaccess memory`.

### P3 – Pressure-Consumer und Ownership

- Ziel: die reale Restsequenz als bekannten Low-Payoff an
  `runner.pressure_central` liefern und den wertlosen Wiederholungsrun
  unterdrücken.
- Kernartefakte: zentrale Payoff-/Run-Target- beziehungsweise
  Plan-first-Regressionstests; produktiver Consumer nur bei belegter Lücke.
- Checks: ausschließlich die direkt betroffenen Testdateien,
  `git diff --check`.
- Done-Gate: Ergebnis, `runner.pressure_central`-Owner, Step/Route und
  unveränderte LegalAction-Autorität sind belegt.
- Commit: `test(ai): cover known R&D multiaccess repeat-run decision`.

### P4 – Current-State-Abschluss

- Ziel: aktuellen Architekturstand verlinken, Prozessstatus abschließen und
  alle direkt änderungsnahen Checks gesammelt bestätigen.
- Kernartefakte: `docs/architecture/ai/README.md`, dieses Dokument.
- Checks: fokussierte Regressionen und `git diff --check`; Typecheck nur bei
  geänderter Typoberfläche.
- Done-Gate: Dokumentation beschreibt den implementierten Stand, Arbeitsbranch
  ist sauber und alle Paketcommits liegen vor.
- Commit: `docs(ai): record implemented R&D memory contract`.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_RND_MULTIACCESS_MEMORY` auf
  `codex/rnd-multiaccess-memory`.
- Genau ein Paket ist aktiv; jedes Paket erhält einen eigenen Commit.
- Der Hauptcheckout wird erst für den finalen lokalen Fast-Forward-Merge nach
  `main` verwendet.
- Vor der Integration wird aktuelles `main` defensiv in den Arbeitsbranch
  eingebunden. Konflikte erhalten beide kompatiblen Intentionen.
- Nach erfolgreichem Merge werden Worktree und vollständig gemergter Branch
  entfernt und in Git sowie im Dateisystem verifiziert.
- Es erfolgt weder Push noch Pull Request.

## Controller-Prompt-Kern

```text
/Goal Arbeite R&D-Zugriffsgedächtnis vollständig und sequenziell von P1 bis
P4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, packages/ai/AGENTS.md, den KI-Änderungskompass und
dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_RND_MULTIACCESS_MEMORY auf Branch
codex/rnd-multiaccess-memory. Arbeite immer nur am aktuellen Paket, führe nur
änderungsnahe Checks aus und committe jedes abgeschlossene Paket. Erzeuge
keine zweite Entscheidungsautorität und verwende nur side-sichere Events und
LegalActions. Bei einem Sicherheitsblocker stoppe mit Removal Condition.
Integriere nach P4 aktuelles main, merge lokal nach main, prüfe main und
entferne Worktree und Branch verifiziert. Markiere das Goal erst danach als
complete.
```

## Abschlusskriterien

- Multiaccess-Beobachtungen werden geordnet und duplikatsicher geführt.
- Steal, Trash, Remove, Corp-Draw und R&D-Reorder besitzen belegte Übergänge.
- Bekannte wertlose Restsequenzen werden nicht als vollständig neu bewertet.
- `runner.pressure_central` bleibt Owner; kein Resolver und kein Sensor wählt
  eine Action.
- Fokussierte Tests, `git diff --check`, lokaler Main-Merge und verifizierter
  Worktree-/Branch-Cleanup sind erfolgreich.
