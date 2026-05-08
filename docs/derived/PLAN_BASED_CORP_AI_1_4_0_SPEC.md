# Planbasierte Corp-KI 1.4.0 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.4.0-Vertrag für Corp-Pläne, Planbewertung, DecisionDebug, Fallback, Benchmarks und Hidden-Info-Sicherheit.

## Grundsatz

Planung ist Bewertung, nicht Regelautorität.

```txt
AiDecisionInput -> PlanGenerator -> PlanEvaluator -> LegalAction -> PlayerAction -> applyAction
```

## Planmodell-Sollschema

```ts
type CorpPlanKind =
  | "score_now"
  | "score_next_turn"
  | "build_scoring_remote"
  | "protect_hq"
  | "protect_rnd"
  | "recover_economy"
  | "bait_runner"

type CorpPlanCandidate = {
  planId: string
  kind: CorpPlanKind
  legalActionIds: string[]
  expectedBenefits: string[]
  visibleRisks: string[]
  requiredRoles: string[]
}

type CorpPlanScore = {
  planId: string
  score: number
  confidence: number
  reasons: string[]
  evidence: string[]
}

type CorpPlanDecision = {
  selectedPlanId: string
  selectedActionId: string
  fallbackUsed: boolean
  debug: CorpPlanDebug
}
```

`legalActionIds` müssen aus dem aktuellen `AiDecisionInput.legalActions` stammen.

## Erlaubte Inputs

Erlaubt:

- Corp PlayerView.
- aktuelle LegalActions.
- side-gefilterte PublicEvents/EventTail.
- eigenes Deckrollenprofil.
- AI-Hints für eigene AI-supported Karten.
- öffentliche Match-Metadaten wie Agenda-Punkte, Tags, Credits, sichtbare Server.

Verboten:

- Full GameState.
- Runner-Grip, Runner-Stack oder verdeckte Runnerkarten.
- vollständige gegnerische Deckliste oder gegnerisches privates Deckrollenprofil.
- nicht redigierte WebSocket-, Reconnect- oder Undo-Payloads.
- lokale private Asset- oder Dateipfade.

## Evaluatoren

### AgendaRiskEvaluator

Bewertet:

- eigene sichtbare Agenda-Punkte und Zielwert,
- installierte eigene Agenda-Kandidaten nur aus eigener erlaubter Sicht,
- Advance-Stand,
- Runner-Druck aus öffentlicher Historie.

### ServerThreatEvaluator

Bewertet:

- HQ-/R&D-Zugriffe aus öffentlicher Historie,
- sichtbare Schutzlage,
- bekannte Runner-Rig-Rollen nur soweit PlayerView sie offenlegt,
- Remote-Bedrohung aus Boardstatus und PublicEvents.

### EconomyReserveEvaluator

Bewertet:

- eigene Credits und Klicks,
- Rez-/Score-/Installationskosten,
- Economy-Operations, Assets und sichtbare sichere Einnahmequellen.

### IceRezEvaluator

Bewertet:

- Rez-Kosten,
- ICE-Rollen aus AI-Hints/Card-Roles,
- sichtbare Breaker-/Rig-Informationen nur wenn öffentlich,
- ETR-/Taxing-/Damage-/Tag-Rollen.

### ScoringWindowEvaluator

Bewertet:

- aktuelle Score-LegalAction,
- nötige Klicks und Credits,
- Advance-Zustand,
- erwartete Verwundbarkeit bis zum nächsten Corp-Zug.

### RemoteIntentMemory

Speichert nur erlaubte, rekonstruierbare Hinweise aus eigener Sicht und PublicEvents. Es darf keine verdeckten Runnerdaten oder FullState-Marker enthalten.

## DecisionDebug

DecisionDebug muss side-sicher sein:

- `aiLevel: 2`
- `planKind`
- `selectedActionType`
- `score`
- `confidence`
- `visibleReasons`
- `fallbackUsed`
- `seed`
- `profileId`

Nicht erlaubt:

- gegnerische verdeckte Kartenidentitäten,
- private Decklisten,
- FullState-Auszüge,
- nicht sichtbare Replacement-/Prevention-Optionen der Gegenseite.

## Fallback

Wenn kein Plan rechtzeitig oder legal ausgewählt werden kann:

1. wähle eine sichere LegalAction nach bestehender Fallback-Heuristik,
2. dokumentiere `fallbackUsed: true`,
3. liefere safe DecisionDebug,
4. erzeuge niemals eine eigene Action außerhalb von LegalActions.

## Benchmark-Vertrag

Benchmarks müssen mindestens messen:

- illegale Actions,
- Fallbackrate,
- Timeoutrate,
- Replay/StateHash-Fehler,
- Planrollenabdeckung,
- Szenarioziel erreicht oder nicht,
- Vergleich gegen Baseline.

## No-Scope-Prüfung

Ein V1.4.0-Implementation Review muss bestätigen:

- keine Runner-Plan-KI,
- kein Belief State,
- keine FullState-Simulation,
- keine LLM-Regelautorität,
- keine neuen Karten oder Mechaniken,
- keine Hidden-Info-Leaks.
