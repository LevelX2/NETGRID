# Mechanic M1 Effect and Timing Spec

Status: V0.92 Freeze
Stand: 2026-05-03
Zielgate: V0.93

## Kurzentscheidung

M1 fuehrt ein additives Fundament fuer Effects, Abilities, Timing, Choices und Eventklassifikation ein. Es ersetzt bestehende spielbare Actions nicht sichtbar, sondern legt einen internen Vertrag fest, der spaetere Mechaniken ohne Sonderpfad-Wildwuchs erlaubt.

V0.93 darf bestehende Resolver adapterfaehig machen. Es darf aber keine Damage-, Trace-, Resource-, Mulligan-, Multiaccess-, Identity-Ability-, Prevention- oder Replacement-Mechanik spielbar machen.

## Shared-Vertraege

### EventVisibilityClass

```ts
type EventVisibilityClass =
  | "public"
  | "private_to_side"
  | "hidden_info_barrier"
  | "replay_only";
```

- `public`: oeffentliche Details duerfen in PublicEvents und PlayerViews erscheinen.
- `private_to_side`: Detaildaten nur fuer die berechtigte Side.
- `hidden_info_barrier`: erzeugt oder nutzt relevante neue verdeckte Information; Undo nach diesem Event wird blockiert.
- `replay_only`: Details bleiben nur im lokalen privaten Replay/Eventlog.

### CostRequirement

```ts
type CostRequirement =
  | { kind: "click"; amount: number }
  | { kind: "credit"; amount: number; source?: "credit_pool" | "future_hosted" | "future_recurring" }
  | { kind: "tag"; amount: number }
  | { kind: "counter"; counterType: string; amount: number; sourceRef: string };
```

V0.93 muss nur bestehende Kostenquellen funktional abdecken: Klicks, Credits und Tags. Hosted/Recurring/Counters duerfen typisiert vorbereitet werden, aber keine neue spielbare Nutzung erhalten.

### TargetRequirement

```ts
type TargetRequirement =
  | { id: string; kind: "card"; zoneScope?: string[]; side?: Side; visibility: "known_to_actor" | "public" | "engine_only" }
  | { id: string; kind: "server"; allowedServers?: ServerId[] }
  | { id: string; kind: "subroutine"; sourceIceRef: string }
  | { id: string; kind: "side"; allowedSides: Side[] };
```

Targets werden beim LegalAction-Bau und in `applyAction` erneut validiert. Hidden targets duerfen nicht in oeffentliche Payloads gelangen.

### ChoiceRequest und PendingChoice

```ts
type ChoiceRequest = {
  choiceId: string;
  side: Side;
  source: string;
  prompt: string;
  kind: "select_option" | "select_cards" | "bid_amount" | "confirm";
  options: ChoiceOption[];
  minSelections: number;
  maxSelections: number;
  stateVersion: number;
  visibility: EventVisibilityClass;
};

type PendingChoice = ChoiceRequest;
```

Pflichten:

- `GameState.pendingChoice` ist optional.
- `PlayerView.pendingChoice` zeigt nur Choices der berechtigten Side.
- Waerend `pendingChoice` aktiv ist, sind nur passende Choice-Actions legal.
- Falsche Side, falsche `choiceId`, stale `stateVersion`, ungueltige Optionen sowie zu viele/zu wenige Optionen werden abgelehnt.
- V0.93 darf synthetische Choice-Tests nutzen, aber keine neue sichtbare Mechanik wie Mulligan oder Trace freischalten.

### EffectDefinition

```ts
type EffectDefinition = {
  effectId: string;
  source: EffectSource;
  controller: Side;
  timing: TimingPointId;
  costs: CostRequirement[];
  targets: TargetRequirement[];
  choices?: ChoiceRequirement[];
  steps: EffectCommand[];
  visibility: EventVisibilityClass;
};
```

Ein Effect ist kein Freitext-Kartentext und kein UI-Script. Er ist ein typisierter Plan fuer deterministische Engine-Schritte.

### EffectCommand

V0.93-Startumfang:

