# Zug- und Kampagnenplanung

Status: **aktueller Detailvertrag für Corp und Runner**  
Stand: 2026-09-10

Diese Seite definiert Suche, Projektion, Kampagnenwert, Zugcommitment und
Revalidierung. Autoritätsgrenzen begründet das [Zielbild](target-architecture.md);
Lifecycle, Parent-/Need-Bindung und aktuelle Ausführung definiert der
[gemeinsame Planvertrag](planning-architecture.md). Fachliche Ziele liegen
bei den [Runner-](runner-plan-contracts.md) und [Corp-Ownern](corp-plan-contracts.md).

Die Typblöcke erläutern Konzepte; sie sind keine kopierte API-Spezifikation.
Für reale Feldnamen, Pflichtfelder und Signaturen gelten die folgenden Quellen.
Konzeptionelle Namen ohne entsprechendes Symbol begründen keinen neuen Hook.

## Implementierungskarte

| Fähigkeit                                                                                           | Reale Quelle                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules Context, side-sichere Identität, Invocation, Head, TurnPlan, Value Claims, Bewertungsregister | [turn-planning-contracts.ts](../../../packages/ai/src/plans/turn-planning-contracts.ts)                                                                                                                                          |
| Aktuelle Routen aus residenten Modulen                                                              | `enumerateCurrentPlanSchedulerRoutes` in [plan-scheduler.ts](../../../packages/ai/src/plans/plan-scheduler.ts)                                                                                                                   |
| Corp-/Runner-Adapter, Headbildung und fachliche Projektionen                                        | [corp-turn-planner-shadow.ts](../../../packages/ai/src/plans/corp-turn-planner-shadow.ts), [runner-turn-planner-shadow.ts](../../../packages/ai/src/plans/runner-turn-planner-shadow.ts); produktiv mit `authorityMode: cutover` |
| Score-/Defense-Mehrschrittlinien                                                                    | [corp-agenda-turn-planning.ts](../../../packages/ai/src/plans/corp-agenda-turn-planning.ts), [corp-defense-turn-planning.ts](../../../packages/ai/src/plans/corp-defense-turn-planning.ts)                                       |
| Projektionsframe und zertifizierte Deltas                                                           | [turn-projection.ts](../../../packages/ai/src/plans/turn-projection.ts)                                                                                                                                                          |
| Begrenzte Suche und Paretofronten                                                                   | `searchDeterministicRemainderTurnPlans` in [turn-remainder-search.ts](../../../packages/ai/src/plans/turn-remainder-search.ts)                                                                                                   |
| Commitment, Lease, Receipt, Restart und tatsächlicher Zugabschluss                                  | [turn-plan-commitment.ts](../../../packages/ai/src/plans/turn-plan-commitment.ts)                                                                                                                                                |
| Aktuelle Auswahl und Bindung                                                                        | `resolveTurnPlannerCutover` in [corp-turn-planner-cutover.ts](../../../packages/ai/src/plans/corp-turn-planner-cutover.ts), von beiden Seiten verwendet                                                                          |
| Residente Corp-Kampagnen über den Gegnerzug                                                         | [corp-opponent-campaign-continuity.ts](../../../packages/ai/src/plans/corp-opponent-campaign-continuity.ts) und [resident-plan-portfolio.ts](../../../packages/ai/src/plans/resident-plan-portfolio.ts)                          |

### Konzeptionelle Namen und tatsächliche Darstellung

| Name in einem erklärenden Beispiel                                            | Produktive Darstellung / Grenze                                                                                                                                                    |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CampaignContinuationQuote`                                                   | `CampaignMilestoneQuote` und `CampaignValueClaim` in `turn-planning-contracts.ts`; fachliche Quotes insbesondere in `corp-agenda-turn-planning.ts`                                 |
| `TurnStepOption`, `TurnLineCandidate`                                         | `TurnRemainderSearchOffer`, `TurnRemainderSearchStep`, `TurnRemainderSearchLine` in `turn-remainder-search.ts`; gebundener Plan als `TurnPlan`                                     |
| `LineEvaluationComponentDefinition`, `LineRiskVector`, `LineContinuityVector` | `TurnPlanEvaluationDimension` und `TURN_PLAN_EVALUATION_REGISTRY` sowie gebundene `evaluationValues`; das umfangreichere Beispielschema ist keine implementierte Register-API      |
| `PriorityObligationRegistry`                                                  | `ValidatedPriorityObligation` und `PriorityCoverage`, produziert/validiert in den Plannerverträgen; keine zusätzliche Registry-Instanz dieses Namens                               |
| `CorpHandPlanningRecord`                                                      | `CorpHandInventoryFacts` und `CorpHandRouteCoverageRecord` in [corp-hand-inventory-facts.ts](../../../packages/ai/src/runtime/corp-hand-inventory-facts.ts)                        |
| `TurnPlanRandomizationEligibility`                                            | `randomizationEligibility` einer zulässigen Corp-Agenda-Linie; kein allgemeiner Randomisierungsfreibrief                                                                           |
| `PersistedTurnPlanRandomizationDecision`                                      | Engine-Quote/Command/Receipt `EngineRandomizedTurnPlanSelection*` in [shared](../../../packages/shared/src/index.ts); kein gleichnamiges allgemeines Feld des `TurnPlanCommitment` |
| `TurnPlannerTrace`                                                            | `AiTurnPlanningDebug` in [shared](../../../packages/shared/src/index.ts) und seine Runtime-Projektion                                                                              |

Die Beispiele erläutern bestehende Anforderungen. Eine dort zusätzlich
skizzierte Datenstruktur ist weder ein bereits vorhandenes Symbol noch ein
Auftrag, sie vorsorglich einzuführen. Neue Anforderungen werden am heutigen
Vertrag und mit eigener Abnahme begründet.

## 1. Zug- und Kampagnenverträge

Die folgenden Typen zeigen den beabsichtigten Vertrag. Namen und Felder sind
Teil des Reviewgegenstands; sie sind noch nicht implementiert.

### 1.1 `PlanningRulesContext`

Der Planer muss denselben Regel- und Formatstand über alle Quotes, Frames,
Linien, Commitments, Traces und Checkpoints binden.

```ts
type PlanningRulesContext = {
  rulesBaselineFingerprint: string;
  rulesVersion: string;
  engineSchemaVersion: string;
  cardImplementationVersion: string;
  deviationRegistryVersion: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  plannerPolicyVersion: string;
  actionSemanticSchemaVersion: string;
  planModuleSetFingerprint: string;
  lineEvaluationRegistryVersion: string;
  campaignValuePolicyVersion: string;
};

type PlanningStateIdentity = {
  stateVersion: number;

  // Einzige Zustandsidentität für Ranking, Cache, Line-/Candidate-IDs und
  // Replanentscheidungen.
  sideSafePlanningFingerprint: string;

  // Optionaler opaker Engine-Token ausschließlich für Freshness-Validierung.
  // Er darf niemals Ranking, Sortierung, Cachepartition oder IDs beeinflussen.
  engineFreshnessToken?: string;
};
```

Der Rules-Fingerprint ist eine kanonische, versionierte Serialisierung der
realen NETGRID-`RulesBaseline`-Felder plus Formatprofil und Planner-Policy.
Er ist kein lossy Hilfshash und kein Ersatz für die einzelnen
Diagnosefelder. Der getrennte `sideSafePlanningFingerprint` entsteht
ausschließlich aus PlayerView, eigenen bekannten Daten, PublicEvents und
aktuellen LegalAction-Semantiken. Unterschiedliche gegnerische Hidden-Zonen
bei identischem side-sicheren Input müssen denselben Planning-Fingerprint,
dieselben Candidate-IDs und dieselbe Linie erzeugen.

Ein vollständiger `GameState`-Hash ist keine Planneridentität. Ein opaker
Engine-Token darf nur feststellen, dass ein rematerialisierter aktueller
Step noch frisch ist; sein Wert darf keine fachliche Entscheidung
beeinflussen.

Der aktuelle `AiDecisionInput` transportiert noch keinen vollständigen
Planning-Rules-Kontext. Seine side-sichere Erweiterung ist deshalb ein
explizites Vorbedingungspaket. Quotes oder Commitments mit abweichendem
Kontext werden fail-closed abgewiesen.

Ein Server- oder KI-Runtime-Neustart löst unabhängig vom Fingerprint
`runtime_restarted` aus. Danach werden Kampagnen requotet,
`TurnPlanCommitment`s verworfen und neu geplant. Ein weiterhin gültiges
hartes `PlanCommitment` wird revalidiert und bleibt zwingende Vorgabe. Ein
reiner Client-Reconnect ohne Runtime-Neustart ist kein Replan-Grund.

### 1.2 Routendefinierende Invocation

Eine Action-ID allein identifiziert nicht immer die zu bewertende Variante.
Targets und Choices werden nach ihrer Planungsrolle getrennt:

```ts
type ChoicePlanningRole =
  | "route_defining"
  | "resolution_only"
  | "observation_boundary";

type BoundTargetSlot = {
  slotId: string;
  values: PlanTargetRef[];
  ordering: "single" | "ordered" | "unordered";
};

type CanonicalChoiceValue =
  | { kind: "boolean"; value: boolean }
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "target"; value: PlanTargetRef }
  | {
      kind: "target_list";
      values: PlanTargetRef[];
      ordering: "ordered" | "unordered";
    };

type CanonicalLegalActionInvocation = {
  semanticActionType: string;
  sourceCardInstanceId?: string;
  sourceAbilityId?: string;
  boundTargets: BoundTargetSlot[];
  boundChoices: Array<{
    choiceId: string;
    role: ChoicePlanningRole;
    value: CanonicalChoiceValue;
  }>;
  invocationKey: string;
};

type CurrentLegalActionBinding = {
  actionId: string;
  stateVersion: number;
  semanticActionSetFingerprint: string;
  invocationKey: string;
};
```

Bekannte Ziele werden über einen erweiterbaren typisierten Vertrag
referenziert:

```ts
type PlanTargetRef =
  | { kind: "card"; cardInstanceId: string }
  | { kind: "server"; serverId: string }
  | {
      kind: "ability";
      sourceCardInstanceId: string;
      abilityId: string;
    }
  | { kind: "player"; side: Side }
  | { kind: "zone"; zoneId: string }
  | { kind: "value"; value: number }
  | { kind: "target_set"; targets: PlanTargetRef[] };
```

Die technische Bindung erfolgt bevorzugt über stabile Instanz- und
Ability-IDs. Kartendefinition und Kartenname dürfen für fachliche Bewertung,
Trace und Erklärung verwendet werden. Verboten sind nur verteilte
kartennamenspezifische Sonderentscheidungen im allgemeinen Scheduler.

`invocationKey` ist eine kollisionsfreie kanonische Serialisierung aus:

- side-sicherem Planning-Fingerprint;
- semantischem Actiontyp und konkreter eigener Source-Instanz;
- routendefinierenden Targets;
- routendefinierenden Choices.

Nur ein aktueller `TurnPlanningHeadCandidate` besitzt zusätzlich eine
`CurrentLegalActionBinding`. Zukünftige semantische Steps enthalten weiterhin
keine Action-ID. Damit wird der sinnvolle aktuelle LegalAction-Beleg nicht
mit einer verbotenen zukünftigen Action-ID vermischt.

Kanonisierung:

- ungeordnete Zielmengen werden nach ihrem typisierten kanonischen Schlüssel
  sortiert; geordnete Mengen behalten ihre Reihenfolge;
- Zahlen müssen endlich und normalisiert sein;
- doppelte Ziele und doppelte Choice-Slots sind ungültig;
- optionale Felder besitzen genau eine kanonische Abwesenheitsdarstellung;
- `lineId`, `candidateId` und Opportunity-Keys werden aus diesen
  side-sicheren Inhalten abgeleitet, nie aus Enumerationsreihenfolge oder
  fortlaufenden Zählern.

Regeln:

- bekannte Server-, Karten-, X-Wert- oder Verteilungsentscheidungen, die
  Kosten, Ziel oder Linienwert ändern, werden vor der Linienbewertung
  planlokal gebunden;
- reine Resolution-Choices werden erst nach Auswahl der Linie und aktuellen
  Route gelöst;
- eine Choice mit nicht beobachtbarem oder gegnerischem Ausgang wird als
  Beobachtungsgrenze behandelt;
- `engine_only`-Targets dürfen von der KI nicht enumeriert werden;
- die Engine revalidiert die vollständige ausgewählte Invocation weiterhin
  autoritativ.

Das zuständige Planmodul erzeugt die konkrete Variante. Der zentrale
Semantikvertrag validiert ihre Planungsrolle; weder Scheduler noch einzelne
Module dürfen widersprüchliche globale Klassifikationen etablieren. Im
Zweifel ist eine Auswahl `route_defining`, sobald sie Kosten, Ziel, Wirkung
oder Folgeoptionen verändert.

Die bestehende Zielregel „Choice erst nach Actionwahl“ wird damit nicht
pauschal aufgehoben, sondern auf `resolution_only` präzisiert.

### 1.3 `TurnPlanningHeadCandidate`

Vor der Executorwahl dürfen konkrete aktuelle Varianten nur als nicht
autoritative Planungsbelege existieren:

```ts
type TurnPlanningHeadCandidate = {
  candidateId: string;
  planInstanceId: string;
  rootPlanInstanceId: string;
  stepFingerprint: string;
  rulesContext: PlanningRulesContext;
  stateVersion: number;
  invocation: CanonicalLegalActionInvocation;
  currentBinding: CurrentLegalActionBinding;
  immediateProjection: ProjectedOutcomeDelta;
  executableWitness: ExecutableWitness;
  guarantee: GuaranteeLevel;
  evidenceCodes: string[];
};

