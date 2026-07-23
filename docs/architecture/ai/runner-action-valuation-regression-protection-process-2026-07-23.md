# Runner-Aktionsbewertung: Regressionsschutz aus Match fd22cad3

Status: P3 abgeschlossen, lokale Integration ausstehend

## Quelle und Vorgabe

Ausgangspunkt ist die vollständige Entscheidungsanalyse des aktiven Matches
`match_fd22cad3cc454a9e`. Der Runner installierte dort einen zweiten
`Psychic Friend` ohne neuen Grenznutzen und beendete später drei aufeinander
folgende Züge als erste Aktion mit vier verbleibenden Klicks.

Freigegeben ist ausschließlich ein Test- und Diagnosepaket:

- exakte historische Decision-Checkpoints;
- positive und negative Gegenproben;
- deckweiter Kartenhint- und Consumer-Audit;
- diagnostische Metriken für frühes Runner-Zugende und redundante
  Installationen;
- keine Änderung des produktiven KI-Verhaltens.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Abarbeitung ausreichend
präzise. Historisches Match, Decision-Indizes, betroffene Runtime-Consumer,
positive Kontrollen und bestehende Verifikationswege sind bestimmt.

Konservative Annahme: Historische Checkpoints dürfen einen aktuell roten
`behavior_regression`-Nachweis führen. Infrastrukturdrift, ungültige Fixtures
oder Redaktionsverletzungen sind dagegen Blocker und dürfen nicht als
Verhaltensfehler umgedeutet werden.

## Gesamtziel

Der aktuelle Fehlzustand wird reproduzierbar und redaktionssicher eingefroren,
ohne die produktive Auswahl zu verändern. Die Tests unterscheiden dabei
zwischen:

1. fehlerhaftem frühem Runner-Zugende mit Restklicks;
2. dem zulässigen Zugende mit null Klicks;
3. dem zulässigen sofortigen Zugende für einen deterministischen
   Corp-Deckout-Sieg;
4. einer sinnvollen ersten Breaker-Installation;
5. einer redundanten späteren Breaker-Installation ohne Capability-Delta.

Die Diagnosemetriken machen diese Fälle in Selfplay- und Baseline-Artefakten
sichtbar, ohne selbst Regel- oder Auswahlentscheidungen zu treffen.

## Nicht-Ziele

- keine Änderung von Scorewerten, Tiebreakern oder Plan-Override-Schwellen;
- kein neuer Laufzeitausschluss für `end_turn` oder Installationen;
- keine Änderung von Kartenhints, Decks, Kartenimplementierungen oder Engine;
- keine Änderung der Run-Lock-Bewertung;
- keine Migration historischer Laufzeitdaten;
- kein Push und keine Remote-Integration.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Checkpoints verwenden ausschließlich reproduzierte `PlayerView`,
  `LegalActions`, redigierte Eventdaten und produktive KI-Einstiege.
- Hidden Zones und private Gegnerinformationen erscheinen weder in Fixtures
  noch in Diagnoseevidence.
- Exakte historische Erwartungen werden nicht durch `rebase` passend gemacht.
- Ein roter Checkpoint ist nur bei `behavior_regression` fachliche Evidence.
- Positive Gegenproben müssen vor einer späteren Laufzeitkorrektur grün sein.
- Diagnosemetriken dürfen Auswahl, Score, LegalActions, Replay oder StateHash
  nicht verändern.

## Automatische Fehlerbehandlung

