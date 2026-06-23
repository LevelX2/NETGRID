# AI Replay Mistake Iteration Process 2026-06-23

## Status

`prepared`

Arbeitsbranch: `codex/ai-replay-mistake-iteration`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_REPLAY_MISTAKE_ITERATION`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Vorgabe vom 2026-06-23: NETGRID soll lokal vorhandene gespeicherte KI-Spiele, Replays und KI-Traces auswerten, bestätigte Fehlentscheidungen finden, ihre früheste vermeidbare Ursache bestimmen, reproduzierbare Entscheidungstests erzeugen und pro Iteration genau einen generalisierbaren Fehlercluster beheben.

Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`, kein Push.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise, wenn der erste Durchlauf bewusst begrenzt wird.

Bestimmbar sind:

- Gesamtziel: ein wiederholbarer lokaler KI-Replay-Mining- und Fix-Kreislauf plus eine erste geprüfte Fehlercluster-Iteration.
- Reihenfolge: Inventar/Baseline, DecisionCase-Extraktion, Detektion/Adjudication/Clustering, Repro, minimaler Fix, Holdout/Review.
- Scope: lokale Match-/Replay-/AI-Trace-Daten, `packages/ai`, vorhandene Replay-/Simulation-/Benchmark-Skripte, AI-Reports und optional `docs/activities/`.
- Nicht-Ziele: keine Engine-Vertragsänderung als KI-Tuning, keine Hidden-Info-Nutzung für Entscheidungsgüte, kein breiter Heuristikumbau, keine Enterprise-Gate-Kaskade.
- Abnahme: fokussierte Tests, AI-Typecheck, `git diff --check`, Discovery-/Holdout-Auswertung mit 0 IllegalActions, 0 ReplayFailures, RedactionSafe.
- Branch-/Worktree-Erwartung: eigener `codex/`-Branch, final lokal nach `main`.

Konservative Annahmen:

- "NETGRID-Lean-Local-Modus" wird aus der Vorgabe als Arbeitsstil interpretiert: kleine Pakete, fokussierte Tests, kleiner Holdout, keine unnötigen Gate-Artefakte.
- Wenn keine belastbaren lokal gespeicherten KI-Matches oder Traces auswertbar sind, wird kein Fix erfunden; stattdessen wird ein Observability-/Datenqualitätsblocker oder eine Activity erzeugt.
- Der erste Durchlauf behebt höchstens einen bestätigten generalisierbaren Fehlercluster. Weitere Cluster werden dokumentiert oder als Activities geschnitten.

## Gesamtziel

Der Prozess baut und nutzt einen schlanken lokalen Kreislauf:

```text
StoredMatch / Replay / AI Trace
-> side-safe DecisionCase
-> MistakeCandidate
-> fachliche Adjudication
-> earliest_avoidable_divergence
-> DecisionFingerprint / Cluster
-> Repro-Snapshot und Negativkontrolle
-> minimaler AI-Fix in der passenden Schicht
-> Discovery-/Holdout-Nachweis
-> Iterationsbericht und Commit
```

Eine Änderung gilt nur als Verbesserung, wenn sie den bestätigten Fehler reduziert, keine Hidden Information nutzt, ausschließlich vorhandene LegalActions auswählt und in einem unabhängigen kleinen Holdout keine relevante Verschlechterung erzeugt.

## Nicht-Ziele

- Keine Änderung an Engine-Regelautorität, LegalAction-Erzeugung oder `applyAction`.
- Keine Änderung an Replay, StateHash oder Randomness, außer ein separater Engine-/Harness-Fund wird bewusst aus dem KI-Scope herausgeroutet.
- Keine Nutzung verdeckter Gegnerkarten für `decision_quality`.
- Keine MatchId-, StateVersion-, DeckHash-, Seed- oder Replay-spezifischen Produktiv-Sonderregeln.
- Keine großen Score-Gewichtsänderungen aus einem einzelnen Replay.
- Keine parallelen Fixes für mehrere Ursachen.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt oder ein Blocker dokumentiert ist.
- Jede finale AI-Action stammt aus `input.legalActions`.
- Discovery und Holdout bleiben getrennt; Holdout wird nicht zur Fixableitung genutzt.
- FullState oder Hidden Cards dürfen nur für lokale Forensik, Replay-/Engine-Prüfung oder realisierte Outcome-Analyse genutzt werden, nie als Begründung für damalige KI-Entscheidungsqualität.
- Shadow-Abweichung ist nur Nominierung, kein Fehlerbeweis.
- Engine-, LegalAction- und Harness-Probleme werden nicht als KI-Spielstärke-Fix behandelt.

