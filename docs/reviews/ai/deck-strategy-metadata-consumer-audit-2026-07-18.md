# Deck Strategy Metadata Consumer Audit 2026-07-18

Status: abgeschlossen

## Ergebnis

Die öffentlichen Metadaten des `AiDeckStrategyProfile` haben jetzt einen expliziten Consumer-Vertrag. Es verbleibt kein unklassifiziertes Runner-/Corp-Teilprofil und kein scheinbar produktives Feld ohne Laufzeitwirkung.

| Metadaten                                                    | Einstufung                 | Consumer                                            | Entscheidung                                                                                  |
| ------------------------------------------------------------ | -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `strategyScores`, `primaryStrategies`, `secondaryStrategies` | produktiv und diagnostisch | StrategicIntent/RuntimeContext, AI007               | behalten                                                                                      |
| `functionSignalCounts`                                       | produktiv und diagnostisch | RunnerStrategicIntent, AI007                        | behalten                                                                                      |
| `legacySignalCounts`                                         | nur diagnostisch           | AI007-Legacygruppen, AI006-Invariant-Check          | behalten; verhindert, dass Legacy-Rollen unbemerkt wieder Anchorwirkung erhalten              |
| `runnerProfile.*`                                            | nur diagnostisch           | AI007-Runnerprofil                                  | behalten; zeigt Coverage-, Economy-, Setup-, Pressure- und Defense-Lücken nachvollziehbar an  |
| `corpProfile.iceProfile`, `scoreProfile`, `remoteProfile`    | nur diagnostisch           | AI007-Corpprofil                                    | behalten; Rohzählungen erklären StrategyScores, ohne zusätzliche Plannerwirkung vorzutäuschen |
| `corpProfile.economyProfile`, `punishProfile`                | produktiv und diagnostisch | CorpStrategicIntent, StrategicRuntimeContext, AI007 | behalten                                                                                      |
| `warnings`                                                   | nur diagnostisch           | AI007, DeckDoctrine-v2-Diagnostik                   | behalten und mit Karten-ID-Provenienz ausgeben                                                |

## Bereinigungen

- `DECK_STRATEGY_METADATA_CONSUMER_CONTRACT` ist die maschinenprüfbare Klassifikation aller abgeleiteten öffentlichen Metadatengruppen.
- Inspector-Warnungen tragen nun die verursachende `cardId`; gleichartige Warnungen mehrerer Karten kollabieren nicht mehr zu einer herkunftslosen Deckwarnung.
- Der AI007-Viewer bezeichnet den StrategyProfile-Pfad nicht länger fälschlich als ohne Plannerwirkung. StrategyScores wirken als `strategic_intent_input`; Seitenprofile und Legacy-Zählungen bleiben ausdrücklich diagnostisch.

## Keine Entfernung

Die diagnostischen Profile sind nicht redundant zum Nutzer- und Reviewzweck: StrategyScores zeigen das Ergebnis, die Teilprofile und Legacy-Zählungen erklären dessen Rohbasis beziehungsweise sichern die Abgrenzung alter Rollen. Ein Entfernen würde die geforderte Erkennbarkeit von Deckzweck und Ableitungslücken verschlechtern. Deshalb wurden diese Felder klassifiziert und ihre vorhandenen Consumer präzisiert statt sie zu löschen.
