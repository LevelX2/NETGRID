# AI036 Neutral LegalAction Projection

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: read-only Builder im AI-Paket, keine Runtime-Verbrauchsstelle

## Kurzfazit

AI036 ergänzt `buildActionSemanticCandidates` und `buildNeutralActionSemanticCandidate` in `packages/ai/src/action-semantic-candidate.ts`. Der Builder nimmt ausschließlich vorhandene Engine-`LegalAction`s entgegen und erzeugt pro Eingabe genau einen neutralen `ActionSemanticCandidate`.

Die Projektion erzeugt keine Legalität, wählt keine Aktion, scored keine Aktion und verändert keinen bestehenden KI-Pfad. Die bestehende KI importiert den Builder nicht.

## Neutralform

Jeder neutrale Candidate erhält:

- `primaryProjectionStatus: "neutral_projected"`
- `semanticActionType: "unknown"`
- `sourceKind: "unknown"`
- `abilityBindingMethod: "unresolved"`
- `projectionIssues: []`
- `confidence: "none"`
- leere `cardContextSignals`, `actionTacticSignals`, `strategySupport`, `conditions`, `risks`, `constraints`
- `costProfile.costKnownStatus: "unknown"`
- leeres `timingProfile`
- `hardGates` mit `engine_legal_action`, `side_visibility`, `hidden_info` und `runtime_no_effect` auf `pass`

## Szenario-Korpus

Die 100%-Aussage gilt ausschließlich für den dokumentierten AI036-Korpus `ai036_synthetic_legal_action_fixture` aus `packages/ai/src/action-semantic-candidate.test.ts`.

Der Korpus deckt die aktuellen 32 `ActionType`s aus `packages/shared/src/index.ts` ab und ordnet sie den Mindestgruppen Runner-Turn, Corp-Turn, Run-Sequenz, Access-Sequenz, Choice-/Prompt-Sequenz, Rez-/Paid-Ability-Fenster, Trace-/Tag-/Damage-nahe Actions und Spezial-/System-Actions zu.

Für diesen Korpus gilt:

```text
totalLegalActions: 32
neutralProjected: 32
semanticActionTypeKnown: 0
sourceResolved: 0
abilityResolved: 0
targetContextProjected: 0
cardSemanticsJoined: 0
```

Das ist keine Aussage über alle theoretisch möglichen Spielzustände.

## Keine Hidden-Info-Projektion

Der Builder liest keinen `GameState`, keine Hidden Zones, keine Gegner-Privatdaten, keine Logs und keine Kartendatenbank. Aus `payload` werden nur sortierte Key-Namen nach `legalActionRef.originalPayloadKeys` übernommen; Payload-Werte werden in AI036 nicht in den Candidate projiziert.

## Keine Wirkung

AI036 hat keine Engine-, Shared-, Planner-, Scoring-, Action-Auswahl-, Profil-/Default-, UI- oder Legalitätswirkung.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai036-neutral-legal-action-projection.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI037 Basic Action Semantics`.
