# AI-Source-Structure-Gate-Remediation – Plan 2026-07-19

Status: `active`

## Quelle und Vorgabe

- Nutzerauftrag vom 19.07.2026: den roten allgemeinen
  `check:ai`-Strukturzustand sinnvoll auflösen und den erstellten Plan mit dem
  Skill `paketprozess-worktree-goal` direkt umsetzen.
- Ausgangsplan und führendes Artefakt: dieses Dokument.
- Verbindliches `/Goal`: ASSG-0 bis ASSG-6 sequenziell umsetzen, jedes Paket
  separat prüfen und committen, den Arbeitsbranch lokal nach `main`
  integrieren und Worktree sowie gemergten Branch erst nach verifiziertem
  Abschluss entfernen.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel und Null-Baseline sind messbar;
- die fachliche Reihenfolge ASSG-0 bis ASSG-6 ist festgelegt;
- In-Scope-Dateien, Owner-Grenzen und Nicht-Ziele sind benannt;
- Abnahmekriterien und Paketchecks sind ableitbar;
- Branch-, Worktree-, Merge- und Cleanup-Erwartung sind verbindlich;
- Engine-, Hidden-Info-, Replay- und Verhaltensinvarianten begrenzen die
  automatische Fehlerbehandlung.

## Ziel

Das allgemeine Gate `corepack pnpm check:ai-source-structure` und damit
`corepack pnpm check:ai` werden wieder vollständig grün. Alle aktuellen
Dateigrößenverstöße werden durch fachliche Schnitte beseitigt. Bestehende
Grenzwerte werden dafür nicht angehoben und Verstöße werden nicht auf neue
Großdateien verschoben.

Der Endstand besitzt erneut eine grüne Null-Baseline: Ein späteres
AI-Änderungspaket darf keinen bereits roten Strukturstand mehr als
unabhängige Vorabweichung akzeptieren.

## Annahmen

- Der aktuelle lokale `main` ist die Integrationsquelle; Remote-Pull, Push und
  Pull Request sind nicht Teil dieses Prozesses.
- Die bestehende Testabdeckung ist die Verhaltensreferenz. Strukturarbeit darf
  Produktionsverhalten weder bewusst verbessern noch verschlechtern.
- Neue interne Module sind zulässig, sofern öffentliche Exporte und
  Schichtgrenzen unverändert bleiben.
- Der Hauptworkspace wird nach dem vorbereitenden Prozesscommit bis zum
  finalen lokalen Merge nicht für Implementierungsarbeit verwendet.

## Nicht-Ziele

- Keine neue KI-Heuristik, kein Play-Strength-Tuning und keine
  Match-Remediation.
- Keine Engine-, Server-, Web-, Kartenhint- oder Deckstrategieänderung.
- Keine allgemeine Bereinigung aller großen AI-Dateien außerhalb der neun
  Removal-List-Treffer.
- Kein Massenumzug des flachen Runtime-Roots.
- Keine Remote-Integration und keine sichtbare Produktversionsänderung.

## Verifizierter Ausgangsstand

Der saubere lokale `main`-Stand `52ac68d19` meldet am 19.07.2026 neun
Größenverstöße:

| Klasse            | Pfad                                                                          |   Ist | Grenze | Delta |
| ----------------- | ----------------------------------------------------------------------------- | ----: | -----: | ----: |
| vorher bekannt    | `runtime/corp-scoreline/semantic-runtime-corp-score-scoreline-components.ts`  | 1.022 |    997 |   +25 |
| neu hinzugekommen | `runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection.ts`   | 1.619 |  1.445 |  +174 |
| vorher bekannt    | `runtime/semantic-choice-ranking.ts`                                          |   695 |    543 |  +152 |
| neu hinzugekommen | `runtime/semantic-runtime-corp-board-triage.ts`                               |   810 |    793 |   +17 |
| neu hinzugekommen | `runtime/semantic-runtime-corp-score.ts`                                      |   838 |    828 |   +10 |
| neu hinzugekommen | `runtime/semantic-runtime-corp-score.test.ts`                                 | 3.827 |  3.797 |   +30 |
| vorher bekannt    | `semantic-ai-runtime-cutover.test.ts`                                         | 4.262 |  4.261 |    +1 |
| neu hinzugekommen | `runtime/corp-scoreline/semantic-runtime-corp-board-triage-scoreline.test.ts` | 1.469 |  1.373 |   +96 |
| vorher bekannt    | `runtime/choice-ranking/semantic-choice-ranking-corp.test.ts`                 |   422 |    299 |  +123 |

