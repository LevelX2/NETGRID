# Plan-first-Runtime-Cutover – Ausgangsbefund

Status: **PF00 Baseline**
Stand: 2026-07-23
Zielprozess:
`docs/architecture/ai/ai-plan-first-runtime-cutover-process-2026-07-23.md`

## Kurzurteil

Die aktuelle Runtime besitzt bereits wertvolle Plan-, Portfolio-, Demand- und
Semantikbausteine. Die produktive Ausführungsautorität liegt aber noch nicht
beim Plan:

```text
TacticalPlan wählen und mappen
→ globale Semantic Choices bewerten
→ zahlreiche Override-Policies prüfen
→ Initial-Selection-Sonderpfade prüfen
→ Run-only-Nachkorrektur
→ gegebenenfalls Coverage-Fallback
→ Action
```

Damit kann ein Plan fachlich erkannt sein, während eine andere Einzelaction
produktiv gewinnt. Die neue Architektur darf diese Schichten nicht nur
umbenennen; sie muss sie durch Step-lokale Routenauswahl ersetzen.

## Reproduzierte rote Evidence

Ausgeführt:

```text
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/fd22-runner-action-valuation-regressions.test.ts \
  --maxWorkers=1 --testTimeout=30000
```

Ergebnis:

```text
1 Testdatei bestanden
9 Tests bestanden
```

Die Tests sind grün, weil sie den bekannten roten Verhaltenszustand
reproduzierbar klassifizieren. Gesichert bleiben:

- zweite redundante `Psychic Friend`-Installation als
  `behavior_regression`;
- drei Runner-Zugenden als erste Aktion mit vier Restklicks;
- erste fachlich zulässige Installationen als Gegenfälle;
- EndTurn bei null verfügbarer Action Capacity als Gegenfall.

PF00 verändert keine produktive Auswahl und keine Erwartung dieser Evidence.

## Aktueller Plan- und Portfoliovertrag

### TacticalPlan

`packages/ai/src/plans/plan-contract-types.ts` führt 20 konkrete
`TacticalPlanType`s und einen breiten `PlanStepKind`-Katalog.

Problem:

- die Typen sind aktuelle Ist-Evidence, aber keine Zielmodule;
- `runner.play_best_hand_card` ist ein pauschaler Kartenplan;
- Priorität liegt als Zahl direkt am Plan;
- Step und Mapping sind noch eng an vorhandene Actionkandidaten gekoppelt.

### PlanPortfolio

`packages/ai/src/plans/plan-portfolio-types.ts` besitzt:

- genau einen `interrupt`;
- genau einen `foreground`;
- höchstens zwei `backgrounds` im aktuellen Buildpfad;
- vermischte Lifecycle-/Rollenbegriffe;
- persistierte numerische `priority`;
- Credit-/Action-Demands und ausgewählte Routes;
- untypisierte `supportsEntryIds`;
- zusammengefasste Credit-/Click-Reservierungen.

Problem:

- Lifecycle, Rolle und Execution State sind nicht orthogonal;
- residente Pläne können technisch verworfen und neu erzeugt werden;
- Parentbedarf und Supportprovider sind kein First-class-Vertrag;
- Priorität wird als Instanzwert behandelt;
- eingeschränkte Ressourcen werden nicht als gemeinsames typisiertes Ledger
  arbitriert.

## Produktive Autoritätsbrüche

### 1. Globaler Actionvergleich nach Planbewertung

`packages/ai/src/runtime/semantic-runtime.ts` erzeugt globale `choices` und
ermittelt anschließend `rawBestChoice`.

Removal-Paket: **PF13**

Ziel:

- globale Choices dürfen weiter Semantik und planlokale Routewerte liefern;
- `rawBestChoice` darf keinen Executor oder planfremden Step bestimmen.

### 2. Plan-Override-Auswahl

Die Runtime ruft
`bestSemanticRuntimeChoiceForTacticalPlanOverride` und
`tacticalPlanMappedChoice` auf.

Betroffene Owner:

- `packages/ai/src/runtime/choice-ranking/mapped-choice-orchestrator.ts`;
- `mapped-choice-policies.ts`;
- `mapped-choice-initial-overrides.ts`;
- `runner-plan-overrides.ts`;
- `corp-plan-overrides.ts`.

Der Orchestrator besitzt viele Regeln, die anhand von Rohscore,
Scorekomponenten oder Scorelücken eine andere Action als das Mapping wählen.

Removal-Paket: **PF13**

Ziel:

- fachlich berechtigte Regeln werden in PlanAssessment, Stepbildung,
  Route-Safety oder side-spezifische Priority Policy verschoben;
- kein allgemeiner „OverrideChoice“ bleibt produktiv.

### 3. Initial-Selection-Sondergewinner

`selectSemanticRuntimeInitialChoice` kann vor beziehungsweise neben dem
gemappten Plan unter anderem auswählen:

