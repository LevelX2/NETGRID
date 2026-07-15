# KI-Runner-Endgame-Remediation für Match 424A (2026-07-15)

Status: P0 bis P5 abgeschlossen; P6 zur lokalen Integration freigegeben

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_424abdd1c7ac054d` aus der lokalen
SQLite-Runtime:

- Modus: `human_corp_vs_runner_ai`;
- Runner-Deck: `Inside Forgery Loop`;
- Korp-Deck: `Cheap Bag of Tricks`;
- Seed: `match-mrkixbgq-j4so7f`;
- Endstand: Runner 0, Korp 8;
- Trace-Modus: `detailed`;
- 155 persistierte Runner-Entscheidungen.

Der Nutzer hat nach vollständiger zugweiser Analyse zunächst neun Findings und
ihre Umsetzung freigegeben. Während P5 hat er die zuvor übersehene
Nichtnutzung von Fall Guy in einem Tag-Vermeidungsfenster als zehntes Finding
ergänzt. Die Vorgabe ist für einen sequenziellen Worktree-Prozess
präzise. Jeder historische Verhaltensfund muss auf dem unveränderten
Ausgangscode als spielgleicher `behavior_regression`-Checkpoint rot sein,
bevor Produktionscode für ihn geändert wird. Textlich falsche Hints werden
zusätzlich über explizite, kartentextnahe Hint-Verträge abgesichert.

## Gesamtziel und `/Goal`

`/Goal`: Die zehn freigegebenen Findings aus
`match_424abdd1c7ac054d` sequenziell im eigenen Worktree zuerst als
spielgleiche rote Decision-Checkpoints oder textgenaue rote Hint-Verträge
sichern, nur weiterhin rote Verhaltensfehler generisch in Hints, Ontologie-
Consumern, Plan-Mapping, RunTargetEvaluation und Runner-Endgame-Planung
beheben, die unveränderten Zielverträge und Gegenproben grün verifizieren,
dokumentieren, lokal nach `main` integrieren und Worktree sowie Arbeitsbranch
verifiziert entfernen.

- Arbeitsbranch: `codex/ai-match-424a-runner-endgame`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_424A_RUNNER_ENDGAME`
- Ausgangs-`main`: `483f4a410798a521bc130659c1c2b6a43bdf7f78`
- Hauptworkspace: nur für den finalen lokalen Merge
- Push oder Pull Request: nicht Teil dieses Prozesses

## Freigegebener Scope

1. Einen blockierten Matchpoint-Remote als kurze Folge aus Pfadöffnung,
   Funding und Run planen, statt auf gewöhnliches Setup zurückzufallen.
2. `expose_info`- und `ice_trash`-Aktionen anhand des sichtbaren Remote-
   Kontexts, der Score-Gefahr und konkreter ICE-Ziele bewerten.
3. Broker-Laden und -Auszahlen semantisch unterscheiden und eine terminal
   nützliche Auszahlung nicht durch den normalen Bankzyklus sperren.
4. Run-Events mit ihrem konkreten Zielserver durch dieselbe RunTargetEvaluation
   wie normale Runs bewerten.
5. Die falsche Force-Shield-Planrolle `recover_economy` entfernen.
6. Handgrößen-Chips trotz ihres Namens nicht als MU-Unterstützung behandeln.
7. Negative oder redundante Plan-Mappings ohne akuten passenden Bedarf nicht
   gegen klar bessere Aktionen erzwingen.
8. Einen mit Krash grundsätzlich gedeckten, aber insgesamt unbezahlbaren
   Mehr-ICE-Pfad als `blocked_unpayable` statt als fehlende Wall-Coverage
   diagnostizieren.
9. Core Command und Broker textgenau als HQ-gebundenen ICE-Trash
   beziehungsweise Hosted-Credit-Bank beschreiben.
10. Eine sichtbare, legal bezahlbare Tag-Vermeidung wie Fall Guy in einem
    unmittelbar drohenden Tag-Fenster gegen `pass` bewerten.

## Annahmen und Nicht-Ziele

- Die fachlichen Erwartungen verwenden nur damalige Runner-PlayerViews,
  LegalActions, öffentliche Event-Präfixe und erlaubte Runtime-Metadaten.
- Eine bessere Schlusssequenz soll die beste vorhandene Gewinnchance nutzen;
  sie behauptet keinen erzwungenen Runner-Sieg.
- Ein direkter unbezahlbarer oder sichtbar schädlicher Run wird nicht
  künstlich freigegeben.
- Normale Broker-Zyklen, sinnvolle erste Schutzinstallationen, bezahlbare
  Run-Events und Handgrößenunterstützung bleiben zulässig.
- Es gibt keine Match-ID-, Seed-, Deck- oder Karteninstanz-Sonderregel in der
  Produktionslogik.