- Bei `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, `fixture_redaction_violation` oder
  `fixture_invalid` wird das aktive Paket angehalten und die Ursache eng
  diagnostiziert.
- Bei erwarteter `behavior_regression` wird der rote Nachweis dokumentiert und
  das Paket darf fortgesetzt werden.
- Unerwartet grüne Negativ-Checkpoints werden gegen Decision-Index,
  Erwartungsvertrag und produktiven Entrypoint geprüft; Erwartungen werden
  nicht künstlich verengt.
- Bestehende fremde Änderungen werden nicht verändert oder zurückgesetzt.

## Sicherheitsblocker

Der Prozess stoppt, wenn:

- der exakte historische Zustand nicht redaktionssicher reproduzierbar ist;
- das Fixture Hidden Information enthält;
- der produktive Runtime-Einstieg umgangen werden müsste;
- eine Diagnosemetrik produktive Entscheidungsdaten verändert;
- der Arbeitsbranch nicht sicher nach `main` integrierbar ist;
- der Worktree beim Abschluss offene relevante Änderungen enthält.

Removal Condition ist jeweils ein reproduzierbarer, dokumentierter und mit den
Projektverträgen vereinbarer Zustand.

## State Machine

`prepared -> checkpoint_evidence -> diagnostics -> final_verification -> merged -> cleaned`

Zu jedem Zeitpunkt ist genau ein Paket aktiv. Ein Übergang erfolgt erst nach
erfülltem Done-Gate und Paketcommit.

## Paketfolge

### P0 – Prozessvertrag und Ausgangslage

Ziel: Prozess, Umfang, Invarianten und vorhandene Evidence verbindlich
festhalten.

Kernartefakte:

- dieses Prozessdokument;
- dokumentierter Worktree- und Branch-Stand.

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate: Prozessartefakt vollständig, Worktree sauber bis auf das
Prozessartefakt, eigener Paketcommit vorhanden.

Commit-Vorschlag:

`docs(ai): define runner action valuation regression process`

### P1 – Historische Decision-Checkpoints und Gegenproben

Ziel: Die relevanten Entscheidungen aus `match_fd22cad3cc454a9e` exakt
reproduzieren.

Arbeit:

- Checkpoint für die redundante zweite `Psychic Friend`-Installation;
- Checkpoints für die drei frühen `end_turn`-Entscheidungen;
- positive Kontrollen für die erste sinnvolle `Psychic Friend`-Installation,
  die erste sinnvolle `Matador`-Installation und reguläres Zugende mit null
  Klicks;
- eigenständige Gegenprobe für den bereits implementierten sicheren
  Corp-Deckout-Sieg;
- enger Test-Runner mit klarer Klassifikation von erwartetem
  `behavior_regression` gegenüber Infrastrukturfehlern;
- deckweiter Kartenhint- und Consumer-Audit für den im Checkpoint enthaltenen
  Runner-Decksnapshot.

Checks:

- Fixture-Schema und Redaktionsprüfung;
- direkter Vitest-Lauf der neuen Checkpoint-Datei;
- angrenzende vorhandene Decision-Checkpoints;
- deckweiter Hint-Consumer-Audit.

Done-Gate: Alle Fixtures sind reproduzierbar; Negativfälle liefern
ausschließlich die erwartete Verhaltensregression; positive Kontrollen und
Infrastrukturverträge sind grün.

Commit-Vorschlag:

`test(ai): capture runner action valuation regressions`

### P2 – Diagnostische Metriken

Ziel: Dieselben Fehlerklassen in künftigen Selfplays und Baseline-Läufen
sichtbar machen.

Arbeit:

- Runner-Zugende mit Restklicks erkennen;
- nachgewiesenen deterministischen Corp-Deckout-Sieg davon ausnehmen;
- redundante Installationen über vorhandene strukturierte
  `persistentInstallEvaluation`-Evidence zählen;
- Metriken in kompakte Baseline- und Review-Ausgaben integrieren;
- reine Diagnosewirkung durch Unit- und Integrationsgegenproben sichern.

Checks:

- fokussierte Metric- und Formattertests;
- Selfplay-Trace-Mining-Tests;
- unveränderte Auswahl-/Replay-Verträge.

Done-Gate: Neue Metriken sind deterministisch, redaktionssicher und
diagnostisch-only; frühes Zugende und redundante Installation werden erkannt,
zulässige Gegenbeispiele nicht.

Commit-Vorschlag:

`feat(ai-diagnostics): track premature runner yield and redundant installs`

### P3 – Breite Verifikation und Wissenspflege

Ziel: Den Test-/Diagnosestand deckübergreifend absichern und dauerhaft
dokumentieren.

Arbeit:

- fokussierte sowie breite AI-Verifikation;
- aktueller Behavior-Baseline-Lauf oder eng begründeter gleichwertiger
  reproduzierbarer Lauf;
- Reviewbericht mit roten Verhaltensnachweisen, grünen Gegenproben und
  Nicht-Zielen;
- führenden Projektstatus und Betriebslog nach Logregel aktualisieren.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm test:ai:shards`
- `corepack pnpm check:ai`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `git diff --check`

