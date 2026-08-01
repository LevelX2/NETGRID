# Serie 82b2 – Red-Evidence vor der Remediation

Datum: 01.08.2026  
Status: sechs Decision-Checkpoints replaybar, sechs gewünschte Erwartungen
rot; Broker-Deck-Consumervertrag rot

## Capture-Vertrag

Alle Checkpoints wurden nach ausdrücklicher Nutzerfreigabe mit einem
kurzlebigen read-only SQLite-Client aus den beiden abgeschlossenen Matches
aufgenommen. Die Fixtures enthalten den historischen Test-GameState, aber
Runtime-Input und Events bleiben side-redacted. Die Checkpoint-Validierung und
eine breite Any-LegalAction-Replayprobe sind für alle sechs Fixtures grün.

| Checkpoint | Finding | strict warmup | aktuelle Wahl | gewünschter Vertrag |
|---|---|---:|---|---|
| `cp-82b2-01-all-nighter-rd-bonus-d5` | F1 | D1–D4, 0 Drift | Bonus-Run Archives | gebundener Bonus-Run R&D |
| `cp-82b2-02-broker-cashout-d99` | F2 | D49–D98, 0 Drift | Basic Credit | Cashout der 12-Credit-Instanz durch `runner.credit_bank` |
| `cp-82b2-03-rd-data-wall-rez-d57` | F3 | D54–D56, 0 Drift | `decline_rez` | Data Wall durch `corp.defend_servers` rezzen |
| `cp-82b2-04-rd-fire-wall-rez-d92` | F3 | D77–D91, 0 Drift | `decline_rez` | Fire Wall durch `corp.defend_servers` rezzen |
| `cp-82b2-05-vapor-no-readvance-d137` | F4 | D133–D136, 0 Drift | Vapor Ops re-advancen | kein unmittelbarer Re-Advance nach Liquidation |
| `cp-82b2-06-vapor-no-repeat-readvance-d161` | F4 | D133–D160, 0 Drift | Vapor Ops re-advancen | keine wiederholte Nullsummen-Schleife |

## Voll-Warmup-Drift bei Broker

Ein zusätzlicher strikter Broker-Captureversuch ab D1 wurde bewusst verworfen:
Er driftet bereits bei D11 von historischem `Run auf Remote 1` zu aktuellem
`Run auf R&D`, lange bevor der Broker 12 Credits erreicht. Das ist
`runtime_state_drift` für den frühen Verlauf und keine zulässige Grundlage,
die Broker-Erwartung zu schwächen. Der gewählte Suffix beginnt bei D49 mit dem
vierten Load derselben Instanz und replayt alle 50 nachfolgenden Entscheidungen
bis D99 strikt ohne Drift.

## Roter Status vor dem ersten Codepatch

Der fokussierte Test
`series-82b2-remediation-decision-checkpoints.test.ts` besitzt für jede
Fixture eine grüne Replay-/Validierungsprobe und eine unveränderte gewünschte
Expectation. Auf dem Ausgangsstand liefern alle sechs Zielassertionen
`behavior_regression`; es gibt keine Legality-, Runtime-, Fixture- oder
Redactionfehler.

F5 wird durch den unveränderten Runner-Deck-Audit belegt: Sein
Behavior-Checkpoint läuft mit Warmup-Drift 0 grün, anschließend ist genau
`onr_v1_154_broker` mit `hosted_credit_add_hint_mismatch`, Engine `[3]` gegen
Hint `[]`, rot. Der Corp-Deck-Audit bleibt vollständig grün.

Damit sind ausschließlich aktuelle Verhaltensregressionen F1–F4 und der
aktuelle Datenvertrag F5 zur Implementierung freigegeben.
