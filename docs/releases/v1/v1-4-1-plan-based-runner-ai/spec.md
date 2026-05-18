# Planbasierte Runner-KI 1.4.1 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.4.1-Vertrag für Runner-Pläne, Run-/Rig-/Contest-Bewertung, DecisionDebug, Fallback, Benchmarks und Hidden-Info-Sicherheit.

## Grundsatz

Die Runner-KI plant unter Unsicherheit. Unbekannte Karten bleiben unbekannt.

```txt
AiDecisionInput -> RunnerPlanGenerator -> RunnerPlanEvaluator -> LegalAction -> PlayerAction -> applyAction
```

## Planmodell-Sollschema

```ts
type RunnerPlanKind =
  | "pressure_rnd"
  | "pressure_hq"
  | "contest_remote"
  | "build_rig"
  | "recover_economy"
  | "draw_for_answers"
  | "trash_asset"
  | "safe_probe_run"

type RunnerPlanCandidate = {
  planId: string
  kind: RunnerPlanKind
  legalActionIds: string[]
  visibleBenefits: string[]
  visibleRisks: string[]
  uncertainty: string[]
  requiredRoles: string[]
}

type RunnerPlanScore = {
  planId: string
  score: number
  confidence: number
  reasons: string[]
  evidence: string[]
}
```

## Erlaubte Inputs

Erlaubt:

- Runner PlayerView.
- aktuelle LegalActions.
- side-gefilterte PublicEvents/EventTail.
- eigenes Deckrollenprofil.
- AI-Hints für eigene AI-supported Karten.
- sichtbare Korp-Boarddaten, PublicEvents, Credits, Agenda-Punkte, Tags.

Verboten:

- Full GameState.
- verdeckte HQ-, R&D-, Archives- oder Remote-Kartenidentitäten, sofern nicht aufgedeckt.
- vollständige gegnerische Deckliste oder privates Deckrollenprofil.
- unrezzed ICE-Titel, solange nicht regelhaft bekannt.
- lokale private Asset- oder Dateipfade.

## Evaluatoren

### RunnerRigEvaluator

Bewertet:

- installierte Breakerrollen,
- MU-Verbrauch und freie MU,
- Creditreserve,
- Kartenrollen in eigener sichtbarer Hand,
- Setup-Lücken.

### RunCostEstimator

Bewertet:

- bekannte/rezzed ICE-Kosten,
- sichtbare ICE-Rollen,
- erwartbare Breaker-Kosten aus eigenen sichtbaren Rig-Daten,
- Creditreserve nach Run,
- Jack-out-Optionen.

### ServerAccessValueEvaluator

Bewertet:

- R&D-Wert aus öffentlichem Spielstand und Historie,
- HQ-Wert ohne echte HQ-Titel,
- Archives-Wert nach bekannten Archives-Informationen,
- Remote-Wert aus Advance-Stand und sichtbaren Root-Karten.

### RemoteThreatEvaluator

Bewertet:

- Advance-Stand,
- Corp-Credits und Klicklage,
- bekannte PublicEvents,
- sichtbare Assets/Upgrades,
- nicht die verdeckte Identität unbekannter Remote-Karten.

### CorpScoringThreatEvaluator

Bewertet:

- Corp-Agenda-Punkte,
- erreichbaren Agenda-Zielwert,
- sichtbare Scoring-Remote-Lage,
- öffentliche Scoring- und Installationshistorie.

## DecisionDebug

Runner-DecisionDebug muss nennen:

- `aiLevel: 2`
- `planKind`
- `selectedActionType`
- `score`
- `confidence`
- `visibleReasons`
- `uncertainty`
- `fallbackUsed`
- `seed`

DecisionDebug darf keine verdeckten Corp-Karten als Fakten nennen. Unsichere Annahmen müssen als Risiko oder Unbekanntheit formuliert werden.

## Fallback

Wenn kein Plan legal oder rechtzeitig gewählt werden kann:

1. sichere LegalAction aus bestehender Fallback-Heuristik wählen,
2. `fallbackUsed: true` setzen,
3. side-sichere Gründe liefern,
4. keine Action außerhalb von LegalActions erzeugen.

## Benchmark-Vertrag

Benchmarks messen mindestens:

- illegale Actions,
- Fallbackrate,
- Timeoutrate,
- Replay/StateHash-Fehler,
- Planrollenabdeckung,
- schlechte Runs in Negativfixtures,
- erfolgreiche Remote-Contest-Entscheidungen,
- Rig-/Economy-Timing,
- Regression gegen V1.4.0-Corp-Plan-KI.

## No-Scope-Prüfung

Ein V1.4.1-Implementation Review muss bestätigen:

- kein Belief State,
- keine FullState-Simulation,
- kein Zugriff auf verdeckte Corpkarten,
- keine neuen Karten oder Mechaniken,
- keine LLM-Regelautorität,
- keine Regression der Corp-Plan-KI.
