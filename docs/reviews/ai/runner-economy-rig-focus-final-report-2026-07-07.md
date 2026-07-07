# Runner Economy Rig Focus Final Report 2026-07-07

## Ergebnis

Die Analyse aus Match `match_6e8f03d9b28d5898` wurde in vier Umsetzungspaketen bearbeitet und side-safe über PlayerViews, LegalActions, PublicEvents, Rollen- und Hint-Semantik abgesichert.

## Umgesetzte Änderungen

### Broker-/Bank-Economy

- Broker-Installationen werden nicht mehr nur dann positiv bewertet, wenn im selben Zug bereits ein Load-Follow-up plausibel ist.
- Bank-Economy hat ein mehrzügiges Wertziel: erster Load, weitere Loads bis zum Wertziel und Cashout erst bei akutem Bedarf oder ausreichend hohem Bankstand.
- Cashout bei 6 gespeicherten Credits ohne konkreten Fundingbedarf wird nicht mehr als Standardziel behandelt; der generische Wert-Cashout liegt bei 12 gespeicherten Credits.
- Akute Agenda-/Remote-Fenster können Broker-Build weiterhin übersteuern.

Commit: `90bae71de fix(ai): treat broker as multi-load economy plan`

### Coverage-Install und Discard

- Sichtbare Hand-Breaker, die einen konkreten bekannten ICE-Coverage-Bedarf decken, erhalten einen eigenen Install-Score.
- Discard-Keep-Score schützt nicht redundante Runner-Economy, Payout, Breaker, Setup, Draw- und Pressure-Karten stärker.
- Playable/Installable Runner-Economy wird zusätzlich gegen Handlimit-Discard geschützt.
- Non-additive Runner-Utility-Duplikate in Hand oder bereits im Rig werden gezielt niedriger bewertet, damit echte Redundanz weiterhin abwerfbar bleibt.

Commit: `d80e4f0f9 fix(ai): prefer useful runner hand cards`

### Run-Payoff

- Bekannte R&D-Topkarten mit Trash-Payoff zählen nur noch als sinnvoller Run-Payoff, wenn nach dem Trash mindestens 2 Credits Reserve bleiben.
- Ein bekannter R&D-Top wie `BBS Whispering Campaign` wird damit nicht mehr wiederholt angelaufen, wenn der Runner zwar gerade zahlen könnte, danach aber blank wäre.
- Bestehende No-Payoff- und Declined-Trash-Memory bleibt erhalten.

Commit: `cba4247b1 fix(ai): require reserve for known R&D trash payoff`

## Verifikation

Fokussierte Gates wurden je Paket grün ausgeführt:

- `vitest run packages/ai/src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000 -t "Broker"`
- `vitest run packages/ai/src/runtime/runner-install-score.test.ts packages/ai/src/runtime/discard-keep-score.test.ts --maxWorkers=1 --testTimeout=30000`
- `vitest run packages/ai/src/known-central-access-payoff.test.ts packages/ai/src/runtime/runner-rnd-repeat-run-score.test.ts --maxWorkers=1 --testTimeout=30000`
- `tsc -p packages/ai/tsconfig.json --noEmit`
- `prettier --check` auf den geänderten AI-Dateien
- `git diff --check`

## Hinweis

Ein direkter Voll-Lauf von `semantic-ai-runtime-cutover.test.ts` war nicht Paket-Gate, weil zwei bestehende aktive RunPlan-Tests mit `MissingRunnerRunPlanError` abbrechen. Nach den finalen Änderungen: 71 Tests bestanden, 2 Tests fehlgeschlagen. Die betroffenen Tests sind nicht Broker-, Discard-, Coverage-Install- oder R&D-Payoff-spezifisch.

## Grenzen

- Es wurden keine Engine-Regeln und keine LegalAction-Erzeugung geändert.
- Remote-Contest wurde nicht neu erfunden; bestehende sichtbare High-Payoff-Remote-Overrides bleiben erhalten und werden durch Broker-/Economy-Pläne nicht übersteuert.
- Die Lösung nutzt keine verdeckten Corp-Zonen und keine nicht legalen Handlungen.
