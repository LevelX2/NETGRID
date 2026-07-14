# KI-Decision-Remediation für Match DFE6 (2026-07-15)

Status: Verifiziert; P0 bis P5 abgeschlossen, P6 ausstehend

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_dfe6223d817c646d` aus der lokalen
SQLite-Runtime:

- Modus: `human_corp_vs_runner_ai`;
- Runner-Deck: `Inside Forgery Loop`;
- Korp-Deck: `Rent to Own War Engine`;
- Seed: `match-mrjore7w-158k9zy:series-game-2`;
- Endstand: Runner 8, Korp 5;
- Trace-Modus: `detailed`;
- 102 persistierte Runner-Entscheidungen.

Die Vorgabe ist für direkte Umsetzung präzise. Freigegeben sind drei eng
abgrenzbare Findings:

1. verdeckte Archives-Karten werden allein wegen Runner-Matchpunktdrucks trotz
   sinnvoller Alternativen überbewertet;
2. ein redundanter Fall Guy wird unter akuter Hirnschadengefahr als
   Survival-Antwort über einen notwendigen Draw gestellt;
3. der Encounter-Score behandelt eine einzelne legale Pump-Aktion als
   erreichbaren Breakpfad, obwohl der vollständige Pfad unbezahlbar ist.

## Gesamtziel und `/Goal`

`/Goal`: Die drei freigegebenen Findings aus
`match_dfe6223d817c646d` sequenziell im eigenen Worktree zuerst als
spielgleiche rote Decision-Checkpoints sichern, danach die generischen Ursachen
in Archives-Anlass, threat-kompatibler Survival-Planabbildung und vollständiger
Encounter-Pfadquote beheben, die unveränderten Checkpoints und Gegenproben grün
verifizieren, dokumentieren, lokal nach `main` integrieren und Worktree sowie
Arbeitsbranch verifiziert entfernen.

- Arbeitsbranch: `codex/ai-dfe6-decision-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_DFE6_DECISION_REMEDIATION`
- Ausgangs-`main`: `8abc411bd3b742a7bfddfe83998744a031fc771c`
- Hauptworkspace: nur für den finalen lokalen Merge
- Push oder Pull Request: nicht Teil dieses Prozesses

## Annahmen und Nicht-Ziele

- Die fachlichen Erwartungen stammen ausschließlich aus damaligem
  side-sicherem Runner-Kontext und dem öffentlichen Event-Präfix.
- Die Deckstrategien `runner.run_event_tempo` und `runner.rig_first` bleiben
  unverändert; die Änderungen korrigieren nachgelagerte Spezialbewertungen.
- Archives darf bei sichtbarer Agenda, ungesehener zufälliger Korp-Ablage,
  echtem Korp-Deckdruck oder fehlender sinnvoller Alternative weiterhin
  priorisiert werden.
- Wiederholbare Broker-Nutzung wird nicht pauschal begrenzt.
- Der risikoreiche Start des verdeckten Liche-Remote-Runs wird nicht anhand
  späterer Hidden-Info umbewertet.
- Es gibt keinen breiten Bewertungsrefactor, keine neue Controller-Runtime und
  keine Match-, Seed- oder Karteninstanz-Sonderlogik.
- Es werden keine Benchmarks, Baseline-Läufe, Selfplays oder zusätzlichen
  Simulationsspiele ausgeführt.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Die KI erhält nur side-sichere PlayerViews, öffentliche Event-Präfixe und
  ausdrücklich erlaubte Metadaten.
- Jeder Verhaltensfix beginnt mit einem spielgleichen Checkpoint auf dem
  unveränderten Ausgangscode.
- Nur `behavior_regression` gilt als fachlich rote Evidence.
- Checkpoint-Erwartungen werden nach dem Red-Nachweis nicht abgeschwächt.
- Threat-Kompatibilität wird über strukturierte Effekte und sichtbaren Zustand
  bestimmt, nicht über Kartenname oder Match-ID.
- Ein Breakpfad gilt nur als erreichbar, wenn Stärkeaufbau und notwendige
  Subroutinen vollständig bezahlbar sind.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration oder
  Redaction-Fehler werden vor Bewertungsänderungen als Infrastrukturproblem
  behandelt.
- Ist ein historischer Fund auf aktuellem Ausgangscode bereits grün, wird für
  diesen Fund kein Verhaltensfix umgesetzt.
- Fehlende LegalActions, Hidden-Info-Bedarf oder eine notwendige Änderung der
  Rules Engine außerhalb dieses Scopes blockieren das jeweilige Paket.
- Rote Tests werden nicht durch weichere Expectations oder Zufallstoleranz
  grün gemacht.

## State Machine

`preflight -> process_committed -> red_evidence -> archives_fixed -> survival_fixed -> encounter_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Prozessbasis und isolierter Worktree

- Ziel: Scope, `/Goal`, Invarianten, Branch und Worktree versionieren.
- Checks: Dokumentformatierung, `git diff --check`, sauberer Paketcommit.
- Done-Gate: Prozessartefakt ist committed und der Worktree basiert auf dem
  dokumentierten Ausgangsstand.
- Commit: `docs(ai): plan dfe6 decision remediation`

### P1 – Spielgleiche rote Decision-Checkpoints

