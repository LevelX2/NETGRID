# AI Controller Spec

Status: frozen_for_implementation  
Stand: 2026-05-03  
Gilt für: MVP 0.3

## Ziel

Controller sind Eingabequellen. Die Engine bleibt die einzige Regelautorität. Human, AI und Replay dürfen nur `PlayerAction` einreichen, deren `actionId` aus aktuellen `LegalActions` stammt. `applyAction` validiert side, stateVersion, Timingpunkt, Kosten und Targets erneut.

## Controller-Typen

```ts
type PlayerController =
  | { controllerId: string; side: Side; type: "human_local" | "human_remote"; displayName?: string }
  | { controllerId: string; side: Side; type: "ai"; displayName?: string; profile?: AiProfile }
  | { controllerId: string; side: Side; type: "replay"; displayName?: string };
```

MVP 0.3 verwendet `human_local`, `human_remote`, `ai` und `replay` als modellierte Typen. Die Engine wertet diese Typen nicht als Regelquelle aus.

## AI-Input

Erlaubt:

- `side`
- `playerView`
- `legalActions`
- side-gefilterte `PublicGameEvent`-Taildaten
- `difficulty`
- `seed`
- `decisionId`
- `actionNumber`
- `profileId`

Verboten:

- `GameState`
- `cardInstances`
- gegnerische Hand-/Deck-/R&D-/Stack-Reihenfolgen
- unrezzed Corp-Kartentitel für Runner
- Runner-Grip-/Stack-Titel für Corp
- Session-, Token-, Storage- oder WebSocket-Interna
- private Event-Payloads der Gegenseite

## AI-Decision

```ts
type AiDecision = {
  actionId: string;
  reasonCode: string;
  explanation: string;
  consideredActionIds: string[];
  fallbackUsed: boolean;
  confidence?: number;
}
```

`reasonCode` ist stabil und testbar. `explanation` ist deterministisch, kurz und ausschließlich aus sichtbaren Daten abgeleitet.

## Fallback

Wenn eine Heuristik keine legale Action findet oder eine ungültige Action referenziert, wird deterministisch auf die erste stabile LegalAction zurückgefallen. Der Fallback muss markiert werden.

## Server-Orchestrierung

Der Server darf AI-Actions automatisch ausführen, wenn die aktive Seite als AI konfiguriert ist. Dabei gilt:

- AI-Actions laufen durch denselben `applyAction`-Pfad wie Human-Actions.
- Nach jeder AI-Action werden EventLog, StateHash, MatchVersion und Payloads aktualisiert.
- Der Loop stoppt bei Human-Turn, Winner, fehlenden LegalActions oder Action-Limit.
- Standardpayloads bleiben side-gefiltert.