- `gain_credits`
- `spend_credits`
- `draw_card`
- `install_card`
- `trash_card`
- `advance_card`
- `score_agenda`
- `rez_card`
- `start_run`
- `end_run`
- `change_breaker_strength`
- `break_subroutine`
- `resolve_subroutine`
- `access_card`
- `steal_agenda`
- `add_tag`
- `remove_tag`
- `set_pending_choice`
- `complete_pending_choice`
- `emit_event`

Nicht in V0.93:

- random Grip-Trash,
- Trace-Bids,
- Mulligan-Ablauf,
- Multiaccess-Queue,
- Prevention-/Replacement-Ketten,
- Hosting-Beziehungen,
- neue Counterfamilien ausser bestehenden Advancement-/Tag-/Memory-/Strength-Werten.

## Ability Registry

```ts
type AbilityDefinition = {
  abilityId: string;
  sourceCardDefinitionId: string;
  kind: "paid" | "triggered" | "static" | "setup" | "future_interrupt" | "future_replacement";
  allowedTimingPoints: TimingPointId[];
  effect: EffectDefinition;
  publicActionType?: ActionType;
};
```

V0.93-Pilot:

- Breaker Pump und Break werden intern als `paid` Abilities modelliert.
- Die daraus erzeugten LegalActions duerfen weiter `pump_breaker` und `break_subroutine` heissen.
- Action IDs bleiben deterministisch und kompatibel.
- Kosten, Timing und Ziel werden bei LegalAction-Erzeugung und `applyAction` doppelt geprueft.

## Timingstrategie

V0.93 gibt nur diese Fenster frei:

| TimingPointId | Erlaubter M1-Zweck |
|---|---|
| `corp_action.main` | Corp-Hauptaktionen und spaetere Corp-Paid-Faehigkeiten, sofern explizit legalisiert |
| `runner_action.main` | Runner-Hauptaktionen und spaetere Runner-Paid-Faehigkeiten, sofern explizit legalisiert |
| `run.approach_ice` | Corp-Rez/Decline und spaetere Approach-Choices |
| `run.encounter_ice` | Breaker Pump/Break Pilot |
| `access.resolve_card` | Access-Aufloesung und spaetere Access-Choices |
| `game.checkpoint` | Sieg-/Cleanup-Pruefung, keine allgemeine Priority |

Keine Seite erhaelt allgemeine Prioritaet, wenn kein konkreter LegalAction-Eintrag existiert.

## Eventklassifikation und Undo

V0.93 soll neue Events oder Effect-Ergebnisse klassifizieren. Der Server darf Hidden-Info-Barrieren daraus ableiten, solange bestehende Barrieren nicht abgeschwaecht werden.

Mindestklassifikation:

| Pfad | Klasse |
|---|---|
| Credits, Clicks, Tags, oeffentliche Install/Rez/Score/Steal-Information | `public` |
| Details einer nur der Side bekannten Choice | `private_to_side` |
| HQ/R&D Access, neuer Hidden-Info-Kontakt, Choice mit verdeckten Optionen | `hidden_info_barrier` |
| Vollstaendige private Action/LegalAction im lokalen Replay | `replay_only` |

## StateHash-Regel

`pendingChoice` und neue optionale Eventklassifikationsfelder sind State-/Eventschema-Aenderungen. Rebaselines sind nur erlaubt, wenn:

- die Aenderung im Implementation Review dokumentiert ist,
- kein Hidden-Info-Leak verdeckt wird,
- Replay nach Rebaseline deterministisch bleibt,
- alte Szenarien weiterhin fachlich dasselbe Verhalten zeigen.

## V0.93-Erfolgskriterien

- Bestehende Actions bleiben nach aussen kompatibel.
- `pendingChoice` ist side-sicher in `GameState` und `PlayerView` vorbereitet.
- Breaker Pump/Break laufen intern ueber Ability-Pilot oder einen aequivalenten Adapter.
- Choice-Revalidierung lehnt falsche Side, stale State, falsche Choice und ungueltige Optionen ab.
- Eventklassifikation kann Undo-Barrieren und PublicEvent-Filter stutzen.
- Keine M2- oder V0.94+-Mechanik wird spielbar.