Die vier zuvor dokumentierten Treffer sind auf dem integrierten Stand
`d5199cdb0` reproduzierbar. Die fünf weiteren Treffer entstanden durch
nachfolgende fachliche Corp-Scoring-, Scoring-Window- und
Board-Triage-Erweiterungen. Das ist Baseline-Drift, nicht nur eine veraltete
Dokumentationszahl.

Neben den Größenmeldungen bleiben der produktive Laufzeit- und Typimportgraph
zyklenfrei. Der Fehlerzustand ist damit ein Struktur- und Gate-Vertragsproblem,
kein belegter Engine-, LegalAction-, Hidden-Info-, Replay- oder
Randomness-Fehler.

## Architekturfindings

### Hoch – Das rote Gate hat seine Ratchet-Wirkung verloren

Mehrere fachlich grüne Pakete akzeptierten den roten Strukturteil als
vorbestehend. Dadurch konnte die Zahl der Treffer von vier auf neun steigen,
ohne dass `check:ai` wieder eine grüne Baseline erreichte. Solange dieser
Zustand besteht, kann das Sammelgate neue Strukturregressionen nicht mehr klar
von Altlasten unterscheiden.

### Mittel – Drei Verantwortlichkeitsgrenzen sind erneut angewachsen

- `semantic-runtime-corp-scoring-window-projection.ts` enthält neben der
  Window-Projektion inzwischen rund 380 Zeilen sichtbare Runner-Credit-,
  Staged-Breaker- und Pfadbewertung.
- `semantic-choice-ranking.ts` enthält erneut Corp-Urgency-, Scoreline- und
  Board-Triage-Policy im zentralen Mapping-Orchestrator, obwohl dafür bereits
  `runtime/choice-ranking/` als Owner existiert.
- `semantic-runtime-corp-score.ts` sammelt Score-, Advance-, Rez-, Install-,
  Economy- und End-Turn-Komponenten in einer einzigen großen Funktion.

### Mittel – Tests folgen den vorhandenen Fachfamilien noch nicht vollständig

Die betroffenen Tests sind nicht nur wegen einzelner Zeilen rot. Insbesondere
der Cutover-Test mit 4.262 Zeilen und der Corp-Score-Test mit 3.827 Zeilen
decken mehrere unabhängige Verträge in je einer Suite ab. Ein rein
formatgetriebener Ein-Zeilen-Fix würde das Gate zwar teilweise beruhigen, aber
den dokumentierten Strukturzweck verfehlen.

## Verbindliche Invarianten

- Keine Änderung an Engine-Regeln, LegalActions oder `applyAction`.
- Keine Änderung an Scoringwerten, Prioritätsreihenfolge, Evidence,
  Plan-Mapping oder Choice-Auswahl.
- Keine Änderung an PlayerViews, PublicEvents, Hidden-Info-Grenzen, Replay,
  StateHash, Seeds oder RandomDrawRecords.
- Öffentliche Exporte von `@netgrid/ai` und `@netgrid/ai/simulation` bleiben
  unverändert.
- Tests werden verschoben oder fachlich geteilt, aber nicht gelöscht,
  abgeschwächt oder durch breitere Erwartungen ersetzt.
- Keine Grenzwerterhöhung als Remediation; nach jedem Schnitt werden die
  Grenzen auf den kleineren Endstand abgesenkt.
- Neue Dateien liegen in den vorhandenen Owner-Verzeichnissen
  `runtime/choice-ranking/` und `runtime/corp-scoreline/`, nicht zusätzlich im
  flachen Runtime-Root.

## Automatische Fehlerbehandlung

- Paketverursachte Typecheck-, Import-, Format- oder Testfehler werden eng im
  aktiven Paket behoben; das nächste Paket beginnt erst nach grünem Done-Gate.
- Bei einem unerwarteten neuen Größenverstoß wird zuerst geprüft, ob Logik nur
  verschoben statt fachlich geschnitten wurde. Der Verstoß wird im aktiven
  Paket beseitigt und nicht allowlisted.
- Bei einem roten Verhaltenstest werden Import-/Fixture-/Reihenfolgefehler
  untersucht. Erwartungen, Scorewerte oder Checkpoints dürfen nicht zur
  Anpassung an verändertes Verhalten umgeschrieben werden.
