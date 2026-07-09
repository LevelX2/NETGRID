# AI Proteus Random/Bad Publicity Readiness

Status: historical_diagnostic_review_superseded_by_default_pool_ready

Aktualisierung 2026-07-09: Das Random-/Bad-Publicity-Modell ist umgesetzt, Zufall bleibt bis zum Engine-RandomDrawRecord unvorhergesagt, sichtbare Bad-Publicity-Schwellen werden side-safe bewertet und die Familien-/Pilotgates sind grün. Der folgende Text bleibt als historischer Vorbereitungsstand erhalten.

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
productiveUseAllowed: true
semanticExecutionAllowed: true
runtimeConsumerStatus: action_semantic_candidate_v1
noRuntimeEffect: false
technicalAiDeckEligibility: true
selectedAiPlaytestReady: true
defaultPoolReady: true
```

## Schluss

Die damaligen Removal Conditions sind geschlossen. Aktuelle Evidence steht im Proteus-Reconciliation-Final-Review vom 2026-07-09.
