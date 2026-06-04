# Action-Semantik-Brücke Automationsprozess

Stand: 2026-06-04
Status: Prozessdefinition für sequenzielle Codex-Ausführung; keine Hintergrundautomation, kein Scheduler, kein unbeaufsichtigter Runtime-Prozess
Erstellt durch: `release-planning-agent`
Primärer Agent für Ausführung: `release-implementation-agent`

## Zweck

Dieser Prozess macht die zehn beschriebenen Schritte der Action-Semantik-Brücke ausführbar. Er definiert Ziel, Annahmen, Reihenfolge, Artefakte, Gates und automatische Fehlerbehandlung so, dass ein Codex-Controller die Schritte sequenziell ohne planmäßige menschliche Zwischenfreigaben abarbeiten kann.

Der Prozess erzeugt selbst keine Legalität, kein Scoring, keine Action-Auswahl und keine produktive KI-Wirkung. Er ist ein read-only Foundation- und Diagnoseprozess vor späterer, separat freizugebender DeckDoctrine-v2-, TacticalGoal- und Shadow-only-Arbeit.

## Quellen

- Eingefügte Aufgabenbeschreibung vom 2026-06-04.
- `docs/architecture/ai/ki-roadmap-neue-ki-spieler-2026-06-02-v1.md`.
- `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`.
- `docs/reviews/ai/ai019-legal-action-semantic-bridge-audit-2026-06-01.md`.
- `docs/reviews/ai/ai031-033-tactic-signal-taxonomy-finalization-2026-06-03.md`.
- Ergänzende 18 Präzisierungen aus Review-Text vom 2026-06-04.

## Zielpräzision

Das Gesamtziel ist für einen automatischen Prozess ausreichend präzise. Es braucht keine fachliche Rückfrage, wenn die folgenden Annahmen gelten.

Verbindliches Ziel:

```text
Alle von der Engine angebotenen LegalActions werden read-only in ActionSemanticCandidate-Projektionen überführt.

Die Projektion erzeugt keine Legalität.
Die Projektion wählt keine Aktion.
Die Projektion scored keine Aktion.
Die Projektion verändert keine Runtime-Entscheidung.
Die Projektion erklärt nur side-safe, was eine bereits legale Aktion semantisch bedeutet.
```

Gesicherte Annahmen:

1. Die "10 Schritte" meinen die zehn Schritte aus der eingefügten Action-Semantik-Beschreibung, nicht die gesamte 14-Step-KI-Roadmap.
2. Die im Quelltext benannten Batches `AI034` bis `AI042` decken Schritte 1 bis 9 ab.
3. Der dort noch unbenannte zehnte Schritt wird in diesem Prozess als `AI043 Diagnostic Doctrine/Goal Bridge Handoff` geführt.
4. `AI043` ist nicht das produktive semantische Entscheidungsmodul aus Roadmap-Step 10. Es ist nur ein diagnostischer Handoff nach erfolgreicher read-only Action-Projektion.
5. Der Controller stellt keine Zwischenfragen. Unklare Semantik wird konservativ als `unknown`, `schema_gap`, `source_unresolved`, `ability_unresolved`, `target_context_unavailable` oder `hidden_info_blocked` markiert.
6. Die Abarbeitung erfolgt in einem eigenen Worktree auf dem Branch `codex/ai-action-semantics-bridge`. Nach erfolgreichem Abschluss von AI043 muss dieser Branch lokal nach `main` integriert werden. Erst nach erfolgreichem Merge darf der Worktree wieder entfernt werden. Push und PR bleiben außerhalb dieses Prozesses und brauchen eine eigene Nutzerfreigabe oder einen separaten Abschlussworkflow.
7. `100 Prozent LegalActions` bedeutet immer 100 Prozent des im jeweiligen Report dokumentierten Szenario-Korpus, nicht alle theoretisch möglichen Spielzustände.

## Nicht-Ziele

- Keine neue KI-Entscheidung.
- Kein Produktiv-Scoring.
- Keine Action-Auswahl durch ActionSemanticCandidates.
- Keine Änderung an `applyAction`-Autorität.
- Keine LegalAction-Erzeugung durch Semantikdaten.
- Keine Hidden-Info-Projektion in PlayerViews, Reconnect, WebSocket, PublicEvents, Undo, Replay, Logs oder Client-Fehler.
- Keine Proteus-KI-Freigabe.
- Keine pauschale Card-Hint-Korrektur nebenbei.
- Keine Strategy-ID-Erweiterung nebenbei.

## Controller-Invarianten

Diese Invarianten gelten für jeden Step:

