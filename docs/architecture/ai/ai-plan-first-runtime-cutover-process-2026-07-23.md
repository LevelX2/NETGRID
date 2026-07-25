# KI-Plan-first-Runtime-Cutover – sequenzieller Umsetzungsprozess

Status: **implementing**
Quelle/Vorgabe: Nutzerauftrag und
`docs/architecture/ai/ai-plan-layer-target-state-wip.md` Version `0.7`
Primärer Agent: `release-implementation-agent`
Branch: `codex/ai-plan-first-runtime-cutover`
Worktree: `C:\Projekte\NETGRID_AI_PLAN_FIRST_RUNTIME_CUTOVER`

Aktueller Paketstand:

- PF00: abgeschlossen, Commit `2d865be44`
- PF01: abgeschlossen, Commit `46f5df39b`
- PF02: abgeschlossen, Commit `e19287242`
- PF03: abgeschlossen, Commit `0b4af1640`
- PF04: abgeschlossen, Commit `f1caa8e98`
- PF05: abgeschlossen, Commit `0d51e1334`
- PF06: abgeschlossen, Commit `6bf01b5fb`
- PF07: abgeschlossen, Commit `8abb66d4e`
- PF08: abgeschlossen, Commit `c0da361f2`
- PF09: abgeschlossen, Commit `50eb3b892`
- PF10: abgeschlossen, Commit `b684db3f5`
- PF11: abgeschlossen, Commit `48f0f109e`
- PF12: abgeschlossen, Commit `fbdb8fb10`
- PF13: abgeschlossen, Commit `790259a4a`
- PF14: abgeschlossen, Commit `533eeefaf`
- PF15: abgeschlossen, Commit `4b0c459f6`
- PF16: Runtime-Cleanup, Vertragsarbeit, vollständige Gates und Final Review
  abgeschlossen; PF16-Commit und Main-Integration ausstehend

## Zielprüfung

Die Vorgabe ist für eine direkte sequenzielle Umsetzung ausreichend präzise.
Der gewünschte Endzustand ist nicht eine weitere Gewichtungsrunde, sondern ein
produktiver Autoritätswechsel:

```text
Goal-/Threat-Signale
→ persistentes PlanPortfolio
→ Assessments und validierte Priority Claims
→ Root-Foreground und genau ein Leaf-Executor
→ Step
→ aktuelle semantische Route
→ genau eine vorhandene LegalAction
```

Fehlende Planabdeckung oder nicht tragfähige Semantik darf nicht durch die
Auswahl einer „irgendwie sicheren“ anderen Action verdeckt werden. Solche
Zustände müssen deterministisch fehlschlagen, klassifiziert diagnostiziert und
im fachlich zuständigen Paket behoben werden.

Eine offene Architekturfrage bleibt der normative Regelvertrag für
freiwilliges EndTurn. Für diesen Prozess gilt die konservative
Implementierungsgrenze:

- keine Engine-Regeländerung ohne eigenen belegten Regelentscheid;
- solange die Engine `end_turn` anbietet, ist es für die KI bei verbleibender
  sicher nutzbarer Action Capacity unzulässig;
- fehlende Planabdeckung darf niemals durch `end_turn` kaschiert werden;
- eine spätere Engine-Entfernung der LegalAction bleibt ein gesonderter
  Regelentscheid, nicht stiller Bestandteil des KI-Cutovers.

## Gesamtziel

Die Semantic Runtime wird radikal auf einen autoritativen Plan-first-Pfad
umgestellt. Nach Abschluss gilt:

1. Jede freiwillige KI-Hauptaktion besitzt eine produktive Kette aus
   Planinstanz, Phase, Step, Capability, Target und aktuellem Route Head.
2. Nach Planwahl existiert kein globaler Action-Wettbewerb und keine
   Action-over-Plan-Override-Schicht.
3. Tactical Goals bleiben kurzlebige, nicht autoritative Eingabesignale.
4. Runner und Corp verwenden getrennte fachliche Scheduler-Policies auf
   demselben kleinen Kernel.
5. Planinstanzen sind persistent, dedupliziert und über orthogonale
   Zustandsachsen, Retention und Outcome fortschreibbar.
6. Support läuft über `PlanNeed`, Root-/Leaf-Executor und typisierte
   Ressourcen, nicht über planfremde Scoreboni.
7. Mehraktionslinien speichern keine zukünftigen Action-IDs und werden nach
   jeder StateVersion semantisch neu materialisiert.
8. Pflicht-, Choice-, Run-, Access-, Trace-, Rez- und Passfenster werden
   ausdrücklich klassifiziert und behalten ihren PlanExecutionOrigin.
9. Produktive generische Kaschierungsfallbacks sind entfernt.
10. Fehlende Module, Semantik, Routes, Ressourcenauflösung oder Scheduler-
    Invarianten erzeugen sichtbare Failure-Klassen und rote Gates.
11. Die historischen Psychic-Friends-, EndTurn-, Highlighter-, Score- und
    Manhunt-Fälle sowie Full-Match-Baselines belegen den neuen Pfad.

## In Scope

- `packages/ai/src/plans/` und die TacticalPlan-Fassade;
- produktive Semantic-Runtime-Orchestrierung und Choice-Auswahl;
- Plan-Memory, Portfolio, Needs, Ressourcen und Fortsetzungen;
- Action-Semantik-Bindung und Planattribution;
- Runner- und Corp-Planregistries sowie Zielmodule;
- Decision-Chain-Diagnostik und Failure-Klassifikation;
- Decision Checkpoints, Modul-/Kerneltests und AI Behavior Baseline;
- notwendige AI-interne Typen, Exporte, Wissens- und Reviewartefakte;
- eng notwendige Engine-Tests zur bestehenden EndTurn-LegalAction-Grenze,
  aber keine unbelegte Regeländerung.

## Nicht-Ziele

- keine neue LegalAction-Erzeugung durch die KI;
- keine Änderung von `applyAction`, Replay, StateHash oder Randomness;
- keine Hidden-Info-Allowlist-Erweiterung;
- keine Karten-ID-Sonderfälle im Kernel oder Scheduler;
- keine dauerhafte Parallelruntime;
- keine pauschale Neubewertung aller Kartenhints;
- keine Produktversionsänderung;
- kein Push und kein Pull Request;
- keine Beibehaltung alter Plan-/Override-Schichten aus
  Rückwärtskompatibilitätsgründen.

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Kein Paket wird übersprungen.
3. Nach jedem Paket laufen die paketnahen Tests, AI-Typecheck und
   `git diff --check`.
4. Jedes abgeschlossene Paket erhält einen eigenen Commit.
5. Ein rotes Done-Gate stoppt die Paketfolge.
6. Neue Fehler werden im zuständigen Planmodul oder Kernelvertrag behoben,
   nicht durch einen allgemeineren Fallback.
7. Legacy-Verhalten darf vor dem produktiven Cutover noch als
   Vergleichsevidence in Tests aufgerufen werden, aber nicht als zweiter
   produktiver Auswahlweg bestehen.
8. Ab PF13 darf keine produktive Entscheidung auf eine Legacy- oder
   Semantic-Fallback-Auswahl zurückfallen.