type ExecutableWitness = {
  stateVersion: number;
  sideSafePlanningFingerprint: string;
  semanticActionSetFingerprint: string;
  stepFingerprint: string;
  invocationKey: string;
  quoteIds: string[];
  safetyPolicyVersion: string;
  allRouteDefiningChoicesBound: boolean;
};
```

Ein Planning Head:

- stammt ausschließlich aus einer aktuellen LegalAction;
- besitzt keine Executor- oder Ausführungsautorität;
- darf für alle konkurrierenden bereiten Planinstanzen erzeugt werden;
- wird nach Auswahl der Linie nicht direkt ausgeführt;
- muss als gewählter erster Step durch das zuständige Modul erneut zu einer
  echten `PlanRoute` materialisiert werden;
- muss dabei Step-Fingerprint, Invocation, StateVersion, Quote und Choices
  exakt wiederfinden;
- schlägt bei Abweichung fail-closed fehl.

Planning Heads erhalten ihre `candidateId` aus
`sideSafePlanningFingerprint`, Root, Step und `invocationKey`. Ein
Engine-Freshness-Token ist ausdrücklich kein Bestandteil dieser ID.

### 1.4 Modulare Projektionsschnittstelle

Der Scheduler darf zukünftige Steps nicht aus Kartenwissen rekonstruieren.
Die Domänenlogik bleibt in den Planmodulen:

Die Fähigkeit ist auf reale Dienste verteilt: `enumerateCurrentPlanSchedulerRoutes`
liefert aktuelle Routen; die side-spezifischen TurnPlanner und ihre fachlichen
Projektionsdienste erzeugen die Zukunftsoptionen. Horizontfähigkeiten stehen
im jeweiligen `*_TURN_PLANNING_MODULE_COVERAGE`-Register. Ein
`TurnPlanningModuleExtension` mit zusätzlichen Lifecycle-Methoden existiert
nicht auf `PlanModule`; siehe [Implementierungskarte](#implementierungskarte).

Normen:

- das Modul projiziert nur seine eigene Fachdomäne;
- gemeinsame Ressourcen-, Timing-, Rules- und Parentverträge validiert der
  Kernel;
- zukünftige Optionen enthalten keine Action-IDs;
- fehlende Zukunftsprojektion beendet oder verwirft nur den betreffenden Ast;
- sie erzeugt keinen globalen `PlanResolutionFailure`;
- ein harter Runtimefehler entsteht erst, wenn der ausgewählte aktuelle Step
  nicht legal und invocation-genau bindbar ist;
- Module ohne vollständige Zukunftsprojektion liefern eine belegte aktuelle
  Single-Step-Linie mit
  `projection_not_supported` als Stopgrund.
- `current_turn_only`-Module müssen vollständig am aktuellen TurnPlan
  teilnehmen, benötigen aber keinen künstlichen Fortsetzungswert;
- `campaign_capable`- und `context_dependent`-Module müssen für eine
  tatsächlich mehrzügige Instanz eine validierbare Kampagnenquote liefern.

Für v1 gilt bewusst eine enge Discovery-Grenze:

- zukünftige Root-Phasen dürfen nur bereits residente Planinstanzen oder
  bereits admission-geprüfte Child-/Supportbeziehungen referenzieren;
- eine deterministische Aktion, die voraussichtlich erstmals eine neue
  Planinstanz erzeugt, endet mit
  `projected_plan_discovery_required`;
- erst im tatsächlich erreichten Zustand läuft normale Discovery und plant
  den Restzug neu;
- der Scheduler erzeugt keine hypothetischen Planinstanzen und persistiert
  keine zukünftigen Proposals.

Damit wird eine zweite hypothetische Portfolio-Lifecycle-Engine vermieden.
`ProjectedPlanProposal`s bleiben eine mögliche spätere Erweiterung und sind
kein Bestandteil des aktuellen Vertrags. Ein gebundener zukünftiger Phasenroot
bleibt im residenten Portfolio in seiner aktuellen Rolle und wird erst beim
real validierten Phase Entry `foreground`.

### 1.5 `CampaignValueClaim`

Kampagnen melden keine frei gewichteten globalen Fortsetzungswerte. Sie
melden typisierte Fakten und Claims:

```ts
type CampaignValueClaim = {
  claimId: string;
  objectiveKey: string;
  componentKey: string;
  sourcePlanInstanceId: string;
  rootPlanInstanceId: string;
  dimension: CampaignValueDimension;
  aggregationMode:
    | "exclusive"
    | "replace"
    | "maximum"
    | "bounded_sum"
    | "delta_from_previous_prefix";
  contributionKind:
    | "objective_payoff"
    | "risk_reduction"
    | "funding_gap_reduction"
    | "option_preservation"
    | "tempo_delta"
    | "future_flexibility";
  beforeQuoteId: string;
  afterQuoteId: string;
  delta: ValueEnvelope;
  horizon: PlanDeadline;
  confidence: GuaranteeLevel;
  dependencyKeys: string[];
  conflictKeys: string[];
  evidenceCodes: string[];
};
```

Beispiel:

```text
score_window:<agendaInstanceId>:<targetServerId>
```

Ownership-Regeln:

- `corp.score_agenda` besitzt den eigentlichen Scorefenster- und
  Agenda-Payoff;
- `corp.defend_servers` liefert dazu höchstens die Verringerung des
  Contest-/Breach-Risikos;
- `corp.economy` liefert höchstens die Verringerung der Funding-Lücke;
- `corp.establish_scoring_remote` liefert höchstens Remote-Wiederverwendungs-
  und Optionswert;
- Supportpläne dürfen den Objective-Payoff des Roots nicht erneut
  beanspruchen;
- zwei exklusive `objective_payoff`-Claims mit demselben Ownership Key
  machen die Linienbewertung ungültig;
- Abhängigkeiten und Konflikte werden vor Aggregation als azyklischer Graph
  validiert.
- `exclusive` darf je `objectiveKey + componentKey` nur einmal vorkommen;
- sequenzielle Defense- oder Fundingverbesserungen verwenden
  `delta_from_previous_prefix` und müssen mit dem `beforeQuoteId` exakt an
  den vorherigen Line Prefix anschließen;
- `bounded_sum`, `maximum` und `replace` verwenden ausschließlich zentral im
  Register festgelegte Grenzen und Subsumptionsregeln.

### 1.6 `CampaignContinuationQuote`

```ts
type CampaignQuoteBasis =
  | {
      kind: "actual_state";
      stateVersion: number;
      sideSafePlanningFingerprint: string;
    }
  | {
      kind: "projected_frame";
      baseStateVersion: number;
      projectedFrameKey: string;
      linePrefixHash: string;
    };

type CampaignContinuationQuote = {
  quoteId: string;
  planInstanceId: string;
  moduleId: PlanModuleId;
  rulesContext: PlanningRulesContext;
  stateVersion: number;
  turnKey: string;
  basis: CampaignQuoteBasis;
  phase: string;
  currentMilestone: string;
  nextMilestone: CampaignMilestone;
  horizon:
    | "next_milestone"
    | "next_own_turn"
    | "next_score_window"
    | "bounded_multi_turn";
  viability: "ready" | "waiting" | "blocked" | "nonviable";
  expectedTurnsToMilestone: ValueRange;
  requiredResources: CampaignResourceRequirement[];
  protectedResources: ResourceReservationRequest[];
  opponentIntervention: OpponentInterventionEnvelope;
  valueFacts: CampaignValueFact[];
  valueClaims: CampaignValueClaim[];
  pauseConditions: PlanConditionRef[];
  abandonConditions: PlanConditionRef[];
  replanTriggers: ReplanTrigger[];
  evidenceCodes: string[];
};
```

Die Quote wird aus der residenten Planinstanz und dem aktuellen
side-sicheren Zustand abgeleitet. Sie ist keine zweite persistente
Planinstanz und besitzt keine Ausführungsautorität.

Vorher- und Nachher-Quote einer Claim-Differenz müssen dieselbe Kampagne,
Quoteversion, Wertpolicy und einen kausal anschließenden Line Prefix besitzen.
Zwei Linien aus derselben StateVersion erhalten deshalb unterschiedliche
Nachher-Quotes, sobald ihre `projectedFrameKey` oder ihr `linePrefixHash`
abweichen. Eine bloß StateVersion-gebundene hypothetische Quote ist ungültig.

Die zentrale side-spezifische `CampaignValuePolicy` prüft die Claims, bindet
sie an das Feature-Register und berechnet erst danach den inkrementellen
Fortsetzungswert.

### 1.7 `ProjectedDecisionFrame`

```ts
type ProjectedDecisionFrame = {
  side: Side;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  turnKey: string;
  timingPointClass: string;
  actionCapacityLedger: ProjectedActionCapacityLedger;
  ownCredits: ValueRange;
  ownHandCount: ValueRange;
  ownHandCapacity: number;
  ownKnownZones: ProjectedKnownZoneState[];
  ownKnownBoard: ProjectedOwnBoard;
  usageLedger: ProjectedUsageLedger;
  publicEventFacts: ProjectedPublicEventFacts;
  visibleOpponentBoard: ProjectedVisibleOpponentBoard;
  serverPostures: ProjectedServerPosture[];
  resourceLedger: ProjectedResourceLedger;
  portfolioForecasts: ProjectedPlanProgress[];
  projectedCleanup?: ProjectedCleanupOutcome;
  pendingBoundary?: BoundaryActionAssessment;
  uncertainty: ProjectionUncertainty[];
};
```

Dieser Frame ist ausdrücklich kein `GameState`. Er enthält nur:

- bereits side-sicher sichtbare Daten;
- eigene bekannte Daten;
- deterministische Folgen einer hypothetischen eigenen Aktion;
- typisierte Intervalle für unsichere Folgen.

Der kanonische `projectedFrameKey` umfasst mindestens bekannte eigene Zonen
und Instanzen, Planphase und Meilenstein, Root-/Need-Bindung,
Action-Capacity-Tokens, Reservierungen, einmal-pro-Zug-Nutzungen, relevante
öffentliche Eventflags, Claims, bereits realisierte Objective-Komponenten
und Beobachtungsstatus. Board und Credits allein reichen nicht zur
Zyklenkennung.

Das Action-Capacity-Ledger bildet nicht nur normale Klicks ab, sondern:

- unrestricted und eingeschränkte Zusatzaktionen;
- Action-Gain und Action Debt;
- kostenlose oder eingebettete Folgeaktionen;
- kontingente und garantierte Kapazität;
- Ablauf- und Nutzungsrestriktionen;
- bereits reservierte ActionDemands.

Es verwendet die vorhandenen `ActionDemand`-, `ActionCapacityRoute`- und
Ressourcenledger-Verträge als Basis.

### 1.8 Beobachtungsgrenzen ohne vorgeplante Recourse-Phasen

```ts
type TurnBoundaryKind =
  | "none"
  | "controlled_resolution"
  | "private_observation"
  | "public_random_outcome"
  | "opponent_response_window"
  | "engine_continuation"
  | "projection_not_supported";

type BoundaryActionAssessment = {
  boundaryKind: Exclude<TurnBoundaryKind, "none" | "controlled_resolution">;
  immediateValueClaims: CampaignValueClaim[];
  immediateOutcome: OutcomeEnvelope;
  remainingActionCapacityAfterBoundary: ProjectedActionCapacityLedger;
  postBoundaryOptionality: ValueEnvelope;
  residualTurnValueBasis:
    | "remaining_capacity"
    | "open_need_hit_distribution"
    | "hand_quality_distribution"
    | "public_outcome_distribution";
  hitProbabilityBands?: NeedHitProbabilityBand[];
  uncertainty: ProjectionUncertainty[];
  assumptionIds: string[];
};
```

Eine vollständig kontrollierte deterministische Resolution ist keine
Beobachtungsgrenze. Ein Draw, Search mit unbekanntem Ergebnis, gegnerischer
Bid oder unsicherer Access-Ausgang ist eine Grenze. Das zuständige Modul
bewertet den unmittelbaren Zweck, die bekannte Ergebnisverteilung,
Action-Capacity-, Hand- und Risikokosten der Grenzaktion. Der konkrete
TurnPlan endet dort. Nach dem tatsächlichen Ergebnis werden Zustand und
`LegalActions` neu aufgebaut und der verbleibende Zug vollständig neu
geplant. Es werden keine hypothetischen Folgephasen oder bedingten
Commitments hinter der Grenze erzeugt.

Der konservative `postBoundaryOptionality` ist kein Recourse-Plan. Er darf
nur verbleibende typisierte Kapazität, einen konkret benannten
Bedarfstreffer, Handqualitätsband oder öffentliche Ergebnisverteilung
bewerten. Er darf weder eine konkrete unbekannte Karte noch eine spätere
Route, Root-Phase oder Action annehmen. Ohne registrierte Basis ist der
Restwert null. So wird ein Draw mit drei verbleibenden Klicks fairer gegen
eine deterministische Linie verglichen, ohne die Entscheidung nach dem Draw
vorzutäuschen.

### 1.9 `TurnStepOption`

```ts
type TurnStepOption = {
  optionId: string;
  ownerPlanInstanceId: string;
  rootPlanInstanceId: string;
  executionBinding:
    | { kind: "root_step" }
    | {
        kind: "support_need";
        needId: string;
        assignmentId: string;
      }
    | {
        kind: "resolution_child";
        parentInstanceId: string;
      }
    | {
        kind: "urgent_response";
        obligationId: string;
      };
  capability: PlanStepCapability;
  target?: PlanTargetRef;
  currentPlanningHead?: TurnPlanningHeadCandidate;
  projectedCost: ResourceDelta;
  projectedOutcome: ProjectedOutcomeDelta;
  progressDelta: ProjectedPlanProgress[];
  valueClaims: CampaignValueClaim[];
  observationBoundary?: BoundaryActionAssessment;
  guarantee: GuaranteeLevel;
  evidenceCodes: string[];
};
```

Nur `currentPlanningHead.invocation` darf eine aktuelle Action-ID enthalten.
Alle Optionen hinter dem ersten Zustand werden semantisch beschrieben. Sie
dürfen konkrete bekannte `PlanTargetRef`s binden. Eine echte `PlanRoute`
entsteht erst nach Linien- und Executorwahl beziehungsweise bei späteren
Steps nach Rematerialisierung im dann aktuellen Zustand.

### 1.10 `TurnLineCandidate`

```ts
type TurnPlanPhase = {
  phaseId: string;
  rootPlanInstanceId: string;
  rootAssessmentFingerprint: string;
  entryFrameKey: string;
  entryConditions: PlanConditionRef[];
  completionCondition: PlanConditionRef;
  targetMilestone: CampaignMilestone | TurnMilestone;
  stepOptions: TurnStepOption[];
  protectedValueClaimIds: string[];
  transition:
    | {
        kind: "next_bound_phase";
        nextPhaseId: string;
        reasonCode: PhaseTransitionReason;
        resourceHandoffIds: string[];
      }
    | { kind: "turn_end" }
    | { kind: "observation_boundary" }
    | { kind: "projected_plan_discovery_required" };
  hardPlanCommitmentId?: string;
};

