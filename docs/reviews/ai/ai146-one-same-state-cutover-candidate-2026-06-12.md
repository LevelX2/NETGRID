# AI146 One Same-State Cutover Candidate

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI146 durfte höchstens eine belegte same-state Runtime-Verbesserung schneiden. Der Cutover war nur zulässig, wenn dieselbe Entscheidungssituation eine legale, bessere Alternative mit hinreichendem Target-Kontext zeigt und der Testgegenstand erhalten bleibt.

## Entscheidung

Kein Runtime-Cutover.

## Evidenz

| Quelle | Ergebnis | Schluss |
| --- | --- | --- |
| AI140 Same-State Challenger Proof | `sameStateLegalBetter = 0`, `historical_only_not_legal_now = 17`, `redactionSafe = true` | Kein Kandidat erfüllt das Same-State-Kriterium. |
| AI141 TargetContext Gap Closure | Top-5-Fälle vollständig oder erklärt, aber historische Challenger-Action am Legacy-Entscheidungspunkt nicht als Alternative vorhanden | Target-Kontext ist nicht der blocker; LegalAction-Verfügbarkeit ist der blocker. |
| AI142 Runner Coverage Goal Completion Shadow | 10 von 15 Fällen mit Shadow-Completion-Potenzial | Priorisierungshilfe, kein Cutover-Beweis. |
| AI143 Corp Tempo Conversion Shadow | 9 von 9 Fälle als Tempo-Konversion klassifizierbar | Priorisierungshilfe, kein Cutover-Beweis. |
| AI144 Endgame Intent Memory Shadow | 56 konvertierte Intents, 35 durch fehlende legale Alternative blockiert | Intents können erklärt werden, aber nicht pauschal in Runtime-Scoring übernommen werden. |
| AI145 MCTS-lite Endwindow Probe | 5 von 5 Proxy-Probes schlagen Legacy, Runtime-Blocker `proxy_only_no_engine_state_applyaction_replay` | Proxy bestätigt Richtung, ersetzt aber keinen Engine-State- und LegalAction-Beweis. |

## No-Go-Begründung

Eine Runtime-Änderung an der Aktionsauswahl wäre hier eine Verallgemeinerung aus historischen oder proxybasierten Schattenbefunden. Das verletzt den Paketkontrakt, weil keine geprüfte same-state LegalAction-Alternative vorliegt. Insbesondere darf daraus keine generische Credit-, Draw-, Run- oder Corp-Economy-Strafe entstehen.

## Folge

AI147 fasst die semantischen Endgame-Metriken als Scorecard zusammen. AI148 führt den finalen Sweep aus und prüft, ob die unveränderte Runtime weiterhin legal, deterministisch und redaction-safe bleibt.

## Verifikation

- AI140: `sameStateLegalBetter = 0`
- AI141: Top-5-Fälle vollständig oder erklärt
- AI145: alle Probes mit Runtime-Blocker `proxy_only_no_engine_state_applyaction_replay`
- `git diff --check`