9. Jede produktive Planentscheidung ist side-safe und deterministisch.
10. Main wird nur für die finale lokale Integration verwendet.

## Produktive Entscheidungslanes

Der Cutover kennt nur folgende legitime Lanes:

### A. Engine-/Fensterauflösung

- automatische Auflösung ohne KI-Auswahl;
- Pflichtauswahl aus aktuellen LegalActions;
- optionale Ability-/Rez-/Trace-/Run-/Access-Fortsetzung mit
  `PlanExecutionOrigin`;
- legitimes Pass/Decline nur in einem Regel- oder Ability-Fenster, das dies
  ausdrücklich erlaubt.

Diese Lane ist kein strategischer Fallback.

### B. Autoritativer Plan

- Portfolio reconciliieren;
- alle relevanten Instanzen assessen;
- Priority Claims validieren;
- Root-Foreground und Leaf-Executor bestimmen;
- Step und aktuelle Route materialisieren;
- genau eine Step-kompatible LegalAction wählen.

### C. Enger neutraler Plan

Ein neutraler Grundplan ist eine echte Planinstanz und kein freier
Actionsieger:

- Basic Credit zur monotonen Liquiditätserhöhung;
- zwingender sichtbarer Hand-/Survivalbedarf;
- zwingender Cleanup-/Overflow-Bedarf.

Draw, Probe-Run, allgemeine Boardentwicklung und EndTurn sind keine neutralen
Universalpläne.

### D. Klassifizierter Fehler

Wenn A bis C keine gültige Entscheidung liefern, wird nicht weitergespielt.
Die Runtime wirft eine typisierte Failure mit redigierter Decision Chain.

## Failure-Taxonomie

```ts
type PlanResolutionFailureCode =
  | "missing_plan_module_coverage"
  | "missing_action_semantics"
  | "step_capability_mismatch"
  | "step_target_mismatch"
  | "no_current_route_head"
  | "priority_claim_rejected"
  | "resource_claim_conflict"
  | "invalid_support_graph"
  | "stale_or_future_action_reference"
  | "commitment_invalidated"
  | "window_origin_missing"
  | "executor_invariant_broken"
  | "end_turn_with_usable_capacity"
  | "scheduler_replan_exhausted";
```

Jede Failure enthält mindestens:

- Side, StateVersion, Timing und Fensterklasse;
- LegalAction-Typen ohne private Payloads;
- relevante Planinstanz- und Step-IDs;
- Failure Code und fachlichen Owner;
- Blocker oder Removal Condition;
- redigierte Candidate-/Assessment-/Route-Zählungen.

Keine Failure darf automatisch eine Ersatzaction auswählen.

## Sicherheitsblocker

Der Prozess stoppt bei:

- IllegalAction oder stale Action;
- Hidden-Info-Leak;
- nicht deterministischer Entscheidung bei gleichem Input und Seed;
- Replay-/StateHash-Abweichung;
- zukünftiger oder veralteter Action-ID in Route oder Fortsetzung;
- nicht erklärbarer P1-/P2-Claim;
- zyklischem Supportgraph;
- produktivem Legacy-/Fallback-Rückfall nach PF13;
- EndTurn mit verbleibender sicher nutzbarer Action Capacity;
- rotem Full-Match-Gate ohne eng klassifizierten fachlichen Owner.

Ein Blockerreport benennt die genaue Removal Condition. Das nächste Paket
beginnt erst nach Entfernung des Blockers.

## Prozess-State-Machine

```text
planned
→ package_active
→ package_verifying
→ package_committed
→ next_package
→ final_verifying
→ main_integrating
→ worktree_cleaning
→ complete

package_active/package_verifying
→ blocked
→ removal_condition_satisfied
→ package_active
```

## Paketübersicht

| Paket | Schwerpunkt | Produktive Wirkung |
| --- | --- | --- |
| PF00 | Prozess, Ist-Inventar und rote Evidence | keine |
| PF01 | Rules-/Failure-/Fallback-Vertrag | Diagnosebasis |
| PF02 | Zieltypen, Identität und Zustandsachsen | keine |
| PF03 | Assessments und validierte Prioritätsclaims | keine |
| PF04 | Action-Semantik, Step-Match und Route Head | keine |
| PF05 | Persistentes Portfolio und Retention | neue Kernelbasis |
| PF06 | PlanNeed und typisierte Ressourcen | neue Supportbasis |
| PF07 | geschützte Fortsetzungen und Window Origin | neue Sequenzbasis |
| PF08 | Runner-/Corp-Scheduler-Kernel | noch nicht produktiv |
| PF09 | Runner Economy, Rig und Defense | Runner-Grundmodule |
| PF10 | Runner Pressure, Remote, Entwicklung und Runfenster | Runner-Abdeckung |
| PF11 | Corp Score, Remote, Defense und Economy | Corp-Grundmodule |
| PF12 | Corp Virus, Punish, Ambush und Hand | Corp-Abdeckung |
| PF13 | radikaler produktiver Cutover | Plan-first live |
| PF14 | Restabdeckung, EndTurn und Fallback-Entfernung | fail-closed live |
| PF15 | Checkpoints, Hidden-Info und Full-Match-Baseline | Freigabeevidence |
| PF16 | Cleanup, Wissenspflege und Final Review | Abschluss |

## PF00 – Prozess, Ist-Inventar und rote Evidence

### Ziel

Den Livepfad, seine Autoritätsbrüche und die vorhandene Testevidence so
festhalten, dass spätere Pakete keine verdeckten Overrides übersehen.

### Eingangsvoraussetzungen

- WIP-Zielkonzept Version 0.3;
- sauberer Hauptworkspace;
- eigener Worktree und Branch.

### Konkrete Arbeit

- diesen Prozess anlegen;
- aktuelle Plan-/Portfolio-/Semantic-Runtime-Owner inventarisieren;
- produktive Action-over-Plan-Stellen, Coverage-Fallbacks,
  Initial-Selection-Overrides und EndTurn-Pfade benennen;
- vorhandene rote Checkpoints für Psychic Friends und vorzeitiges EndTurn
  unverändert sichern;
- Removal-Ledger für jede zu entfernende Legacy-/Fallback-Schicht anlegen.

### Kernartefakte

- dieses Prozessdokument;
- `docs/reviews/ai/ai-plan-first-runtime-cutover-baseline-2026-07-23.md`;
- bestehende fd22-Decision-Checkpoints.

### Checks

```text
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/fd22-runner-action-valuation-regressions.test.ts
git diff --check
```

### Done-Gate

- jeder produktive Auswahlweg hat einen benannten Owner und Removal-Paket;
- rote Ausgangsevidence reproduziert;
- kein Runtimecode geändert.

### Commit

`docs(ai): plan fail-closed plan-first runtime cutover`

## PF01 – Rules-, Failure- und Fallback-Vertrag

### Ziel

Failure-Klassen und Entscheidungslanes implementieren, bevor neuer
Schedulercode entsteht.

### Konkrete Arbeit

- `PlanResolutionFailure` samt Codes und redigiertem Kontext anlegen;
- Decision Chain um Failure Lane und `fallbackReason` erweitern;
- bestehende `SemanticCoverageFallbackError` auf die gemeinsame Taxonomie
  abbilden;