type TurnLineCandidate = {
  lineId: string;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  turnKey: string;
  phases: TurnPlanPhase[];
  projectedEnd: ProjectedDecisionFrame;
  priorityCoverage: PriorityCoverage;
  validatedValueClaims: CampaignValueClaim[];
  evaluationComponents: LineEvaluationComponent[];
  risk: LineRiskVector;
  continuity: LineContinuityVector;
  rank: LexicographicLineRank;
  stopReason:
    | "projected_turn_end"
    | "observation_boundary"
    | "projection_not_supported"
    | "projected_plan_discovery_required"
    | "bounded_search_horizon";
  stopEnvelope: ProjectedTurnStopEnvelope;
  optimisticUpperBound: ValueEnvelope;
  randomizationEligibility?: TurnPlanRandomizationEligibility;
};
```

`PriorityCoverage` ist keine einzelne höchste Rangzahl, sondern eine
kanonische Menge aktueller Pflicht-IDs:

```ts
type PriorityCoverage = {
  requiredObligationIds: readonly string[];
  satisfiedObligationIds: readonly string[];
  violatedObligationIds: readonly string[];
  deferredObligationIds: readonly string[];
};

type ValidatedPriorityObligation = {
  obligationId: string;
  priorityClass: "P1" | "P2" | "P3";
  sourcePlanInstanceId?: string;
  sourceSignalId?: string;
  activatedAtFrameKey: string;
  deadline: PlanDeadline;
  satisfactionCondition: PlanConditionRef;
  deferrable: boolean;
  deferUntil?: PlanDeadline;
  witnessId: string;
  guarantee: GuaranteeLevel;
};
```

Eine Linie ist nur innerhalb derselben Pflichtlage vergleichbar.
P1-/P2-/P3-Pflichten werden dadurch nicht gegenseitig verdeckt, nur weil
eine andere Pflicht derselben Klasse erfüllt wurde. Für eine zulässige Linie
muss `violatedObligationIds` leer sein; `deferredObligationIds` darf nur
vertraglich aufschiebbare Pflichten enthalten.

Die Pflichtmenge stammt ausschließlich aus zentral validierten
`ValidatedPriorityObligation`s. Searchpartitionen verwenden den kanonischen
Signaturkey aus required, satisfied und deferred IDs, nicht nur die höchste
Prioritätsklasse. P1/P2 werden nach jedem erwarteten Step geprüft. P3 wird
zusätzlich geprüft, wenn seine Deadline vor dem nächsten gebundenen
Replan-/Yield-Punkt liegt.

Eine Linie darf mehrere geordnete Phasen besitzen. Jede Phase besitzt genau
ein Root; andere Owner in ihren `stepOptions` müssen als exakte Leaves
dieses Phasenroots gebunden sein. Ein nicht als Phasenübergang modellierter
Rootwechsel, ein verletztes hartes Commitment oder ein ungeklärter
exklusiver Ressourcenkonflikt macht die Linie ungültig; es ist kein weicher
Malus.

Ein `projected_turn_end` ist noch keine Erlaubnis zu `end_turn`. Es trägt nur
Annahmen über die erwartete Restkapazität. Erst im real erreichten Zustand
erzeugt `*.complete_turn` den autoritativen aktuellen
`CurrentTurnCompletionCertificate` aus dem vollständigen LegalAction- und
Disposition-Set. Dabei müssen alle aktuellen Invocation-Varianten
klassifiziert und `assessment_unknown` beziehungsweise unaufgelöste
Invocations null sein.

### 1.11 `TurnPlanCommitment`

Der reale Typ [TurnPlanCommitment](../../../packages/ai/src/plans/turn-plan-commitment.ts)
bindet Regel-Fingerprint, Runtimeinstanz, vorherige und aktuelle side-sichere
Identität, Phasen/Knoten/Cursor, `phaseEntry`, Hard-Commitment-/Kampagnen-IDs,
Quotes/Claims, PriorityCoverage, erwarteten Übergang und Replanstatus.
`TurnPlanExecutionLease` autorisiert den aktuellen Node. Eine zufällige
Linienauswahl wird über den Engine-Commandvertrag gebunden; ein zusätzliches
allgemeines `randomizationDecision`-Feld ist keine bestehende Commitment-API.

`phases + nodes + cursor` sind die einzige kanonische
Fortschrittsdarstellung. `remainingNodes`, `currentPhaseId` und
`currentNodeId` werden bei Bedarf daraus abgeleitet und nicht als zweite
Wahrheit gespeichert. Jede Phase wird beim Eintritt gegen
`entryFrameKey`, `entryConditions`, Root-Assessment, NeedAssignments und
Ressourcenübergabe revalidiert. Schlägt diese Prüfung fehl, wird nicht
blind fortgesetzt, sondern typisiert neu geplant.

Das Commitment wird serverprivat zusammen mit dem residenten Portfolio
gespeichert. Es ist:

- stärker als ein loser Continuity-Bonus;
- schwächer als eine atomare Engine-Transaktion;
- nach jeder tatsächlichen Aktion neu zu validieren;
- bei erwarteter deterministischer Progression über bereits geplante
  Phasengrenzen hinweg fortzuschreiben;
- beim Zugwechsel geschlossen oder in eine Kampagnenwartelage überführt;
- frei von zukünftigen Action-IDs, aber nicht von stabilen bekannten
  Karten-, Objekt-, Server- oder Ability-Referenzen.

Ein vollständig projizierter Knoten ist nicht automatisch ein fachlicher
Planabschluss. Endet eine aktuelle Linie nur mit
`projected_plan_discovery_required`, wechselt das Commitment an die
`plan_internal_continuation_boundary`. Der TurnPlanner rematerialisiert dort
die nächste aktuelle `LegalAction` für dieselbe
`sequenceRootPlanInstanceId`; ein Folgevertrag verweist über
`predecessorCommitmentId` auf seinen Vorgänger. Dadurch bleiben Root,
Planinstanz, Route Head und Leaf-Executor nachvollziehbar, ohne eine
zukünftige Action-ID zur Regelautorität zu machen.

Eine bereits bekannte gleichrangige Alternative darf diese Rematerialisierung
nicht verdrängen. Die Bindung endet nur an einer positiven, typisierten
Grenze: neu sichtbare side-sichere Information, nachgewiesener Routenabschluss
oder Routenverlust, ein neu entstandener höherwertiger P1-/P2-/P3-Interrupt,
relevanter Ressourcen- oder Zieldrift oder eine ausdrückliche planinterne
Entscheidungsgrenze. „Eine Aktion wurde ausgeführt“ ist kein Replan-Grund.
Retention, Preemption und Release tragen strukturierte Diagnose mit altem
Owner, vorgesehenem nächsten Meilenstein, Grenztyp, Evidence und gegebenenfalls
übernehmendem Owner.

### 1.12 Commitment-Hierarchie

Die verbindliche Reihenfolge lautet:

```text
Pflichtfenster der Engine
>
aktives und validiertes PlanCommitment
>
TurnPlanCommitment
>
Persistence Policy und normale Hysterese
>
stabiler Tie-Break
```

Regeln:

1. Ein aktives `PlanCommitment` bildet einen zwingenden Prefix jeder
   zulässigen Turn-Line.
2. `locked_sequence` ohne aktuell validierten Schutzgraphen genügt nicht
   allein, um einen spekulativen zukünftigen Step hart zu machen.
3. Der Turn Planner darf aus einem späteren Step ein neues
   `PlanCommitment` vorbereiten; aktiv wird es erst über den normalen
   aktuellen Auswahl- und Receipt-Vertrag.
4. Eine Verzweigung des harten Fortsetzungsgraphen aktualisiert oder
   invalidiert den Turn Plan.
5. P1-/P2-Breakbedingungen folgen weiterhin dem vorhandenen
   PlanCommitment-Vertrag.
6. Das Turn Commitment darf niemals eine spekulative Capability durch bloße
   Aufnahme in `remainingNodes` zur `locked_sequence` hochstufen.

## 2. Erzeugung der Zugvarianten

### 2.1 Eingangsmenge

Der Scheduler beginnt mit:

- aktuellem `PlayerView`;
- aktuellen `LegalActions`;
- aktuellen `ActionSemanticCandidates`;
- residentem Portfolio;
- validierten PlanAssessments;
- dem kanonischen `PlanningRulesContext`;
- dem aktuellen `CorpHandInventoryFacts` und der daraus abgeleiteten
  planwirksamen Handklassifikation;
- gegebenenfalls einem aktiven, revalidierten `PlanCommitment`;
- aktuellen Kampagnenquotes;
- dem typisierten Ressourcen- und Action-Capacity-Ledger;
- Strategic Intent und Deckstrategie;
- gegebenenfalls aktivem `TurnPlanCommitment`.

### 2.2 Planungs-Heads vor der Executor-Auswahl

Die bestehende Reihenfolge

```text
Assessments
→ Executor auswählen
→ Route materialisieren
```

reicht für eine Zuglinienwahl nicht aus: Der Scheduler könnte nur Varianten
des bereits gewählten Executors sehen. Deshalb gilt im Zielstand:

```text
Assessments und residente Kampagnen
→ nichtautoritative Planning Heads enumerieren
→ semantische Linien projizieren und vergleichen
→ Phasenfolge, Linie und aktuellen Leaf-Executor auswählen
→ gewählten Head autoritativ rematerialisieren und revalidieren
→ aktuelle Route binden
```

Planning Heads dürfen die vorhandene Executorlogik nicht umgehen. Sie sind
vergleichbare Vorschläge mit einem ausführbaren aktuellen Witness. Erst die
nach der Linienwahl erneut aus den unveränderten `LegalActions`
materialisierte Route ist ausführbar. Scheitert diese Rematerialisierung,
liegt ein klassifizierter Bindungsfehler vor; der Scheduler darf nicht
stillschweigend einen anderen Head nehmen.

### 2.3 Planbeiträge statt globaler Aktionsliste

Jede ausführbare Planinstanz erzeugt null oder mehr `TurnStepOption`s.
Supportpläne erzeugen Optionen nur:

- für einen exakt offenen Parentbedarf;
- als Response- oder Resolution-Leaf des gebundenen Roots;
- oder als selbstständige Phase mit eigenem Root, wenn sie regulär Teil
  eines vollständigen TurnPlans wird.

Dadurch kann `corp.economy` nicht allgemein einen Credit anbieten und ihn
nachträglich irgendeinem Ziel zurechnen. Die Option muss bereits enthalten:

- welchen Bedarf sie schließt;
- welchem Parent sie dient;
- bis wann die Ressource benötigt wird;
- welcher Folge-Step dadurch erreichbar wird.

Ein Root darf keine unabhängigen P4-/P5-Ziele als eigene Leaves
vereinnahmen. Solche Ziele können jedoch als ausdrücklich geplante spätere
Root-Phasen desselben TurnPlans auftreten. Erreicht eine Phase ihr Ziel und
bleibt Action Capacity, folgt bei unveränderten Voraussetzungen die bereits
gebundene nächste Phase. Nur wenn keine weitere Phase belastbar vorplanbar
ist, endet der TurnPlan an einer typisierten Grenze.

### 2.4 Suchverfahren

Produktiv arbeitet `searchDeterministicRemainderTurnPlans` mit begrenzter,
deterministischer Suche und geschützten Paretofronten. Die konkrete Tiefe
und die Knotengrenzen stehen in `TurnRemainderSearchBudget` und den
side-spezifischen Aufrufern. Eine allgemeine Beam Search ist kein noch
abzuarbeitender Architekturauftrag. Eine tiefere Suche benötigt einen
belegten Mehrwert und eine eigene Laufzeit-/Qualitätsprüfung.

Ablauf:

1. routendefinierende aktuelle Invocations aus `LegalActions`,
   `ActionSemanticCandidates` und Planmodulen als Planning Heads erzeugen;
2. jede Option auf einen side-sicheren Projektionsframe anwenden;
3. nur das zuständige Planmodul um seine fachlich erlaubten semantischen
   Fortsetzungen bitten;
4. nicht projektierbare Fortsetzungen als Ende dieses Zweigs behandeln;
5. Claims, Kapazität, harte Commitments und Rootreinheit je Phase
   validieren;
6. inkompatible oder sicher dominierte Linien verwerfen;
7. über mehrere Root-Phasen bis zum realistisch projizierbaren Zugende,
   einer echten Unsicherheitsgrenze oder einem Projektionsende erweitern;
8. vollständige Linien mit zentral registrierten Komponenten
   lexikografisch bewerten;
9. beste Linie auswählen;
10. deren ersten Head autoritativ rematerialisieren und revalidieren;
11. Linie und aktuellen Step als `TurnPlanCommitment` binden.

„Future projection unsupported“ beendet nur diesen Zweig. Ein Modul ohne
Fortsetzungsprojektion kann weiterhin eine valide Single-Step-Linie oder
einen bewusst markierten Boundary-Head anbieten. Es bringt nicht den
gesamten Zugplaner zum Stillstand.

### 2.5 Action Capacity, Tiefe und Budgets

Suchtiefe ist nicht gleich Anzahl normaler Klicks. Jeder Knoten verbraucht
eine typisierte `ActionDemand`, die gegen vorhandene
`ActionCapacityRoute`s und das bestehende Plan-Resource-Ledger geprüft wird.
Damit werden auch eingeschränkte Aktionen, zusätzliche Aktionen,
Nicht-Klick-Fenster und bereits reservierte Kapazität korrekt behandelt.
Garantierter Action-Gain erweitert das Ledger und damit den planbaren
Horizont. Eine Operation, die eine Aktion kostet und zwei neue Aktionen
erzeugt, erhöht die Restkapazität netto um eine Aktion; folgende Install-,
Advance- oder andere Steps werden im selben TurnPlan mitgeplant. Zufälliger
Action-Gain beendet den konkreten Plan an der Unsicherheitsgrenze.

Die realen Abbruchbudgets stehen in `TurnRemainderSearchBudget`:
`maximumDepth`, `maximumExpandedNodes`, `maximumBranchesPerPartition` und
`maximumParetoLinesPerPartition`. Der Aufrufer kann sie begrenzt konfigurieren;
Defaultwerte stehen ausschließlich in der Implementierung. Semantische
Boundaries und nicht unterstützte Projektion begrenzen den Ast zusätzlich.
Diese Grenzen sind technische Suchbudgets, keine Spielregel.

Wanduhrzeit darf gemessen und als Cutover-Gate verwendet werden, aber weder
Abbruch noch Auswahl beeinflussen. Sonst könnte dieselbe Eingabe abhängig
von Rechnerlast zu einer anderen Aktion führen.

### 2.6 Sichere Beschneidung und geschützte Fronten

Eine globale „Top N nach Zwischenwert“-Kürzung kann verzögert wertvolle
Linien entfernen. Die Beam-Front wird deshalb mindestens partitioniert
nach:

- Root-Plan und Zielmeilenstein;
- höchster erfüllter Pflichtklasse;
- aktivem Hard-Commitment-Bezug;
- Beobachtungsgrenzenklasse;
- Garantie-/Risikoband.

Je viablem `Root × nächstem Meilenstein` bleibt mindestens ein
nichtdominierter Vertreter geschützt. Besitzen mehrere Varianten
unterschiedliche, nicht gegenseitig dominierte Risiko-, Ressourcen-,
Fortschritts- oder Unsicherheitsprofile, bleibt eine kleine geschützte
Pareto-Front erhalten. Zusätzlich gelten:

- Pareto-Erhalt für Wert, Risiko, Restkapazität und Unsicherheit;
- konservative Upper Bounds für noch nicht vollständige Linien;
- kein Pruning eines aktiven validen Hard-Commitment-Prefixes;
- kein Vergleich inkompatibler Rules Contexts;
- typisierte Prune-Gründe im Trace.

Die konkrete Maximalgröße dieser Mini-Front ist Kalibrierung; die Pflicht,
nicht nur nach einer globalen Zwischenpunktzahl zu beschneiden, ist
Architekturvertrag. Schutz bedeutet nur Fortbestand im Suchraum, nicht
spätere Auswahl.

### 2.7 Äquivalenzgruppierung

Optionen dürfen nur gruppiert werden, wenn identisch sind:

- Owner- und Root-Plan;
- Capability;
- konkretes Ziel;
- `invocationKey` einschließlich routendefinierender Choices;
- Kostenintervall;
- erwartetes Wirkungsintervall;
- Garantiegrad;
- Beobachtungsart;
- Wertclaims, Kampagnen- und Ressourcenwirkung.

Verschiedene Server, Karteninstanzen, ICE-Positionen oder Choice-Payloads
werden nicht allein wegen desselben LegalAction-Typs zusammengelegt.

Mehrere Schrittfolgen dürfen dagegen auf eine kanonische Reihenfolge
reduziert werden, wenn nachweislich:

- beide Reihenfolgen legal sind;
- Kosten, Zugendzustand und Value Claims identisch bleiben;
- keine Aktion die andere finanziert, freischaltet oder verändert;
- kein Trigger, keine Position, keine Reservierung und keine Deadline von
  der Reihenfolge abhängt;
- keine Unsicherheits- oder Reaktionsgrenze dazwischenliegt.

Zwei ICE an demselben Server sind beispielsweise nicht vertauschbar, wenn
ihre Installationsreihenfolge die späteren Positionen bestimmt.

### 2.8 Dominanz

Linie A dominiert Linie B nur, wenn:

- beide dieselben harten Prioritätspflichten erfüllen;
- beide dieselbe oder eine kompatible Folge von Phasenmeilensteinen
  verfolgen;
- beide denselben `PlanningRulesContext` besitzen;
- keine von beiden ein andersartiges geschütztes Hard-Commitment-Prefix
  trägt;
- A in keiner harten Ressource schlechter ist;
- A keinen höheren sichtbaren Worst-Case-Risikowert besitzt;
- A nach validierter Claim-Ownership in mindestens einer relevanten
  Wertdimension strikt besser ist;
- A nicht mehr Unsicherheit oder einen früheren ungeklärten
  Beobachtungsbruch erzeugt.

Damit wird eine scheinbar billige Remote-Installation nicht automatisch
gegenüber einer Defense-Linie behalten, wenn sie den gerade finanzierten
Schutzmeilenstein aufgibt.

## 3. Bewertung der Varianten

### 3.1 Erst harte Pflichten, dann Nutzen

Fachliche Zulässigkeit und harte Bindungen werden vor der weichen
Bewertung geprüft. Der tatsächliche Comparator `compareLines` in
[turn-remainder-search.ts](../../../packages/ai/src/plans/turn-remainder-search.ts)
vergleicht anschließend in dieser Reihenfolge:

1. weniger verletzte Pflicht-IDs;
2. mehr erfüllte Pflicht-IDs;
3. höherer Prioritätsrang der Linie, einschließlich P4 bis P6;
4. `rootPreferenceRank`, wenn beide Linien denselben Root besitzen;
5. Summe der registrierten `evaluationValues` mit ihrer jeweiligen Richtung;
6. `moduleCandidatePreferenceRank`;
7. verbleibende unbeschränkte Action Capacity, dann liquide Credits;
8. kürzere Folge, zuletzt stabiler `lineId`.

Diese Reihenfolge beschreibt die generische Restzugsuche. Die vorgeschalteten
Owner-/Pflichtprüfungen und die speziellen Agenda-/Defense-Linien bleiben
Bestandteil der side-spezifischen Adapter. Risiko, Kampagnenfortsetzung und
Kontinuität liefern gebundene Fakten beziehungsweise Werte; sie sind keine
zusätzlichen allgemeinen Comparator-Stufen in einer zweiten dokumentierten
Sortierliste. Insbesondere ist ein klassenübergreifender P4–P6-Ausgleich allein
durch weiche Zahlenwerte nicht implementiert und nicht durch diese
Konsolidierung freigegeben.

Zusätzlich sind Linien vor jeder weichen Bewertung ungültig, wenn sie:

- ein aktives und weiterhin legales Hard-Commitment ohne erlaubten
  Breakgrund verletzen;
- innerhalb einer einzelnen Phase mehrere unabhängige Roots besitzen;
- eine Kampagnenwert-Komponente doppelt beanspruchen;
- Rules-Context-, State- oder Invocation-Invarianten verletzen;
- einen ungeplanten Rootwechsel ohne Phasenübergang oder Replan-Grund
  enthalten.

### 3.2 Versioniertes Bewertungsregister

Es entsteht kein neuer, frei wachsender globaler Score-Monolith.
Bewertungsdimensionen werden in einem versionierten Register geführt:

```ts
type LineEvaluationComponentDefinition = {
  componentId: string;
  schemaVersion: number;
  side: "corp" | "runner" | "shared";
  priorityClass: "P4" | "P5" | "P6";
  comparisonMode: "lexicographic" | "bounded_weight";
  allowedClaimDimensions: readonly CampaignValueDimension[];
  unit: string;
  monotonicDirection: "higher_is_better" | "lower_is_better";
  aggregationMode:
    | "exclusive"
    | "replace"
    | "maximum"
    | "bounded_sum"
    | "delta_from_previous_prefix";
  excludesOrSubsumes: readonly string[];
  range: { min: number; max: number };
  evidenceRequirements: readonly string[];
};
```

P1 bis P3 sind keine weichen Registerkomponenten. Sie stammen aus einem
getrennten Pflichtvertrag aus `ValidatedPriorityObligation` und `PriorityCoverage` und wirken als harte
Zulässigkeits-, Deadline- und Defer-Verträge. Das reale `TURN_PLAN_EVALUATION_REGISTRY` liefert Qualitätsdimensionen
für P4 bis P6; der aktuelle Klassenrang bleibt davor maßgeblich. Dadurch kann
kein Zahlenbonus eine Pflicht imitieren oder überstimmen; P6 für endlichen
Normalfortschritt und Turn Completion ist ausdrücklich enthalten.

Planmodule liefern Fakten und `CampaignValueClaim`s, nicht ihre eigene
globale Rangzahl. Die side-spezifische Policy validiert Claims, wendet
registrierte Komponenten an und erzeugt daraus unter anderem:

- Sieg- und Agenda-Fortschritt;
- Central- und Remote-Defense;
- Rezbereitschaft;
- Economy und Liquidität;
- Handqualität, Handkapazität und Cleanup-Kosten;
- Boardentwicklung und gegnerisch verlorenes Tempo;
- Informationswert, Flexibilität und Deckstrategiefit.

Neue Komponenten brauchen Schema, Wertebereich, Ownership,
Evidenzanforderung, Gegenproben und Tracefeld. Verteilte Magic Numbers oder
planlokale, nicht registrierte Globalboni sind unzulässig.

Rein planinterne Fachbewertungen bleiben im zuständigen Modul, etwa der
Vergleich zweier ICE-Positionen innerhalb derselben Defense-Variante. Sobald
ein Wert unterschiedliche Roots, Phasen oder vollständige TurnPlans
gegeneinander beeinflusst, muss er über dieses zentrale Register laufen.

### 3.3 Risikovektor

```ts
type LineRiskVector = {
  terminalExposure: number;
  agendaExposure: number;
  centralBreachExposure: number;
  remoteContestExposure: number;
  unfundedRezLiability: number;
  handOverflowLiability: number;
  strandedResourceCost: number;
  opponentInterventionRisk: number;
  projectionUncertainty: number;
};
```

Die Bewertung nutzt einen robusten Vergleich aus:

- garantierter Mindestwirkung;
- erwarteter Wirkung;
- maximal möglicher Wirkung;
- Garantiegrad;
- sichtbarer gegnerischer Eingriffsmöglichkeit.

Eine spekulative hohe Obergrenze schlägt keinen deutlich besseren
garantierten Floor, wenn dadurch eine zentrale oder terminale Lücke entsteht.

### 3.4 Kontinuität

Kontinuität wird nicht nur als kleiner Bonus nach der Einzelplanbewertung
verwendet. Sie wird auf Linienebene berechnet:

```ts
type LineContinuityVector = {
  preservesActiveTurnCommitment: boolean;
  preservesCurrentPhaseRoot: boolean;
  preservesBoundPhaseSequence: boolean;
  closesFundedParentNeed: boolean;
  reachesPromisedMilestone: boolean;
  switchingCost: number;
  strandedPreparationCost: number;
};
```

`unjustifiedPlanSwitches` ist bewusst keine weiche Zahl mehr. Ein
unbegründeter Wechsel ist eine ungültige Linie.

Wenn D3 einen Credit exakt für einen Defense-Parent beschafft, enthält die
Linie danach eine geschlossene oder weiterhin reservierte
Defense-Fortsetzung. Eine nicht bereits als Folgephase gebundene
D4-Alternative darf nur an einem legitimen Replan-Punkt übernehmen, wenn:

- sie eine höhere harte Prioritätsklasse erfüllt;
- die Defense-Fortsetzung objektiv unmöglich wurde;
- eine neue Beobachtung ihre Bewertung materiell verändert;
- oder ihre gesamte Linie die definierte Wechselmarge überschreitet.

### 3.5 Hysterese

Hysterese wird nur an einem echten Replan-Punkt gegen Challenger
ausgewertet. Bei erwartetem Fortschritt wird nicht nach jedem Step die volle
Linienkonkurrenz neu eröffnet. Auch ein erwarteter Übergang zur bereits
geplanten nächsten Phase ist kein Challenger-Punkt. An einem zulässigen
Vergleichspunkt bleibt die gebundene Linie bei gleichem Prioritätsniveau
aktiv, solange ein
Challenger nicht:

- die konfigurierte Wechselmarge überschreitet;
- einen besseren garantierten Floor liefert;
- einen verfallenden Meilenstein rettet;
- oder einen expliziten Replan-Trigger erfüllt.

Die Hysterese darf keine P1-/P2-Reaktion blockieren.

## 4. Fortsetzungswert mehrzügiger Kampagnen

### 4.1 Problem

Eine reine Zugendbewertung benachteiligt mehrzügige Vorhaben. Ein Zug, der:

- ein Scoring-Remote auswählt;
- Credits und Rezreserve bindet;
- eine Agenda vorbereitet;
- aber noch nicht scort,

kann am Ende weniger unmittelbaren Wert zeigen als mehrere kurzfristige
Economy-Aktionen. Tatsächlich kann er aber den wesentlich besseren
Scorepfad für den nächsten Zug geschaffen haben.

### 4.2 Lösung

Jede relevante Kampagne liefert Fakten und eigentumsgebundene
`CampaignValueClaim`s. Die zentrale `CampaignValuePolicy` prüft Ownership,
Abhängigkeiten und Konflikte und berechnet erst danach den inkrementellen
Fortsetzungswert.

Für eine Linie `L` gilt konzeptionell:

```text
Gesamtwert(L)
  = unmittelbare Veränderung des projizierten Zugendzustands
  + Summe der validierten inkrementellen Kampagnenclaims nach L
  - zukünftige Verpflichtungen
  - sichtbare Eingriffsrisiken
  - Projektionsunsicherheit
  - Wechsel- und Strandungskosten