## Automatische Fehlerbehandlung

- Beschädigte oder nicht reproduzierbare Spiele erhalten einen Skip-Grund.
- Rote Baseline-Tests werden als vorbestehend oder neu klassifiziert.
- Wenn ein Repro nicht stabil herstellbar ist, wird kein Fix umgesetzt.
- Wenn ein Fix Safety- oder Holdout-Regressionen erzeugt, wird die Änderung verworfen; nur nützliche Repro-/Diagnoseverbesserungen dürfen bleiben.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn kompatibel.
- Kein `git reset --hard`, kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht aus aktuellen LegalActions stammt;
- eine Änderung Hidden Info für Scoring, Target-Auswahl, Label, Snapshot oder Fix benötigt;
- eine KI-Verbesserung Engine-, `applyAction`-, Replay-, StateHash- oder Randomness-Verträge ändern müsste;
- Replay-/Trace-Export oder versionierte Artefakte verdeckte Karten, private Payloads, Token, Decklisten oder lokale Pfade enthalten würden;
- der höchstpriorisierte Cluster nur ambiguous oder outcome-getrieben ist;
- der Holdout neue IllegalActions, ReplayFailures, StateHashMismatch oder Redaction-Verstöße zeigt.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> replay_ai_0_preflight_inventory
  -> replay_ai_1_decisioncase_extraction
  -> replay_ai_2_candidate_adjudication_clustering
  -> replay_ai_3_repro_and_controls
  -> replay_ai_4_minimal_cluster_fix
  -> replay_ai_5_holdout_review_activity_handoff
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessartefakt | Artefakt existiert, Worktree sauber, `git diff --check` grün | `docs(ai): define replay mistake iteration process` |
| `REPLAY-AI-0` | Inventar und Baseline | lokale Datenquellen, auswertbare Spiele/Traces, Skip-Gründe, Discovery/Holdout und Baseline-Checks dokumentiert | `docs(ai): record replay mistake baseline inventory` |
| `REPLAY-AI-1` | DecisionCase-Extraktion | side-safe DecisionCase-Extraktor oder Report erzeugt redigierte Fälle ohne Hidden-Info-Leak | `feat(ai): extract replay decision cases safely` |
| `REPLAY-AI-2` | Kandidaten, Adjudication und Cluster | Kandidaten werden nur nominiert, fachlich adjudiziert, geclustert und ein höchstpriorisierter bestätigter Cluster ausgewählt | `docs(ai): adjudicate replay mistake clusters` |
| `REPLAY-AI-3` | Repro und Kontrollen | minimaler Repro-Snapshot/Test, Nachbarschaftsvarianten und Negativkontrolle stehen und schlagen vor Fix fachlich passend fehl | `test(ai): add replay mistake cluster repro` |
| `REPLAY-AI-4` | Minimaler Fix | genau eine primäre Ursache wird in der passenden AI-Schicht behoben; Repro und fokussierte Tests grün | `fix(ai): address replay mistake cluster` |
| `REPLAY-AI-5` | Holdout, Review und Activities | Discovery-/Holdout-Auswertung, Fähigkeitsmetrik, Risiken, ggf. Activity-Handoff und Iterationsbericht dokumentiert | `docs(ai): record replay mistake iteration review` |
| `FINAL-GREEN` | Abschlusschecks und Integration | relevante AI-Tests, Typecheck, Diffcheck, finaler Merge nach `main`, Hauptworkspace geprüft | optionaler Fix-/Docs-Commit |

## Paketdetails

### REPLAY-AI-0: Inventar und Baseline

Ziel: tatsächliche lokale Daten- und Testbasis feststellen.

Kernartefakt:

- `docs/reviews/ai/ai-replay-mistake-baseline-inventory-2026-06-23.md`

Arbeit:

- Git-Status, Commit, Worktree und relevante Agentenverträge dokumentieren.
- Tatsächliche Speicherorte und Formate für gespeicherte Matches, Replays/EventLogs, AI-Decision-Traces, DecisionDebug, Simulation-/Benchmarkdaten und Snapshot-/Scenario-Fixtures ermitteln.
- Anzahl gefundener Spiele, Runner-/Corp-Verteilung, AI-/Gegnerprofile, Seeds, Deckpaare, Replay-Status und Anteil auswertbarer KI-Entscheidungen dokumentieren.
- Beschädigte oder nicht reproduzierbare Spiele mit Skip-Grund erfassen.
- Discovery/Holdout deterministisch teilen.

