# Signal Consumer Coverage 2026-07-03

## Status

`ready_with_scoped_runtime_consumers`

Dieser Review schließt die Lücke zwischen der ICE Semantic Review v2 Signalpflege und der laufenden Semantic-Corp-Runtime für den aktuellen Korp-ICE-Platzierungspfad.

## Ergebnis

- `corp_ice.multi_program_trash`, `run.corp_run_rewind` und `damage.corp_persistent_damage_counter` sind in `packages/ai/src/runtime/corp-ice-placement/corp-ice-placement.ts` als eigene Profilmerkmale angebunden.
- Die kompilierten Runtime-Hints (`data/ai/ai-card-hints-compiled.json`) werden wieder aus dem aktiven Hint-Stand regeneriert und enthalten die aktuellen ICE-v2-`tacticSignals` und `strategySupportPairs`.
- `scripts/check-ai-tactic-signal-consumers.mjs` prüft aktuelle Review-Familien darauf, dass profile- oder strategy-relevante Signale entweder einen Source-Consumer, eine Strategy-Derivation oder eine explizite No-Runtime-Policy haben.
- Die alte Taxonomie-Drift ist bereinigt: Signale ohne Derivationsregel tragen keine direkten `allowedStrategyAnchors` mehr; das undottierte `tag_snowball_followup` ist in aktuellen Hint-Signal-/Evidence-Feldern zu `tag.snowball_followup` normalisiert.

## Runtime-Wirkung

- `multiProgramTrash`: verstärkt Program-Trash-/Rig-Tax-Erkennung im Korp-ICE-Platzierungsprofil.
- `runRewind`: wird als Tax-/Positionssignal behandelt und bevorzugt nicht als erstes ICE ohne rezzed Outside-Layer.
- `persistentDamageCounter`: wird als persistenter Damage-Druck im ICE-Profil sichtbar.

Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness-, UI- oder Hidden-Info-Vertragsänderung.

## Legacy-/Backlog-Grenze

Der neue Consumer-Gate blockiert aktuelle Review-Familien und die neuen ICE-v2-Signale. Ältere `targetProfileRelevant`-Backlog-Signale aus früheren AI019/AI020/Breaker-Slices bleiben im Report sichtbar, werden in diesem Slice aber nicht als neuer Blocker hochgezogen.

## Verifikation

- `corepack pnpm check:ai-compiled-hints`
- `node scripts/check-ai-strategy-taxonomy.mjs`
- `node scripts/check-ai-tactic-signal-consumers.mjs`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/compiled-hints-runtime.test.ts src/tactic-signal-consumers.test.ts src/strategy-taxonomy.test.ts src/runtime/corp-ice-placement/corp-ice-placement.test.ts --reporter=dot`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Hinweis: Ein vollständiger `corepack pnpm --filter @netgrid/ai exec vitest run --maxWorkers=1 --testTimeout=30000 --reporter=dot`-Lauf wurde anschließend abgeschlossen und scheiterte in 8 Dateien / 10 Tests an bestehenden bzw. nachgezogenen generierten AI-Report-/Index-/Overlay-Drifts und dem größeren Classic-Role-Quality-Gate (`ai-hint-quality-gates.test.ts`). Die neuen Consumer-Gates und der Korp-ICE-Placement-Scope sind separat grün.