- Die Engine bleibt Regelautorität.
- Eingang sind nur Engine-`LegalActions`, side-safe `PlayerView`-/`AiDecisionInput`-Daten und bereits geprüfte Semantikartefakte.
- Der Controller darf unklare Semantik nicht raten.
- Jeder Step erzeugt Markdown- und JSON-Evidence, sofern nicht ausdrücklich begründet entbehrlich.
- Jeder Step erhält ein Check-Skript oder erweitert ein bestehendes Check-Skript mit expliziten Assertions für den neuen Step.
- Alle No-Effect-Flags bleiben `false`: Planner, ActionScore, PlanWeight, Targeting-KI, Engine, Legalität, Profil-/Default-Switch, UI-Derivation und Hidden-Info-Leak.
- Rote Checks sind zuerst Debug-Arbeit, kein sofortiger Stopp.
- Ein Step darf den nächsten Step erst freigeben, wenn sein Done-Gate erfüllt ist.

## Automatische Fehlerbehandlung

Der Prozess hat keine planmäßigen Human-Review-Stopps.

Konservative automatische Fortsetzung:

- unbekannter Action-Type -> `semanticActionType: "unknown"`, `primaryProjectionStatus: "schema_gap"`;
- fehlende Source -> `projectionIssues: ["source_unresolved"]`;
- mehrdeutige Ability -> `projectionIssues: ["ability_unresolved"]`;
- Zielkontext nicht side-safe verfügbar -> `projectionIssues: ["target_context_unavailable"]`;
- Hidden-Info-Grenze berührt -> `projectionIssues: ["hidden_info_blocked"]`;
- mehrdeutige Kartensignale bei Multi-Ability-Karte ohne Ability-ID -> nur Broad Card Context, keine Ability-nahe Signalübernahme;
- fehlende TargetProfile-Anbindung -> Report-Gap, keine Zielheuristik;
- rote Tests -> Ursache eingrenzen, engen Fix versuchen, relevante Checks wiederholen, Gap dokumentieren.

Sicherheitsblocker ohne Rückfrage:

- bestätigter Hidden-Info-Leak;
- bestätigte Runtime-/Planner-/Legalitätswirkung außerhalb des Step-Ziels;
- unklassifizierbare fremde Worktree-Änderungen;
- kaputte Repo-Grundlage, die nicht mit engem Step-Fix reparierbar ist;
- Sicherheitsverletzung, bei der Fortsetzung das NETGRID-Kernmodell schwächen würde.

Ein Sicherheitsblocker erzeugt einen Blocker-Report mit Ursache, betroffenen Dateien, letztem grünen Stand und Removal Condition. Der Controller fragt nicht nach, sondern stoppt den Prozesslauf sauber.

## State Machine

Empfohlener State-Pfad:

```text
worktree_preflight
→ step_planned
→ step_implementing
→ step_verifying
→ step_done
→ next_step_planned
→ ...
→ integration_preflight
→ integration_verifying
→ merged_to_main
→ worktree_removed
→ complete
```

Blocker-Pfad:

```text
step_implementing oder step_verifying
→ blocked
```

Regeln:

- Es ist immer genau ein Step aktiv.
- Kein Step darf übersprungen werden.
- Der Controller darf innerhalb eines Steps mehrere Fix-/Verify-Schleifen drehen.
- `complete` ist erst erlaubt, wenn Schritt 10 abgeschlossen, der Abschlussreport geschrieben, der Arbeitsbranch erfolgreich nach `main` gemerged und der separate Worktree entfernt wurde.
- `blocked` ist kein menschlicher Reviewzustand, sondern ein Sicherheitsstopp mit dokumentierter Removal Condition.

## Schrittfolge

Vor AI034 läuft ein nicht nummerierter Preflight. Er erzeugt keine Semantik- oder Codeänderung.

| Preflight | Ziel | Kernartefakte | Done-Gate |
| --- | --- | --- | --- |
| Action Bridge Baseline Check | Baseline, Worktree, Branch, relevante Semantik-Checks und ausgeschlossene fremde Dateien dokumentieren. | `docs/reviews/ai/action-semantics-bridge-preflight-2026-06-04.md`, `docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json` | Arbeits-Worktree/Branch eindeutig; Hauptworkspace und Arbeits-Worktree geprüft; AI028-R, AI031-033 und Guide V3 referenziert; relevante Checks grün oder bewusst out-of-scope; keine Codeänderung im Preflight. |