- Neue kompatible `main`-Änderungen werden beim defensiven Abgleich in beide
  Intentionen integrierend aufgelöst und anschließend erneut getestet.
- Ein Timeout oder abgebrochener Testlauf wird einmal mit enger Diagnose und
  angemessener Testselektion wiederholt; er gilt nie als bestanden.

## Sicherheitsblocker

Der Prozess stoppt mit Blocker-Report und konkreter Removal Condition, wenn:

- ein fachlicher Schnitt nur durch Änderung von LegalActions, Scoringwerten,
  Choice-Reihenfolge oder Hidden-Info-Verträgen möglich erscheint;
- ein Konflikt mit neuem `main` denselben Vertrag widersprüchlich definiert;
- vorhandene rote Verhaltenstests nicht identisch auf der Paketbasis
  reproduzierbar sind und keine verhaltensneutrale Korrektur belegbar ist;
- der Ziel-Worktree oder Zielbranch fremde oder nicht zuordenbare Arbeit
  enthält;
- vor Worktree-Cleanup relevante offene Änderungen vorliegen.

## State Machine

```text
prepared
  -> ASSG-0 active -> ASSG-0 committed
  -> ASSG-1 active -> ASSG-1 committed
  -> ASSG-2 active -> ASSG-2 committed
  -> ASSG-3 active -> ASSG-3 committed
  -> ASSG-4 active -> ASSG-4 committed
  -> ASSG-5 active -> ASSG-5 committed
  -> ASSG-6 active -> ASSG-6 committed
  -> main synchronized
  -> final gates green
  -> merged to main
  -> worktree removed and verified
  -> merged branch deleted and verified
  -> complete
```

Zu jedem Zeitpunkt ist genau ein Paket aktiv. `blocked` ist nur mit
dokumentiertem Sicherheitsblocker und Removal Condition zulässig.

## Paketfolge

### ASSG-0 – Preflight, Null-Baseline-Vertrag und Kollisionsschutz

- Den aktuellen Commit, alle neun Ist-/Grenzwerte, Importzyklen, Runtime-Root
  und öffentlichen Exporte erneut messen.
- Für die Umsetzung wegen der stark veränderten AI-Hotspots einen eigenen
  Branch und Worktree verwenden; `main` erst am Integrationspunkt anfassen.
- Die neun Treffer als feste Removal List führen. Neue Treffer während der
  Umsetzung sind paketverursacht und müssen im verursachenden Paket entfernt
  werden.
- Done-Gate: reproduzierbare Baseline, sauberer Worktree und unveränderte
  fachliche Fokus-Suiten.

### ASSG-1 – Cutover-Tests nach Live-Vertragsfamilien teilen

- `semantic-ai-runtime-cutover.test.ts` in fachlich benannte Suiten für
  Live-Default/Coverage-Fallback, Corp-Cutover und Runner-Plan-/Memory-Cutover
  teilen.
- Gemeinsame Fixture-Erzeugung nur bei tatsächlicher Wiederverwendung in ein
  enges `*.test-support.ts` verschieben.
- Alle vorhandenen Testnamen und Assertions erhalten; der bisherige
  Sammeltest wird entfernt oder bleibt nur als kleine Boundary-Suite.
- Ziel: keine neue Testdatei über 2.500 Zeilen; die Teilgrenzen werden explizit
  geratcheted.
- Done-Gate: identische Cutover-Testmenge grün, ein Größenverstoß entfernt.

### ASSG-2 – Choice-Ranking-Fassade und Corp-Policy erneut trennen

- Corp-Urgency, Scoreline-Safety und Board-Triage-Yield aus
  `semantic-choice-ranking.ts` in die vorhandenen Owner
  `choice-ranking/corp-plan-overrides.ts` und
  `choice-ranking/mapped-choice-policies.ts` überführen; nur bei klarer
  Eigenverantwortung ein weiteres kleines Corp-Policy-Modul anlegen.
- Die Reihenfolge der Mapping-Arbitration sichtbar im Orchestrator erhalten.
  Keine Rückkehr zu einem bloß verschobenen 500-Zeilen-Einzelfunktionsblock.
- `semantic-choice-ranking-corp.test.ts` nach Scoreline-/Rez-Reserve- und
  Board-Triage-Overrides teilen. Gemeinsames Setup bleibt im vorhandenen
  Test-Support.
