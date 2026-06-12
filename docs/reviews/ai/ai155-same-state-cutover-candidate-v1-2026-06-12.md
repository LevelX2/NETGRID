# AI155 Same-State Cutover Candidate v1

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI155 sollte genau einen produktiven Fix testen, aber nur wenn AI149-AI154 einen harten Kandidaten liefern:

- same-state LegalAction belegt,
- TargetContext komplett oder ausreichend,
- Hard-/Risk-Gates grün,
- x5 nicht schlechter,
- x10 nicht schlechter,
- kein generischer Credit-/Draw-/Run-/Corp-Economy-Malus,
- keine Wiederholung des verworfenen B005-Draw-Malus.

## Entscheidung

Kein Runtime-Cutover.

## Evidenz

| Quelle | Ergebnis | Schluss |
| --- | --- | --- |
| AI149 Same-State Challenger Probe | 17 Kandidaten, 0 Same-State-Matches, 0 `same_state_legal_better`, 17 `historical_only_not_legal_now` | Kein produktiver Kandidat erfüllt die Kernbedingung. |
| AI150 TargetContext Closure | Top-5 vollständig oder begründet; historischer Challenger in 0 von 5 Fällen same-state vorhanden | TargetContext ist nicht der primäre Blocker, sondern fehlende LegalAction-Verfügbarkeit im selben Zustand. |
| AI151 Endgame Intent Memory Shadow | 122 Intents, 27 stale | Liefert Prioritäten, aber keine LegalAction-Freigabe. |
| AI152 Runner Coverage Solver Shadow | 15 Runner-/Run-Fälle, 10 `coverage_install_now`, 5 `coverage_credit_needed` | Shadow-Signal für Fixture-Aufbau, kein Cutover-Beweis. |
| AI153 Corp Tempo Converter Shadow | 20 Corp-/mixed-Fälle, Scoreline-/Advance-/Protection-Kategorien sichtbar | Shadow-Signal, keine Economy-Strafe. |
| AI154 MCTS-lite Probe v1 | 10 Probes, alle Proxy-stärker als Legacy, Runtime-Blocker `proxy_only_no_engine_state_applyaction_replay` | Proxy bestätigt Richtung, ersetzt aber keinen same-state Proof. |

## No-Go-Begründung

Ein Runtime-Fix wäre nur durch Verallgemeinerung aus historischen oder proxybasierten Shadow-Signalen möglich. Das wäre genau der Fehler, den dieser Block vermeiden soll. Ohne same-state LegalAction-Match darf weder eine Coverage-Installation, Search-Action, Scoreline-/Protection-Action noch Access/Trash/Steal-Aktion produktiv bevorzugt werden.

## Folge

AI156 ergänzt die Scorecard. AI157 darf kein produktives Flag mit Wirkung einführen; zulässig ist nur ein dokumentiertes Default-off/No-Candidate-No-Go. AI158 führt den finalen Sweep aus.

## Verifikation

- AI149: `sameStateMatches = 0`
- AI150: `historicalChallengerPresentAtSameState = 0`
- AI154: `runtimeBlocker = proxy_only_no_engine_state_applyaction_replay`
- `git diff --check`