- produktive Fallback-Policy vollständig inventarisieren und per Test
  festhalten;
- vorläufigen EndTurn-AI-Vertrag als Invariante implementieren;
- explizit testen, dass eine Failure keine Ersatzaction erzeugt.

### Kernartefakte

- neuer Kernel-/Failure-Vertrag unter `packages/ai/src/plans/`;
- Runtime-Diagnostik;
- fokussierte Failure- und EndTurn-Tests.

### Done-Gate

- alle Failure Codes sind redigiert und deterministisch;
- Fallbackpfade sind messbar, nicht still;
- EndTurn mit Restkapazität kann nicht als Coverage-Fallback dienen.

### Commit

`feat(ai): define fail-closed plan resolution failures`

## PF02 – Zieltypen, Identität und Zustandsachsen

### Ziel

Den PlanInstance-Vertrag aus WIP 0.3 implementieren, ohne alte
Lifecycle-Begriffe weiter zu vermischen.

### Konkrete Arbeit

- Modul-ID/-Version und stabilen `dedupeKey` einführen;
- `PlanViability`, `PlanPortfolioRole`, `PlanExecutionState` und
  `PlanPersistencePolicy` implementieren;
- `proposed` ausschließlich als Proposal behandeln;
- Retention-/Expiry-/Abandonment-Verträge typisieren;
- Adapter vom heutigen `TacticalPlan` zur neuen Proposal-Evidence nur für
  Migrationspakete bereitstellen;
- keine neuen Basisklassen aus den 20 Legacy-Typen ableiten.

### Done-Gate

- ungültige Zustandskombinationen sind typ- oder testseitig gesperrt;
- gleiche `dedupeKey`s erzeugen keine Duplikatinstanzen;
- Priorität ist kein persistierter autoritativer PlanInstance-Zustand.

### Commit

`feat(ai): add plan instance identity and orthogonal states`

## PF03 – PlanAssessment und validierte Priority Claims

### Ziel

Planwahl kennt Ausführbarkeit und Ressourcenlücke, ohne einen versteckten
globalen Action-Wettbewerb vorwegzunehmen.

### Konkrete Arbeit

- `PlanAssessment`, `PriorityClaim`, Witness und `GuaranteeLevel`
  implementieren;
- Runner-/Corp-Policy validiert P1 bis P6;
- P1/P2 ohne belegten Reason Code und Witness herabstufen oder ablehnen;
- Readiness, Blocker, nächste semantische Step-Vorschau und
  FeasibilityEnvelope erzeugen;
- Assessment darf keine konkrete Action-ID auswählen;
- Hysterese und Kontinuität auf Plan-, nicht Action-Ebene binden.

### Done-Gate

- kein Modul kann sich selbst unbelegt P1/P2 geben;
- Assessment enthält keine zukünftige Action-ID;
- P5-Cadence verdrängt P4 nicht;
- Intent-Fit und akute Evidence sind getrennt.

### Commit

`feat(ai): assess plans before validated priority selection`

## PF04 – Action-Semantik, Step-Match und aktueller Route Head

### Ziel

Die Plan-to-Action-Brücke wird zur einzigen Action-Bindung.

### Konkrete Arbeit

- Step-Capability und Target gegen `ActionSemanticCandidate` validieren;
- `PlanRoute` mit genau einem aktuellen `head` und semantischer
  `continuation` implementieren;
- Action-ID plus StateVersion im Route Head prüfen;
- Future-/Stale-ID-Guards ergänzen;
- Psychic Friend nicht über generisches `install_card` als beliebige
  Breaker-Coverage akzeptieren: Die erste Kopie darf den belegten
  Code-Gate-Bedarf erfüllen, eine weitere Kopie oder eine falsche
  Wall-/Sentry-Rolle aber nicht;
- planlokale Routenauswahl darf nur Step-kompatible Kandidaten vergleichen.

### Done-Gate

```text
selected_action_capability_mismatch = 0
selected_action_target_mismatch = 0
future_or_stale_action_id_in_route = 0
```

### Commit

`feat(ai): bind plan steps to current semantic route heads`

## PF05 – Persistentes Portfolio, Reconciliation und Retention

### Ziel

Das aktuelle 1/1/2-Portfolio durch den residenten Zielvertrag ersetzen.

### Konkrete Arbeit

- alle relevanten Instanzen resident halten;
- Root-Foreground, mehrere Backgrounds und mehrere Response-Kandidaten
  abbilden;
- genau einen Leaf-Executor erzwingen;
- Deduplizierung, Stale-TTL, Completion-History und technische Verdrängung
  implementieren;
- Planfortschritt aus Outcome/Receipt statt Action-ID ableiten;
- Churn-/Preemption-/Resume-Gründe diagnostizieren;
- Schema-v1-Memory ohne Rückwärtskompatibilität auf Zielversion ersetzen.

### Done-Gate

- keine fachliche Zweiergrenze für Backgrounds;
- genau ein Executor;
- residenter Plan wird nach Präemption fortgesetzt;
- stale Pläne verfallen nach Modulvertrag;
- kein Portfolio-Pingpong bei unverändertem Zustand.

### Commit

`feat(ai): replace tactical portfolio with resident plan instances`

## PF06 – PlanNeed und typisierte Ressourcen

### Ziel

Support wird über explizite Bedarfe und ein zentrales Ledger statt Scoreboni
koordiniert.

### Konkrete Arbeit

- `PlanNeed`, Status, Deadline, Provider und Parentbindung implementieren;
- typisierte ActionCapacity-/Credit-Tokens und Liabilities einführen;
- Hard, Soft und Forecast Claims trennen;
- nur Leaf-Executor oder laufende Fortsetzung darf hart reservieren;
- Supportgraph zyklenfrei validieren;
- delegierte Priorität nur für gebundene Parentneeds;
- bestehende Credit-/Action-Demands und Routes migrieren.

### Done-Gate

- keine Doppelreservierung;
- P2-Supportkind erhält delegierte Priorität;
- unabhängige Economy erhält sie nicht;
- Valu-Pak, Edgerunner, Wilson und Broker respektieren Restriction, Cadence
  und Ablauf;
- Backgrounds blockieren Ressourcen nicht dauerhaft hart.

### Commit

`feat(ai): coordinate plan needs and typed resource claims`

## PF07 – Geschützte Fortsetzungen und Window Origin

### Ziel

Same-Turn- und Fensterfolgen bleiben planbindend, ohne zukünftige LegalActions
vorzutäuschen.

### Konkrete Arbeit

- `PlanCommitment` als semantischen Verzweigungsgraph implementieren;
- GuaranteeLevel und konkrete Deadline-Kontexte verwenden;
- `PlanExecutionOrigin` und `PlanExecutionReceipt` einführen;
- automatische Auflösung, Pflichtchoice, optionale Ability, Main Action,
  Run/Access/Trace und Pass/Decline klassifizieren;
- nach jeder StateVersion nächsten Step neu materialisieren;
- Abbruch-/Branch-Regeln für Trace-, Tag-, Damage-, Run- und Scorefolgen.

