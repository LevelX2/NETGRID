# Corp Score Window Local Default Candidate

Status: `keep_env_gated`

Datum: 2026-06-13

Bezugsprozess: AI-MAT3-16 aus `docs/architecture/ai/ai-play-strength-maturation-3-process-2026-06-13.md`.

## Ergebnis

`corp_score_window` ist kein lokaler Default-off-Kandidat. Der Scope bleibt env-gated und report-only vorbereitet.

Aktueller Stand nach dem TargetChoice-Korpusausbau:

| Feld | Wert |
| --- | ---: |
| Corpus-Szenarien | 54 |
| Scope-Kandidaten | 54 |
| Erlaubte Corp-Score-Window-Fälle | 4 |
| Would-Override | 4 |
| Actual-Override | 0 |

## Bewertung

Die Fallzahl ist weiterhin zu klein für eine lokale Default-Vorbereitung. Der Scope enthält außerdem empfindliche Score-/Advance-Entscheidungen, bei denen verpasste Fenster, passives Scoring, Remote-Sicherheit und TargetChoice-Payloads zusammenwirken. Der neue TargetChoice-Korpus verbessert die Diagnose, reicht aber nicht für eine Default-Kandidatur.

Verbindliche Grenzen:

- keine Default-Aktivierung,
- keine lokale Policy-Freigabe als Default-off-Kandidat,
- keine produktive Score-/Advance-Übernahme,
- weitere Korpus- und ShadowLeague-Abdeckung vor erneuter Bewertung.

## Schlussfolgerung

`corp_score_window` bleibt für AI-MAT3-17 nur als `keep_env_gated` dokumentierbar. Eine spätere Kandidatur braucht deutlich mehr reale Score-/Advance-Fälle, stabile TargetChoice-Coverage und keine neuen Forbidden-Mistake-Signale in ShadowLeague.
