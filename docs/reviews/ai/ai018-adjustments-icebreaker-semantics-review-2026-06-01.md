# AI018 Anpassungen: Icebreaker Semantik Review

Datum: 2026-06-01
Aufgabe: AI018 Anpassungen
Auslöser: `AI018_Icebreaker_Semantics_Review_Instructions_2026-06-01.md`

## Kurzfazit

Die AI018-Review-Anpassungen sind umgesetzt. TargetProfile V1 ist jetzt als gültige, rein diagnostische Hint-Struktur erlaubt. Die Icebreaker-Spezialfälle wurden enger beschrieben, `breaker.unknown_special` bei Morphing Tool und Fubar abgebaut, und generische Search-/Recovery-Karten erzeugen keinen pauschalen `runner.search.breaker`-Derived-Anchor mehr.

Keine Änderung erzeugt Plannerwirkung, Action Scores, PlanWeights, Targeting-KI, Engine-Regeln, Legalität, Profile/Defaults, UI-Derivationslogik oder Kartenpool-/Proteus-Baseline-Korrekturen.

## Schema- und Katalogänderungen

- TargetProfile V1 ist in der Hint-Ontologie valide:
  - `schemaVersion=target-profile-v1`
  - `kind`: `install_target`, `mode_choice`, `search_install_target`, `hosted_install_target`, `use_target`, `replacement_target`
  - `timing`: unter anderem `on_install`, `on_play`, `paid_action`, `during_ice_encounter`, `after_successful_run`, `replacement_window`
  - `targetType`: `installed_ice`, `ice_type`, `program`, `icebreaker`, `hosted_program`, `server`, `card`
  - kontrollierte `preferences`, `avoid` und `hiddenInfoPolicy`
- Der Taktiksignal-Katalog enthält jetzt 79 Signale.
- Neue support-only Signale:
  - `breaker.delayed_action_cost`
  - `breaker.ends_run_after_use`
  - `breaker.hosted_strength_penalty`
  - `breaker.multi_subroutine_break`
  - `breaker.one_time_mode_choice`
  - `breaker.scaling_strength`
  - `breaker.stealth_payment_loss`
  - `setup.hand_size`
  - `setup.memory`
  - `setup.program_host`
- `setup.recovery` ist jetzt support-only. `setup.search` ankert `runner.search.breaker` nur noch in der engeren Programmsuche mit strukturiertem `target=program`.

## Kartenentscheidungen

| Karte | Anpassung |
| --- | --- |
| Black Widow | TargetProfile V1 `install_target` für gewähltes installed ICE ergänzt. |
| Morphing Tool | `breaker.unknown_special` entfernt; `configurableCoverage`, `reconfigurableType`, `coverageCandidates` und zwei `mode_choice`-TargetProfiles ergänzt. |
| Fubar | `breaker.unknown_special` vermieden; `configurableCoverage`, `oneTimeModeChoice`, `stealth_loss` und `mode_choice`-TargetProfile ergänzt. |
| Airport Locker | V1-TargetProfile `search_install_target` für Programmauswahl während ICE-Encounter ergänzt; Breaker-Suche bleibt echter Anchor. |
| Lockjaw | V1-TargetProfile `use_target` für temporären Icebreaker-Strength-Bonus ergänzt. |
| Personal Touch, The | V1-TargetProfile `use_target` für permanenten Icebreaker-Strength-Counter ergänzt. |
| Pattel's Virus | V1-TargetProfile `use_target` für Strength-Reduction-Counter auf installed ICE ergänzt. |
| Dropp | `breaker.ends_run_after_use` wird aus `ends_run_after_use` abgeleitet. |
| Japanese Water Torture | `breaker.delayed_action_cost` wird aus `forgo_actions` abgeleitet. |
| Big Frackin' Gun, Redecorator, Pile Driver | `breaker.multi_subroutine_break` mit `maxSubroutinesPerBreak` abgeleitet. |
| Skeleton Passkeys | `pumpStrengthAmount=4` wird als echter Mehrwert-Pump erfasst. |
| Bulldozer, Wrecking Ball, Hammer, Jackhammer, Pile Driver, Ramming Piston, Fubar | `breaker.stealth_payment_loss` wird aus `stealth_loss` abgeleitet. |
| Dupré, Snowball | `breaker.scaling_strength` wird aus Scaling-/Temporary-Strength-Mechanik abgeleitet. |
| Afreet, Imp | `setup.program_host` und `breaker.hosted_strength_penalty` werden abgeleitet; V1-Hosting-TargetProfile bleibt diagnostisch und Human-Review-pflichtig. |
| Succubus | `setup.program_host` und V1-Hosting-TargetProfile werden abgeleitet. |
| Eurocorpse (TM) Spin Chip | Hosting-TargetProfile für hosted Icebreaker ergänzt; Recurring-Breaker-Credit bleibt bestehen. |
| Cortical Cybermodem, Sunburst Cranial Interface | `setup.memory` und `setup.hand_size` werden sichtbar. |
| Arasaka Portable Prototype, Artemis 2020, Parraline 5750, Raven Microcyb Eagle, Raven Microcyb Owl | `setup.memory` ergänzt; Arasaka erhält diagnostisches `costProfile.agendaPoints=1`. |
| Microtech Backup Drive | `runner.search.breaker`-Anchor entfernt; V1-`replacement_target` für Program-Trash-Replacement ergänzt. |
| Gideon's Pawnshop, If You Want It Done Right..., Mantis, Fixer-at-Large | Zu breiter generischer Search-/Recovery-Anchor entfernt; bleibt support-only bis eigene generische Search-/Recovery-Strategie existiert. |

## Grenzen

- TargetProfile V1 ist Diagnose- und Review-Struktur, keine Targeting-KI.
- Es wurden keine neuen Strategy IDs eingeführt.
- Es wurden keine Action-Auswahl-, Breakkosten-, Planner-, Score- oder PlanWeight-Verbraucher angeschlossen.
- Normale Breaker bleiben Coverage-/Spezialsignale ohne pauschalen Strategieanker.
- Hidden Info bleibt ausgeschlossen: Präferenzen sind nur über sichtbare, bekannte oder LegalAction-bereitgestellte Ziele auswertbar.

## Verifikation

- `node scripts/check-ai-derived-facts.mjs --write`
- `node scripts/check-ai-derived-facts-full.mjs --write`
- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `node scripts/check-ai-hint-compiled-index.mjs --write`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-manual-overlays`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