### Done-Gate

- keine Fortsetzung enthält zukünftige Action-IDs;
- Prearranged Drop, Promises, Promises und Scorefolge verlieren keine
  Conversion;
- Manhunt verzweigt bei Tag-/Damageabwehr korrekt;
- Run-/Access-Choices behalten ihren Root- und Leaf-Ursprung.

### Commit

`feat(ai): protect semantic continuations across decision windows`

## PF08 – Gemeinsamer Scheduler und side-spezifische Policies

### Ziel

Den vollständigen Zielzyklus hinter einer noch nicht produktiven internen
Schnittstelle implementieren.

### Konkrete Arbeit

- gemeinsames Reconcile/Assess/Select/Materialize/Receipt-Orchestrator;
- getrennte Runner-/Corp-Registry und Priority Policy;
- begrenztes deterministisches Replanning;
- Failure statt beliebiger Action nach Replan-Erschöpfung;
- P0-Fensterlane vom freiwilligen Scheduler trennen;
- Diagnosevergleich gegen aktuelle Runtime nur in Tests.

### Done-Gate

- gleicher Kernel trägt Runner und Corp ohne fachlichen Mega-Switch;
- kein Action-Rohscore entscheidet den Executor;
- kein stiller Fallback;
- Assessment-/Selection-/Route-Kette ist vollständig diagnostiziert.

### Commit

`feat(ai): implement shared plan scheduler with side policies`

## PF09 – Runner-Grundmodule: Economy, Rig und Defense

### Ziel

Die grundlegenden Runner-Bedarfe vollständig planfähig machen.

### Konkrete Arbeit

- `runner.economy`;
- `runner.rig_and_coverage`;
- `runner.defense_and_recovery`;
- neutraler Basic-Credit-Plan;
- Draw/Search/Install nur als Route eines konkreten Steps;
- Admission-Gate für kartenbezogene Entwicklungsinstanzen vorbereiten;
- Psychic-Friends- und negative-Draw-Gegenfälle migrieren.

### Done-Gate

- kein freier `play_best_hand_card`;
- Nicht-Breaker erfüllt nie Coverage;
- Economy endet oder gibt ab, wenn der konkrete Bedarf erfüllt ist;
- Tag-, Damage- und Handpufferbedarf werden intern fachlich priorisiert.

### Commit

`feat(ai): migrate runner economy rig and defense plans`

## PF10 – Runner-Taktikmodule: Pressure, Remote, Entwicklung und Runfenster

### Ziel

Runner-Hauptaktionen und optionale Runfenster vollständig abdecken.

### Konkrete Arbeit

- `runner.pressure_central` für HQ/R&D/Archives und Multi-Server-Zugriff;
- `runner.contest_remote`;
- Admission-geprüftes `runner.develop_board_and_hand`;
- `runner.convert_run_window`;
- serverbezogene RunPurpose-/Access-Origin-Bindung;
- Highlighter-Fortschritt und Corp-Purge-Reconciliation;
- Probe-Run nur als echter Pressure-/Informationsplan.

### Done-Gate

- alle freiwilligen Runner-Aktionsfamilien besitzen einen Domainowner;
- Highlighter wächst nur bei realer Conversion;
- unpassierbares Ziel, Purge oder sinkender Grenznutzen reconciliiert;
- keine allgemeine Runner-Board-/Draw-Kaschierung.

### Commit

`feat(ai): migrate runner pressure remote and run window plans`

## PF11 – Corp-Grundmodule: Score, Remote, Defense und Economy

### Ziel

Corp-Scoring und Boardinvestition erhalten klare Ownership.

### Konkrete Arbeit

- `corp.score_agenda`;
- `corp.establish_scoring_remote`;
- `corp.defend_servers` inklusive Rez-Response;
- `corp.economy`;
- Score-/Remote-/Defense-Ownership-Matrix im Codevertrag;
- Same-Turn-Score als geschützte Fortsetzung;
- allgemeine ICE-/Boardinstallation nur mit fachlichem Owner.

### Done-Gate

- Scoreplan besitzt Agenda/Install/Advance/Score;
- Defense liefert Schutz und Rez, übernimmt aber keinen Scoreowner;
- kein generischer Board-Triage-Actionsieger;
- Scorecloseout verliert nicht gegen Economy oder Exposure-Rohscore.

### Commit

`feat(ai): migrate corp score remote defense and economy plans`

## PF12 – Corp-Taktikmodule: Virus, Punish, Ambush und Hand

### Ziel

Die übrigen Corp-Domänen so abdecken, dass kein generischer Midgame-Fallback
notwendig ist.

### Konkrete Arbeit

- `corp.respond_to_virus_pressure`;
- `corp.punish_campaign` plus `corp.execute_punish_sequence`;
- `corp.ambush_and_bluff`;
- `corp.hand_and_agenda_management`;
- Admission-geprüfte spezielle Corp-Entwicklung statt
  `safe_generic_development`;
- alternative Terminalbedingungen über side-sichere Projektion.

### Done-Gate

- Purge konkurriert regelkonform mit Score und Economy;
- Punishkomponenten bleiben über Züge resident;
- unsichere Killlinie trägt Garantiegrad und verzweigt;
- Agenda-Flood/Draw/Discard besitzen eigenen Owner;
- keine Corp-Aktion benötigt generischen Midgame-Auffang.

### Commit

`feat(ai): migrate corp virus punish ambush and hand plans`

## PF13 – Radikaler produktiver Cutover

### Ziel

Die neue Planebene erhält die alleinige produktive Ausführungsautorität.

### Konkrete Arbeit

- Semantic Runtime auf den neuen Scheduler umstellen;
- `bestSemanticRuntimeChoiceForTacticalPlanOverride`,
  `tacticalPlanMappedChoice`-Overridepfade und
  `selectSemanticRuntimeInitialChoice`-Sondergewinner entfernen oder auf
  reine Window-/Safety-Gates reduzieren;
- `rawBestChoice` darf nur planlokal innerhalb des ausgewählten Steps wirken;
- produktive Legacy-Plan-/Portfolio-Schemas entfernen;
- `fallbackUsed:true` für freiwillige Hauptaktionen verbieten;
- alte direkte Semantic-Runtime-Auswahl aus dem Livepfad löschen.

### Done-Gate

```text
plan_override_after_selection = 0
voluntary_action_without_executor = 0
productive_legacy_runtime_selection = 0
productive_semantic_coverage_fallback = 0
```

Alle produktiven Hauptaktionen laufen durch den neuen Scheduler. Fehlende
Abdeckung führt rot zu PF14, nicht zurück zur alten Runtime.

### Commit

`refactor(ai): cut over runtime to authoritative plan-first selection`

## PF14 – Restabdeckung, EndTurn und Fallback-Entfernung

### Ziel

Jede nach PF13 sichtbar werdende Lücke fachlich schließen und die alten
Kaschierungsfallbacks endgültig entfernen.

Initialer roter Failure-Korpus nach dem produktiven Cutover:

- erster Matador: strategischer Sentry-Coverage-Bedarf wird noch nicht aus dem
  residenten Deck-/Rollenbild in `runner.rig_and_coverage` aufgenommen;