```

Für Kampagne `C`:

```text
inkrementeller Kampagnenwert(C, L)
  = Fortsetzungswert(C nach L)
  - Fortsetzungswert(C vor L)
```

Dadurch wird derselbe bereits vorhandene Boardwert nicht doppelt gezählt.

### 4.3 Vermeidung von Doppelzählung

Es gelten vier Zuständigkeiten:

- der Stellungsbewerter bewertet, was am Zugende tatsächlich auf Board, Hand
  und Creditpool vorhanden ist;
- das Fachmodul belegt nur seine registrierten, inkrementellen
  Zukunftsclaims;
- die zentrale Ownership-Policy entscheidet, welchem Root und welcher
  Wertdimension der Claim zugerechnet werden darf;
- ein bereits realisierter Meilenstein wird aus dem Fortsetzungswert entfernt
  und nur noch als Stellungswert geführt.

Beispiel:

- installiertes ICE besitzt Stellungswert;
- die Möglichkeit, es im nächsten Zug passend zu rezz(en), besitzt nur den
  inkrementellen Zusatzwert abzüglich Finanzierungs- und Eingriffsrisiko;
- derselbe Schutzwert darf nicht in beiden Komponenten vollständig
  erscheinen.

Zusätzliche Invarianten:

- `ownershipKey` ist innerhalb einer Linie eindeutig;
- Supportpläne dürfen den Root-Payoff nicht nochmals beanspruchen;
- Agenda erhält Scorefenster- und Konversionswert, Defense den
  inkrementellen Schutzbeitrag, Economy nur den noch nicht bereits als
  Creditbestand realisierten Enablerwert;
- konkurrierende Kampagnen dürfen dieselbe exklusive zukünftige Konversion
  nicht gleichzeitig voll bewerten;
- ein nicht auflösbarer Claimkonflikt macht die Linie ungültig und wird
  nicht durch anteilige Heuristik kaschiert.

### 4.4 Planungshorizont

Es wird ein hybrider Horizont verwendet:

1. aktueller Zug: so konkret wie side-sicher möglich;
2. bis zum nächsten Kampagnenmeilenstein: begrenzter semantischer Rollout;
3. dahinter: konservativer heuristischer `value-to-go`.

Für eine Agenda-Kampagne reicht der begrenzte Rollout typischerweise bis:

- zum vorbereiteten Scorefenster;
- über eine aggregierte sichtbare Gegnerreaktion;
- bis zum nächsten eigenen realistischen Scorefenster.

Es wird nicht versucht, beliebig viele vollständige Züge vorauszuberechnen.
Jeder zukünftige Meilenstein trägt dabei explizite Zug-, Action-Capacity-
und Verzögerungskosten. Ein späterer hoher Payoff darf nicht so bewertet
werden, als wäre er ohne Tempoverlust sofort verfügbar.

### 4.5 Gegnerische Reaktion

Die Kampagnenquote darf nur verwenden:

- sichtbaren gegnerischen Boardzustand;
- öffentliche Ereignisse;
- side-sichere Beliefs;
- allgemeine, deck- und phasenbezogene Risikomodelle;
- sichtbare Zugriffs-, Credit- und Breakerfähigkeit.

Sie darf keine konkrete unbekannte gegnerische Karte voraussetzen. Gegnerische
Intervention wird als Intervall oder Szenariomenge modelliert, beispielsweise:

- keine wirksame Intervention;
- sichtbarer Standard-Contest;
- starker, aber side-sicher plausibler Contest.

## 5. Referenzkampagne `corp.score_agenda`

### 5.1 Kampagnenidentität

Eine Agenda-Kampagne wird mindestens gebunden an:

- konkrete eigene Agenda-Instanz, sobald side-sicher ausgewählt;
- beabsichtigten Scoremodus;
- Zielserver oder definierte Fast-Advance-Linie;
- aktuellen Meilenstein;
- Credits, Klicks, Advancement- und Schutzbedarf;
- erwartetes nächstes Scorefenster.

### 5.2 Meilensteine

```text
agenda_available
→ score_path_selected
→ score_resources_funded
→ scoring_remote_prepared
→ agenda_installed
→ score_window_protected
→ advancement_complete
→ agenda_scored
```

Nicht jede Linie benötigt jeden Meilenstein. Fast Advance kann
`scoring_remote_prepared` überspringen; Remote Scoring darf es nicht.

### 5.3 Kampagnenquote

Die Agenda-Quote enthält:

- Agenda-Punkte und Siegdistanz;
- frühestes plausibles Scorefenster;
- Restkosten und Action Capacity bis zum Meilenstein;
- Schutz- und Rezreserve;
- sichtbare Erreichbarkeit des Remotes;
- Risiko des Agenda-Verlusts;
- Wahrscheinlichkeit, dass die Vorbereitung nach dem Gegnerzug noch
  verwertbar ist;
- Wert eines sicheren langsameren Pfads;
- Wert eines schnelleren riskanteren Pfads;
- explizite Abbruchbedingungen.

### 5.4 Beispiel: schneller gegen sicherer Pfad

Variante A:

```text
Agenda installieren
→ zweimal advancen
→ geringe Rezreserve
→ nächster Zug früh scorefähig
```

Variante B:

```text
Credit für Rezreserve
→ schützendes ICE installieren
→ Agenda noch auf HQ halten
→ Scorefenster einen Zug später, aber besserer Worst-Case-Floor
```

Der Scheduler vergleicht nicht „Install“ gegen „Credit“, sondern die
projizierten Linien:

- wann entsteht das Scorefenster;
- wie stark ist es geschützt;
- wie groß ist Agendaexposition;
- wie viel gegnerisches Tempo wird zugelassen;
- welche Linie passt zur Deckstrategie und Spielsituation;
- welcher Fortsetzungswert bleibt nach dem Zug.

### 5.5 Verbindliches Akzeptanzszenario: Opening Rush

Der erste Agenda-Vertikalschnitt muss ausdrücklich eine Opening-Rush-Lage
mit mindestens drei Linienfamilien abdecken:

```text
reiner Rush:
konkrete Agenda installieren
→ Remote schützen oder advancen