- Ziel: Alle drei Findings vor Produktionsänderungen fachlich rot
  reproduzieren und positive Gegenproben grün halten.
- Zielzustände:
  - Archives: Decisions 47, 72 oder 94; führender Endspielanker ist Decision
    94 / StateVersion 172;
  - Survival: Decision 53 / StateVersion 94;
  - Encounter-Quote: Decision 51 / StateVersion 92.
- Arbeit: Captures mit historischem GameState, öffentlichem Event-Präfix,
  Runner-Decksnapshot und Runtime-Zustand; Expectations und Gegenproben;
  Fixture-Validierung und fokussierter Vitest-Lauf.
- Done-Gate: Zielverträge scheitern ausschließlich als `behavior_regression`;
  Gegenproben sind grün; Red-Evidence ist separat committed.
- Commit: `test(ai): capture dfe6 decision regressions`

### P2 – Archives-Anlass korrigieren

- Ziel: Runner-Matchpunktdruck allein qualifiziert keinen verdeckten
  Archives-Run bei sinnvoller Alternative.
- Gegenvertrag: sichtbare Agenda, zufällige Korp-Ablage, Korp-Deckdruck und
  Restaktion ohne sinnvolle Alternative bleiben positiv.
- Checks: DFE6-Archives-Checkpoint, `runner-archives-score.test.ts`, angrenzende
  Target- und Runtime-Tests, `git diff --check`.
- Done-Gate: unveränderte Ziel- und Gegenverträge sind grün.
- Commit: `fix(ai): require evidence for hidden Archives runs`

### P3 – Threat-kompatible Survival-Planabbildung

- Ziel: Akuter Schadensdruck bevorzugt tatsächlichen Handpuffer oder passende
  Schadensprävention; Tag-Vermeidung und redundante negative Installationen
  erfüllen den Plan nicht.
- Gegenvertrag: Bei tatsächlicher Taggefahr bleibt Fall Guy als präventive
  Entwicklung zulässig; passende Schadensprävention darf Draw überstimmen.
- Checks: DFE6-Survival-Checkpoint, Plan-Matching-, Semantic-Ranking- und
  Handbuffer-Tests, `git diff --check`.
- Done-Gate: der unveränderte DFE6-Vertrag wählt Draw; Gegenproben bleiben
  grün.
- Commit: `fix(ai): match survival plans to damage answers`

### P4 – Vollständige Encounter-Breakpfadquote

- Ziel: Ein einzelner legaler Pump zählt nur bei vollständig bezahlbarem
  Stärke- und Breakpfad als echte Encounter-Alternative.
- Gegenvertrag: Ein bezahlbarer Pump-und-Break-Pfad bleibt klar vor dem
  Auslösen schädlicher Subroutinen priorisiert.
- Checks: DFE6-Encounter-Checkpoint, Encounter-Survival-, sichtbare
  Run-Analyse- und RunPlan-Tests, `git diff --check`.
- Done-Gate: die gewählte DFE6-Aktion bleibt korrekt, aber die falsche
  `break_or_pump_available`-Begründung entfällt; Gegenprobe grün.
- Commit: `fix(ai): gate encounter loss penalty on viable breaks`

### P5 – Verifikation, Review und Wissenspflege

- Ziel: fokussierte und angrenzende Regressionen, AI-Typecheck und dauerhafte
  Dokumentation abschließen.
- Pflichtchecks: alle neuen Checkpoints, betroffene Unit-Tests,
  `corepack pnpm --filter @netgrid/ai typecheck`, relevante aktive
  Architekturchecks soweit ohne Simulation, `git diff --check`.
- Ausdrücklich nicht ausgeführt: Benchmarks, Baselines, Selfplays und
  zusätzliche Simulationsspiele.
- Artefakte: Final Review unter `docs/reviews/ai/`, AI-README bei dauerhaftem
  Vertrag und Monatslog.
- Done-Gate: Checks und Grenzen sind dokumentiert; Worktree sauber.
- Commit: `docs(ai): close dfe6 decision remediation`

### P6 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, final verifizieren, bevorzugt
  Fast-Forward mergen und Worktree sowie Branch entfernen.
- Done-Gate: lokales `main` enthält alle Paketcommits; Status und Diff-Hygiene
  sind sauber; Worktree-Pfad und Arbeitsbranch existieren nicht mehr.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_DFE6_DECISION_REMEDIATION` auf Branch
`codex/ai-dfe6-decision-remediation`. Arbeite immer nur am aktuellen Paket,
stelle die spielgleichen Tests vor dem jeweiligen Verhaltensfix fachlich rot,
ändere ihre Expectations danach nicht und committe jedes abgeschlossene Paket
separat. Nutze den Hauptworkspace erst für den finalen Merge. Führe keine
Benchmarks, Baseline-Läufe, Selfplays oder zusätzlichen Simulationen aus.

## Abschlusskriterien

- Alle drei historischen Zustände sind als dauerhafte Checkpoints versioniert.
- Zieltests waren vor den Fixes fachlich rot und sind danach unverändert grün.
- Gegenproben verhindern pauschale Archives-, Survival- oder Encounter-Regeln.
- Keine Hidden-Info-, LegalAction-, Replay- oder Determinismusgrenze wird
  abgeschwächt.
- Pflichtchecks und bewusst nicht ausgeführte Checks sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