- deterministischer Corp-Deckout: die gewinnbringende Rush-Hour-Linie benötigt
  einen expliziten terminalen Plan statt einer EndTurn-Ausnahme;
- alte FD22-Tests erwarten noch die absichtlich roten Altfehler
  „zweiter Psychic Friend“ und „vorzeitiges EndTurn“, obwohl die neue Runtime
  bereits produktive Planaktionen auswählt.

### Konkrete Arbeit

- Failure-Korpus über vollständige AI-Tests und ausgewählte Matches sammeln;
- jede Lücke einem bestehenden oder neuen engen Domainowner zuordnen;
- keine Lücke durch Ausweitung des neutralen Plans schließen;
- `semanticCoverageFallbackDecision`,
  `failClosedFallbackPolicyForAction` und freie Draw-/EndTurn-Policy
  entfernen;
- Mandatory/Window-Lane getrennt erhalten;
- EndTurn bei Restkapazität hart sperren;
- Coverage-Matrix für jede produktiv auftretende Actionfamilie schließen.

### Done-Gate

```text
plan_attribution_rate = 100 %
missing_plan_module_coverage = 0
missing_action_semantics = 0
end_turn_with_safe_action_capacity = 0
fallback_reason_missing_module_coverage = 0
```

Nachweis des vollständigen AI-Testlaufs nach Schließung der fachlichen Lücken:

- `459` Testdateien und `3.216` Tests ausgeführt;
- `missing_plan_module_coverage = 0`;
- `invalid_plan_identity = 0`;
- `priority_claim_rejected = 0`;
- `scheduler_replan_exhausted = 0`;
- die verbleibenden roten Tests sind alte Verhaltens-, Reason- oder
  Evidence-Verträge und werden in PF15 einzeln auf den neuen Planvertrag
  umgestellt, nicht durch Runtime-Fallbacks beruhigt.

Zusätzliche PF14-Gates:

- `tsc -p packages/ai/tsconfig.json --noEmit`: grün;
- `check-ai-source-structure`: grün, keine Runtime- oder Typzyklen;
- `check-package-boundaries`: grün;
- fokussierte Plan-, Live-Runtime-, Real-Engine- und Simulationstests:
  `48/48` grün.

### Commit

`refactor(ai): remove masking fallbacks and close plan coverage`

## PF15 – Checkpoints, Hidden-Info und Full-Match-Baseline

### Ziel

Den Cutover nicht nur typseitig, sondern durch unterschiedliche reale
Verhaltensslices freigeben.

### Konkrete Arbeit

- fd22 Psychic Friends/EndTurn;
- Highlighter plus Corp-Purge und Gegenfälle;
- Corp-Same-Turn-Score;
- Manhunt mit Trace-/Tag-/Damageverzweigungen;
- Action-Capacity-Fälle;
- Valu-Pak nur mit vorab gebundenen, sinnvollen Programmen, exakter
  Reihenfolge sowie nachgewiesener MU-/Credit-/Handpuffer-Projektion; der
  Kartenplan wartet davor resident in `prepare_restricted_sequence`, und
  Programme mit lediglich `later`/`none`-Bedarf legitimieren das Ausspielen
  nicht; keine spekulative Öffnung für erst später ziehbare Programme;
- observational-equivalence-Paare;
- komplette AI-Shards, Typecheck, Contracts und AI-Gates;
- AI Behavior Baseline mit qualitativen Vollaudits;
- Full Matches müssen regulär enden oder eine klassifizierte echte
  Modul-/Semantiklücke melden.

### Aktueller Zwischenstand am 2026-07-25

Implementiert und fokussiert verifiziert:

- Die frühere familienheuristische Abdeckung über
  `actionPlanOwnerships` ist entfernt. Eine Rollen-, Kartenfamilien- oder
  Semantikzuordnung gilt nicht mehr als Planabdeckung.
- Für jede freiwillige aktuelle LegalAction gilt jetzt der harte
  Schedulervertrag: entweder materialisiert ein aktuell ausführbarer
  Plan-Step genau diese Action-ID als Route, oder genau ein registriertes
  Fachmodul weist sie mit einer konkreten
  `explicitly_nonproductive`-Disposition zurück. Eine wartende residente
  Instanz, ein generischer Owner oder ein anderer ausführbarer Plan dürfen
  eine unaufgelöste Aktion nicht kaschieren. Route und Disposition derselben
  Action-ID bleiben ein fail-closed Widerspruch.
- Valu-Pak besitzt eine residente Vorbereitungsphase
  `prepare_restricted_sequence`; hohe Deckstrategiepassung allein öffnet die
  Sequenz nicht.
- Die Preflight-Projektion bindet konkrete sichtbare Programme und deren
  Reihenfolge und prüft MU, normale sowie eingeschränkte Credits,
  Credit-Floor und Handkartenpuffer über die gesamte Sequenz.
- Ein einzelnes Programm ist nur als akute, exakt durch die temporären Credits
  geschlossene Brücke zulässig. Ressourcen, spätere Programme und bloße
  Deckdichte zählen nicht als produktives Bundle.
- Nach dem Öffnen verlangt die Sequenz ein residentes Commitment. Fehlt es
  oder ist es nicht mehr erfüllbar, entsteht `commitment_invalidated`; weder
  ein anderes Programm noch EndTurn darf die Lücke kaschieren.
- Eine laufende Valu-Pak-Sequenz wird ausschließlich über die genau eine
  aktive Executor-Instanz fortgesetzt. Abgeschlossene oder historische
  Sequenzen dürfen ihre Commitments nicht mehr liefern; fehlende oder
  mehrdeutige Executorbindung schlägt als `commitment_invalidated` fehl.
- Nicht-endliche temporäre Credits, Installationskosten, MU-Werte oder
  Commitmentzahlen werden nicht auf null normalisiert: fehlerhafte
  Preflight-Kartendaten scheitern fail-closed, korrupte residente
  Commitments werden invalidiert.
- Der vollständige Hidden-Info-Beobachtungsäquivalenzvertrag ist als vier
  getrennte Vollzustandspaare ausführbar: Corp-HQ plus zukünftige
  R&D-Reihenfolge, unrezzte ICE-Identität, verdeckte Remote-Identität sowie
  verdeckte Runner-Ressource plus Grip/Stack. Jedes Paar verlangt identische
  side-sichere `PlayerView`, identische `LegalActions`, gleichen Seed und
  RandomCounter sowie anschließend die vollständig identische
  KI-Entscheidung. Der fokussierte Lauf ist `4/4` grün.
- Die beiden fokussierten Same-Turn-Gegenfälle „Tycho Extension plus Project
  Consultants“ und „geschützte Corporate-War-Linie“ sind auf dem aktuellen
  Stand grün. Eine Installationsvariante wird nur noch dispositioniert, wenn
  kein exakter Same-Turn-Scoreplan ihre Action-ID bindet.