- aktiven Runner-Runplan;
- unvermeidbaren Corp-Deckout;
- reactive Choice;
- Runner-Self-Damage-Sieg;
- Matchpoint-Remote-Contest;
- globale Best Choice.

Removal-Pakete:

- Window-/Run-Kontext: **PF07/PF10**
- Terminalpfade: **PF03/PF08**
- produktiver Cutover: **PF13**

Ziel:

- Terminal- und Urgent-Response-Pfade werden validierte Planclaims;
- Runfortsetzungen verwenden `PlanExecutionOrigin`;
- kein paralleler initialer Actionsieger.

### 4. Nachgelagerte Run-only-Korrektur

`runnerRunOnlyActionAdjustedSemanticChoice` kann die bereits getroffene
Auswahl nochmals verändern.

Removal-Pakete: **PF07/PF10/PF13**

Ziel:

- erzwungene Run-Aktionskapazität wird als Fenster-/Origin- oder
  Ressourcenvertrag vor Stepwahl modelliert;
- keine nachgelagerte Actionkorrektur.

### 5. Coverage-Fallback

`semanticCoverageFallbackDecision` sortiert LegalActions über
`failClosedFallbackPolicyForAction`.

Aktuelle Policyfamilien:

- Mandatory Choice;
- direct closeout;
- Tag entfernen;
- Run fortsetzen oder einziger Runstart;
- Access-Auflösung;
- Basic Credit;
- Basic Draw;
- EndTurn, Jack-out, Decline Trash und Decline Rez.

Problem:

- Pflicht-/Fensterauflösung und freiwillige Hauptaktionen sind vermischt;
- Basic Draw und EndTurn können fehlende Planabdeckung kaschieren;
- `fallbackUsed:true` liefert produktiv eine Action, statt die Lücke rot zu
  machen.

Removal-Pakete:

- Failure-/Lane-Trennung: **PF01**
- Window Resolution: **PF07**
- neutraler Basic-Credit-Plan: **PF09**
- produktive Entfernung: **PF14**

### 6. Global nachgespeiste Demand-Scorings

Credit- und Action-Demands aus dem Portfolio werden in die globale
Semantic-Choice-Bewertung eingespeist.

Removal-/Migrationspaket: **PF06/PF13**

Ziel:

- Needs und Ressourcen entscheiden Planmachbarkeit und planlokale Route;
- sie sind keine globalen Bonuskomponenten mehr.

## Bereits wiederverwendbare Bausteine

Nicht alles wird ersetzt:

- `ActionSemanticCandidate` bleibt verbindliche read-only Semantikbrücke;
- Funding- und Action-Capacity-Routen liefern Migrationswissen;
- bestehende DeckCapabilities und Strategic Intent bleiben Eingaben;
- RunTarget-, Scoreline-, Damage-, Trace- und Access-Projektionen bleiben
  fachliche Services;
- vorhandene Decision Checkpoints bleiben Evidence;
- side-safe PlanMemory-Isolation und Redaction bleiben harte Grenzen.

Wiederverwendung bedeutet nicht, dass die bisherigen Orchestratoren oder
Scoreboni als Zielvertrag erhalten bleiben.

## Removal-Ledger

| Ist-Schicht | Zielowner | Removal-Paket | Gate |
| --- | --- | --- | --- |
| persistierte Planpriority | `PlanAssessment` | PF02/PF03 | Priority nur StateVersion-basiert |
| gemischter Lifecycle/Rolle | PlanInstance-Achsen | PF02/PF05 | ungültige Kombinationen gesperrt |
| 1/1/2-Portfolio | residentes Portfolio | PF05 | keine fachliche Background-Zweiergrenze |
| Credit-/Action-Scoreeinspeisung | PlanNeed/Ledger | PF06 | keine globale Demand-Autorität |
| Future-Follow-up-Annahmen | semantische Fortsetzung | PF04/PF07 | keine Future-/Stale-ID |
| Initial-Selection-Sonderpfade | Priority/Window/Scheduler | PF03/PF07/PF08 | ein Leaf-Executor |
| Runner-/Corp-Overridefiles | Planmodule/Policies | PF09–PF13 | null Action-over-Plan |
| Run-only-Nachkorrektur | Window Origin/Ressourcen | PF07/PF10/PF13 | keine Nachwahl |
| Semantic Coverage Fallback | Resolution Lane/Failure | PF01/PF14 | kein produktiver Hauptaktionsfallback |
| `play_best_hand_card` | Domainroute/Admission-Plan | PF09/PF10 | kein freier Kartenwettbewerb |
| generische Board-Triage | Corp-Domainowner | PF11/PF12 | keine allgemeine Auffangaction |

## PF00-Gate

- Livepfad und Autoritätsbrüche inventarisiert: **bestanden**
- Removal-Paket je Schicht benannt: **bestanden**
- fd22-Evidence reproduziert: **bestanden**
- Runtimecode unverändert: **bestanden**
- Abhängigkeiten im Worktree installiert: **bestanden**, Lockfile unverändert

PF01 darf beginnen.