| Step | Batch | Ziel | Kernartefakte | Done-Gate |
| --- | --- | --- | --- | --- |
| 1 | `AI034 LegalAction Shape Inventory` | Aktuelle LegalAction-Typen, Payload-Shapes, Source-, Ability-, Target-, Choice-, Cost- und Timing-Kandidaten inventarisieren. | `docs/reviews/ai/ai034-legal-action-shape-inventory-<date>.md`, `.json`, `scripts/check-ai034-legal-action-shape-inventory.mjs` | Mindestens ein Action-Type inventarisiert; Shapes enthalten `actionType` und Payload-Key-Liste; No-Effect-Flags false; keine Engine-/Legalitätsänderung. |
| 2 | `AI035 ActionSemanticCandidate Schema` | Stabilen Candidate-Typ und Reportschema definieren. | Schema-Datei im AI-Paket oder Shared-Scope nach Bedarf, `docs/reviews/ai/ai035-action-semantic-candidate-schema-<date>.md`, `.json`, Check-Skript | Typ enthält Action, Source, Ability, Semantik, Cost, Timing, Target, Board, Confidence, `primaryProjectionStatus`, `projectionIssues`, Gates und Evidence; keine Runtime-Verbrauchsstelle. |
| 3 | `AI036 Neutral LegalAction Projection` | Jede LegalAction bekommt mindestens einen neutralen Candidate. | `buildActionSemanticCandidates` oder eng benannter neutraler Builder, Report, Check-Skript, Tests | 100 Prozent der betrachteten LegalActions neutral projizierbar; unknown/schema_gap erlaubt; keine Action-Auswahländerung. |
| 4 | `AI037 Basic Action Semantics` | Nicht-kartenbasierte Basic-/System-Actions semantisch klassifizieren. | Basic-Action-Mapping, Report, Check-Skript, Unit-Tests | Kernaktionen wie `gain_credit`, `draw_card`, `start_run`, `continue_run`, `jack_out`, `access_card`, `end_turn`, `resolve_choice` haben kontrollierte Semantik ohne Karten-Hints. |
| 5 | `AI038 Card Action Source Binding` | Card-Actions mit `sourceCardId` und eindeutiger `abilityId` verbinden, wenn side-safe möglich. | Source-/Ability-Binder, Report, Check-Skript, Tests | Source wird nur side-safe gesetzt; Single-Ability-Inferenz dokumentiert; Multi-Ability ohne eindeutige ID bleibt `ability_unresolved`. |
| 6 | `AI039 TargetContext Projection` | Legale Zieloptionen und ausgewählte Ziele in side-safe TargetContext überführen. | TargetContext-Typ/Builder, Report, Check-Skript, Tests | Nur Engine-angebotene legale Ziele; keine Hidden-Info-Ratewerte; TargetProfile-Gaps reportet statt geraten. |
| 7 | `AI040 Action Cost and Timing Profiles` | Kosten und Timing normalisieren. | `ActionCostProfile`, `TimingProfile`, Report, Check-Skript, Tests | Click-, Credit-, Trash-, Agenda-, Forfeit-, Damage-, Tag-, Discard-, X- und Timing-Felder werden soweit side-safe gefüllt; unbekannte Felder bleiben `unknown`. |
| 8 | `AI041 Action-to-Card-Semantic Join` | SourceCardId/AbilityId mit CardSemanticProfile, Taktiksignalen, StrategySupport, Risiken, Constraints und TargetProfiles verbinden. | Join-Builder, Report, Check-Skript, Tests | Single-Ability-Join übernimmt passende Signale; Multi-Ability-Join ohne ID bleibt breit und `ability_unresolved`; keine blinde Signalübernahme. |
| 9 | `AI042 Action Semantics Coverage Report` | Coverage, Gaps und Gates über Teststates/Szenarien auswerten. | Coverage-Report `.md`/`.json`, Check-Skript, Tests | 100 Prozent neutral projected; 0 Hidden-Info-Leaks; 0 Runtime-Verhaltensänderungen; unknown/schema_gap vollständig reportet. |
| 10 | `AI043 Diagnostic Doctrine/Goal Bridge Handoff` | Nur diagnostisch zeigen, wie Candidates später mit DeckDoctrine v2 und TacticalGoals verbunden werden können. | Handoff-Report, ggf. Shadow-only Fixture-Report, Check-Skript | Keine Score-, Auswahl- oder Produktivwirkung; klare Folgegrenzen für DeckDoctrine v2, TacticalGoal generation, Action-to-goal matching und Shadow-only Fixture-Design. |

## Step-Details

### Preflight: Action Bridge Baseline Check

Der Preflight ist verpflichtend und nicht Teil der zehn fachlichen Steps.

Pflichtpunkte:

- Branch/HEAD und separater Worktree sind dokumentiert.
- Hauptworkspace und Arbeits-Worktree sind sauber oder fremde Änderungen sind ausdrücklich excluded.
- `AI028-R` ist als aktuelle semantische Baseline referenziert.
- `AI031-033` Taxonomy Finalization ist abgeschlossen oder bewusst als noch nicht erforderlich dokumentiert.
- Guide V3 liegt am kanonischen Pfad.
- AI023-2 bis AI030 Checks sind grün oder bewusst out-of-scope.
- Keine Chronicle- oder fremden Dateien im Arbeitsset.
- `docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json` ist angelegt oder aktualisiert.

Progress-State-Mindestform:

```json
{
  "processId": "action-semantics-bridge",
  "currentStep": "AI034",
  "completedSteps": [],
  "blocked": false,
  "lastGreenCommit": null,
  "nextStep": "AI035"
}
```

### Szenario-Korpus und Coverage-Begriff