- Runner-Run-Funding benötigt jetzt ein reales Route- oder
  Post-Run-Floor-Gap. Ein bereits direkt konvertierbares Ziel erzeugt keinen
  Funding-Step; eine andere direkt positive Runroute verdrängt nicht
  dringliches Funding. Nur eine belegte akute Score-Bedrohung kann diese
  Alternativsperre überstimmen. Eine direkt konvertierbare
  Geschwisterroute auf demselben Server blockiert Funding auch bei akuter
  Bedrohung. Der dringliche Floor-Override erlaubt nur eine exakt
  ausführbare, nichtnegative Terminalroute; ein echtes Route-Gap oder
  negative Credits nach dem Run bleiben finanzierungsbedürftig.
- Broker-Cashout ist an eine konkrete planfähige Kartenentwicklung gebunden,
  muss deren Credit-Gap im selben Zug schließen und den erforderlichen
  Handpuffer nach Cashout und Entwicklung erhalten. Ausnahmen verlangen einen
  expliziten akuten Survival- oder Coverage-Nachweis für genau diese
  Zielkarteninstanz. Nicht-endliche Cashout-, Puffer- oder Fundingwerte
  erzeugen eine konkrete Ablehnung und werden nicht als null oder als
  konvertierbare Route behandelt.
- Der globale Corp-Verteidigungsplan bindet genau die ausgewählte
  ICE-Server-Kombination. Alle anderen aktuellen Installationsvarianten
  derselben ICE-Instanz werden durch `corp.defend_servers` konkret
  dispositioniert; eine allgemeine ICE-Familienzuordnung deckt sie nicht ab.
- Die ICE-Härtung ist umgesetzt und fokussiert verifiziert:
  - Das frühere ICE-Platzierungsmodul liefert ausschließlich Facts; die
    serverübergreifende Auswahl liegt allein bei `corp.defend_servers`.
  - Score-Schutz ist an den exakten Score-Parent gebunden. Die Parent-Band
    wird zuerst nach P1–P4 gewählt; erst innerhalb dieser Band konkurrieren
    Child-Routen. Parent-ID, Priorität, Evidence, Assessment und Action
    stammen aus derselben Bindung. Fehlender Parent oder fehlende
    Score-Klasse schlägt fail-closed fehl.
  - Ein blockierter terminaler P1-Score-Parent behält seinen exakt gebundenen
    Funding-Child auch neben einem fremden ausführbaren P4-Score-Parent. Der
    Umkehr- und Prioritätsfall ist ebenfalls verifiziert.
  - Effekt und Funding werden getrennt bewertet. `funding_only` übernimmt
    den exakten Engine-projizierten Funding-Gap und erzeugt Economy-Support
    desselben Parents, niemals zielgerichteten ICE-Draw.
  - Installations-, aktuelle Rez- und Post-Install-Rez-Kosten stammen nur aus
    vollständigen, an `stateVersion`, Karteninstanz, Server und Action
    gebundenen Engine-Quotes. Gedruckte `rezCost`, Layerzählung, numerische
    Scoreboni und die frühere zentrale Reserveheuristik sind keine
    Verteidigungsautorität mehr.
  - Das vorbereitete Remote-Szenario bindet Defense und alle Score-Signale
    ausschließlich an
    `plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1`; es entsteht kein
    konkurrierendes `new_remote`-Signal.
  - Unvollständige, unbekannte, veraltete oder falsch gebundene Facts und
    Quotes bleiben fail-closed.
- In einem Rez-Fenster wird `decline_rez` nur dann als unproduktiv
  dispositioniert, wenn `corp.defend_servers` eine exakte, aktuell
  produktive Rez-Action materialisiert. Ohne eine solche Route bleibt
  Decline die zulässige fenstergebundene Entscheidung.
- `corp.ambush_and_bluff` bindet jede sichtbare Ambush-Kopie über
  `sourceInstanceId`, Zielserver und exakte aktuelle `actionId`. Eine
  Ambush-Rolle oder LegalAction allein erzeugt keinen Plan: Die konkrete
  Vorausplanung verlangt einen expliziten CorpIntent für
  `corp.ambush_bluff`; fehlt der Signalvertrag, schlägt die Runtime
  fail-closed fehl. Zwei gleiche Kopien materialisieren nicht gegenseitig
  ihre Installationsvarianten; spätere Advance-/Trigger-Phasen bleiben an
  Instanz und Commitment gebunden.
- Chester Mix öffnet nur mit einer vorab positiv bewerteten exakten
  Same-Fort-ICE-Fortsetzung eine gesperrte Rez-Install-Sequenz. Nach dem Rez
  wird die neue Install-LegalAction über ICE-Instanz und Fort gebunden;
  verschwindet sie, entsteht `commitment_invalidated`.
- Dr. Dreff und Jenny Jett besitzen getrennte Modelle. Dr. Dreff verlangt das
  letzte relevante Fenster und unter seinem Halb-Rez-Vertrag bezahlbares
  sichtbares HQ-ICE. Jenny verlangt einen aktuellen Run am eigenen Fort und
  die Finanzierung ihrer Rez- plus fortabhängigen Installationskosten; der
  Dr.-Dreff-Vertrag wird nicht auf sie übertragen.
- Vor den jüngsten Proteus-Longtail-Korrekturen war der vollständige
  Prüfstand grün:
  - alle Workspace-Typechecks einschließlich AI, Engine, Shared und Catalog;
  - AI-Shard 1: `162/162` Dateien und `1.529/1.529` Tests;
  - AI-Shard 2: `162/162` Dateien und `1.338/1.338` Tests;
  - AI-Shard 3: `162/162` Dateien und `1.046/1.046` Tests;
  - vollständiger Engine-Lauf: `207/207` Dateien und `1.795/1.795` Tests;
  - Decision Checkpoints: `62/62` Dateien und `368/368` Tests;
  - fokussierte Hidden-Info-, Authority-, Live-Runtime- und Replay-Verträge:
    `152/152`;
  - Package-Boundaries, AI-Source-Structure, Hints, Doctrine,
    Proteus-Readiness und `git diff --check`;
  - akzeptierte Standard-Baseline: `60` regulär beendete Spiele,
    `11.168` Entscheidungen und null IllegalActions, Replayfehler,
    FallbackActions, Runtimefehler, Action-Limits oder
    Hidden-Info-Findings. Die qualitative Prüfung hält `175` Findings,
    darunter drei HIGH-Corp-never-scores-Fälle, sowie zwei
    `gameEndReason=unknown`-Anomalien sichtbar fest.