Done-Gate: Technische Gates grün, erwartete rote Verhaltenscheckpoints klar
klassifiziert, Review und Wissensbasis aktuell.

Ergebnis: erfüllt. Der vollständige Behavior-Baseline-Lauf ist wegen eines
deterministisch reproduzierbaren 480-Aktionen-Spiels nicht als insgesamt
akzeptiert markiert. Der betroffene Slot enthält keinen Treffer der beiden
neuen Diagnoseklassen; alle Illegal-Action-, Replay-, Runtime-, Hidden-Info-,
Redaktions- und technischen Gates sind grün. Der unabhängige Bestandsbefund
ist im Abschlussreview als eigener Follow-up festgehalten und wird nicht
durch eine sachfremde Laufzeitänderung in diesem Diagnosepaket kaschiert.

Commit-Vorschlag:

`docs(ai): record runner action valuation regression evidence`

## Verifikationsregeln

- Jeder Paketcheck läuft im Arbeits-Worktree.
- Runtime-SQLite wird ausschließlich read-only aus
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite` gelesen.
- Checkpoint-Capture verwendet zunächst `--warmup-policy strict`.
- Vorher-/Nachher-Vergleiche verwenden identische Seeds, Deckslots,
  Aktionslimits und Deck-Fingerprints.
- Diagnosemetriken sind keine zweite Regelautorität und kein Ersatz für exakte
  Checkpoints.
- Nach jedem Paket: Checks dokumentieren, `git diff --check`, nur
  paketzugehörige Änderungen stagen und committen.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree:
  `C:\Projekte\NETGRID_RUNNER_ACTION_VALUATION_REGRESSION_TESTS`
- Arbeitsbranch:
  `codex/runner-action-valuation-regression-tests`
- Hauptworkspace:
  `C:\Projekte\NETGRID`
- Integrationsbranch:
  `main`

Der Hauptworkspace wird bis zum finalen lokalen Merge nicht verändert. Vor dem
Merge wird ein weitergelaufenes `main` in den Arbeitsbranch integriert und die
finale Verifikation wiederholt. Anschließend wird bevorzugt per Fast-Forward
nach `main` gemergt. Nach erfolgreicher Main-Prüfung werden Worktree und
gemergter Arbeitsbranch entfernt und sowohl in Git als auch im Dateisystem
verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Runner-Aktionsbewertung:
Regressionsschutz aus Match fd22cad3“ vollständig und sequenziell von P0 bis
P3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden Wiki-Einstiege,
agents/card-enablement-ai-knowledge-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_RUNNER_ACTION_VALUATION_REGRESSION_TESTS auf Branch
codex/runner-action-valuation-regression-tests. Nutze den Hauptworkspace nur
für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess eine
konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen
Paket. Führe Paketchecks aus und committe jedes abgeschlossene Paket. Ändere
kein produktives KI-Verhalten. Bei Sicherheitsblocker stoppe, dokumentiere
Blocker und Removal Condition. Nach P3 final verifizieren, aktuelles main
integrieren, lokal nach main mergen, main prüfen, den sauberen Arbeits-Worktree
entfernen, seine Entfernung in Git und Dateisystem verifizieren, den gemergten
Arbeitsbranch löschen und das Goal erst danach als complete markieren.
```

## Abschlusskriterien

- P0 bis P3 sind in Reihenfolge abgeschlossen und jeweils committed.
- Produktives KI-Verhalten ist unverändert.
- Historische Negativ- und Positivfälle sind reproduzierbar getrennt.
- Diagnosemetriken sind redaktionssicher und deterministisch.
- Breite technische Gates sind grün.
- Review und Wissensbasis dokumentieren Befund und Nicht-Ziele.
- Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree und gemergter Branch sind nachweislich entfernt.