`100 Prozent LegalActions` darf nur relativ zu einem im Report benannten Szenario-Korpus beansprucht werden. Kein Step darf daraus eine Aussage über alle theoretisch möglichen Spielzustände ableiten.

Mindestkorpus für AI036 und AI042:

- Runner normaler Turn: Click-Credit, Draw, Install, Play Event/Prep, Start Run.
- Corp normaler Turn: Mandatory Draw, Click-Credit, Install, Rez Window, Advance, Score, Operation Play.
- Run-Sequenz: Approach, Encounter, Break/Pump, Continue, Jack Out, Pass ICE.
- Access-Sequenz: Access Card, Steal Agenda, Trash Accessed Card, Decline Trash.
- Choice-/Prompt-Sequenz: Resolve Choice, Choose Target, Pay/Decline.
- Rez-/Paid-Ability-Fenster.
- Trace-/Tag-/Damage-nahe Actions, soweit LegalActions im Korpus existieren.

AI036 darf `100% neutral projected` nur für den benannten Scenario Corpus beanspruchen. AI042 weist Coverage pro Szenario und aggregiert aus.

### AI034 LegalAction Shape Inventory

Der Controller liest LegalAction-Typen und Payloads aus Code, Tests und AI-DTO-Pfaden. Ziel ist Inventar, nicht Interpretation.

Pflichtfragen des Reports:

- Welche `actionTypes` existieren?
- Welche Payload-Felder gibt es?
- Wo stehen Source-, Ability-, Target-, Choice-, Cost-, Timing-, X- und Mode-Werte?
- Welche Actions sind Basic-, Card-, Game-Rule-, Choice- oder Unknown-Actions?
- Welche Payload-Felder sind side-safe im `AiDecisionInput` verfügbar?
- Welche Felder gehen aktuell zwischen Engine-LegalAction und AI-DTO verloren?

Pflichtabschnitt im JSON-Report:

```json
{
  "lostBetweenEngineAndAiDto": [
    {
      "field": "selectedCardId",
      "presentInEngine": true,
      "presentInAiDecisionInput": false,
      "impact": "target_context_gap",
      "recommendedStep": "AI039"
    }
  ]
}
```

Automatische Fortsetzung: Wenn ein Feld side-safe unklar ist, wird es als Risk Finding oder Candidate Gap reportet, nicht genutzt.

AI034 darf Engine-Code lesen und reporten, ohne Engine-Dateien zu ändern. Wenn AI034 keine Engine-Dateien ändert und keine Engine-/Shared-Typen importiert, ist Engine-Typecheck optional; sobald LegalAction-Typen importiert, Shared DTOs erzeugt oder Engine-Typen berührt werden, ist Engine-Typecheck Pflicht.

### AI035 ActionSemanticCandidate Schema

Der Candidate-Typ muss stabil genug für Reports und Tests sein, aber noch nicht alle Actions perfekt verstehen.

Pflichtfelder:

```ts
type ActionSemanticCandidate = {
  actionId: string;
  actionType: string;
  actorSide: "runner" | "corp";
  actorId?: string;
  observerSide?: "runner" | "corp" | "system";
  visibilityScope: "actor_private" | "public" | "corp_private" | "runner_private" | "developer_only";
  legalActionRef: {
    actionId: string;
    actionType: string;
    originalPayloadKeys: string[];
    payloadHash?: string;
  };
  stateVersion?: number;
  sourceKind: "card" | "basic_action" | "game_rule" | "choice" | "unknown";
  sourceCardId?: string;
  abilityId?: string;
  abilityBindingMethod:
    | "explicit_ability_id"
    | "engine_payload"
    | "single_legal_ability_inferred"
    | "unresolved";
  semanticActionType: string;
  cardContextSignals: string[];
  actionTacticSignals: string[];
  strategySupport: StrategySupportPair[];
  conditions: SemanticCondition[];
  risks: SemanticRisk[];
  constraints: SemanticConstraint[];
  costProfile: ActionCostProfile;
  timingProfile: ActionTimingProfile;
  targetContext?: ActionTargetContext;
  boardContext: BoardContextSummary;
  confidence: "none" | "low" | "medium" | "high";
  primaryProjectionStatus:
    | "projected"
    | "neutral_projected"
    | "partial_projected"
    | "blocked"
    | "schema_gap"
    | "hidden_info_blocked";
  projectionIssues: Array<
    | "source_unresolved"
    | "ability_unresolved"
    | "target_context_unavailable"
    | "hidden_info_blocked"
    | "cost_unknown"
    | "timing_unknown"
    | "card_semantics_unavailable"
  >;
  hardGates: ActionGateResult[];
  evidence: string[];
};
```

Mindestform für Gates:

```ts
type ActionGateResult = {
  gateId:
    | "engine_legal_action"
    | "side_visibility"
    | "hidden_info"
    | "source_resolution"
    | "ability_resolution"
    | "target_context"
    | "cost_known"
    | "timing_known"
    | "runtime_no_effect";
  status: "pass" | "block" | "unknown" | "not_applicable";
  severity: "info" | "warning" | "error";
  reason?: string;
  evidence?: string[];
};
```