- Es gibt keinen neuen Controller, keine Action-Erzeugung außerhalb der
  Engine und keine Änderung an Kartentext, Engine-Legalität, Replay oder
  Hidden-Info-Grenzen.
- Zusätzliche Selfplays und Behavior-Baselines sind nicht Teil des Scopes;
  die Evidence stammt aus spielgleichen Checkpoints und fokussierten Gates.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Die KI erhält nur side-sichere PlayerViews, öffentliche Event-Präfixe und
  ausdrücklich erlaubte Metadaten.
- Jeder Verhaltensfix beginnt mit einem spielgleichen roten Checkpoint auf dem
  unveränderten Ausgangscode.
- Nur `behavior_regression` gilt als bestätigte historische
  Verhaltensregression.
- Bereits grüne historische Funde werden dokumentiert, aber nicht künstlich
  durch Produktionsänderungen verfolgt.
- Strukturierte Hint-Effekte und Kartenfelder schlagen Titelheuristiken.
- Terminale Planung bleibt klick-, kredit-, ziel- und pfadgebunden.
- Checkpoint-Erwartungen werden nach dem Red-Nachweis nicht abgeschwächt.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration,
  Warmup-Drift oder Redaction-Fehler werden vor Bewertungsänderungen als
  Infrastrukturproblem behandelt.
- Fehlt für eine bessere Sequenz eine notwendige LegalAction, wird nicht im
  KI-Code darum herum gearbeitet.
- Erfordert eine Lösung verdeckte Korp-Informationen, ist das Paket blockiert.
- Rote Tests werden nicht über weichere Expectations, Zufallstoleranz oder
  kartenspezifische Sonderwerte grün gemacht.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder Hint-Gate-Fehler
  blockieren den Abschluss.

## State Machine

