# AI016 Taktiksignal-Derivation Gap Fix Batch 1

Aufgabe-ID: AI016

## Ergebnis

AI016 schließt den ersten engen Batch aus AI015 im read-only Taktiksignal-Derivationspfad. Geändert wurden nur der kontrollierte Derivationskatalog, die Taxonomie-Smoke-Tests, der deterministisch gebaute AI Hint Inspector Index und die daraus abgeleiteten Diagnoseberichte.

Keine aktiven oder compiled Hints wurden migriert. Es gibt keine Plannerwirkung, keine Action-Score- oder PlanWeight-Änderung, keine Engine-/LegalAction-Änderung, keine Profil-/Default-Umschaltung und keine Catalog-/Proteus-Baseline-Korrektur.

## Regeländerungen

### Scored Agenda Utility und Fast Advance

`score.agenda_action` bleibt als Taktiksignal für scored Agenda Actions erhalten, ankert aber nicht mehr automatisch `corp.fast_advance`. Fast-Advance-Anker entstehen jetzt enger über `score.advance_burst` aus echten Advancement-/Score-Beschleunigungsfacts, insbesondere `advance_burst` oder `score_acceleration` mit `resource=advancement_counters`.

Prüfbeispiele:

- `On-Call Solo Team`: behält `score.agenda_action`, verliert `corp.fast_advance`.
- `AI Board Member`: bekommt keinen Fast-Advance-Anker aus bloßem scored Agenda Kontext.
- `Networked Center`: bekommt `score.advance_burst` und `corp.fast_advance`, weil `score_acceleration` mit Advancement-Counters vorliegt.

### Tag Payoff und Damage/Kill

`tag.payoff` ankert nur noch `corp.tag_trace_punish`. `corp.damage_kill` kommt nur noch über `damage.payoff`, einschließlich `tag_punish_payoff` mit `resource=damage` und Corp/Runner-Scope-Gates.

Prüfbeispiele:

- `Closed Accounts`: behält `tag.payoff`, verliert `corp.damage_kill`.
- `On-Call Solo Team`: behält `corp.damage_kill`, weil echte Damage-Facts vorhanden sind.
- `Scorched Earth` und `Punitive Counterstrike`: behalten Damage/Kill über Damage-Facts.

### ICE-Modifier und ICE-Tax

Neue kontrollierte ICE-Signale:

- `ice.strength_modifier` aus `global_modifier` oder `remote_protection` mit `resource=strength`, `scope=ice`.
- `ice.subroutine_modifier` aus `global_modifier` mit `resource=subroutines`, `scope=ice`.

`tax.ice` trifft zusätzlich Corp-ICE-Run-Tax mit `scope=run_path`. Alle neuen ICE-Anker sind Corp-side- und scope-gated und ankern nur `corp.ice_tax_glacier`, nicht `corp.remote_scoring`.

Prüfbeispiele:

- `Black Ice Quality Assurance`: erhält `ice.strength_modifier` und `corp.ice_tax_glacier`.
- `Ice Transmutation`: erhält `ice.strength_modifier`, `ice.subroutine_modifier` und `corp.ice_tax_glacier`.
- `Canis Minor` und `Viral 15`: erhalten `tax.ice` und `corp.ice_tax_glacier`.

### Ambush / Access-Punish / Runner-Tax

`persistent_counter_effect` mit `timing=on_access`, `scope=runner`, Corp Asset/Upgrade und Side-Gate leitet zusätzlich `access.punish` ab und ankert `corp.ambush_bluff`. Persistente Runner-Counter-Belastung wird separat als support-only `tax.runner_persistent` abgeleitet. Corp-Credit-Belastung des Runners aus `counter_economy`, `resource=credits`, `scope=runner` wird support-only `tax.runner_credit`.

Prüfbeispiel:

- `Doppelganger Antibody`: erhält `access.punish`, `tax.runner_credit`, `tax.runner_persistent` und `corp.ambush_bluff`, aber keinen `corp.asset_economy`-Anker.

## Zahlen

| Kennzahl | Vor AI016 | Nach AI016 |
| --- | ---: | ---: |
| Ableitungsregeln | 57 | 66 |
| Katalogisierte Taktiksignal-IDs | 51 | 55 |
| Vorkommende Taktiksignale im Inspector-Index | 44 | 49 |
| Karten mit Taktiksignalen | 330 / 564 | 344 / 564 |
| Karten mit Strategy Anchors | 226 / 564 | 236 / 564 |
| Mechanische Facts ohne Taktiksignal | 62 | 48 |
| `corp.damage_kill`-Anker | 42 | 38 |
| `corp.fast_advance`-Anker | 15 | 13 |
| `corp.ice_tax_glacier`-Anker | 62 | 71 |
| `corp.ambush_bluff`-Anker | 5 | 6 |

Neue oder neu vorkommende Signale im Batch:

- `ice.strength_modifier`: 5 Karten.
- `ice.subroutine_modifier`: 1 Karte.
- `tax.runner_credit`: 2 Karten.
- `tax.runner_persistent`: 5 Karten.
- `tax.ice`: 7 Karten, vorher 0 Vorkommen trotz vorhandener Regel.
- `score.advance_burst`: 13 Karten, vorher 3.

## Bewusst nicht geändert

- Keine Ableitung aus `roles`, `planRoles`, `lineSupport` oder `valueHints`.
- Keine manuellen `functionTags`.
- Keine Hidden-Info-, PlayerView-, PublicEvent- oder Runtime-Payload-Änderung.
- Keine React-/UI-Derivationslogik.
- Keine neuen Remote-Contest- oder Central-Defense-Signale; diese bleiben Descriptor-Gaps, bis es klare First-Class-Facts gibt.
- Keine Hint-Rebuilds für active/compiled Hints, weil diese Dateien fachlich unverändert blieben.

## Aktualisierte Artefakte

- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-hint-inspector-index.json`
- `scripts/check-ai-strategy-taxonomy.mjs`
- `packages/ai/src/strategy-taxonomy.test.ts`
- `packages/ai/src/ai-hint-inspector-index.test.ts`
- `docs/reviews/ai/ai016-tactic-signal-derivation-gap-fix-batch1-report-2026-06-01.json`
- Deterministisch aktualisierte Diagnoseberichte:
  - `docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json`
  - `docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json`
  - `docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json`

## Checks

Grün:

- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
- `git diff --cached --check`