kombinierter Rush:
konkrete Agenda installieren
→ ICE vor Scoring-Remote
→ ICE vor R&D oder HQ

sicherer Aufbau:
Centrals schützen
→ Economy entwickeln
→ Agenda später installieren
```

- im Eröffnungszug ist eine konkrete Agenda-Installation und
  Advancement-Linie legal;
- HQ und/oder R&D sind noch nicht vollständig entwickelt;
- ein sichererer Aufbaupfad und ein schnellerer Scorepfad konkurrieren;
- eine kombinierte Linie darf Agenda-, Remote- und Central-Phasen im selben
  TurnPlan verbinden;
- Agenda-/Siegfortschritt, eigene Agendaexposition, Schutzannahmen,
  Restliquidität und sichtbarer Runnerdruck werden gemeinsam bewertet;
- HQ und R&D dürfen ohne konkrete P1-/P2-Defensepflicht vorübergehend
  ungeschützt bleiben;
- ein pauschaler „erst immer Centrals schützen“-Satz ist ebenso unzulässig
  wie ein pauschaler Opening-Rush-Bonus.

Das Szenario prüft zugleich die Wert-Ownership: Der Agenda-Root besitzt den
Scorefensterwert; ein Defense-Leaf darf ausschließlich seinen zusätzlichen
Schutzbeitrag beanspruchen; Economy-Support darf denselben Scoreertrag nicht
erneut gutschreiben. `corp.opening_and_board_foundation` darf die frühe
Opportunity erkennen oder unterstützen, übernimmt aber weder Agenda- noch
Defense-Ownership.

Sind Rush und Nicht-Rush nach harter Validierung beide fachlich vertretbar
und dominiert keine Familie die andere eindeutig, darf einmalig über den
Engine-RNG eine strategische Mischentscheidung erfolgen. Innerhalb der
gewählten Familie wird die beste konkrete Linie gewählt; zertifiziert
nahgleiche Linien dürfen ebenfalls Engine-RNG verwenden. Die Entscheidung
wird in Kampagne und `TurnPlanCommitment` persistiert und bei erwarteter
Progression nicht neu ausgewürfelt.

### 5.6 Verhalten über den Gegnerzug

Am Ende des Corp-Zugs wechselt die Agenda-Instanz nicht zu `abandoned`.
Sie bleibt resident, typischerweise:

```text
viability: ready oder waiting
executionState: idle
moduleState.campaignWait: awaiting_opponent_outcome
```

Während des Runnerzugs:

- Rezzes und andere legale Reaktionen sind kampagnengebundene Interrupts;
- öffentliche Runs, Zugriffe, Trashes und Creditänderungen aktualisieren die
  Quote;
- der strategische Zweck wird nicht wegen jedes Reaktionsfensters ersetzt.

Am nächsten Corp-Zug wird die Kampagne mit den tatsächlichen sichtbaren
Änderungen revalidiert.

### 5.7 Aufgabe einer Agenda-Kampagne

Aufgabe erfolgt nur mit explizitem Grund, beispielsweise:

- gebundene Agenda oder Ziel existiert nicht mehr;
- Scorepfad ist regel- oder ressourcentechnisch nicht mehr erreichbar;
- Scoring-Remote wurde materiell kompromittiert;
- Sieg- oder Verlustlage erzeugt einen höherklassigen terminalen Pfad;
- Deck-/Strategieannahme ist durch belastbare neue Evidence ungültig;
- ein anderer Plan besitzt nach Hysterese einen materiell besseren,
  robusteren Gesamtpfad.

„Ein anderer Plan hat gerade einen etwas höheren Einzelaktionswert“ ist kein
zulässiger Aufgabegrund.

## 6. Defense, ICE-Installation und Rez-Plan

### 6.1 Grundsatz

Freiwillige ICE-Allokation, ICE-Installation und ICE-Rez werden
ausschließlich innerhalb des Defense-Plans oder als exakt gebundener
Defense-Support eines anderen Root-Plans bewertet. Es gibt keine globale
ICE-Sonderregel außerhalb des Planportfolios.

Eine durch einen anderen Karteneffekt zwingend gebündelte Install-/Rez-
Resolution bleibt beim auslösenden Plan. Der Defense-Plan liefert dafür
Schutz-, Server- und Rezbewertung als Fachservice, übernimmt aber nicht das
Root oder die Resolutionautorität.

### 6.2 Nicht apodiktische Rez-Anforderung

ICE-Installation darf sinnvoll sein, obwohl das ICE aktuell nicht
finanzierbar zu rezz(en) ist.

Der Defense-Plan muss deshalb mindestens drei Fälle unterscheiden:

1. **sofort rezfähig:** Installations- und Rezreserve sind vorhanden;
2. **absehbar rezfähig:** aktuell nicht rezfähig, aber glaubwürdiger
   Fundingpfad bis zum erwarteten Runfenster;
3. **Bluff oder vorbereitende Installation:** keine sichere kurzfristige
   Rezfähigkeit, aber positiver Täuschungs-, Tempo- oder
   Installationsvorbereitungswert.

Fall 3 ist eine Möglichkeit, kein Automatismus.

### 6.3 Bewertung einer nicht sofort rezfähigen Installation

Positive Faktoren:

- hoher Schutzbedarf des Servers;
- keine sinnvollere rezfähige ICE-Alternative;
- glaubwürdiger nächster Funding-Step;
- wertvoller Bluff- oder Umleitungseffekt;
- spätere Installationskosten oder Action Capacity werden vorgezogen;
- das ICE passt nach Typ, Position und Kosten zur geplanten Serverrolle;
- der Zug besitzt sonst keine höherwertige kohärente Entwicklungslinie.

Negative Faktoren:

- kein plausibler Fundingpfad;
- akute andere Serverlücke;
- Installation bindet ein für eine andere Route deutlich besseres ICE;
- das Ziel ist ohne Payoff oder bereits ausreichend geschützt;
- die Aktion verdrängt einen verfallenden Score-, Defense- oder
  Economy-Meilenstein;
- die Hand- oder Creditlage macht die Fortsetzung voraussichtlich unmöglich;
- der Bluffwert wird wiederholt oder ohne strategische Glaubwürdigkeit
  beansprucht.

Der Bluffwert erhält eine begrenzte, diagnostizierbare Komponente. Er darf
keine beliebige schlechte Installation rechtfertigen.

### 6.4 Sequenzbindung

Wenn ein Economy-Step exakt einen Defense-Bedarf schließt:

```text
corp.defend_servers
  └─ Bedarf: 1 Credit für gewählte Install-/Rez-Linie
       └─ corp.economy nimmt Credit