- Seit diesem Vollstand fokussiert korrigiert und gemeinsam verifiziert:
  - Precision-Bribery-Lock-Removal ist nur als exakter Step eines sichtbaren
    Score-Parents produktiv; ohne solchen Parent bleibt die Action
    ausdrücklich unproduktiv.
  - Corporate Guard(R) Temps bleibt trotz Engine-zertifizierter zukünftiger
    Action-Capacity ohne gebundenen taktischen Parent ausdrücklich
    unproduktiv.
  - Fetal-AI-Installationen behalten ihre exakt vorbereitete
    `corp.ambush_and_bluff`-Route auch neben blockierten Score-Parents auf
    demselben oder einem anderen Server.
  - R&D Mole wird im exakten laufenden R&D-Accessfenster als zusätzlicher
    Multiaccess-Step von `runner.convert_run_window` materialisiert.
  - Engine-beschränkte Pirate-Broadcast-Mehrfachrunfolgen werden über ihre
    exakten R&D-/Archives-Legs fortgesetzt; normale Cadence- und
    Archives-Nutzenprüfungen bleiben davon getrennt.
  - Der zusammengeführte Runtime-/Variantenstand ist fokussiert grün:
    `152/152` Live-Runtime-Verbundtests, `26/26` Varianten-/Reprofälle und
    `141/141` Runner-Run-Window-/Pilot-Reprofälle.
  - Der aktuelle Proteus Selected Pilot ist qualifiziert: `16` Spiele,
    `1.991` Entscheidungen, `11` reguläre Abschlüsse, `5` Action-Limits,
    `0` Runtime-Failures und jeweils `0` IllegalActions, Replay-,
    Redaction-, No-Progress-, Fallback- und Originalset-Control-Fehler. Der
    Report persistiert und summiert `terminationKind` vollständig; die reale
    Action-Limit-Rate beträgt `31,3 %` bei erlaubten `75 %`.
- Auf dem aktuellen Code-Freeze-Stand erneut vollständig grün:
  - Workspace-Typecheck einschließlich Shared, Catalog, Engine, Decks, AI,
    Web und Server;
  - AI-Shard 1: `165/165` Dateien und `1.549/1.549` Tests;
  - AI-Shard 2: `165/165` Dateien und `1.336/1.336` Tests;
  - AI-Shard 3: `164/164` Dateien und `1.051/1.051` Tests;
  - Engine: `207/207` Dateien und `1.795/1.795` Tests;
  - Decision Checkpoints: `62/62` Dateien und `368/368` Tests;
  - finaler Hidden-Info-, Authority-, Replay-, EndTurn- und
    Planabdeckungsfokus: `8/8` Dateien und `237/237` Tests;
  - Contracts, Test-Discovery, Package-Boundaries, AI-/Engine-Source-
    Structure, Hint-Metadaten, Doctrine, Proteus-Inventar/-Family/-Pilot/
    Readiness, Card-Function-Abstraction sowie Economy- und
    Action-Capacity-Audits.
  - akzeptierte finale Standard-Baseline: `60` Spiele und `11.012`
    Entscheidungen; sämtliche Hard Gates grün und jeweils `0`
    IllegalActions, Replayfehler, Action-Limits, Fallbacks, Timeouts,
    Runtimefehler, Hidden-Info-Findings und No-LegalAction-Fehler.
    Redaction ist vollständig sicher. Die `175` qualitativen Findings,
    darunter drei HIGH-Corp-never-scores-Fälle und zwei bekannte
    `gameEndReason=unknown`-Anomalien, bleiben im Bericht sichtbar.

Der Variantenvertrag ist für PF15 verbindlich:

- Eine Kartenfamilien-, Rollen- oder Semantikdeklaration ist keine
  Action-Abdeckung und darf den harten Schedulervertrag nicht ersetzen.
- Ein Score-, Installations- oder Sequenz-Step mit konkreten `actionIds`
  materialisiert ausschließlich diese IDs.
- Breite Semantik-, Source- oder Target-Materialisierung ist bei vorhandenen
  `actionIds` verboten.
- Jede aktuell legale Geschwistervariante, die nicht zum gebundenen Step
  gehört, benötigt genau eine explizite Disposition des fachlichen
  Eigentümers.
- Dieselbe Action-ID darf nicht zugleich produktive Planroute und
  `explicitly_nonproductive` sein. Der Scheduler bricht diesen Widerspruch
  weiterhin fail-closed als `missing_plan_module_coverage` ab.

PF15 besitzt keine offenen Done-Gates mehr. Der vollständig grüne Prüfstand
wurde mit Commit `4b0c459f6`
(`test(ai): verify fail-closed plan-first runtime cutover`) abgeschlossen.

### Done-Gate

- keine IllegalAction, Hidden-Info-Abweichung oder Nondeterminismus;
- keine unklassifizierte Failure;
- keine wiederholte Failure desselben Owners;
- keine vorzeitigen Restklick-EndTurns;
- keine redundante Nicht-Breaker-Coverage;
- Baseline- und Full-Match-Evidence akzeptiert.

### Commit

`test(ai): verify fail-closed plan-first runtime cutover`

## PF16 – Cleanup, Wissenspflege und Final Review

### Ziel

Nur den neuen aktuellen Vertrag im produktiven Runtime- und Exportgraphen
behalten. Historische Altverträge dürfen ausschließlich dann als
quarantänisierte Test-/Evaluationsdiagnostik verbleiben, wenn Boundary-Gates
ihre produktive Wiedereinführung verhindern und ihr aktueller Evidence-Wert
benannt ist.

### Konkrete Arbeit

- tote Legacy-Plan-, Override- und Fallbackdateien entfernen; noch
  evidence-tragende Altverträge ausdrücklich in Test-/Evaluation-Scopes
  quarantänisieren;
- `TacticalGoal` als Legacy-Autoritätsvertrag entfernen beziehungsweise in
  typisierte, an die aktuelle `stateVersion` gebundene Goal-/Threat-Signale
  überführen. Diese Signale sind kurzlebig, nicht persistent und niemals
  Action-Autorität; persistente Handlungsautorität besitzen ausschließlich
  Planinstanzen;
- den Strategic-Intent-Vertrag trennen: P1–P3 dürfen den aktuellen Intent mit
  belastbarer Evidence übergehen; P4/P5 benötigen Intent-Fit oder explizite
  taktische Evidence. Intent-Wechsel erfolgen nur bei Phasenwechsel,
  belastbarer neuer Information oder Planabschluss/-invalidierung, nicht
  durch normale Action-Schwankungen;
- verbliebene Legacy-TacticalGoal- und Semantic-Runtime-Abhängigkeiten aus
  öffentlichen Entry-Points, Dependency-Komposition und Exporten entfernen;
- Exporte, Source-Structure- und Package-Boundary-Gates aktualisieren;
- WIP 0.7 mit erreicht/offen abgleichen;
- AI-README, CODEX_STATUS, Projektstatus und Monatslog aktualisieren;
- Final Review mit Checks, Metriken, Abweichungen und Restpunkten;
- belegten Restpunkt für eine strukturierte Engine-Continuation-ID festhalten:
  `ChoiceRequest` und LegalAction sollen eine gemeinsame `originActionId` oder
  `continuationId` tragen, damit mehrstufige Planaktionen nicht dauerhaft
  `choice.source` parsen müssen. Die aktuelle PF15-Korrektur bleibt eng und
  verhindert ungebundene Choice-Aktionen vor der Ausführung; die größere
  Engine-Vertragsmigration gehört in PF16 beziehungsweise ein daraus
  abgeleitetes Folgepaket;
- aktuelles `main` in den Arbeitsbranch integrieren;
- finale Gates ausführen.

### Aktueller PF16-Nachweis

