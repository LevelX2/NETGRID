# AI133 Progress-Aware Alternative Snapshots

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI133 erweitert die opt-in LegalAction-Alternative-Snapshots um progress- und zielbezogene Felder. Das Paket bleibt rein diagnostisch und ändert keine Runtime-Auswahl.

## Änderung

- Neuer Helper: `packages/ai/src/simulation/progress-aware-alternative-snapshot.ts`
- Integration: `scripts/run-ai-selfplay-trace-matrix.ts`
- Snapshot-Felder je Alternative:
  - `actionType`
  - `semanticActionType`
  - `scoreKeys`
  - `hardGates`
  - `targetContextStatus`
  - `expectedProgressLabel`
  - `blockedReason`
  - `similarLaterProgress`

`similarLaterProgress` ist absichtlich `unknown_shadow_only`. Der aktuelle AI133-Schritt behauptet noch keine historische Outcome-Ähnlichkeit; diese Auswertung gehört in AI136.

## Integrationsprobe

Ausgeführt wurde ein kleiner opt-in Selfplay-Lauf:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai133-progress-aware-alternative-snapshots-2026-06-12.json --pairs b --seeds ai-v143-tuning-005 --max-actions 160 --max-findings 10 --include-action-alternatives --max-alternatives-per-finding 5
```

Ergebnis:

| Metrik | Wert |
| --- | ---: |
| Spiele | 1 |
| Entscheidungen | 160 |
| Action-Limit erreicht | 1 |
| Illegal Actions | 0 |
| Replay Failures | 0 |
| Redaction-safe | 1 |

Die erzeugte JSON enthält die neuen Felder `hardGates`, `targetContextStatus`, `expectedProgressLabel`, `blockedReason` und `similarLaterProgress`.

## Bewertung

- Die Alternative-Snapshots bleiben opt-in und action-limit-window-scoped.
- Die Verdichtung nutzt nur bereits redaction-safe `actionAlternatives` aus dem Trace.
- Die Snapshot-Auswertung trennt Scoreline-, Coverage-, Protection-, Economy- und Reachability-Kontext, ohne LegalAction-Generierung oder `applyAction` zu verändern.
- Harte Gates werden nur als Diagnosefeld ausgewiesen und blockieren keine neue Aktion im Runtime-Pfad.

## Verifikation

- `corepack pnpm --filter @netgrid/ai test -- progress-aware-alternative-snapshot progress-delta-labeler`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai133-progress-aware-alternative-snapshots-2026-06-12.json --pairs b --seeds ai-v143-tuning-005 --max-actions 160 --max-findings 10 --include-action-alternatives --max-alternatives-per-finding 5`
- `git diff --check`