In der Bridge-Phase blockt `unknown` nicht automatisch; es wird reportet. `block` ist für echte Hidden-Info-, Runtime-, Legalitäts- oder Sicherheitsprobleme reserviert.

Automatische Fortsetzung: Schema-Lücken werden als optionale oder `unknown`-fähige Felder modelliert, nicht als Prozessstopp.

AI035 darf Typen, Builder-Signaturen und Report-Schemas definieren, aber keine bestehende KI-Auswahlfunktion importieren oder aufrufen. Check-Assertions müssen bestätigen: keine Imports der neuen Action-Projektion in Legacy-Decision-, Scorer- oder Plan-Module; keine Veränderung an `chooseAction`, `applyAction` oder Player-Decision-Flows.

### AI036 Neutral LegalAction Projection

Jede LegalAction muss technisch als Candidate repräsentierbar sein.

Mindestprojektion:

```json
{
  "actionId": "<legal-action-id>",
  "actionType": "<action-type>",
  "sourceKind": "unknown",
  "semanticActionType": "unknown",
  "primaryProjectionStatus": "neutral_projected",
  "projectionIssues": [],
  "confidence": "none",
  "evidence": ["AI036 neutral projection"]
}
```

`neutral_projected` bedeutet nur: technisch repräsentiert, nicht semantisch verstanden.

Automatische Fortsetzung: Unbekannte Actions blockieren nicht, solange sie neutral projected und im Coverage-Report sichtbar sind.

Report-Metriken müssen mindestens trennen:

- `neutralProjected`;
- `semanticActionTypeKnown`;
- `sourceResolved`;
- `abilityResolved`;
- `targetContextProjected`;
- `cardSemanticsJoined`.

### AI037 Basic Action Semantics

Basic-/System-Actions bekommen eine kleine engine-nahe Semantik, unabhängig von Card Hints.

Pflichtfamilien:

- Economy: `gain_credit`.
- Draw: `draw_card`, `mandatory_draw`.
- Run: `start_run`, `continue_run`, `jack_out`.
- Access: `access_card`, `steal_agenda`, `trash_accessed_card`, `decline_trash`.
- Corp window: `rez_ice`, `decline_rez`.
- Turn flow: `end_turn`, `forgo_action`.
- Tag/Counters: `remove_tag`, `purge_virus_counters`, `purge_runner_virus_counters`.
- Choice: `resolve_choice`.

Zusätzlich muss AI037 im Report ausweisen, welche dieser LegalAction-Familien bereits im Inventar vorkommen, semantisch klassifiziert wurden oder bewusst `unknown` bleiben:

- `install_runner_program`;
- `install_runner_hardware`;
- `install_runner_resource`;
- `play_runner_event` / `play_runner_prep`;
- `install_corp_card`;
- `install_ice`;
- `install_remote_card`;
- `play_corp_operation`;
- `advance_card`;
- `score_agenda`;
- `rez_card`;
- `rez_ice`;
- `break_subroutine`;
- `boost_breaker_strength`;
- `pay_trace`;
- `boost_trace`;
- `prevent_damage`;
- `remove_tag`;
- `trash_installed_card`;
- `discard_cleanup`.

Automatische Fortsetzung: Mehrdeutige Systemaktionen bekommen breite Intent-Familien wie `turn_flow`, `pass_window`, `choice_resolution` oder `unknown`.

### AI038 Card Action Source Binding

Card-Actions bekommen source- und ability-nahe Bindung, soweit side-safe.

Regeln:

- `action.source` plus PlayerView-Auflösung ist bevorzugt.
- Eigene Hand-/Boardkarten dürfen actor-known genutzt werden.
- Gegnerische verdeckte Karten dürfen nicht aus Full State, Logs oder privaten Payloads ergänzt werden.
- Single-Ability-Inferenz ist nur erlaubt, wenn die Karte im aktuellen LegalAction-Angebot genau eine legal angebotene Fähigkeit besitzt und der LegalAction-Typ eindeutig auf diese Fähigkeit zeigt, oder wenn die Engine-Payload die Fähigkeit eindeutig macht.
- Multi-Ability-Karten ohne eindeutige Ability-ID bleiben `ability_unresolved`.

Nicht ausreichend ist, dass eine Karte im Kartentext nur eine auffällige Fähigkeit hat.

Pflichtfeld:

```ts
abilityBindingMethod:
  | "explicit_ability_id"
  | "engine_payload"
  | "single_legal_ability_inferred"
  | "unresolved";
```

Automatische Fortsetzung: Ability-Unklarheit wird dokumentiert und blockiert den Gesamtprozess nicht.

### AI039 TargetContext Projection

TargetContext baut nur aus legalen Engine-Angeboten und side-safe sichtbaren Daten.

Kernform:

```ts
type ActionTargetContext = {
  selectedTargets: LegalTarget[];
  availableTargets?: LegalTargetSummary[];
  targetKind:
    | "card"
    | "server"
    | "ice"
    | "program"
    | "resource"
    | "hardware"
    | "agenda"
    | "choice"
    | "unknown";
  targetZones: string[];
  targetSide: "runner" | "corp" | "both" | "unknown";
  hiddenInfoPolicy: string;
  availableTargetsStatus: "engine_provided" | "not_available" | "target_context_unavailable";
  targetProfileMatches: TargetProfileMatch[];
  targetConstraintResults: ConstraintResult[];
};
```

Wenn die Engine nur gewählte Ziele liefert, gilt `availableTargetsStatus: "not_available"`. Wenn legale Optionen aus Engine-Angeboten vorliegen, gilt `engine_provided`. Zieloptionen dürfen nicht aus Boardstate rekonstruiert werden, auch wenn sie offensichtlich erscheinen.

Automatische Fortsetzung: Wenn nur TargetRequirements, aber keine konkreten Zielkandidaten verfügbar sind, wird `target_context_unavailable` gesetzt.

### AI040 Action Cost and Timing Profiles

Kosten und Timing werden normalisiert, ohne daraus Bewertung zu erzeugen.

CostProfile:

```ts
type ActionCostProfile = {
  clickCost?: number;
  creditCost?: number;
  trashCost?: number;
  agendaPointCost?: number;
  forfeitAgenda?: boolean;
  selfDamage?: DamageAmount[];
  selfTag?: number;
  discardCost?: number;
  xValue?: number | "choice" | "unknown";
  paidBy?: "runner" | "corp" | "unknown";
  beneficiary?: "runner" | "corp" | "none" | "unknown";
  costKnownStatus: "known" | "partial" | "unknown" | "not_applicable";
  variableCost?: {
    kind: "x" | "trace_boost" | "trash_cost" | "rez_cost" | "choice" | "unknown";
    min?: number;
    max?: number;
    chosen?: number;
  };
  additionalCosts: string[];
};
```

TimingProfile:

```ts
type ActionTimingProfile = {
  phase?: string;
  turnSide?: "runner" | "corp";
  window?: string;
  runPhase?: string;
  encounterPhase?: string;
  accessPhase?: boolean;
  scoreWindow?: boolean;
  rezWindow?: boolean;
  responseWindow?: boolean;
};
```

Automatische Fortsetzung: Nicht ableitbare Kosten oder Timingfelder bleiben `unknown` oder fehlen, werden aber im Report gezählt.

### AI041 Action-to-Card-Semantic Join

Der Join verbindet LegalAction-Source mit CardSemanticProfile und Inspector-/Hint-Semantik.

Stufen:

1. `single_ability_card`: passende Card-Signale dürfen als `actionTacticSignals` übernommen werden, wenn die Inferenz nach AI038 zulässig ist.
2. `multi_ability_card + abilityId`: ability-relevante Signale dürfen als `actionTacticSignals` übernommen werden.
3. `multi_ability_card ohne abilityId`: nur breiter Card Context als `cardContextSignals`, `projectionIssues: ["ability_unresolved"]`.

Card-Level-`tacticSignals` dürfen im Candidate nur als `cardContextSignals` erscheinen. Ability-relevante Signale dürfen erst als `actionTacticSignals` erscheinen, wenn `abilityId` explizit oder sicher inferiert ist.

Automatische Fortsetzung: Fehlende ability-nahe Semantik erzeugt Follow-up-Findings, aber keine stillschweigende Kartenkorrektur.

### AI042 Action Semantics Coverage Report

Der Report konsolidiert die Brücke über Testszenarien.

Mindeststruktur:

```json
{
  "totalLegalActions": 0,
  "neutralProjected": 0,
  "sourceResolved": 0,
  "abilityResolved": 0,
  "targetContextProjected": 0,
  "costProfileProjected": 0,
  "timingProfileProjected": 0,
  "cardSemanticJoined": 0,
  "unknownActions": [],
  "hiddenInfoBlocked": [],
  "schemaGaps": [],
  "scenarioCoverage": [
    {
      "scenarioId": "runner_basic_turn",
      "totalLegalActions": 0,
      "neutralProjected": 0,
      "unknownActions": [],
      "schemaGaps": []
    }
  ],
  "topGapCategories": []
}
```

Gates:

- 100 Prozent LegalActions neutral projected.
- 0 Hidden-Info-Leaks.
- 0 Runtime behavior changes.
- 0 action selection changes.
- 0 non-engine legal assumptions.
- Alle unknown/schema_gap-Fälle dokumentiert.

### AI043 Diagnostic Doctrine/Goal Bridge Handoff

Dieser Schritt ist der Abschluss des beschriebenen 10-Schritte-Prozesses. Er verbindet die Ergebnisse nur diagnostisch mit dem nächsten Arbeitsfeld.

Erlaubt:

- Report, welche Candidate-Felder für DeckDoctrine v2, TacticalGoal generation und Action-to-goal matching bereitstehen.
- Liste fehlender HardGate-, TargetProfile-, Cost-/Timing- und Ability-Daten.
- Shadow-only Fixture-Vorschlag.
- Handoff an spätere separat freizugebende DeckDoctrine-v2-, TacticalGoal- und Shadow-only-Folgeprozesse.

Nicht erlaubt:

- produktives `chooseSemanticAiAction`;
- numerische Scores, Rankings oder Action-Auswahl-Simulationen, auch nicht testweise;
- Scoreberechnung für Live-Entscheidungen;
- Änderung von Plannergewichten;
- Feature-Flag-Cutover;
- Legacy-Entfernung.

Erlaubt sind nur Field-Readiness-Matrix, Gap-Liste, vorgeschlagene nächste Batches und Shadow-only-Fixture-Design ohne Gewichtung oder Rangliste.

## Verifikationsregeln

Pflicht je Step:

- Step-spezifisches Check-Skript.
- `corepack pnpm --filter @netgrid/ai test`, sobald AI-Code betroffen ist.
- `corepack pnpm --filter @netgrid/ai typecheck`, sobald AI-Code oder AI-Typen betroffen sind.
- `corepack pnpm --filter @netgrid/web typecheck`, wenn Shared-Typen, DTOs oder Debug-/Viewer-Daten betroffen sind.
- `corepack pnpm --filter @netgrid/engine test` und `typecheck`, wenn Engine-Typen, LegalAction-Builder oder Payload-Normalisierung betroffen sind.
- bestehende relevante AI-Semantik-Checks, mindestens die aktuellen AI028-R bis AI031-033 Checks, soweit sie im Workspace vorhanden sind und nicht bewusst out-of-scope sind.
- `git diff --check`.

Ein Step-Review muss dokumentieren:

- ausgeführte Befehle;
- Exit-Code oder Ergebnis;
- bekannte Warnungen;
- nicht ausgeführte Checks mit Begründung;
- No-Effect-Bestätigung.

AI034-Sonderregel: Engine-Code darf gelesen werden. Engine-Tests oder Engine-Typecheck sind nur Pflicht, wenn Engine-Dateien, Shared-Typen, LegalAction-Imports oder DTO-Typen geändert werden; sonst müssen sie als optional oder out-of-scope begründet werden.

## Worktree-, Git- und Integrationsregeln für automatische Ausführung

Empfohlener Arbeitsbranch:

```text
codex/ai-action-semantics-bridge
```

Empfohlener Arbeits-Worktree:

```text
C:\Projekte\NETGRID_AI_ACTION_SEMANTICS_BRIDGE
```

Worktree-Regeln:

- Der Hauptworkspace `C:\Projekte\NETGRID` bleibt der lokale Integrationsworkspace für `main`.
- Die AI034-bis-AI043-Abarbeitung läuft ausschließlich im separaten Worktree `C:\Projekte\NETGRID_AI_ACTION_SEMANTICS_BRIDGE`.
- Vor AI034 prüft der Controller, ob der Ziel-Worktree bereits existiert.
- Falls der Ziel-Worktree fehlt, wird er aus `main` für `codex/ai-action-semantics-bridge` angelegt.
- Falls der Branch bereits existiert, darf er nur verwendet werden, wenn er nicht in einem anderen Worktree aktiv ist und eindeutig zu diesem Prozess gehört.
- Der Controller darf während der Abarbeitung nicht in den Hauptworkspace zurückwechseln, außer für den abschließenden lokalen Merge nach `main`.
- Unklassifizierbare Änderungen im Hauptworkspace oder im Arbeits-Worktree sind ein Sicherheitsblocker.
- Lokale Runtime-Daten, Caches, SQLite-Dateien, Secrets und Build-Artefakte bleiben auch im separaten Worktree unversioniert.

Commit-Regel:

- Nach jedem grünen Step-Gate darf lokal committed werden.
- Commit-Message-Muster: `ai: <kurzer step-titel>`.
- Kein Push und kein Pull Request durch diesen Prozess.
- Keine lokalen Runtime-Daten, Caches, SQLite-Dateien, Secrets oder Build-Artefakte versionieren.
- Fremde oder unklare Worktree-Änderungen nicht revertieren.

Empfohlene Commit-Titel:

```text
ai: inventory legal action shapes
ai: define action semantic candidate schema
ai: add neutral legal action projection
ai: classify basic action semantics
ai: bind card action sources
ai: project action target context
ai: normalize action cost and timing profiles
ai: join action and card semantics
ai: report action semantics coverage
ai: hand off diagnostic doctrine goal bridge
```

Finale Integrationsregel:

- Nach AI043 muss der Arbeits-Worktree sauber sein und alle Step-Artefakte müssen committed sein.
- Vor dem Merge prüft der Controller im Hauptworkspace `C:\Projekte\NETGRID`, dass `main` aktiv und sauber ist.
- Wenn `main` seit Anlage des Arbeitsbranches weitergelaufen ist, muss der Controller `main` zuerst im Arbeits-Worktree in `codex/ai-action-semantics-bridge` integrieren und die relevanten Checks erneut ausführen. Konflikte oder rote Integrationschecks sind Sicherheitsblocker.
- Der lokale Merge nach `main` erfolgt erst, wenn der Arbeitsbranch die aktuelle `main`-Basis enthält, AI043 abgeschlossen ist, der Abschlussreport existiert und die finalen Checks grün oder begründet nicht erforderlich sind.
- Der bevorzugte lokale Integrationspfad ist ein Fast-Forward-Merge von `codex/ai-action-semantics-bridge` nach `main`. Wenn Fast-Forward nicht möglich ist, darf der Controller nur mit dokumentierter Begründung einen lokalen Merge-Commit erzeugen; Konflikte bleiben Blocker.
- Nach erfolgreichem Merge prüft der Controller den integrierten `main`-Stand mindestens mit `git status --short` und `git diff --check`.
- Erst danach wird der separate Worktree `C:\Projekte\NETGRID_AI_ACTION_SEMANTICS_BRIDGE` entfernt.
- Das Löschen des Arbeitsbranches ist optional und nur erlaubt, wenn `main` die Arbeit enthält und keine spätere Nachprüfung auf diesem Branch benötigt wird.
- Wenn der Merge nach `main` scheitert oder der integrierte `main`-Stand nicht sauber ist, bleibt der Worktree erhalten und der Prozess endet in `blocked` mit Removal Condition.

## Controller-Prompt-Kern

Wenn dieser Prozess später als Codex-Controller ausgeführt wird, gilt folgender Kernauftrag:

```text
Arbeite im NETGRID-Repo wiki-first.

Ziel: Arbeite die Action-Semantik-Brücke strikt sequenziell von AI034 bis AI043 ab.

Lies zuerst AGENTS.md, AGENTS.local.md falls vorhanden, release-implementation-agent und die Pflicht-Wissensseiten.
Lies danach diesen Prozess, CODEX_STATUS, KI-Roadmap, Guide V3, AI019 und AI031-033.

Arbeite für die Umsetzung ausschließlich im separaten Worktree C:\Projekte\NETGRID_AI_ACTION_SEMANTICS_BRIDGE auf Branch codex/ai-action-semantics-bridge.
Nutze C:\Projekte\NETGRID nur für den abschließenden lokalen Merge nach main.

Stelle keine Zwischenfragen.
Triff konservative Annahmen nur, wenn sie im Prozess erlaubt sind.
Rate keine Semantik.
Markiere Unsicherheit über `primaryProjectionStatus`, `projectionIssues`, Gaps und Reports.

Arbeite immer nur am aktuellen Step.
Führe Step-spezifische Checks aus.
Debugge rote Checks, solange kein Sicherheitsblocker vorliegt.
Schreibe Markdown-/JSON-Report und Check-Skript je Step.
Bestätige No-Effect-Flags.
Gehe erst zum nächsten Step, wenn das Done-Gate erfüllt ist.

Bei Hidden-Info-Leak, Runtime-/Planner-Wirkung, unklassifizierbaren fremden Änderungen oder anderem Sicherheitsblocker:
stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition und ändere keinen weiteren Step.

Wenn AI043 abgeschlossen ist, schreibe Abschlussreport und setze den Prozess auf integration_preflight.
Danach merge den Arbeitsbranch lokal nach main. Wenn der Merge erfolgreich ist und main sauber bleibt, entferne den separaten Worktree. Erst danach ist der Prozess complete.
```

## Abschlusskriterien für den Gesamtprozess

Der 10-Schritte-Prozess ist abgeschlossen, wenn:

1. AI034 bis AI043 in genau dieser Reihenfolge abgeschlossen sind.
2. Jede Engine-LegalAction im betrachteten Scope neutral projected werden kann.
3. Basic Actions kontrollierte Semantik haben.
4. Card Actions Source und Ability nur side-safe binden.
5. TargetContext nur aus legalen Engine-Zieloptionen entsteht.
6. CostProfile und TimingProfile normalisiert sind.
7. CardSemanticProfile nur side-safe gejoined wird.
8. Coverage-Gates 0 Hidden-Info-Leak, 0 Runtime-Wirkung und 0 Action-Selection-Wirkung bestätigen.
9. Unknown-, schema_gap-, unresolved- und hidden_info_blocked-Fälle vollständig reportet sind.
10. AI043 einen klaren diagnostischen Handoff liefert, aber kein produktives Scoring oder Entscheidungsmodul aktiviert.
11. `codex/ai-action-semantics-bridge` lokal erfolgreich nach `main` gemerged wurde.
12. Der separate Worktree `C:\Projekte\NETGRID_AI_ACTION_SEMANTICS_BRIDGE` nach erfolgreichem Merge entfernt wurde.