```

dann enthält das `TurnPlanCommitment`:

- Defense als Root;
- Economy als aktuellen Leaf;
- geschlossenen Creditbedarf nach dem Receipt;
- nächsten Defense-Meilenstein;
- reservierte Credits;
- zulässige Replan-Gründe.

Nach der Creditaktion konkurriert der Defense-Step nicht wieder wie eine
völlig neue ungebundene P4-/P5-Idee. Er wird als Fortsetzung derselben
Zuglinie bewertet.

### 6.5 Globale ICE-Allokation innerhalb des Plans

Der Defense-Plan vergleicht `ICE × Server × Position` als planinterne
Varianten. Dabei werden mindestens berücksichtigt:

- Schutzboden von HQ und R&D;
- aktueller und erwarteter Runnerdruck;
- Agendaexposition;
- Multiaccess- und Kartenverlust-Risiko;
- ICE-Typ, Rez-Kosten und sichtbare Breakerabdeckung;
- Installationskosten und Position;
- spätere Rezreserve;
- Remote-Doktrin;
- Bluff- und Informationswert;
- Opportunitätskosten der anderweitigen ICE-Nutzung.

Eine zusätzliche ICE-Schicht darf nicht allein deshalb als wirkungslos
gelten, weil die unmittelbare Zugriffs-Erfolgswahrscheinlichkeit in der
aktuellen Projektion gleich bleibt. Bekannter Stop-, Breaker-Tax-, Damage- oder
Encounter-Störungswert ist ebenfalls Schutzfortschritt. Unrezzte vorhandene
ICE bleiben alternative Rez-Optionen und werden nur bei einer tatsächlich
gebundenen gemeinsamen Rez-Linie vollständig in denselben Fundingbedarf
eingerechnet.

Eine zulässige längerfristige Vorfinanzierung wird zwischen erster und zweiter
Schutzschicht nicht asymmetrisch behandelt: Hat ein vorhandenes Remote genau
eine Schicht und verlangt das konkrete Scoreprojekt die übliche zweite
Reifeschicht, darf diese unter denselben makrostrategischen Sicherungen vor der
vollständigen Rez-/Score-Finanzierung gelegt werden. Das ist eine begrenzte
Projektfortsetzung, kein Freibrief für weitere Layer und keine dauerhafte
Festlegung eines bestimmten Remotes als Score- oder Asset-Remote.

Erst danach meldet der Defense-Plan seine besten Step-Optionen an den
Scheduler.

## 7. Informationsgrenzen

Ein aktuelles Informationsfenster darf einen eigenen, eng gebundenen
Child-Plan besitzen. `runner.expose_information` ist der Referenzfall: Das
Modul wählt nur die exakte Aufdecken-/Verzicht-Action des bereits begonnenen
Runs, bewertet den Informationsgewinn als Flexibilität und merkt sich eine
erfolgreich selektierte ICE-Instanz erst ab der folgenden `stateVersion`.
Server- und Runwahl bleiben beim Parent; das Gedächtnis ist kein
Choice-Resolver und keine zweite Hidden-Info-Quelle.

### 7.1 Typisierte Grenzen

Nicht jede Choice und nicht jede Zustandsänderung beendet eine Linie.
Verbindlich gelten die in Abschnitt 1.8 definierten `TurnBoundaryKind`s:

- `controlled_resolution`: Alle routendefinierenden Choices und Ziele sind
  bereits gebunden; die Resolution ist deterministisch projektierbar. Kein
  Replan.
- `private_observation`: Draw, Search oder Reveal erzeugt neue eigene
  Information. Der konkrete TurnPlan endet dort.
- `public_random_outcome`: Sichtbarer Zufall mit mehreren relevanten
  Ausgängen.
- `opponent_response_window`: Der Gegner kann legal und materiell
  eingreifen.
- `engine_continuation`: Enginegebundene Resolution, deren Folgeschritte
  noch nicht als normale freiwillige Zuglinie festgeschrieben werden dürfen.
- `projection_not_supported`: Das Fachmodul kann den nächsten semantischen
  Zustand nicht sicher projizieren; nur dieser Zweig endet.

Eine kontrollierte, vollständig bestimmte Choice ist damit ausdrücklich
keine Beobachtungsgrenze.

### 7.2 Grenzaktion statt Scheinfortsetzung

Eine Linie, die an einer echten Unsicherheitsgrenze endet, trägt ein
`BoundaryActionAssessment`:

- typisierte Grenze;
- unmittelbarer fachlicher Zweck;
- bekannte minimale, erwartete und maximale Ergebniswirkung;
- verbleibende Action Capacity nach der Grenzaktion;
- Hand-, Kosten-, Risiko- und Opportunitätswirkung;
- vor der Grenze erfüllte Pflichten und erreichte Meilensteine;
- Unsicherheitsannahmen.

Das zuständige Planmodul bewertet diese Aktion selbst. Der Scheduler plant
keine konkreten oder abstrakten **Folgephasen** hinter dem Ergebnis. Zulässig
ist nur der in Abschnitt 1.8 begrenzte registrierte Restwert ohne Route oder
Rootannahme. Nach der Beobachtung werden Zustand, Inventar und
`LegalActions` neu aufgebaut und ein neuer TurnPlan für den verbleibenden Zug
erzeugt.

### 7.3 Draw als bewusst geplanter erster Schritt

Ein Draw kann eine sinnvolle Zuglinie sein:

```text
Draw
→ private_observation
→ tatsächlichen Restzug mit neuer eigener Information neu planen
```

Vor dem Draw bewertet der Scheduler:

- erwarteten Informations- und Kartenwert;
- aktuelle Handklassifikation und Handkapazität;
- projizierte Cleanup-/Discard-Kosten;
- verbleibende typisierte Action Capacity;
- Wahrscheinlichkeit, einen offenen Rootbedarf zu treffen;
- unmittelbaren erwarteten Karten-/Informationswert des zuständigen Moduls;
- Opportunitätskosten gegenüber Linien ohne Draw.

Nach dem Draw:

- Zustand, Handinventar und `LegalActions` werden neu aufgebaut;
- der Restzug wird wegen `private_observation` neu gesucht;
- der Root-Zweck bleibt bevorzugt bestehen, wenn die neue Information ihn
  nicht materiell verändert;
- ein anderer Root darf nur nach den normalen Replan- und
  Hystereseregeln übernehmen.

### 7.4 Handinventar und Cleanup-Projektion

Die Implementierung führt kein zweites paralleles Handbewertungssystem ein.
Sie erweitert das bereits vor der Draw-Arbitration erzeugte
`CorpHandInventoryFacts`:

1. Jede eigene Handkarteninstanz wird klassifiziert, auch wenn sie aktuell
   keine LegalAction besitzt.
2. Daraus entsteht eine planwirksame, weiterhin side-sichere
   `CorpHandPlanningInventory`-Projektion.
3. Jede Linie projiziert Handgröße und Cleanup-Pflicht.
4. Bei unvermeidbarem Discard wird die beste aktuell legal begründbare
   Cleanup-Variante bewertet, nicht pauschal der durchschnittliche
   Kartenwert abgezogen.
5. Nach Draw oder anderer Handänderung wird das Inventar neu erstellt.

```ts
type CorpHandPlanningDisposition =
  | "current_plan_route"
  | "support_for_need"
  | "blocked_but_developable"
  | "campaign_hold"
  | "redundant"
  | "currently_dead"
  | "discard_candidate"
  | "assessment_unknown";

type CorpHandPlanningRecord = {
  cardInstanceId: string;
  disposition: CorpHandPlanningDisposition;
  relatedPlanInstanceIds: string[];
  relatedNeedIds: string[];
  retentionHorizon?: PlanDeadline;
  blockerIds: string[];
  redundancyGroupId?: string;
  retentionEvidenceCodes: string[];
};
```

Vor einer tatsächlichen Discard-Choice müssen 100 Prozent der eigenen
Handkarten eine Retention- oder Discardbewertung besitzen.
`assessment_unknown` bleibt sichtbar und darf nicht still als
`discard_candidate` behandelt werden. Dies erweitert
`CorpHandInventoryFacts`; es entsteht kein zweites Inventarsystem.

Ein Draw bei voller Hand muss den Wert der wahrscheinlich verdrängten
Ressource, die Cleanup-Aktion beziehungsweise Pflichtresolution und die
dadurch verlorene Planoption tragen. Ein generischer
`draw-for-score-material`-Status darf diese Prüfung nicht umgehen.

### 7.5 Zugabschluss

Für hypothetische Suchknoten gibt es nur ein
`ProjectedTurnStopEnvelope`. Es schätzt, ob und wie die Linie voraussichtlich
an einem regelkonformen Zugabschluss ankommt.

Ein autoritatives `CurrentTurnCompletionCertificate` darf ausschließlich im
tatsächlichen aktuellen Zustand ausgestellt werden. Es bestätigt:

- den aktuellen `PlanningRulesContext`;
- aktuelle `LegalActions`;
- vollständige Behandlung zwingender Engine-Fenster;
- vollständige Behandlung erforderlicher Dispositions-/Cleanup-Schritte;
- legale aktuelle `EndTurn`-Invocation beziehungsweise das vom
  `RulesBaseline` definierte Zugende;
- keine verbleibende aktuell zwingende Plan- oder Resolutionpflicht.

Damit wird keine zweite Zugregel in den Planner eingebaut, und zugleich
kann ein Suchknoten nicht fälschlich behaupten, autoritativ am Zugende zu
sein.

## 8. Revalidierung und Neuplanung

### 8.1 Zentraler Unterschied

Nach jeder StateVersion-Änderung wird neu bewertet. Neu bewerten bedeutet
nicht automatisch, den Plan zu wechseln.

Die Runtime führt nach jeder Aktion aus:

1. Receipt dem erwarteten Übergang zuordnen;
2. tatsächlichen Fortschritt klassifizieren;
3. Ressourcenledger aktualisieren;
4. Commitment-Node und aktuellen Hard-Commitment-Prefix fortschreiben;
5. P1-/P2-Response-Scan ausführen;
6. Replan-Trigger prüfen;
7. bei `expected_progress` den nächsten gebundenen Node rematerialisieren;
8. erwartete Phasengrenzen innerhalb desselben Commitments fortschreiben;
9. nur an Boundary, Deviation, Invalidierung oder höherklassigem Interrupt
   den Restzug neu suchen.

Die aktive Kampagnenquote wird dabei aktualisiert, ohne automatisch eine
vollständige Challenger-Suche zu eröffnen.

### 8.2 Beobachtungsklassen

```ts
type TurnPlanObservationClass =
  | "expected_progress"
  | "expected_phase_transition"
  | "expected_no_material_change"
  | "scheduled_information_boundary"
  | "material_cost_or_target_drift"
  | "material_outcome_deviation"
  | "urgent_interrupt"
  | "phase_milestone_reached"
  | "runtime_restarted"
  | "commitment_invalidated";
```

### 8.3 Zulässige Replan-Trigger

Neuplanung ist erforderlich oder zulässig, wenn:

- der nächste Step nicht mehr legal materialisierbar ist;
- `PlanningRulesContext`, side-sicherer Planning-Fingerprint, StateVersion
  oder routendefinierende Invocation nicht mehr zum Commitment passen;
- Kosten, Ziel oder verfügbare Action Capacity materiell abweichen;
- die tatsächliche Wirkung außerhalb des erwarteten Envelopes liegt;
- eine geplante Informationsgrenze erreicht wurde;
- eine gegnerische Reaktion eine neue sichtbare Lage erzeugt;
- ein P1-/P2-/P3-Interrupt entsteht;
- das Root-Ziel invalidiert wurde;
- die Server- oder KI-Runtime neu gestartet wurde;
- an einem ohnehin zulässigen Replan-Punkt eine neue Linie die
  Wechselmarge unter vollständiger Bewertung überschreitet.

### 8.4 Keine ausreichenden Replan-Gründe

Allein nicht ausreichend sind:

- jede beliebige StateVersion-Erhöhung;
- geringfügige Scoreänderung eines anderen P4-/P5-Plans;
- eine schon vorher bekannte Alternative;
- dieselbe Faktenlage mit neuer Bewertungsreihenfolge;
- ein positiver Einzelaktionsscore;
- ein niedrigerer stabiler Tie-Break-Schlüssel;
- das erwartete Erreichen eines Phasenmeilensteins, wenn eine weitere
  gebundene Phase folgt.

Insbesondere löst `expected_progress` keine vollständige Beam Search aus.
Das Commitment wird zum erwarteten nächsten Node fortgeschrieben und nur
dieser aktuelle Step autoritativ rematerialisiert.

### 8.5 Fail-closed

Ist der gebundene aktuelle Step als `executable_now` ausgewiesen, kann aber
nicht an die aktuellen LegalActions gebunden werden:

- kein stiller Wechsel zu einer freien Aktion;
- kein Rückfall auf den zweitbesten Planning Head innerhalb derselben
  Entscheidung;
- klassifizierter `PlanResolutionFailure`;
- neue Planung erst auf einem regulären neuen Entscheidungszustand.

## 9. Gegnerzug und Interrupts

### 9.1 Kampagnenpersistenz

Ein eigener Zugabschluss beendet nur das `TurnPlanCommitment`, nicht die
zugrunde liegende Kampagne.

### 9.2 Legale Reaktionsfenster

Rez-, Trace-, Prevention-, Ambush- und andere optionale Fenster werden als:

- kampagnengebundener Interrupt;
- urgent response;
- oder reguläre planlokale Reaktion

behandelt.

Sie bilden nur dann ein neues strategisches Root, wenn ihr validierter
Planvertrag das tatsächlich verlangt. Ein ICE-Rez für ein vorbereitetes
Scoring-Remote bleibt typischerweise ein Defense-Leaf derselben
Agenda-Kampagne.

### 9.3 Rückkehr

Nach dem Interrupt:

1. Outcome in die Root-Kampagne zurückführen;
2. Schutz- oder Ressourcenstatus aktualisieren;
3. Kampagne als ready, waiting, blocked, completed oder abandoned
   klassifizieren;
4. im nächsten eigenen freiwilligen Fenster neu quoten;
5. bei weiterhin gültigem Ziel Kontinuität bevorzugen.

## 10. Ressourcen und Reservierungen

Der [gemeinsame Ressourcenvertrag](planning-architecture.md) definiert
Claims, Reservierungen und Supportbindung. Der TurnPlanner trägt diese in
`ProjectedDecisionFrame` fort; zusätzliche oder eingeschränkte Kapazität
wird nach Abschnitt 2.5 bilanziert. Ein zukünftiger Nettoerlös darf keine
fehlende Bruttozahlung zum aktuellen Step ersetzen. Engine-zertifizierte
Aktionsschuld verbraucht die nach dem Effekt verfügbare Kapazität; sie ist
keine zusätzliche vorauszuzahlende Gebühr. Eine gesonderte Mindestkapazität
zum Start muss dagegen vorliegen. Fehlende Quotes behaupten keine
schuldenfreie Folgekapazität.

## 11. Determinismus und Performance

### 11.1 Determinismus

Gleiche side-sichere Eingaben, gleiche Runtimekonfiguration, gleicher Seed
und gleicher `RandomCounter` erzeugen:

- dieselbe Variantenmenge;
- dieselbe Dominanzbereinigung;
- dieselbe Rangfolge;
- dasselbe Commitment;
- dieselbe aktuelle LegalAction.

Ungeordnete Maps, Zeitstempel, Prozessreihenfolge oder Hashes ohne
Replayvertrag dürfen keine Entscheidung beeinflussen.

### 11.2 Randomisierung

Variantenbildung, harte Validierung, Dominanz, Rangbildung und
Zulässigkeitsprüfung bleiben deterministisch. Randomisierung darf Bewertung
nicht ersetzen.

Zulässig sind genau:

1. eine einmalige strategische Mischentscheidung zwischen fachlich
   vertretbarem Rush und Nicht-Rush, wenn keine P1-/P2-Pflicht verletzt wird
   und keine Familie die andere eindeutig dominiert;
2. eine Auswahl zwischen zertifiziert nahgleichen vollständigen Linien;
3. der bereits vorhandene planlokale Same-Step-Routenvertrag.

```ts
type TurnPlanRandomizationEligibility = {
  opportunityKey: string;
  decisionScope: "opening_rush_posture" | "certified_near_equal_lines";
  eligibilityContractVersion: string;
  candidateFamilyKeys: string[];
  candidateLineIds: string[];
  maxExpectedRegret: number;
  admissibilityBandId: string;
  minimumWorstCaseFloor: number;
  probabilityWeights: number[];
  persistsUntil: PlanConditionRef;
  invalidatedBy: PlanConditionRef[];
  rngDomain: "ai_turn_plan_selection";
  evidenceCodes: string[];
};

