# AI091 Safe Scoreline Alternatives Review

Datum: 2026-06-11

Branch: `codex/ai088-ai094-post-stabilization-closure`

## Ergebnis

AI091 wurde als Review-/Gate-Paket abgeschlossen. Der aktuelle AI090-Stand erfüllt das Ziel fuer unsichere Scoreline-Entscheidungen bereits:

- `unsafeScoreChosen`: 3
- Ziel: <= 3
- keine Illegal Actions
- keine Replay-Failures
- Redaction-Safety grün

Eine zusätzliche Runtime-Aenderung wurde nicht vorgenommen. Der vorherige AI090-Versuch mit breiterem Runner-Pressure-Guard hatte `unsafeScoreChosen` auf 4 erhöht und wurde verworfen. Daraus folgt für AI091: Safe-Scoreline-Logik nicht aggressiver machen, solange kein konkreter, reproduzierbarer Unsafe-Score-Fall mit klarer sicherer Alternative isoliert ist.

## Aktuelle Funde

Quelle: `docs/reviews/ai/ai090-action-limit-a-d-5seed-2026-06-11.json`

Unsafe-Reasons:

| Reason | Count |
| --- | ---: |
| `unsafe_score_missing_protected_remote_signal` | 3 |
| `unsafe_score_runner_access_threat_high` | 3 |
| `unsafe_score_unprotected_remote` | 3 |
| `unsafe_score_insufficient_rez_reserve` | 1 |
| `unsafe_score_cheap_contest_available` | 1 |

Die Anzahl `unsafeScoreChosen` bleibt 3, weil mehrere Reasons denselben Score-Fall markieren können.

## Bestehende Guard-Evidence

Die bestehenden AI-Komponenten decken den gewollten AI091-Vertrag bereits ab:

- unsafe Scoreline wird über `corp_scoreline_safety_gate_blocks_doctrine` gegen Doctrine-Boosts geschützt
- passive Corp-Aktionen werden bei verfügbarer sicherer Scoreline mit `corp_passive_scoreline_available` downranked
- unsichere Remote-Scorelines können in bessere Remote-, Schutz-, Fast-Advance-, HQ-Schutz- oder No-Score-Pfade konvertieren

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "unsafe remote|unsafe scoreline|score now doctrine|passive economy|fast-advance|protects HQ|scoreline"`
- AI090-Matrix weiterhin maßgeblich: `unsafeScoreChosen = 3`, `passiveActionWithScoreLineAvailable = 2`

## Restbefund

`passiveActionWithScoreLineAvailable = 2` bleibt Review-Material, ist aber nicht dasselbe wie `unsafeScoreChosen` und wurde in AI091 nicht ohne klaren Fixture-Beleg verschärft. Eine aggressivere Änderung würde mit AI090/AI092-Zielen kollidieren, weil Scoreline-Druck, Runner-Pressure und Action-Limit-Schleifen im Trace gekoppelt sind.

