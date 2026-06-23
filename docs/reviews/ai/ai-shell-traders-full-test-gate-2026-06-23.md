# AI Shell Traders Full-Test-Gate 2026-06-23

## Ergebnis

Das `@netgrid/ai`-Full-Test-Gate ist wieder grün. Die vier roten Shell-Traders-Regressionen in `packages/ai/src/index.test.ts` waren keine Engine-LegalAction-Lücke, sondern eine Drift zwischen dem alten AI-/Test-Payloadfeld `shellTradersAbility` und dem aktuellen Engine-Vertrag `delayedInstallAbility`.

## Ursache

Die Engine erzeugt Shell-Traders-Prepare- und Remove-Counter-Aktionen weiterhin korrekt als `trigger_ability`-LegalActions. Seit der generischen Delayed-Install-/Hosting-Counter-Normierung steht die Fähigkeit im Payloadfeld `delayedInstallAbility`:

- `set_aside_from_grip` für das Vorbereiten einer Grip-Karte.
- `remove_shell_counter` für das Entfernen eines Shell-Counters.

Die roten AI-Tests suchten dagegen noch nach `payload.shellTradersAbility`. Dadurch wurden vorhandene LegalActions im Fixture nicht gefunden. Zusätzlich lasen Baseline-Scoring und Legacy-Planbewertung in `packages/ai/src/index.ts` und `packages/ai/src/legacy/runner-plans.ts` ebenfalls primär das alte Feld, sodass echte aktuelle Engine-Inputs Shell Traders nicht zuverlässig als Shell-Traders-Plan klassifizieren konnten.

## Fix

- `packages/ai/src/index.ts` erkennt Shell-Traders-Aktionen über einen kleinen Kompatibilitätshelfer, der `delayedInstallAbility` bevorzugt und `shellTradersAbility` nur als Fallback akzeptiert.
- `packages/ai/src/legacy/runner-plans.ts` nutzt dieselbe Erkennung für `build_rig`-Planbewertung.
- `packages/ai/src/index.test.ts` wurde auf den aktuellen Engine-Payload `delayedInstallAbility` aktualisiert.

Es gab keine Änderung am Kartenvertrag, keine Engine-Änderung, keine neue LegalAction-Erzeugung und keine Ausweitung von Hidden-Info-, Replay-, StateHash- oder `applyAction`-Verträgen.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Shell Traders" --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`

Der vollständige AI-Testlauf bestand mit 141 Testdateien und 1583 Tests.