type PersistedTurnPlanRandomizationDecision = {
  opportunityKey: string;
  eligibilityContractVersion: string;
  candidateFamilyKeys: string[];
  candidateLineIds: string[];
  probabilityWeights: number[];
  randomDrawRecordId: string;
  selectedFamilyKey: string;
  selectedLineId: string;
  persistsUntil: PlanConditionRef;
  invalidatedBy: PlanConditionRef[];
};
```

Nichtdominanz allein genügt nicht. Alle Mischkandidaten müssen zusätzlich
innerhalb des zentralen Regret-/Admissibility-Bands liegen und denselben
zertifizierten Worst-Case-Floor erreichen. Gewichte sind endlich,
nichtnegativ, normalisiert und policygebunden.

Jeder Draw läuft atomar über die getrennte engineverwaltete RNG-Domäne
`ai_turn_plan_selection`, wird im Replay dokumentiert und
in Kampagne beziehungsweise `TurnPlanCommitment` persistiert. Erwartete
Progression oder ein normaler Phasenwechsel würfelt nicht erneut. Klare
Dominanz, Illegalität, Hard-Commitment-Konflikt oder unterschiedliche harte
Pflichterfüllung schließen RNG aus.

`game_effect_rng`, `ai_turn_plan_selection` und `simulation_rng` besitzen
getrennte Counter-/Record-Domänen. Eine zusätzliche strategische
Mischentscheidung darf spätere Kartenwürfe oder andere Game-Effect-Zufälle
nicht verschieben.

### 11.3 Performancebudget

Der Trace weist aus:

- erzeugte Root-Optionen;
- expandierte Knoten;
- verworfene Dominanzfälle;
- maximale Suchtiefe;
- Abbruchgrund;
- Laufzeit;
- deterministische Budgetausschöpfung.

Bei Erreichen eines deterministischen Knoten-, Tiefen- oder
Verzweigungsbudgets wird die beste bereits vollständig bewertete Linie
verwendet.

Vor tiefer Expansion erzeugt die Suche für jede geschützte Partition aus
`Priority-Obligation-Signatur × Root × nächstem Meilenstein` mindestens eine
konservative Linie bis Zugende, Boundary,
`projected_plan_discovery_required`, `projection_not_supported` oder
`bounded_search_horizon`. Anschließend expandiert sie deterministisch
Round-Robin mit Mindestquote je Partition; erst Restbudget wird über zentrale
Upper Bounds verteilt. Dasselbe gilt für Kampagnenquotes.

Upper Bounds stammen ausschließlich aus registrierten Komponentenmaxima,
verbleibender typisierter Action Capacity, maximal noch zulässigen Claims und
harten Ressourcenlimits. Module liefern keinen freien optimistischen
Gesamtwert. Eine freie Rohscore-Aktion ist kein Performancefallback. Die
gemessene Laufzeit beeinflusst diese Entscheidung nicht.

## 12. Diagnostik

### 12.1 Trace-Segmente

```ts
type TurnPlannerTrace = {
  stateVersion: number;
  turnKey: string;
  planningRulesContextFingerprint: string;
  sideSafePlanningFingerprint: string;
  previousCommitmentId?: string;
  observationClass?: TurnPlanObservationClass;
  replanDecision: "continued" | "replanned" | "completed" | "invalidated";
  replanReasonCode?: string;
  commitmentProgression?: RedactedCommitmentProgressTrace;
  campaignQuotes: RedactedCampaignQuoteTrace[];
  planningHeads: RedactedPlanningHeadTrace[];
  consideredLines: RedactedTurnLineTrace[];
  prunedLines: RedactedPrunedLineTrace[];
  selectedLineId: string;
  selectedPhases: RedactedTurnPlanPhaseTrace[];
  selectedLeafExecutorInstanceId: string;
  selectedMilestone: string;
  firstStepCapability: string;
  invocationKey: string;
  choicePayloadFingerprint: string;
  selectedActionId: string;
  validatedValueClaimIds: string[];
  randomization?: RedactedTurnPlanRandomizationTrace;
  searchStats: TurnSearchStats;
};
```

### 12.2 Erforderliche Erklärbarkeit

Für jede Entscheidung muss sichtbar sein:

- welche vollständigen Linien verglichen wurden;
- welches projizierte Zugende jede Linie hatte;
- welche harten Prioritätspflichten sie erfüllte oder verletzte;
- welcher inkrementelle Kampagnenwert angesetzt wurde;
- welche Ownership-Claims akzeptiert, abgelehnt oder als Duplikat erkannt
  wurden;
- welche Ressourcen reserviert oder freigegeben wurden;
- welche Linien mit welchem typisierten Grund beschnitten wurden;
- welches deterministische Suchbudget verbraucht wurde;
- warum die vorherige Linie fortgesetzt oder verlassen wurde;
- welcher aktuelle Plan den Step ausführte;
- warum die konkrete LegalAction diesen Step erfüllte.

### 12.3 D3-bis-D5-Zieltrace

Eine Regression für diese Folge muss zeigen:

1. D3-artiger Credit:
   - Root Defense;
   - Leaf Economy;
   - konkreter geschlossener Fundingbedarf;
   - nächste Defense-Capability;
   - reservierter Credit;
2. Folgezustand:
   - `expected_progress`;
   - kein materieller Replan-Grund;
   - Fortsetzung oder bewusst dokumentierte bessere Gesamtlinie;
3. Draw-Alternative:
   - Handüberlauf und Discard-Folge im Linienwert;
   - keine Umgehung durch Scorematerial-Bindung.

Der aktuelle Head-, Line-, Claim-, Prune- und Commitment-Trace muss die
Entscheidungsursache belegen. Neue Verhaltenspfade erhalten ihre nötigen
Diagnosefelder zusammen mit der Umsetzung.

### 12.4 Privilegierte In-Game-Debuganzeige

Die vorhandene private KI-Debuganzeige des lokalen Projektbetreibers zeigt die Zugplanung:

- gewählte Gesamtlinie und die wichtigsten verworfenen Alternativen;
- alle Phasen mit Root, Support-/Need-Bindungen und Zielmeilenstein;
- kanonischen Cursor und nächsten gebundenen Step;
- Entry-, Completion- und Transition-Bedingungen;
- Reservierungen, Claims und Priority-Obligations;
- Boundary-, Stop-, Replan- und Invalidierungsgründe;
- Suchpartitionen, Budgetverbrauch und Prunegründe;
- Kampagnenstatus über den Gegnerzug.

Diese ausdrücklich privilegierte Betreiberanzeige darf und soll zur
Playtest-Kontrolle die vollständige Hand der jeweils aktiven KI zusammen mit
deren Planung darstellen. Die Hand des menschlichen Spielers bleibt
ausgeschlossen. Die Anzeige ist keine normale Spieler-, Spectator-,
Public-Replay-, Log- oder Observability-Fläche. Ihre privilegierten
KI-Informationen werden weder zum Plannerinput noch zu PublicEvents, normalen
WebSocket-/Reconnect-Payloads, öffentlichen Replays, Logs oder Clientfehlern.
Die Anzeige beeinflusst keine Entscheidung und reicht keine Aktion ein.

## 13. Fehler- und Sicherheitsgrenzen

Die Umsetzung stoppt ohne KI-Workaround, wenn:

- der aktuelle Step keine LegalAction besitzt;
- eine erforderliche Kostenquote der Engine fehlt;
- eine Kampagnenbewertung gegnerische Hidden-Zonen benötigen würde;
- Ressourcenclaims zyklisch oder widersprüchlich sind;
- Wertclaims doppelt, unbesessen oder nicht zentral auflösbar sind;
- zwei Pläne dieselbe exklusive Ressource ohne Schedulerentscheidung binden;
- ein aktives Hard-Commitment ohne erlaubten Breakgrund verletzt wird;
- der `PlanningRulesContext` nicht zum Zustand und Commitment passt;
- ein Commitment zukünftige Action-IDs enthält;
- der Projektionsframe vom autoritativen Engineergebnis abweicht und der
  Unterschied nicht typisiert behandelbar ist.

Eine nicht side-sicher projektierbare zukünftige Capability stoppt dagegen
nur den betroffenen Suchzweig an `projection_not_supported`. Sie ist kein
globaler Plannerfehler.

## 14. Nicht-Ziele

Nicht Teil des ersten Umsetzungsstands sind:

- vollständige perfekte Suche über mehrere komplette Züge;
- Zugriff der KI auf `GameState`;
- MCTS oder lernendes neuronales Stellungsmodell;
- neue Regeln oder neue LegalActions;
- kartennamenspezifische Sonderentscheidungen im Scheduler;
- apodiktisches Verbot nicht rezfähiger ICE-Installationen;
- automatische Aufgabe einer Kampagne am Zugende;
- Festschreiben zukünftiger Action-IDs oder unbekannter zukünftiger
  Kartenidentitäten;
- Ersetzen aller planlokalen Fachbewertungen durch einen globalen Score;
- unkontrollierte Randomisierung zwischen nicht validierten oder klar
  unterschiedlich guten Zuglinien;
- ein zweites paralleles Corp-Handinventar neben den bestehenden
  `CorpHandInventoryFacts`.

## 15. Testmatrix

### 15.1 Zugkohärenz

- Funding-Step wird im nächsten Schritt zum finanzierten Parent
  zurückgeführt.
- Planning Heads verschiedener möglicher Executor-Pläne konkurrieren vor
  der Executor-Auswahl.
- Der ausgewählte Head wird erneut autoritativ rematerialisiert; ein
  abweichender Witness fällt fail-closed aus.
- Eine bekannte Alternative ohne neue Evidence bricht den Plan nicht.
- `expected_progress` schreitet im Commitment fort, ohne vollständige
  Challenger-Suche.
- Ein materiell besserer Challenger überschreitet die Wechselmarge und
  übernimmt nur an einem legitimen Replan-Punkt.
- Hard-Commitment-Verletzung ist ungültig, nicht nur ein Malus.
- Ein TurnPlan enthält mehrere geordnete Root-Phasen bis Zugende.
- Ein erwarteter Phasenmeilenstein schreitet zur bereits geplanten nächsten
  Phase fort, ohne die Rootkonkurrenz neu zu öffnen.
- Eine nächste Phase startet nur, wenn Entry-Frame, Root-Assessment,
  Bedingungen, NeedAssignments und Ressourcenübergabe weiterhin gelten.
- Eine erst hypothetisch neu entstehende Planinstanz darf nicht
  stillschweigend als spätere Phase verwendet werden.
- Economy darf innerhalb einer Agenda- oder Defensephase nur mit gültiger
  NeedAssignment handeln.
- P1-/P2-Interrupt unterbricht unabhängig von Hysterese.
- Ein vor der nächsten Replan-/Yield-Grenze auslaufendes P3-Fenster wird
  trotz Commitment-Fortschreibung erkannt.
- Nach Interrupt kehrt eine weiterhin viable Kampagne zurück.

### 15.2 Variantenbewertung

- drei Zuglinien mit unterschiedlichen Zugendständen;
- identischer Sofortwert, unterschiedlicher Fortsetzungswert;
- hoher Erwartungswert gegen besseren Worst-Case-Floor;
- dominiert versus nur andersartig;
- verzögert wertvolle Linie bleibt durch geschützte Front erhalten;
- dieselbe exklusive Zukunftskonversion darf nur einen Ownership-Claim
  besitzen;
- Support-Claim darf Root-Payoff nicht duplizieren;
- zwei Linien aus derselben StateVersion erhalten unterschiedliche,
  prefixgebundene Nachher-Quotes, wenn ihre projizierten Frames abweichen;
- verschiedene Ziele dürfen nicht falsch gruppiert werden;
- verschiedene routendefinierende Choice-Payloads dürfen nicht gruppiert
  werden;
- eingeschränkte oder zusätzliche Action Capacity wird nur von passenden
  `ActionDemand`s genutzt;
- Action-Gain-, Bankload-/Cashout- oder ähnliche Projektionen erzeugen
  durch kanonische Zyklenerkennung keine Suchschleife;
- nachweislich vertauschbare Aktionen werden kanonisiert;
- abhängige Aktionsreihenfolgen bleiben getrennt;
- variierende Rechnerlast ändert weder Suchende noch Kandidatenrangfolge;
- verschiedene Root-Enumerationsreihenfolgen ändern weder
  Partitionsexpansion noch Gewinner;
- vor tiefer Expansion existiert mindestens eine konservativ abgeschlossene
  Linie je geschützter Partition;
- zertifizierte Nahgleichstandsrandomisierung verwendet Engine-RNG und
  Replayrecord.
- eine klar schlechtere, nur formal nichtdominierte Linie überschreitet das
  Regret-Band und gelangt nicht in die Mischmenge;
- ein Planner-RNG-Draw verschiebt keinen späteren Game-Effect-RNG-Draw.

### 15.3 Agenda-Kampagne

- Vorbereitung jetzt, Score im nächsten Zug;
- schneller riskanter gegen langsamen sicheren Pfad;
- Agenda bleibt über Gegnerzug resident;
- Remote kompromittiert: Kampagne blockiert oder beendet;
- Scorefenster verloren: legitime Aufgabe;
- Boardwert und Kampagnenwert werden nicht doppelt gezählt.
- Agenda, wirksames Remote-ICE und Central-ICE werden als kohärenter
  mehrphasiger TurnPlan erkannt.
- Reiner Rush, kombinierter Rush und sicherer Aufbau konkurrieren.
- Opening Rush gewinnt gegen Aufbau, wenn der robuste Gesamtpfad besser ist.
- Opening Rush verliert gegen Aufbau, wenn Risiko und Agendaexposition zu
  hoch sind.
- Eine fachlich zulässige Rush-/Nicht-Rush-Mischentscheidung wird einmal
  ausgewürfelt und anschließend persistent fortgeführt.

### 15.4 Defense und ICE

- rezfähige Zentralinstallation;
- aktuell nicht rezfähig, aber glaubwürdiger Fundingpfad;
- sinnvoller Bluff ohne bessere Installation;
- Bluff ohne Funding- und Schutzwert;
- HQ gegen R&D nach sichtbarem Druck;
- Defense-Support für Agenda-Kampagne;
- Economy-Credit bleibt für Defense reserviert;
- ICE-Entscheidung entsteht nie außerhalb des Defense-Plans.

### 15.5 Draw und Information

- freie Handkapazität und echter Bedarf;
- volle Hand ohne ausreichenden Mehrwert;
- voller Grip mit terminal notwendigem Draw;
- Draw als erster Schritt, danach gleiche Kampagne;
- Draw als erster Schritt, danach legitimer Planwechsel;
- private Suche oder Reveal als weitere Beobachtungsgrenzen;
- kontrollierte vollständig gebundene Choice ist keine Grenze;
- Grenzaktion wird unmittelbar durch ihr Planmodul bewertet;
- ein Draw mit drei verbleibenden Aktionen erhält einen anderen eng
  begrenzten Restwert als ein Draw mit keiner verbleibenden Aktion;
- hinter Draw oder Zufall existiert keine vorgeplante Folgephase;
- planwirksames Handinventar klassifiziert jede eigene Handkarteninstanz,
  auch wenn sie momentan keine LegalAction besitzt;
- vor Discard besitzen 100 % der Handkarten eine Retention- oder
  Discarddisposition;
- Cleanup-Projektion wählt die beste legal begründbare Disposition statt
  eines pauschalen Durchschnittsabzugs.

### 15.6 Persistenz

- Prozessneustart stellt das Portfolio wieder her, requotet Kampagnen und
  erzeugt den Restzugplan neu;
- weiterhin gültige harte `PlanCommitment`s überleben den Neustart nach
  Revalidierung;
- Undo verwirft zustandsgebundene Zukunft und revalidiert;
- neuer Turn schließt Zugcommitment, behält Kampagne;
- abgeschlossene Kampagne wird nicht neu entdeckt;
- pausierte Kampagne wird nicht durch TTL verfrüht vergessen.

### 15.7 Sicherheit

- kein `GameState` im AI-Input;
- Hidden-Info-Äquivalenz: unterschiedliche gegnerische Hidden-Zonen erzeugen
  denselben Planning-Fingerprint, dieselben IDs und dieselbe Linie;
- keine zukünftigen Action-IDs;
- konkrete bekannte zukünftige Karten- und Objekt-Targets sind zulässig;
- unbekannte zukünftige Karteninstanzen sind unzulässig;
- aktuelle Action muss in `LegalActions` existieren;
- aktuelle Choices werden erneut validiert;
- deterministischer StateHash und Replay;
- Fail-closed bei Projektions- oder Bindungsfehler.
- inkompatibler `PlanningRulesContext` invalidiert Commitment und Linie.
- nicht projektierbare Zukunft beendet nur den Zweig.
- ein autoritatives Zugabschlusszertifikat entsteht nur im realen aktuellen
  Zustand und deckt aktuelle EndTurn-/Cleanup-Pflichten ab.
- die private KI-Debuganzeige zeigt die vollständige Hand der aktiven KI, niemals die Menschenhand, und
  Zugplanung; normale Spieler-, Replay-, Spectator- und öffentliche
  Datenwege erhalten diese privaten Daten nicht.

### 15.8 Aktuelle Plan- und Horizontabdeckung

- jedes Corp-Planmodul besitzt Planning-Head- oder explizite
  Unsupported-Coverage;
- jedes Modul deklariert seinen Planungshorizont;
- jede tatsächlich mehrzügige Instanz besitzt eine Kampagnenquote;
- ein fehlendes registriertes Modul verletzt den Coverage-Vertrag;
- Shadow-Auswahl beeinflusst keine Liveaktion;
- einfacher Zwei-Schritt-Planer gegen Beam Search auf identischer Evidence;
- Corp und Runner besitzen getrennte Coverage- und
  Behavior-Gates.
- eine Opening-Rush-Kampagne bleibt nach Runner-Run, Rez
  und Remote-Outcome korrekt resident, blockiert oder typisiert beendet.

## 16. Verifikationsumfang

Die [gemeinsame Testzuordnung](planning-architecture.md) und
[packages/ai/AGENTS.md](../../../packages/ai/AGENTS.md) bestimmen die
Prüftiefe. Die Testmatrix in Abschnitt 15 beschreibt fachliche Positiv- und
Gegenfälle; sie ist kein Auftrag zu einem vollständigen Lauf bei jedem Patch.
Bei Änderungen an Suche, Persistenz oder Randomisierung kommen gezielt
deterministische Budget-, Restart-, Redaction- und Replayvergleiche hinzu.
Ein technischer Check weist keine allgemeine Spielstärkenverbesserung nach.

## 17. Messgrößen

Nach Umsetzung werden mindestens beobachtet:

- Anteil freiwilliger Entscheidungen mit vollständiger Restzuglinie;
- Anteil Planmodule mit Planning-Head- und Projektionsabdeckung;
- Zahl lokaler `projection_not_supported`-Zweigenden je Planmodul;
- Planning Heads je Root und Entscheidung;
- Rematerialisierungsfehler je Planning Head;
- Prune-Gründe und geschützte Frontbelegung;
- Suchknoten je Obligation-/Root-/Meilensteinpartition;
- geschützte Partitionen ohne Mindestexpansion;
- Budgetenden ohne konservativ abgeschlossene Linie;
- Anteil Linien bis Zugende oder legitimer Beobachtungsgrenze;
- Planwechsel je Zug;
- Planwechsel ohne typisierten Grund;
- Commitment-Fortschritte ohne Vollsuche;
- Vollsuchen je Zug, getrennt nach Boundary, Deviation, Invalidierung,
  Runtime-Neustart und höherklassigem Interrupt;
- geplante und erfolgreich fortgeschriebene Phasen je TurnPlan;
- Action-Gain-Linien mit korrekt erweiterter Restkapazität;
- strategische und Nahgleichstands-RNG-Entscheidungen samt Persistenz;
- Randomisierungs-Regret und Wiederverwendung desselben Opportunity-Keys;
- finanzierte Parentbedarfe ohne anschließende Konversion;
- Draws bei voller Hand;
- Anteil aller Handkarten mit Plan-/Disposition-Claim;
- produktive Handroute vor einem Draw;
- projizierte und tatsächliche Cleanup-Kosten;
- Projektionsfehler je Delta-Komponente;
- Kampagnenquotenfehler je Meilenstein;
- Phase-Entry-Validierungsfehler;
- Kalibrierungsfehler des Boundary-Restwerts;
- doppelte oder abgelehnte Campaign-Value-Claims;
- Zugenden mit gestrandeter Action Capacity;
- Kampagnenaufgaben ohne typisierten Grund;
- Scorefenster-Erzeugung und -Konversion;
- Kampagnen-Warte-/Fortsetzungsquote über Gegnerzüge;
- Zentralserver ohne Defense-Meilenstein;
- mittlere und maximale Suchknoten;
- deterministische Budgetausschöpfung und Frontpartitionen;
- p50/p95-Entscheidungszeit;
- Behavior-Baseline-Ergebnis;
- Decision-Checkpoint-Drift.

Harte Zielwerte:

- 0 Planwechsel ohne typisierten Grund;
- 0 Hard-Commitment-Verletzungen;
- 0 nicht aufgelöste oder doppelte Value-Claims;
- 0 zukünftige Action-IDs;
- 0 illegale ausgewählte Aktionen;
- 0 Hidden-Info-Äquivalenzverletzungen;
- 0 unklassifizierte Handkarten vor Cleanup/Discard;
- 0 geschützte Suchpartitionen ohne konservativ abgeschlossene
  Ausgangslinie;
- 0 Basic Draws bei voller Hand ohne explizit bewerteten Mehrwert;
- vollständige Planabdeckung je Side;
- 100 % der ausgewählten Aktionen besitzen Root, Leaf, Step und
  Turn-Line-Ursprung.

## 18. Bekannte Risiken

### 18.1 Projektionsmodell wird zu einer zweiten Rules Engine

Gegenmaßnahme:

- aktuelle Kosten und Legalität ausschließlich aus Engine/LegalAction;
- Projektionsframe nur für side-sichere Bewertungsdeltas;
- deterministische Delta-Projektionen gegen Engine-Receipts testen;
- unbekannte Regelwirkung als Boundary oder Blocker, nicht nachbauen.

### 18.2 Fortsetzungswert dominiert reale Gegenwartsgefahr

Gegenmaßnahme:

- harte P1–P3-Reihenfolge;
- Worst-Case-Floor;
- Gegnerinterventionsrisiko;
- begrenzter Horizont;
- keine unbeschränkte spekulative Zukunftsbelohnung.

### 18.3 Kampagnenwert wird doppelt gezählt

Gegenmaßnahme:

- ausschließlich inkrementelle, eigentumsgebundene Claims;
- eindeutiger `ownershipKey` je Linie;
- zentrale Policy statt planlokaler Selbstbewertung;
- Doppelzählungs-Unit- und Szenariotests.

### 18.4 Hysterese macht die KI starr

Gegenmaßnahme:

- P1-/P2-Interrupts brechen immer;
- materielle Abweichungen lösen Replan aus;
- Wechselmarge nur innerhalb kompatibler Priorität;
- Trace jeder verhinderten und erlaubten Übernahme.

### 18.5 Suche wird zu teuer

Gegenmaßnahme:

- Äquivalenzgruppierung;
- Dominanz;
- deterministische Knoten-/Tiefenbudgets;
- Abbruch an Informationsgrenzen;
- Cache rein deterministischer Quoten;
- Laufzeitvergleich am Integrationscheckpoint.

### 18.6 Bluffwert legitimiert schlechte ICE-Installationen

Gegenmaßnahme:

- Bluff ausschließlich als begrenzte Defense-Komponente;
- Schutzbedarf und glaubwürdige spätere Nutzung erforderlich;
- Positiv- und Negativcheckpoint;
- keine globale Bluff-Heuristik.

### 18.7 Sichere, aber verzögert wertvolle Linien werden weggepruned

Gegenmaßnahme:

- geschützte Fronten nach Root, Meilenstein, Pflichtklasse und
  Commitment-Bezug;
- Pareto-Erhalt und konservative Upper Bounds;
- typisierte Prune-Gründe;
- gezielte Agenda-/Defense-Szenarien mit spätem Payoff.

### 18.8 Bewertungsregister wird doch zum globalen Score-Monolithen

Gegenmaßnahme:

- Planmodule liefern Fakten und Claims statt Globalwerte;
- jede Komponente ist versioniert, begrenzt und evidenzpflichtig;
- Hard Gates und Prioritätsklassen bleiben außerhalb weicher Summen;
- Source-Structure- und Review-Gate für neue Komponenten.

### 18.9 Planning Heads werden zur Nebenautorität

Gegenmaßnahme:

- Head braucht aktuellen LegalAction-Witness;
- Auswahl bindet noch keine Aktion;
- gewählter Head wird nach der Linienwahl autoritativ rematerialisiert;
- Abweichung fällt fail-closed aus.

### 18.10 Linienrandomisierung erzeugt Churn oder kaschiert schlechte Werte

Gegenmaßnahme:

- harte Zulässigkeit und Dominanzprüfung immer vor RNG;
- strategischer Rush-/Nicht-Rush-Draw höchstens einmal je Opportunity;
- Ergebnis in Kampagne und Turn Commitment persistieren;
- erneuter Draw nur nach echter Invalidierung oder neuer Opportunity;
- Wahrscheinlichkeiten und Nahgleichstandsband im Trace.

### 18.11 Mehrphasige Vollzugplanung wird unnötig komplex

Gegenmaßnahme:

- nur deterministisch belastbare Folgephasen planen;
- an echter Unsicherheit sofort enden und nach Beobachtung neu planen;
- nachweislich vertauschbare Reihenfolgen kanonisieren;
- einfache Zwei-Schritt-Suche als Baseline erhalten;
- Beam Search und größere Pareto-Fronten nur bei belegtem Mehrwert
  aktivieren.

## 19. Aktuelle Grenzen und Kalibrierung

Die gemeinsame Planung ist für Corp und Runner aktiv. Neue hypothetische
Planinstanzen hinter einem Projektionsschritt bleiben außerhalb des Vertrags;
`projected_plan_discovery_required` verlangt Discovery am realen Folgezustand.
Echte Informationsgrenzen beenden konkrete Folgeplanung. Nicht unterstützte
Projektion zertifiziert weder Wirkung noch Zugabschluss.

Suchbudgets, registrierte Werte, Risiko- und Nahgleichstandsgrenzen werden
an der jeweils zuständigen Policy mit Gegenproben geändert. Ihre heutigen
Werte stehen im Code, keine historische Shadow-Messung ist eine aktuelle
Laufzeitzusage. Mehr Suchkomplexität und weitere Ownerfähigkeiten entstehen
nur aus einem eigenen belegten Auftrag.