- Ziel: öffentliche Ranking-Fassade unter 400 Zeilen; keine neue Produktiv-
  oder Testdatei über 600 beziehungsweise 300 Zeilen.
- Done-Gate: Choice-, Plan-Portfolio-, Decision-Chain- und betroffene
  Decision-Checkpoint-Suiten wählen exakt dieselben Actions und Choices.

### ASSG-3 – Sichtbare Runner-Konkurrenz aus der Scoring-Window-Projektion lösen

- Die zusammenhängende Runner-Seite der Projektion – Central-Pressure-Events,
  sichtbare Multiaccess-Signale, Run-Credit-Pools, Staged Breaker, Memory-Fit
  und bekannte ICE-Pfadbewertung – in ein fachliches Modul
  `semantic-runtime-corp-scoring-window-runner-pressure.ts` extrahieren.
- `semantic-runtime-corp-scoring-window-projection.ts` bleibt Owner für
  Window-Horizont, Access-/Rez-Budget, Window-Kind, Exposure und empfohlene
  nächste Schritte.
- Direkte Contracttests für den extrahierten Runner-Pressure-Owner ergänzen
  oder aus der bestehenden Projection-Suite verschieben; keine doppelte
  Testabdeckung erzeugen.
- Ziel: Projection-Orchestrator unter 1.250 Zeilen; neues Runner-Pressure-Modul
  unter 500 Zeilen.
- Done-Gate: Scoring-Window-, Protection-, Staged-Breaker-, Central-Pressure-
  und spielgleiche Match-3bb14-Regressionen unverändert grün.

### ASSG-4 – Corp-Score-Komposition nach Action-Familien schneiden

- Aus `semantic-runtime-corp-score-scoreline-components.ts` die geschlossene
  Active-Remote-Familie – Advance Clock, Reserve Funding, Off-Path-Penalty und
  Existing-Remote-Pipeline – in ein eigenes Scoreline-Owner-Modul auslagern.
- In `semantic-runtime-corp-score.ts` die Komponentensammlung nach den
  Action-Familien Score/Advance, Rez/Install und Economy/Turn-End in kleine,
  intern typisierte Collector-Funktionen trennen. Die öffentliche Funktion
  bleibt ein reihenfolgetreuer Kompositionsorchestrator.
- `semantic-runtime-corp-score.test.ts` mindestens in allgemeine
  Economy-/Trace-Verträge und aktive Scoreline-/Remote-Verträge teilen; die
  schon vorhandenen spezialisierten Corp-Scoreline-Suiten werden nicht
  dupliziert.
- Ziel: Score-Orchestrator unter 500 Zeilen, Scoreline-Components unter 750
  Zeilen und jede betroffene Testsuite unter 2.500 Zeilen.
- Done-Gate: Corp-Score-, Conditional-Economy-, Scoreline-, Install-,
  Rez-Reserve- und Matchpoint-Regressionen liefern dieselben Komponenten,
  Werte und Evidence in derselben Reihenfolge.

### ASSG-5 – Board-Triage-Entscheidung und Action-Alignment trennen

- `semantic-runtime-corp-board-triage.ts` auf die eigentliche
  Triage-Entscheidung begrenzen. Action-Alignment und die daraus entstehende
  Score-Komponente in den vorhandenen Owner
  `semantic-runtime-corp-board-triage-actions.ts` verschieben, sofern der
  Importgraph dabei zyklenfrei bleibt; andernfalls ein enges
  `...-alignment.ts` neben den vorhandenen Contracts verwenden.
- Den Scoreline-Test nach zentraler Schutztriage und Remote-
  Funding/Protection/Clock teilen.
- Ziel: Triage-Orchestrator unter 500 Zeilen; keine neue Ownerdatei über 700
  Zeilen und keine Testsuite über 900 Zeilen.
- Done-Gate: Board-Triage-, Corp-Score-, Choice-Ranking- und Central-Pressure-
  Regressionen bleiben verhaltensidentisch.

### ASSG-6 – Ratchet härten, Full Gate und Current-State-Abschluss

- Alle alten Caps der geänderten Dateien auf die kleineren Endstände senken
  und explizite Caps für neue Ownerdateien und Tests ergänzen.
- Das Gate weiterhin fail-closed für Laufzeit-/Typzyklen, historische Marker,
  Runtime-Root und Dateigrößen halten. Keine Allowlist für die neun heutigen
  Treffer zurücklassen.
