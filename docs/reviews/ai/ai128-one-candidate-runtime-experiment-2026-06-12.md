# AI128 One-Candidate Runtime Experiment

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI128 darf genau einen Runtime-Kandidaten testen, aber nur wenn AI123-AI127 einen wiederholbaren, sicheren Alternativpfad belegen. Andernfalls ist ein explizites No-Go der korrekte Abschluss.

## Kandidatenprüfung

Geprüfte Quellen:

- AI123: `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.md`
- AI124: `docs/reviews/ai/ai124-pair-a-late-draw-no-goal-review-2026-06-12.md`
- AI125: `docs/reviews/ai/ai125-x10-runner-reserve-outcome-review-2026-06-12.md`
- AI126: `docs/reviews/ai/ai126-corp-economy-endwindow-evidence-v2-2026-06-12.md`
- AI127: `docs/reviews/ai/ai127-action-alternative-snapshot-integration-2026-06-12.md`

Zusätzlicher Alternativen-Probe:

- `docs/reviews/ai/ai128-candidate-alternatives-probe-2026-06-12.json`

Probe-Befehl:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai128-candidate-alternatives-probe-2026-06-12.json --pairs a,d --seeds ai-v143-tuning-006,ai-v143-tuning-010 --max-actions 160 --max-findings 50 --include-action-alternatives --max-alternatives-per-finding 4
```

Probe-Ergebnis:

| Metrik | Wert |
| --- | ---: |
| Spiele | 4 |
| Entscheidungen | 563 |
| Action-Limit-Spiele | 3 |
| Illegal Actions | 0 |
| Replay-Fehler | 0 |
| Redaction safe | true |
| `unsafeScoreChosen` | 0 |
| `passiveActionWithScoreLineAvailable` | 0 |

Subcluster im Probe-Korpus:

| Subcluster | Spiele |
| --- | ---: |
| `late_draw_without_coverage_or_hand_goal` | 1 |
| `corp_late_gain_credit_no_safe_alternative` | 1 |
| `runner_late_gain_credit_real_reserve` | 1 |

## Kandidatenbewertung

| Kandidat | Evidence | Entscheidung |
| --- | --- | --- |
| Pair-A Late-Draw ohne Ziel | A006 zeigt den No-Goal-Draw, aber danach bereits `play_event`, Corp-Install und Corp-Advance. Alternative-Snapshots zeigen keinen klar besseren Draw-/Run-/Install-Pfad. | Kein Runtime-Kandidat. |
| Runner-Reserve-No-Conversion | AI125 trennt 9 Fälle in 5 Progress-Konversionen und 4 Reachability-/Reserve-Fälle. Keine wiederholte bessere Search-/Install-/Draw-Alternative. | Kein Runtime-Kandidat. |
| Corp-No-Safe-Alternative | D006 und D010 bleiben interessant. D006 zeigt `install_card`-Alternativen unterhalb gewähltem `gain_credit`, aber keinen belegten besseren Outcome. D010 nimmt nach Credit direkt `play_operation`; kein stabiler Credit-Vermeidungsfix. | Kein Runtime-Kandidat. |
| Wiederholter x10-Subcluster ohne notwendige Microsteps | Offizielle Top-Cluster sind Runner-Reserve, Corp-Reserve und Run-Microsteps. Run-Microsteps sind kein sicherer No-Progress-Hebel. | Kein Runtime-Kandidat. |

## Stop-Regeln

Ein Runtime-Test wurde nicht gestartet, weil die Eingangsvoraussetzung fehlt: kein wiederholbarer, side-sicher besserer Alternativpfad.

Damit werden die Stop-Regeln nicht erst nach einem schädlichen Experiment ausgelöst, sondern vorab angewendet:

- kein kosmetisches Detector-Tuning,
- keine generische Credit-/Draw-/Run-/Corp-Economy-Strafe,
- keine Wiederholung des AI121-B005-Draw-Malus,
- keine Änderung, die x5 verbessern könnte, aber x10 verschlechtert.

## Entscheidung

AI128 ist ein explizites No-Go für Runtime-Code.

Begründung:

- A006 ist ein echter Detector-Fall, aber kein belegter besserer Runtime-Pfad.
- Runner-Reserve ist überwiegend Progress- oder Reachability-Reserve.
- Corp-No-Safe-Fälle sind noch zu schmal und enthalten keine wiederholte bessere Scoreline-/Protection-/Install-Alternative.
- Der einzige bekannte enge B005-Kandidat wurde in AI121 bereits schlechter getestet und bleibt ausgeschlossen.

## Nächste Removal Condition

Ein späterer Runtime-Kandidat ist erst zulässig, wenn ein neuer Alternativen-Lauf zeigt:

1. mehrere gleiche Residual-Fälle,
2. dieselbe bessere LegalAction-Familie,
3. side-safe Begründung ohne Hidden-Info-Erweiterung,
4. bessere x5- und x10-Metriken,
5. keine Verschlechterung bei `actionLimitReached`, `unsafeScoreChosen` oder `repeated_no_progress_run`.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai128-candidate-alternatives-probe-2026-06-12.json --pairs a,d --seeds ai-v143-tuning-006,ai-v143-tuning-010 --max-actions 160 --max-findings 50 --include-action-alternatives --max-alternatives-per-finding 4`
- `git diff --check`