Checks:

```bash
git status --short
git rev-parse HEAD
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test
git diff --check
```

Bei zu hohem Laufzeitrisiko darf der vollständige AI-Testlauf durch dokumentierte fokussierte AI-Baseline-Tests ersetzt werden; `FINAL-GREEN` muss dann den vollständigen relevanten Lauf nachholen.

### REPLAY-AI-1: DecisionCase-Extraktion

Ziel: auswertbare KI-Entscheidungen side-safe in interne DecisionCases überführen.

Mögliche Kernartefakte:

- `scripts/run-ai-replay-decisioncase-mining.ts`
- `packages/ai/src/evaluation/replay-decision-cases.ts`
- `docs/reviews/ai/ai-replay-decisioncase-mining-2026-06-23.json`
- `docs/reviews/ai/ai-replay-decisioncase-mining-2026-06-23.md`

Mindestfelder:

- `caseId`, `matchId`, `side`, Turn/Action-Index, `stateVersion`, `eventId`, `decisionId`, Timing/Phase.
- Commit-/Version-/Ruleset-/Catalog-Referenzen, soweit vorhanden.
- redigierte Deckreferenzen, Seed, AI-/Gegnerprofil.
- side-safe Vorzustand oder reproduzierbarer View-Snapshot.
- gewählte Action und Choices, alle LegalActions, semantische Projektion relevanter LegalActions.
- DecisionDebug, Scores, sichtbarer Nachher-Kontext, Outcome-Marker, ObservabilityStatus.

Done-Gate:

- Kein versioniertes Artefakt enthält verdeckte Gegnerkarten, FullState, private Payloads, Tokens, Decklisten oder lokale Pfade.
- Extractor/Report ist deterministisch sortiert und begrenzt.

### REPLAY-AI-2: Kandidaten, Adjudication und Cluster

Ziel: Detektoren nominieren nur; Fehler werden fachlich bestätigt.

Detektoren:

- IllegalAction, ReplayFailure, StateHashMismatch, invalid target/choice.
- Hidden-Info-/Redaction-Verstoß.
- verpasstes sichtbares Scorefenster.
- ignorierte sichtbare Remote-Bedrohung.
- wiederholter unerreichbarer oder No-Payoff-Run.
- unnötige Trace-/Credit-Verschwendung.
- Economy-Starvation trotz sinnvoller Recovery.
- falsche Zielbindung.
- wiederholte gleiche Aktion ohne State-Fortschritt.
- lange No-Progress-Sequenz.
- Shadow-/ActionGoalFit-/TacticalGoalUtility-Abweichung als reine Nominierung.

Adjudication-Labels:

- `confirmed_mistake`
- `likely_mistake`
- `ambiguous`
- `not_a_mistake`
- `data_gap`
- `engine_or_harness_bug`

Ursachenklassen:

- `action_semantics_gap`
- `tactical_goal_generation_gap`
- `tactical_goal_priority_gap`
- `belief_or_memory_gap`
- `reachability_or_hard_gate_gap`
- `scoring_or_risk_gap`
- `target_binding_gap`
- `planning_horizon_gap`
- `card_semantics_gap`
- `engine_legal_action_gap`
- `harness_or_replay_gap`
- `observability_gap`

Done-Gate:

- Ein Cluster ist nur fixfähig, wenn mindestens ein bestätigter Fehler, stabile Evidence und eine primäre KI-Ursache vorliegen.
- `engine_legal_action_gap` und `harness_or_replay_gap` werden aus dem KI-Fix-Scope herausgeroutet.

### REPLAY-AI-3: Repro und Kontrollen

Ziel: höchstpriorisierten Cluster reproduzierbar machen.

Arbeit:

- Minimalen redigierten DecisionSnapshot im bestehenden Fixture-/Scenario-Format erzeugen.
- Test muss vor Fix aus fachlich richtigem Grund fehlschlagen.
- Nachbarschaftsvarianten für Credits/Aktionen, sichtbare Bedrohung, LegalAction-Reihenfolge, Targetoptionen ergänzen.
- Mindestens eine Negativkontrolle ergänzen.
- Hidden-State-Invarianz prüfen, soweit bestehende Testhelfer das erlauben.

Done-Gate:

- Repro rot vor Fix oder als expliziter TODO/Expected-Fail nur im Paketkontext dokumentiert.
- Keine Hidden-Info-Abhängigkeit im Snapshot.

### REPLAY-AI-4: Minimaler Cluster-Fix

Ziel: genau eine primäre Ursache beheben.

Routing:

- `action_semantics_gap` -> Action-/Ability-/Cost-/Timing-/Target-Projektion.
- `tactical_goal_generation_gap` -> sichtbares TacticalGoal ergänzen.
- `tactical_goal_priority_gap` -> Zielpriorität oder Threat-Override.
- `belief_or_memory_gap` -> sichtbare Fakten, Invalidierung oder Planhistorie.
- `reachability_or_hard_gate_gap` -> Kosten-, Timing-, Sichtbarkeits- oder Reachability-Gate.
- `scoring_or_risk_gap` -> generische Bewertungs- oder Risikokomponente.
- `target_binding_gap` -> TargetContext oder TargetProfile.
- `planning_horizon_gap` -> begrenzter Plan-/Intent-Zustand.
- `card_semantics_gap` -> kanonische Karten-/Ability-Semantik.

Done-Gate:

- Repro, Varianten und Negativkontrolle grün.
- Fokussierte bestehende AI-Tests grün.
- Kein Match-/Deck-/Replay-Sonderfall.

### REPLAY-AI-5: Holdout, Review und Activity-Handoff

Ziel: Verbesserung nachweisen oder Hypothese verwerfen.

Kernartefakte:

- `docs/reviews/ai/ai-replay-mistake-iteration-review-2026-06-23.md`
- optional Activity unter `docs/activities/inbox/`, nur wenn separater Scope nötig ist.

Mindestbericht:

- untersuchter Fehlercluster;
- Kandidatenzahl und bestätigte Fälle;
- exemplarischer DecisionCase;
- früheste vermeidbare Abweichung;
- primäre Ursache;
- widerlegte Alternativhypothesen;
- geänderte Dateien;
- Repro-, Negativ- und Holdout-Ergebnisse;
- Vorher/Nachher-Metriken;
- verbleibende Risiken;
- Commit.

Harte Erwartungen:

- IllegalActions = 0.
- ReplayFailures = 0.
- StateHashMismatch = 0.
- RedactionSafe = true.
- Exakter Fehler nicht mehr reproduzierbar.
- Negativkontrolle bleibt korrekt.
- Holdout zeigt keine relevante Verschlechterung.

Mindestens eine opportunity-normalisierte Fähigkeitsmetrik wird berichtet, z. B. `dead_run_rate`, `target_error_rate`, `confirmed_mistake_rate`, `cluster_recurrence_rate`, `score_window_conversion` oder `remote_threat_response`.

## Verifikationsregeln

- Nach jedem Paket fokussierte Tests, `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check`.
- Wenn `apps/server` oder Replay-Endpunkte geändert werden, `corepack pnpm --filter @netgrid/server typecheck` und relevante Server-Tests ergänzen.
- Wenn `packages/engine` geändert werden müsste, Prozess stoppen und Engine-/CardImplementation-Fund aus dem KI-Scope heraus dokumentieren.
- Keine Testlockerung ohne dokumentierten fachlichen Grund.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree `C:\Projekte\NETGRID_AI_REPLAY_MISTAKE_ITERATION`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Branch: `codex/ai-replay-mistake-iteration`.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und grün.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den AI Replay Mistake Iteration Process vollständig und sequenziell von REPLAY-AI-0 bis REPLAY-AI-5 plus FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md, docs/architecture/ai/ki-zielbild-metaebene-2026-06-01-v5.md, docs/architecture/ai/ki-roadmap-neue-ki-spieler-2026-06-02-v1.md, docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md und docs/architecture/ai/ai-replay-mistake-iteration-process-2026-06-23.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_REPLAY_MISTAKE_ITERATION auf Branch codex/ai-replay-mistake-iteration.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- REPLAY-AI-0 bis REPLAY-AI-5 und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Alle Paketcommits liegen auf `codex/ai-replay-mistake-iteration`.
- Kein Hidden-Info-, LegalAction-, Engine-, Replay-, StateHash- oder Randomness-Vertrag wurde durch KI-Tuning aufgeweicht.
- Mindestens ein bestätigter Cluster wurde entweder behoben und holdout-geprüft oder sauber als nicht fixfähig/blockiert dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
