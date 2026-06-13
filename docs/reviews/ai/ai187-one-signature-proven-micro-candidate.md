# AI187 One Signature-Proven Micro Candidate

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI187 sollte genau einen Micro-Kandidaten testen, falls AI183, AI184 oder AI186 einen proof-fähigen Kandidaten liefern.

## Gate-Bedingungen

| Bedingung | Status |
| --- | --- |
| SemanticActionSignature vorhanden | teilweise erfüllt |
| TargetIdentity vorhanden oder irrelevant | nicht für Candidate-Pfade erfüllt |
| PlayerAction-Replay-Probe bestanden | nicht probbar |
| Intent-Contract passt | teilweise erfüllt |
| x5 nicht schlechter | nicht anwendbar |
| x10 nicht schlechter | nicht anwendbar |
| kein generischer Malus | erfüllt |

## Ergebnis

No-Go. Es gibt keinen signature-proven Micro Candidate.

| Quelle | Ergebnis |
| --- | --- |
| AI183 Candidate Gate v2 | 3 geprüft, 0 Gate-pass |
| AI184 PlayerAction Replay Probe | 3 geprüft, 0 replay-probed, 3 nicht probbar |
| AI186 Coverage Signature Review | 13 geprüft, 0 Gate-positive |

## Begründung

Die Signatur-Infrastruktur ist vorhanden, aber die candidate-path TargetIdentity fehlt weiterhin. Ein Runtime-Fix würde deshalb wieder auf einer Heuristik beruhen und könnte keine konkrete LegalAction in eine sichere PlayerAction-Auswahl übersetzen.

## Removal Conditions

- Candidate-path TargetIdentity ist `complete` oder fachlich irrelevant.
- Die konkrete signierte LegalAction ist im Snapshot wiederauffindbar.
- Eine PlayerAction kann mit `actionId`, `stateVersion`, Kosten und Ziel gebaut werden.
- Replay-Probe besteht deterministisch ohne IllegalAction.
- x5 und x10 werden durch den Micro-Fix nicht schlechter.

## Schluss

AI187 ändert keine Runtime, keine Scores und keine Planner-Gewichte. Das No-Go erhält den Testgegenstand und verhindert einen Cutover ohne vollständige Proof-Kette.

## Verifikation

- AI183: `passedCandidates = 0`
- AI184: `replayProbed = 0`
- AI186: `gatePositive = 0`
- `git diff --check`