- `TransientPlanSignal` formalisiert kurzlebige, side- und exakt
  `stateVersion`-gebundene Goal-/Threat-Signale. Stale/future Signale,
  unbekannte Felder und Autoritätsfelder wie `actionIds` scheitern
  fail-closed. Produktive Signalquellen existieren für Runner-Remote-Contest,
  Survival, Terminal Wins und Corp-Scoreprojekte. Der Scheduler bindet nur
  die exakte Kombination aus Planmodul, residentem `dedupeKey` und Ziel;
  Module dürfen keine eigene taktische Evidence injizieren.
- Priority-Override und Intent-Mutation sind getrennt. P1/P2 benötigen starke
  beobachtete Evidence, P3 starke Machbarkeit plus Evidence; P4/P5 verlangen
  Intent-Fit oder ein aktuelles explizites taktisches Signal. Intent-Wechsel
  sind ausschließlich an belegte Revalidierungsgrenzen gebunden. Als
  produktiver Live-Trigger ist aktuell der öffentliche Abschluss der
  Setup-/Mulliganphase für beide Seiten angeschlossen. Die weiteren
  typisierten Gründe `new_information`, `plan_completed` und
  `plan_invalidated` benötigen vor produktiver Nutzung jeweils einen
  side-sicheren Evidence-Produzenten.
- Der öffentliche transitive Livegraph enthält keine alten TacticalGoal-,
  SemanticChoice-, PracticalMicro-, TacticalPlan-Memory- oder
  TacticalPlan-Override-Abhängigkeiten mehr. Öffentliche TacticalGoal-Exporte
  und `ownRunnerTacticalGoals` sind entfernt.
- Live und Simulation verwenden denselben Plan-first-Live-Einstieg. Der
  historische `semantic-runtime.ts`-Altvertrag bleibt ausschließlich als
  isolierter Test-/Evaluation-Harness bestehen und ist durch
  Authority-/Module-Boundarytests vom produktiven Livegraphen ausgeschlossen.
- `runner.resource_lifecycle` besitzt einen instanzgenauen, Engine-gequoteten
  Vertrag für Halten, Finanzierung und Verlassen von `Loan from Chiba`;
  Erwerb und Entwicklung bleiben Economy-Aufgaben.
- Der zusammengeführte PF16-Stand ist mit AI-Typecheck, `246/246` gezielten
  Signal-/Intent-/Authority-/Runtime-Tests, `149/149`
  Runtime-/Real-Engine-/Baseline-Repros, Paketgrenzen, Source Structure ohne
  Runtime-/Typzyklen, `check:ai` und Diffcheck verifiziert.
- Die vollständigen Abschlussgates sind grün: 496/496 AI-Testdateien mit
  3.966/3.966 Tests, 207/207 Engine-Testdateien mit 1.795/1.795 Tests,
  Workspace-Typecheck, Contracts, Package-/Source-Struktur, Doctrine,
  Proteus sowie die finale Baseline mit 60 Spielen, 11.012 Entscheidungen
  und 0 harten Fehlern.
- Final Review und Wissensabgleich sind abgeschlossen. Noch offen sind der
  PF16-Commit, der Main-Abgleich und die lokale Abschlussintegration.

### Finale Checks

```text
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm typecheck
corepack pnpm test:contracts
corepack pnpm check:package-boundaries
corepack pnpm check:ai-source-structure
corepack pnpm check:ai
corepack pnpm check:ai-deck-doctrine-strategy
corepack pnpm check:proteus-ai-readiness
corepack pnpm benchmark:ai-behavior
git diff --check
```

### Done-Gate

- alle Tests und Gates grün;
- WIP-Zielbild und Runtime-Abweichungen dokumentiert;
- produktiver Importgraph enthält keine Legacy-/Fallback-Auswahl;
- Arbeitsbranch ist sauber und lokal integrierbar.

### Commit

`docs(ai): close plan-first runtime cutover`

## Paketübergreifende Verifikationsregeln

Nach jedem Paket:

```text
corepack pnpm --filter @netgrid/ai typecheck
<paketnahe vitest-Dateien>
git diff --check
git status --short
```

Nach Kernel-/Cutoverpaketen zusätzlich:

```text
corepack pnpm check:ai-source-structure
corepack pnpm check:package-boundaries
```

Tests mit Timeout, abgebrochenem Prozess oder ungeklärter unhandled rejection
gelten als rot.

## Worktree-, Git- und Integrationsregeln

- ausschließliche Umsetzung im Worktree
  `C:\Projekte\NETGRID_AI_PLAN_FIRST_RUNTIME_CUTOVER`;
- Arbeitsbranch `codex/ai-plan-first-runtime-cutover`;
- Hauptworkspace nur für finalen lokalen Merge;
- genau ein Commit pro abgeschlossenem Paket, zusätzliche enge Fixcommits nur
  wenn ein nachträglicher Paketfehler dies erfordert;
- keine fremden Änderungen überschreiben;
- vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren;
- bevorzugter Fast-Forward-Merge nach `main`;
- kein Push und kein Pull Request;
- Worktree erst nach grünem Main-Gate entfernen;
- Entfernung in Git und Dateisystem verifizieren;
- gemergten Arbeitsbranch anschließend mit `git branch -d` löschen.

## Controller-Prompt-Kern

```text
/Goal Arbeite KI-Plan-first-Runtime-Cutover vollständig und sequenziell von
PF00 bis PF16 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis,
docs/architecture/ai/ai-plan-layer-target-state-wip.md und dieses
Prozessartefakt.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_PLAN_FIRST_RUNTIME_CUTOVER auf Branch
codex/ai-plan-first-runtime-cutover. Nutze den Hauptworkspace nur für den
finalen Merge.

Arbeite immer nur am aktuellen Paket. Überspringe kein Paket. Führe die
Paketchecks aus und committe jedes bestandene Paket. Kaschiere fehlende
Planmodule, Semantik, Routes oder Ressourcenauflösung niemals durch einen
allgemeineren Fallback. Erzeuge stattdessen eine klassifizierte Failure,
ordne sie einem fachlichen Owner zu und behebe sie im zuständigen Paket.

Bei IllegalAction, Hidden-Info-Leak, Replay-/StateHash-Abweichung,
Nondeterminismus, Future-/Stale-Action-ID, unbelegtem P1/P2-Claim,
Supportzyklus oder produktivem Legacy-/Fallback-Rückfall stoppe im aktuellen
Paket und dokumentiere die Removal Condition.

Nach PF16: aktuelles main integrieren, finale Checks wiederholen, lokal nach
main mergen, main prüfen, den sauberen Arbeits-Worktree entfernen, Entfernung
in Git und Dateisystem verifizieren und den gemergten Arbeitsbranch löschen.
Goal erst danach als complete markieren.
```

## Abschlusskriterien

- PF00 bis PF16 jeweils mit bestandenem Done-Gate committed;
- neue Plan-first-Runtime ist einziger Livepfad;
- keine produktive Action-over-Plan-Override-Schicht;
- keine generische Fallback-Kaschierung;
- jede freiwillige Hauptaktion vollständig planattribuiert;
- alle Failure-Klassen rot und redigiert statt ersatzhandelnd;
- Runner-/Corp-Slices, Hidden-Info und Full-Match-Baseline grün;
- lokal nach `main` integriert;
- Worktree und Arbeitsbranch nachweislich entfernt;
- `/Goal` als complete markiert.
