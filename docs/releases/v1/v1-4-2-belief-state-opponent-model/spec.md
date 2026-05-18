# Belief State und Gegner-Modell 1.4.2 Spec

Stand: 2026-05-08
Status: eingefroren

## Grundsatz

Belief State ist kein geheimer Spielzustand. Er ist eine side-sicher rekonstruierte KI-Arbeitssicht.

```txt
(PlayerView, LegalActions, side-filtered Events, own private facts, replay history)
  -> BeliefStateReconstructor
  -> BeliefState
  -> PlanEvaluator
  -> LegalAction
```

## Datenmodell-Sollschema

```ts
type BeliefKnowledgeKind =
  | "public_fact"
  | "own_private_fact"
  | "revealed_opponent_fact"
  | "hypothesis"
  | "unknown"

type BeliefEntry = {
  key: string
  side: "runner" | "corp"
  kind: BeliefKnowledgeKind
  subject: string
  confidence: number
  sourceEventIds: string[]
  invalidatedBy: string[]
}

type BeliefState = {
  side: "runner" | "corp"
  version: string
  entries: BeliefEntry[]
  assumptions: string[]
  uncertainty: string[]
}
```

## Erlaubte Quellen

- eigene PlayerView.
- aktuelle LegalActions.
- side-gefilterte PublicEvents und private Events der eigenen Seite.
- eigene Hand-/Board-/Deck-Snapshot-Metadaten, soweit sie schon zulässig sind.
- rechtmäßig gesehene gegnerische Karten durch Access, Reveal oder Expose.
- Replay-Historie aus erlaubten Payloads.
- AI-Hints nur als Rollen-/Bewertungsdaten für bereits AI-supported Karten.

## Verbotene Quellen

- Full GameState.
- echte verdeckte Gegnerkarten.
- unrezzed ICE-Titel ohne regelhafte Offenlegung.
- komplette gegnerische Deckliste.
- WebSocket-, Reconnect-, Undo- oder Logdaten mit mehr Information als die Seite sehen darf.
- lokale private Pfade, Tokens oder Asset-Metadaten.

## Eventklassifikation

Die Implementierung muss mindestens diese Ereignisfamilien klassifizieren:

- Install.
- Rez.
- Advance.
- Score.
- Steal.
- Access.
- Trash.
- Draw.
- Discard.
- Shuffle.
- Arrange.
- Swap.
- Move to Archives, Heap, RFG oder Set Aside.
- Reveal.
- Expose.

Jede Klassifikation muss angeben:

- welche Seite die Information sehen darf,
- ob ein Fakt oder eine Hypothese entsteht,
- welche bestehenden Hypothesen invalidiert werden.

## Modelle

### Corp-Belief über Runner

- RunnerThreatModel: erwarteter Druck auf HQ, R&D und Remotes.
- RunnerAggressionMemory: historische Run-Frequenz und Contest-Verhalten.
- BreakerAvailabilityEstimate: sichtbare und plausibel vorbereitete Breakerrollen.
- RemoteContestProbability: Wahrscheinlichkeit, dass Runner einen Remote contestet.
- HQPressureEstimate und RNDPressureEstimate.

### Runner-Belief über Corp

- CorpPlanEstimate: Scoring-, Economy- oder Protection-Tendenz.
- RemoteCardBelief: Hypothesen über Remote-Risiko ohne Titel.
- UnrezzedIceRiskModel: Risiko aus Position, Rez-Historie und sichtbaren Kosten.
- HQAgendaDensityEstimate und RNDValueEstimate ohne echte Titel.
- CorpCreditReserveInterpretation.
- RNDTopFreshnessMemory.

## RNDTopFreshnessMemory

```ts
type RndTopFreshnessMemory = {
  lastKnownAccessEventId: string
  knownToRunner: boolean
  freshness: "fresh" | "stale_known_same_top" | "invalidated"
  invalidationReasons: string[]
}
```

Regel:

- Nach einem R&D-Access ohne Move der gesehenen Karte wird `stale_known_same_top` gesetzt.
- `pressure_rnd` und `safe_probe_run` erhalten einen Score-Abzug.
- Nach einer Invalidation wird der Abzug entfernt.

## DecisionDebug

DecisionDebug darf enthalten:

- Memory-Version.
- wichtigste Fakten.
- wichtigste Hypothesen.
- Confidence.
- Unsicherheit.
- Invalidierungsgrund.
- sichtbare Gründe für Planänderungen.

DecisionDebug darf nicht enthalten:

- versteckte Kartenidentitäten,
- echte Hidden-State-Wahrheit,
- private gegnerische Deckliste,
- Tokens oder lokale Pfade.

## Replay und StateHash

Belief State ist abgeleitete KI-Arbeitssicht und darf den echten GameState, EventLog-StateHash und Replay deterministischer Spiele nicht verändern.

## No-Scope

- Keine Rollout-Simulation.
- Kein Selfplay.
- Keine Replay-Browser-UI.
- Keine Tutorial-UI.
- Keine Kartenfreigabe.
- Keine Mechanikerweiterung.
