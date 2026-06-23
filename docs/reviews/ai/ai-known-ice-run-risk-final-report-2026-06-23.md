# AI Known ICE Run Risk Final Report 2026-06-23

## Status

`abgeschlossen`

## Ergebnis

Der Runner bewertet bekannte und gerezzte sichtbare ICE-Gefahren vor dem Run nun side-safe als eigene Hazard-Schicht. Der konkrete Playtest-Fall `R&D` mit sichtbarem `Hunter`, Runner 2 Credits und Alternative `gain_credit` wählt nicht mehr den unbekannten R&D-Run als beste semantische Aktion, sondern Credits. Die Run-Alternative bleibt legal sichtbar, erhält aber `recommendation:gain_credits_first` und Diagnostics wie `visible_ice_hazard:trace_tag` und `visible_trace_tag_hazard_unavoidable:true`.

## Umsetzung

- `VisibleEffectiveSubroutine` trägt öffentlich `baseTraceStrength` und `traceSuccessEffect`; die Engine-RunQuote gibt diese Felder nur für bekannte/rezzed sichtbare ICE aus.
- `visible-run-analysis.ts` projiziert sichtbare Trace-Gefahren generisch aus RunQuote oder CardDefinition-Fallback: Tags, Tag+Counter, Counter, Damage, Trash und Run-Lock.
- Vermeidbarkeit wird aus sichtbarer Trace-Kapazität, sichtbarem Base-Link, Link-Credit-Pools und passenden sichtbaren Breakern bewertet.
- `RunnerRunTargetEvaluation` übernimmt Hazard-Penalty, Vermeidungskosten, erwartete Tags und Unavoidable-Zähler.
- `runnerPressureProbeTargetAllowed` lässt zentrale Pressure-Probes nur noch zu, wenn die RunTarget-Empfehlung selbst `run_now` oder `run_if_free` bleibt.
- Semantic Runtime zeigt die Hazard-Evidence im Score-Component `runner_run_target_semantic_guidance`.

## Abgedeckte Varianten

- Sichtbarer `Hunter` auf R&D mit zu wenig Credits verliert gegen Credit-Aufbau.
- Unrezzed `Hunter` wird nicht als bekannte Gefahr bepreist.
- Sichtbare Remote-Agenda darf trotz bekanntem Hunter-Risiko weiter `run_now` bleiben.
- `Data Raven`-artige Tag+Counter-Folge wird als stärkeres sichtbares Risiko klassifiziert.
- Sichtbarer Base-Link und `Replicator` reduzieren das Risiko auf Vermeidungskosten statt Blocker.

## Verifikation

Grün:

- `corepack pnpm exec vitest run src/known-ice-run-risk.test.ts src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts src/runner-run-target-guidance.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit` in `packages/ai`
- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Eingeordnet:

- `corepack pnpm --filter @netgrid/ai test` scheitert aktuell an vier isoliert reproduzierbaren Shell-Traders-Fixture-Tests in `packages/ai/src/index.test.ts`. Der erste Fehler (`plans installed The Shell Traders as build-rig progress before basic economy`) scheitert auch isoliert, weil der Test eine `trigger_ability`-Payload mit `shellTradersAbility` erwartet, obwohl die LegalAction dem Label nach vorhanden ist. Das liegt außerhalb des bekannten-ICE-Fixes.

## Vertragslage

Keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Änderung an `applyAction`, Replay, StateHash oder Randomness. Hidden Info bleibt geschützt: CardDefinition-Fallbacks werden nur für bereits bekannte/rezzed sichtbare ICE genutzt.

## Nachprüfung 2026-06-23

Die Review-Nacharbeit liegt separat unter `docs/reviews/ai/ai-known-ice-trace-review-fix-final-report-2026-06-23.md`.

Präzisierung zur Verifikation: Die grüne Aussage dieses Reports bezieht sich auf die feature-spezifischen Known-ICE-/Trace-Risk-Checks und die zugehörigen Typechecks. Der vollständige `@netgrid/ai`-Pakettestlauf bleibt baseline-rot wegen vier bekannten Shell-Traders-Fixture-Tests in `packages/ai/src/index.test.ts`; diese Fehler liegen außerhalb des Known-ICE-Trace-Fixes und wurden im Review-Fix erneut reproduziert.

Zusätzliche grüne Nachweise der Review-Nacharbeit:

- Base-Link-Kosten und Side-Effects werden aus Engine-CardImplementation-Quotes bewertet.
- Sichtbare Corp-Bid-Kapazität wird als Garantie-Spanne dokumentiert.
- Mehrere Trace-Subroutinen teilen Credits und Break-Affordability sequenziell.
- Ein echter Engine-`getPlayerView()` -> DTO -> Runner-AI-Test sichert `baseTraceStrength` und `traceSuccessEffect`.
- `tactical-plans.test.ts` wurde separat grün ausgeführt.
