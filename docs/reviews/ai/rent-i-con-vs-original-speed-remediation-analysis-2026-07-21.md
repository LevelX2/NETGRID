# Rent-I-Con gegen Original Speed – Remediation-Analyse (2026-07-21)

## Umfang

Ausgangsmatch `match_e653f50ac25eed22`, identische Seeds
`rent-i-con-vs-original-speed-2026-07-20-001` bis `-005`, je höchstens 480
Aktionen. Runner: `Rent-I-Con: Das Shellspiel`; Corp: `Original Speed v1.0`.

Die vollständigen, lokalen Entscheidungsdateien liegen unter
`data/local/ai-full-analysis-rent-i-con-vs-original-speed-2026-07-21-remediated/`.
Sie enthalten je Spiel alle Aktionen und bis zu 100 Alternativen pro
Entscheidung. Der zusammenfassende, lokale Baseline-Report liegt unter
`data/local/ai-match-deck-baseline-rent-i-con-vs-original-speed-2026-07-21-remediated.json`.

## Ergebnis

| Kennzahl | Ergebnis |
| --- | ---: |
| Spiele | 5 |
| Runner-Siege / Corp-Siege | 3 / 2 |
| Ø Aktionen / Ø Turns | 262,8 / 32,2 |
| Runner-Steals / Corp-Score-Aktionen | 13 / 9 |
| Illegale Aktionen | 0 |
| Replay-Fehler / Spiele mit Fehlern | 0 / 0 |
| Aktionslimit erreicht | 0 |
| Verdeckte Datenmarker | 0 |

Die Engine- und Replay-Invarianten bleiben damit intakt. Die Resultate sind
kein Balanceurteil bei nur fünf Seeds; sie zeigen jedoch stabile,
vollständig-replaybare Spiele ohne Sicherheitsfund.

## Wirkung der Maßnahmen

1. **Hint-Consumer-Contract:** `tacticSignals`, `strategySupportPairs` und
   `remoteRole` sind im Audit nun mit ihren realen Consumer-Ketten hinterlegt.
   Der repräsentative Corp-Audit enthält keinen
   `hint_field_without_consumer_contract`-Fund mehr. Drei verbleibende
   Hosted-Credit-Hinweisfehler (BBS/Department of Truth) sind unabhängig und
   nicht Teil dieses Pakets.
2. **Crystal Wall / Keeper / Quandary:** `corp_ice.end_run` bleibt in
   `tacticSignals`. Es wird durch den semantischen Profil-Compiler verarbeitet;
   zugleich bleiben `functionSignals`, `actionTacticSignals`, strukturierte
   `effects` und `etr_ice` erhalten. Der Vergleich ohne diese drei Einträge
   erzeugte in dieser Stichprobe keine belastbare Verbesserung, daher keine
   Datenlöschung.
3. **Plan-Mismatch:** Der Miner akzeptiert nun ausschließlich die beiden
   strukturierten Revalidierungen `runnerKnownPathBlockedByMissingCoverage` und
   `runnerRunSuppressedAsKnownNoAccess`. Die früheren zwölf
   `plan_step_action_mismatch` reduzierten sich auf vier. Damit bleiben echte,
   noch nicht erklärte Abweichungen sichtbar, während die bekannten
   Nicht-Run-Fälle nicht mehr fälschlich als Fehler erscheinen.
4. **Remote Contest:** Pläne tragen nun die explizite Phase
   `runner_remote_contest_phase:acquire_coverage` oder
   `runner_remote_contest_phase:execute`. Das dokumentiert die Absicht, ohne
   einen unbezahlbaren oder nicht breakbaren Run zu erzwingen.

## Restbefund

Vier mittelpriorisierte `plan_step_action_mismatch` verbleiben im
aggregierten Miner. Keiner betrifft eine illegale Aktion, einen Replay-Fehler,
ein Aktionslimit oder einen Informationsleck-Marker. Sie bleiben absichtlich
sichtbar: Für eine weitere Unterdrückung fehlt derzeit eine gleich präzise,
fachliche Begründung wie bei den zwei behandelten Revalidierungsfällen.