`preflight -> process_committed -> evidence_committed -> red_contracts -> semantics_fixed -> endgame_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Prozessbasis und isolierter Worktree

- Ziel: Scope, `/Goal`, Invarianten, Branch und Worktree versionieren.
- Checks: `git diff --check`, sauberer Paketcommit.
- Done-Gate: Prozessartefakt ist committed und basiert auf dem dokumentierten
  Ausgangsstand.
- Commit: `docs(ai): plan match 424a runner remediation`

### P1 – Side-sichere Match-Evidence und Fehlergruppen

- Ziel: Match-Metadaten, die vollständige Entscheidungstimeline, die zehn
  Findings und die damaligen sichtbaren besseren Alternativen dauerhaft
  dokumentieren.
- Kernartefakt:
  `docs/reviews/ai/ai-match-424a-runner-endgame-evidence-2026-07-15.md`.
- Checks: keine Rohkopien von `game_state_json` oder `trace_json`,
  `git diff --check`, sauberer Paketcommit.
- Done-Gate: Alle Checkpoint-Ziele und Kontrollen sind mit Decision und
  StateVersion benannt.
- Commit: `docs(ai): record match 424a runner evidence`

### P2 – Rote Decision-Checkpoints und Hint-Verträge

- Ziel: Vor Produktionsänderungen die historischen Verhaltensfehler und
  textlichen Hint-Abweichungen reproduzieren.
- Primäre Zielzustände:
  - Decision 111 / StateVersion 202: negatives zweites Force Shield vor
    benötigtem Krash;
  - Decision 134 / StateVersion 245: Inside Job auf bekannt wertlose Archives;
  - Decision 143 / StateVersion 265: zweites MRAM als falscher MU-Support;
  - Decision 146 / StateVersion 273: Remote-Informations- und Bankkontext;
  - Decision 151 / StateVersion 283: Matchpoint-Remote ohne Pfadöffnungs- und
    Fundingsequenz;
  - Decision 154 / StateVersion 286: Krash-Pfad als fehlende Coverage statt
    unbezahlbarer Gesamtpfad.
  - Decision 69 / StateVersion 122: Fall Guy ist legal, aber die KI lässt den
    unmittelbar drohenden Hunter-Tag mit `pass` zu.
- Hint-Verträge: Force Shield, Militech MRAM, Core Command, Broker, Inside Job,
  SeeYa und Forged Activation Orders.
- Gegenproben: erstes nützliches Force Shield, echter MU-Chip, wertvoller
  Inside-Job-Bypass, normaler Broker-Aufbau, bereits erreichbarer
  Matchpoint-Run und bezahlbarer Krash-Pfad.
- Done-Gate: Historische Zielverträge sind ausschließlich als
  `behavior_regression` rot oder als begründeter Nicht-Fix klassifiziert;
  Gegenproben sind grün; Red-Evidence ist separat committed.
- Commit: `test(ai): capture match 424a runner regressions`

### P3 – Hint- und Consumer-Semantik korrigieren

- Ziel: Falsche oder veraltete Hints und ihre generischen Consumer korrigieren.
- Arbeit: Force-Shield-Planrolle, MRAM-/MU-Erkennung, Core-Command-Bedingung,
  Broker-Bankeffekte, Run-Event-Zielprojektion sowie kontextgebundener
  SeeYa-/Forged-Nutzen.
- Done-Gate: Unveränderte reproduzierte Zielverträge und Gegenproben des
  Pakets sind grün; Hint-/Ontology-Gates melden keinen neuen Fehler.
- Commit: `fix(ai): align runner card semantics with visible context`

### P4 – Plan-Arbitration und Endgame-Sequenz härten

- Ziel: Akuten Matchpoint-Druck in eine kurze viable Sequenz konvertieren und
  redundantes Setup sowie falsche Bank-/Coverage-Pläne unterbrechen.
- Arbeit: terminaler Remote-Interrupt, Pfadöffnungs- und Funding-Schritte,
  Broker-Cashout, planbezogene Marginalnutzenprüfung und korrekte
  Mehr-ICE-Pfaddiagnose.
- Done-Gate: Historische Endgame- und Planverträge sind unverändert grün;
  normale Setup-, Bank-, Coverage- und Run-Kontrollen bleiben grün.
- Commit: `fix(ai): convert blocked runner matchpoint contests`

### P4b – Tag-Vermeidungs-Choice nachziehen

- Ziel: Das während P5 ergänzte Finding F10 nach demselben Red-vor-Fix-Vertrag
  abarbeiten.
- Red-Gate: Der spielgleiche D69-Checkpoint scheitert ausschließlich als
  `behavior_regression`; die bisherigen acht Tests des Matchpakets bleiben
  grün.
- Arbeit: generische Choice-Bewertung für sichtbare
  Event-Modification-Optionen; keine Karten-ID- oder Match-Sonderregel.
- Gegenproben: `pass` ohne konkrete Gefahr/Quelle und andere Choice-Arten
  bleiben unverändert.
- Red-Commit: `test(ai): capture match 424a Fall Guy regression`
- Fix-Commit: `fix(ai): use visible tag avoidance choices`

### P5 – Verifikation, Final Review und Wissenspflege

- Ziel: fokussierte und angrenzende Regressionen, AI-Typecheck, relevante
  Hint-Gates und dauerhafte Dokumentation abschließen.
- Pflichtchecks: neue Checkpoints und Verträge, angrenzende Runtime-/Plan-/
  RunTarget-Tests, `corepack pnpm --filter @netgrid/ai typecheck`,
  `corepack pnpm check:ai`, `git diff --check` und realistisch die vollständige
  `@netgrid/ai`-Suite.
- Artefakte: Final Review unter `docs/reviews/ai/`, AI-README und aktueller
  Monatslog für den dauerhaften Vertrag.
- Done-Gate: Checks, Grenzen und Nicht-Fixes sind dokumentiert; Worktree ist
  sauber.
- Commit: `docs(ai): close match 424a runner remediation`

Abschlussnachweis: 333/333 Testdateien und 2253/2253 Tests der vollständigen
`@netgrid/ai`-Suite, AI-Typecheck, `check:ai` und Diff-Hygiene sind grün. Das
Final Review liegt unter
`docs/reviews/ai/ai-match-424a-runner-endgame-remediation-final-2026-07-15.md`.

### P6 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, final verifizieren, bevorzugt
  Fast-Forward mergen und Worktree sowie Branch entfernen.
- Done-Gate: lokales `main` enthält alle Paketcommits; Status und Diff-Hygiene
  sind geprüft; Worktree-Pfad und Arbeitsbranch existieren nicht mehr.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_424A_RUNNER_ENDGAME` auf Branch
`codex/ai-match-424a-runner-endgame`. Arbeite immer nur am aktuellen Paket,
stelle historische Verhaltensverträge vor dem jeweiligen Fix fachlich rot,
ändere ihre Expectations danach nicht und committe jedes abgeschlossene Paket
separat. Nutze den Hauptworkspace erst für den finalen Merge. Führe keine
Selfplays, Behavior-Baselines oder zusätzlichen Simulationsspiele aus.

## Abschlusskriterien

- Jeder reproduzierbare historische Fehler besitzt einen dauerhaften
  spielgleichen Checkpoint; textliche Hint-Fehler besitzen einen expliziten
  Vertrag.
- Zieltests waren vor dem Fix fachlich rot und sind danach unverändert grün.
- Gegenproben verhindern pauschale Matchpoint-, Event-, Bank-, Installations-
  oder Coverage-Regeln.
- Keine Hidden-Info-, LegalAction-, Engine-, Replay- oder
  Determinismusgrenze wird abgeschwächt.
- Pflichtchecks und bewusst nicht ausgeführte Checks sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