- In Prozess- und Reviewvorlagen festhalten: Sobald ASSG abgeschlossen ist,
  ist ein rotes `check:ai-source-structure` kein akzeptierter
  Vorzustand für weitere AI-Integrationen. Ein unabhängiger Fehler muss vor
  Merge behoben oder das Paket darf nicht als vollständig grün bezeichnet
  werden.
- Current-State-Wissen, AI-README, Final Review und Projektlog auf den
  tatsächlich verifizierten Endstand aktualisieren.
- Done-Gate: alle fokussierten und vollständigen Gates grün; aktuelles `main`
  ist defensiv integriert und erzeugt keinen neuen Strukturtreffer.

## Verifikation

Nach jedem Produktionspaket:

```text
corepack pnpm check:ai-source-structure:selftest
corepack pnpm check:ai-source-structure
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:package-boundaries
<paketnahe AI-Suiten>
git diff --check
```

Final:

```text
corepack pnpm check:ai
corepack pnpm check:ai:full
corepack pnpm test:ai:shards
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm check:package-boundaries
corepack pnpm check:ai-source-structure:selftest
git diff --check
```

Tests mit Timeout, abgebrochene Prozesse oder ein verbleibender
Source-Structure-Treffer gelten nicht als bestanden.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-source-structure-gate-remediation`
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_GATE_REMEDIATION`
- Integrationsbranch: lokaler `main`
- Der Hauptworkspace dient nach dem Prozesscommit nur dem finalen Merge.
- Jedes ASSG-Paket erhält nach bestandenem Done-Gate einen eigenen Commit mit
  der im Paket dokumentierten klaren Message.
- Vor Abschluss wird aktuelles `main` defensiv in den Arbeitsbranch
  integriert, falls es weitergelaufen ist; Konflikte werden inhaltlich und
  nicht durch pauschale Seitenwahl gelöst.
- Der Merge nach `main` erfolgt bevorzugt per Fast-Forward. Ein Merge-Commit
  braucht eine dokumentierte technische Begründung.
- Nach erfolgreichem Merge werden Main-Status und Diff-Hygiene geprüft. Erst
  danach darf der exakt aufgelöste Arbeits-Worktree ohne `--force` entfernt
  werden.
- Worktree-Entfernung wird über `git worktree list --porcelain` und das
  Dateisystem doppelt verifiziert. Anschließend wird nur der nachweislich
  gemergte Arbeitsbranch mit `git branch -d` gelöscht.
- Kein `git reset --hard`, kein pauschales Revert fremder Änderungen, kein
  Push und kein Pull Request.

## Controller-Prompt-Kern

```text
/Goal Arbeite die AI-Source-Structure-Gate-Remediation vollständig und
sequenziell von ASSG-0 bis ASSG-6 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_GATE_REMEDIATION auf Branch
codex/ai-source-structure-gate-remediation. Nutze den Hauptworkspace nur für
den finalen Merge. Stelle keine Zwischenfragen, solange die konservative
automatische Fortsetzung dieses Prozesses erlaubt ist. Arbeite immer nur am
aktuellen Paket, führe seine Checks aus, dokumentiere Abweichungen und
committe jedes abgeschlossene Paket separat. Erhöhe keine Dateigrößenlimits
und ändere kein KI-Verhalten. Bei einem Sicherheitsblocker stoppe, schreibe
einen Blocker-Report mit Removal Condition und bewahre alle Änderungen.

Nach ASSG-6 integriere aktuelles main defensiv, führe alle finalen Gates aus,
merge bevorzugt per Fast-Forward nach main und prüfe main. Entferne danach den
sauberen Arbeits-Worktree, verifiziere seine Entfernung in Git und im
Dateisystem, lösche den vollständig gemergten Arbeitsbranch mit branch -d und
markiere das Goal erst dann als complete.
```

## Abschlusskriterien

- `check:ai-source-structure` meldet null Findings.
- `check:ai` und `check:ai:full` sind vollständig grün.
- Kein Grenzwert wurde zur Fehlerbeseitigung angehoben.
- Der produktive Importgraph bleibt ohne Laufzeit- und Typzyklen.
- Die neun Ausgangstreffer sind fachlich geschnitten und nicht nur umbenannt,
  umformatiert oder in ungeratchete Dateien verschoben.
- Alle bestehenden fachlichen Tests und Decision-Checkpoints bleiben erhalten
  und grün.
- Der Abschlussstand ist in Current State und Final Review dokumentiert.
