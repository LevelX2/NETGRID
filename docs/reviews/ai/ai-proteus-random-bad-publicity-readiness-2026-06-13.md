# AI Proteus Random/Bad Publicity Readiness

Status: diagnostic_readiness_only

## Ziel

Proteus-Karten mit Random-Outcome- und Bad-Publicity-Bezug diagnostisch klassifizieren. Technische KI-Deckzulassung und Selected-Deck-Playtest bestehen; dieses Familienmodell hat noch keine eigene produktive Wertungswirkung.

## Klassifikation

| Karte                 | Klasse                        | Hinweis                                                    |
| --------------------- | ----------------------------- | ---------------------------------------------------------- |
| AI Board Member       | needs_bad_publicity_model     | Bad-Publicity-Wert braucht eigenes Modell.                 |
| Charity Takeover      | needs_bad_publicity_model     | Publicity-/Agenda-Wert nicht mit Scoreline verwechseln.    |
| Scaldan               | needs_random_model            | Zufall darf nicht heuristisch geraten werden.              |
| Frame-Up              | needs_bad_publicity_model     | Bad-Publicity-Quelle, Tag-/Punish-Kontext getrennt halten. |
| Faked Hit             | needs_bad_publicity_model     | Meat-Damage-/Bad-Publicity-Kontext trennen.                |
| Poisoned Water Supply | needs_bad_publicity_model     | Bad-Publicity-Payoff bleibt diagnostisch.                  |
| Back Door to Netwatch | ready_for_semantic_annotation | Hidden-Resource-Kontext weiter side-safe prüfen.           |
| Roadblock             | ready_for_semantic_annotation | ICE-/Run-Tax-Semantik möglich, keine Proteus-AI-Freigabe.  |

## Gates

```text
productiveUseAllowed: false
semanticExecutionAllowed: false
runtimeConsumerStatus: none
noRuntimeEffect: true
technicalAiDeckEligibility: true
selectedAiPlaytestReady: true
defaultPoolReady: false
```

## Schluss

Proteus bleibt hinter Originalset-Stabilität zurückgestellt. Diese Liste bereitet nur spätere Semantikannotation vor.
