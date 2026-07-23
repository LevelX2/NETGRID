# KI-Plan-first-Runtime-Cutover – sequenzieller Umsetzungsprozess

Status: **implementing**
Quelle/Vorgabe: Nutzerauftrag und
`docs/architecture/ai/ai-plan-layer-target-state-wip.md` Version `0.3`
Primärer Agent: `release-planning-agent`, Umsetzung später
`release-implementation-agent`
Branch: `codex/ai-plan-first-runtime-cutover`
Worktree: `C:\Projekte\NETGRID_AI_PLAN_FIRST_RUNTIME_CUTOVER`

Aktueller Paketstand:

- PF00: abgeschlossen, Commit `2d865be44`
- PF01: abgeschlossen, Commit `46f5df39b`
- PF02: abgeschlossen, Commit `e19287242`
- PF03: abgeschlossen, Commit `0b4af1640`
- PF04: abgeschlossen, Commit `f1caa8e98`
- PF05: abgeschlossen
- nächstes Paket: PF06

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
- observational-equivalence-Paare;
- komplette AI-Shards, Typecheck, Contracts und AI-Gates;
- AI Behavior Baseline mit qualitativen Vollaudits;
- Full Matches müssen regulär enden oder eine klassifizierte echte
  Modul-/Semantiklücke melden.

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

Nur den neuen aktuellen Vertrag im Repository behalten.

### Konkrete Arbeit

- tote Legacy-Plan-, Override- und Fallbackdateien entfernen;
- Exporte, Source-Structure- und Package-Boundary-Gates aktualisieren;
- WIP 0.3 mit erreicht/offen abgleichen;
- AI-README, CODEX_STATUS, Projektstatus und Monatslog aktualisieren;
- Final Review mit Checks, Metriken, Abweichungen und Restpunkten;
- aktuelles `main` in den Arbeitsbranch integrieren;
- finale Gates ausführen.

### Finale Checks

```text
corepack pnpm --filter @netgrid/ai test
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
