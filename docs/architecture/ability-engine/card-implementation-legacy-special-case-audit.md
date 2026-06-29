# CardImplementation Legacy Special-Case Audit

Status: P3.21 audit after the P3.19 spoiler-conformance pass and P3.20 source-boundary documentation pass.

This document audits the remaining `legacy_engine_special_case` cards that were not migrated into `CardImplementationDefinition` files. It compares the validated original spoiler text with the current legacy implementation, the existing tests, and the CardImplementation architecture that would be needed for future migration batches.

## 1. Kurzfazit

The seven audited cards are still correctly isolated as legacy special cases. None should be migrated opportunistically without adding narrowly scoped architecture first.

One clear spoiler deviation was found:

- `Restrictive Net Zoning` currently taxes Corp ICE installs by `1`, while the validated original spoiler says the Corp must pay `[2]` in addition to the normal cost.

Two cards are materially incomplete in current legacy behavior or need special attention before they can be treated as complete:

- `Loan from Chiba` currently covers the install-time credit gain but not the start-of-turn debt, leave-play pay-or-lose-game clause, or optional end-of-turn self-trash.
- `Restrictive Net Zoning` has the wrong amount and depends on persistent server target binding.

The other five audited cards appear broadly spoiler-conformant in the current legacy implementation, but they depend on engine boundaries that are not yet represented in the declarative CardImplementation vocabulary: run timing windows, hidden-zone choices, current-ICE target binding, ICE/subroutine DSL, or run-duration temporary modifiers.

Recommended P3.22:

1. First fix the `Restrictive Net Zoning` amount as a small legacy correctness hotfix, because the current implementation contradicts the primary spoiler.
2. Then use `Loan from Chiba` as the next architecture batch only if the scope explicitly allows `on_leave_play`, optional end-of-turn self-trash, and pay-or-lose-game handling.

## 2. Übersichtstabelle

| Card | ID | Current coverage | Legacy location | Spoiler conformance | Missing CardImplementation building blocks | Migration risk | Recommended tranche |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Olivia Salazar | `onr_v1_363_olivia-salazar` | `legacy_engine_special_case` | `cost-pipeline.ts`, `index.ts::corpApproachActions`, `index.ts::rezCard` | Appears conformant | Run rez timing ability, dynamic half-cost quote, once-per-run source limit, end-of-run derez | Large | Later timing-window batch |
| Startup Immolator | `onr_v1_068_startup-immolator` | `legacy_engine_special_case` | `index.ts` post-pass actions/resolution, `mechanics/longtail-card-effects.ts` | Appears mostly conformant | On-all-subroutines-broken or post-pass hook, current ICE target binding, dynamic rez-cost payment, target trash effect | Large | Later ICE/target timing batch |
| Loan from Chiba | `onr_v1_168_loan-from-chiba` | `legacy_engine_special_case` | `index.ts` install path | Not fully conformant | `on_leave_play`, pay-or-lose-game, optional end-of-turn self-trash, Runner debt lifecycle | Medium/Large | Dedicated lifecycle batch |
| Corporate Negotiating Center | `onr_v1_314_corporate-negotiating-center` | `legacy_engine_special_case` | `index.ts`, `mechanics/hidden-zone.ts` | Appears conformant | Hidden-zone choice, reveal selected cards, optional start-of-turn choice, public/private payload split | Large | Hidden-info/reveal batch |
| Restrictive Net Zoning | `onr_v1_173_restrictive-net-zoning` | `legacy_engine_special_case` | `index.ts` install choice and ICE install tax | Not conformant: uses `+1`, spoiler says `+2` | Persistent target binding, on-install server choice, Runner-source server-scoped install-cost modifier | Medium/Large | Immediate correctness hotfix, later target-binding pilot |
| Krash | `onr_v1_039_krash` | `legacy_engine_special_case` | `index.ts`, shared icebreaker fields, `card-implementations/onr-v1/runner/programs/krash.ts` | Appears conformant after 2026-06-29 encounter-duration correction | Icebreaker ability DSL, pump duration, break-subroutine action/effect, current encounter binding | Large | Icebreaker DSL batch |
| Virizz | `onr_v1_277_virizz` | `legacy_engine_special_case` | shared subroutine data, `index.ts`, `active-modifiers.ts` | Appears conformant | ICE subroutine CardImplementation DSL, temporary run-duration break-cost modifier | Medium/Large | ICE subroutine DSL or run-duration modifier batch |

## 3. Karten im Detail

### Olivia Salazar

Spoiler text:

> For half cost, rounded down, rez a piece of ice installed on this fort. Derez that ice at the end of the run. Use this ability only once during each run on this fort.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case locations:
  - `packages/engine/src/mechanics/agenda-operation-effects.ts` exports `OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID`.
  - `packages/engine/src/ability-engine/cost-pipeline.ts` quotes and validates Olivia-specific rez costs.
  - `packages/engine/src/index.ts` creates approach-window actions and records temporary derez state during rez resolution.
- `quoteCorpRezCost` halves the regular final rez cost with `Math.floor(...)`.
- `oliviaSalazarRezSourcesForRunIce` requires:
  - an active run in `approach_ice`,
  - a currently approached ICE,
  - the ICE on the attacked server,
  - a rezzed Olivia source installed in that server root,
  - the source not already used during that run.
- Rez revalidation checks source existence, same-fort eligibility, affordability, and action cost/payload consistency.
- `rezCard` marks `run.oliviaSalazarUsedSourceIdsThisRun` and `run.oliviaSalazarTemporaryRezzedIceIds`.
- End-of-run cleanup derezzes tracked ICE if it is still rezzed and still on the attacked server.

Known tests:

- Olivia half-cost ICE rez action and end-of-run derez.
- Normal ICE rez actions remain available when regular rez cost can be paid.
- Olivia quote does not mutate state.
- Source manipulation/stale quote behavior is covered by cost-pipeline revalidation tests around the Olivia path.

Spoiler conformance:

- Appears conformant.
- The half-cost, rounded-down rule is implemented.
- The same-fort requirement is implemented.
- Once during each run per Olivia source is implemented.
- Temporary derez at end of run is implemented.

Missing tests or risks:

- Existing tests are good for the main behavior.
- A future migration should preserve the exact quote/revalidation order because this card interacts with rez-cost modifiers.

Missing CardImplementation building blocks:

- A run timing-window activated ability for the Corp approach-ICE rez window.
- A dynamic cost expression: half of current effective rez cost, rounded down.
- A source-scoped `once_per_run_per_source` limit.
- A temporary end-of-run derez effect.
- Binding to the currently approached ICE without general target-binding expansion.

Migration recommendation:

- Do not migrate as a small card batch.
- Keep legacy until a focused run-timing ability batch can model quote, revalidation, source limit, and deferred derez together.

### Startup Immolator

Spoiler text:

> [T]: Pay the rez cost of a piece of ice to trash that piece of ice. Use this ability only if you have just broken all the subroutines of that piece of ice.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case locations:
  - `packages/engine/src/mechanics/longtail-card-effects.ts` exports `STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID`.
  - `packages/engine/src/index.ts` records fully broken ICE, offers the post-pass action, and resolves the trash effect.
- `recordRunFullyBrokenIce` records ICE whose current subroutine list is fully broken.
- The current subroutine list is taken from the encounter subroutine helper, so dynamic subroutines such as Tesseract should participate in the "all subroutines broken" condition.
- `movePastCurrentIce` sets `startupImmolatorPendingPassedIceId` when the Runner has passed a rezzed ICE whose subroutines were all broken.
- `startupImmolatorPostPassActions` requires an installed source program, a pending fully broken target ICE, and enough Runner credits to pay that ICE's rez cost.
- `resolveStartupImmolatorTrashIce` revalidates the source, pending target, target zone/status, fully-broken record, turn-use flag, and exact cost before payment and trash.
- The target ICE is trashed to Archives and the pending target is cleared.

Known tests:

- Startup Immolator trashes fully broken passed ICE.
- The post-pass window is revalidated.
- The action pays the target ICE rez cost.
- Hidden-info leakage is guarded by the current public payload tests in this area.

Spoiler conformance:

- Appears mostly conformant.
- The `[T]` cost is represented by a per-turn source-use flag, which matches the current project model for this legacy card.
- The "just broken all the subroutines" condition is represented as a post-pass pending window for the fully broken ICE.

Missing tests or risks:

- Add an explicit regression when the fully broken ICE includes dynamic subroutines from Tesseract or Encoder-style modifiers.
- Add an explicit stale-target test for target trash/unrez or rez-cost drift before Startup Immolator resolution.
- The current "just broken" timing is implemented as a narrow post-pass window; migration should document whether that remains the intended timing abstraction.

Missing CardImplementation building blocks:

- `on_all_subroutines_broken`, `on_pass_ice`, or an equivalent narrow post-encounter timing hook.
- Target binding to the current or just-passed ICE.
- Dynamic target-cost quote: pay the target ICE's effective rez cost.
- A target `trash_card` effect.
- A declarative source-use cost or tap/exhaust model.

Migration recommendation:

- Defer until a current-ICE target/timing batch exists.
- Startup Immolator is not a good first target-binding pilot because it combines timing, target, dynamic cost, and trashing.

### Loan from Chiba

Spoiler text:

> Gain [12] when Loan from Chiba is installed. At the start of each of your turns, lose [1]. If Loan from Chiba leaves play, pay [10] or lose the game. You may trash Loan from Chiba at the end of any of your turns.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case location:
  - `packages/engine/src/index.ts` Runner resource install resolution.
- The current install path grants the Runner 12 credits when Loan from Chiba is installed and emits a `gain_credits` resolved effect.
- No current code path was found for:
  - losing 1 credit at the start of each Runner turn,
  - paying 10 or losing the game when the card leaves play,
  - optional self-trash at the end of any Runner turn.

Known tests:

- Loan from Chiba installs as a 12-credit gain without recurring counters.

Spoiler conformance:

- Not fully conformant.
- Only the first sentence is currently represented.
- The coverage status is correctly not `implemented`, but the current legacy behavior is incomplete relative to the primary spoiler.

Missing tests:

- Start-of-runner-turn loss of 1 credit.
- Leave-play pay 10 or lose game.
- Insufficient-credit leave-play loss.
- Optional end-of-turn self-trash.
- Revalidation of the optional self-trash or leave-play payment, if represented as actions.

Missing CardImplementation building blocks:

- `on_leave_play` lifecycle hook.
- Optional end-of-runner-turn self-trash action.
- `pay_credits_or_lose_game` or an equivalent narrow payment/loss effect.
- A leave-play hook that distinguishes ordinary trash/removal from installation-time setup.

Migration recommendation:

- A dedicated lifecycle batch is reasonable, but it is not a tiny migration.
- Loan is a good architecture forcing function because it exposes clear missing lifecycle boundaries without hidden information or target binding.

### Corporate Negotiating Center

Spoiler text:

> At the start of each of your turns, gain [1] for each agenda card stored in HQ that you show to Runner.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case locations:
  - `packages/engine/src/index.ts`
  - `packages/engine/src/mechanics/hidden-zone.ts`
- `startCorporateNegotiatingCenterChoice` finds rezzed Corporate Negotiating Center sources and agenda cards in HQ.
- The Corp receives a hidden-zone choice listing agenda cards in HQ.
- Runner does not see the pending private choice.
- `resolveCorporateNegotiatingCenterChoice` revalidates that:
  - the source is still rezzed and correct,
  - selected cards are still in HQ,
  - selected cards are agendas.
- Corp gains 1 credit per selected agenda.
- Public payload reveals only the selected cards, with public reveal fields and source attribution.

Known tests:

- Corporate Negotiating Center resolves as a start-of-turn HQ agenda reveal.
- Runner-side pending choice redaction is tested.
- Public reveal payload for selected agendas is tested.

Spoiler conformance:

- Appears conformant.
- The implementation respects hidden information by keeping the pending selection private and publishing only actually revealed cards.

Missing tests or risks:

- Add a stale source test where the source is trashed or unrezzed before choice resolution.
- Add a no-agenda or choose-zero case if the UI/action model exposes that path.
- Multiple rezzed sources should be reviewed before migration; current source attribution may be adequate but the hidden-choice source model is more complex than simple lifecycle dispatch.

Missing CardImplementation building blocks:

- Optional start-of-corp-turn hidden-zone choice.
- Private choice generation from HQ.
- Reveal selected cards with public/private payload separation.
- Credit gain based on selected card count.

Migration recommendation:

- Defer to a dedicated reveal/hidden-info batch.
- Do not use this as a general lifecycle-card migration because hidden information is the hard part.

### Restrictive Net Zoning

Spoiler text:

> Choose a data fort when Restrictive Net Zoning is installed. The Corp must pay [2], in addition to the normal cost, to install ice on that fort.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case location:
  - `packages/engine/src/index.ts`
- Runner install actions are generated per Corp server.
- The chosen server is stored on the installed card instance.
- PlayerView exposes the selected server label.
- Corp ICE install additional costs include a tax from installed Restrictive Net Zoning resources whose stored server target matches the install server.

Spoiler conformance:

- Not conformant.
- The original spoiler says `[2]`.
- Current project JSON/shared text and the legacy implementation use `1`.
- The current tests appear aligned with the wrong value rather than the primary spoiler.

Known tests:

- Runner install choices for HQ/R&D/Archives/Remote servers.
- Selected server label storage and payload/view visibility.
- Source-scoped behavior with other modifiers.

Missing tests:

- A direct assertion that same-fort ICE install tax is `+2`.
- A direct no-tax assertion for other servers with the same action/payment path.
- Stale cleanup or target invalidation behavior if the selected server is removed or transformed.

Missing CardImplementation building blocks:

- Persistent target binding on install.
- On-install server choice.
- A Runner-installed source modifier that taxes Corp ICE installs on the selected server.
- Same-server matching from a Runner resource to a Corp server target.

Migration recommendation:

- First perform a small correctness hotfix to change the amount from `1` to `2`.
- Later migrate as a target-binding pilot only after the CardImplementation architecture has persistent source-bound target support.

### Krash

Spoiler text:

> [2]: Break ice subroutine. [2]: +1 strength.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case locations:
  - `packages/shared/src/index.ts` shared icebreaker fields.
  - `packages/engine/src/index.ts` encounter pump/break action generation and resolution.
  - `packages/engine/src/card-implementations/onr-v1/runner/programs/krash.ts` for the printed icebreaker abilities.
- Krash is represented as an installed Runner program/icebreaker with:
  - break cost 2,
  - pump cost 2,
  - base strength 0,
  - memory cost 1.
- Pumping Krash adds encounter-bound strength through the standard icebreaker pump path. It does not use `run.remainderStrengthBonusByBreaker`.
- Break actions use the current break-cost calculation path, so later break-cost modifiers such as Crystal Palace and Virizz participate in revalidation.

Known tests:

- Krash pump strength resets when the current ICE encounter ends.
- Krash break and pump behavior is covered in existing encounter/icebreaker tests.

Spoiler conformance:

- Appears conformant after the 2026-06-29 correction: the printed text has no run-duration clause, so strength does not carry to the next ICE.

Missing tests or risks:

- Existing tests cover reset between ICE and prevent the superseded run-duration behavior from returning.
- Migration should avoid duplicating shared icebreaker fields and CardImplementation abilities.

Missing CardImplementation building blocks:

- A generic icebreaker ability DSL.
- Pump-strength effect with current-encounter duration.
- Break-subroutine action/effect integrated with current encounter revalidation.
- Current ICE/subroutine target binding.
- Interaction with break-subroutine-cost modifiers.

Migration recommendation:

- Defer until a generic icebreaker ability batch.
- Krash is a representative icebreaker candidate but should not be migrated before the DSL boundary is clear.

### Virizz

Spoiler text:

> *For the remainder of the run, Runner must pay an additional [1] to break each ice subroutine.

Current implementation:

- Coverage status: `legacy_engine_special_case`
- Current special-case locations:
  - `packages/shared/src/index.ts` subroutine data.
  - `packages/engine/src/index.ts` subroutine resolution and break-cost calculation.
  - `packages/engine/src/ability-engine/active-modifiers.ts` legacy active modifier reporting.
- The shared subroutine uses a legacy `set_run_break_subroutine_cost_modifier` effect.
- Resolving the subroutine increments `run.breakSubroutineAdditionalCost`.
- Break-subroutine cost calculation adds this run-duration amount to the base and CardImplementation-derived costs.
- The run-duration amount is naturally cleared when the run state ends.
- Active modifier reporting exposes the current run break-cost modifier publicly.

Known tests:

- Virizz can be rezzed and applies a rest-of-run break-cost modifier without release promotion.
- The break cost is increased after the subroutine resolves.
- Active modifier reporting includes the Virizz break-cost modifier.

Spoiler conformance:

- Appears conformant.
- The effect lasts for the remainder of the run and applies to each subsequent break-subroutine payment.

Missing tests or risks:

- Add an explicit stacking regression with Crystal Palace Station Grid if not already covered in the focused break-cost tests.
- The active-modifier path still contains a hardcoded Virizz legacy ID, which is acceptable while the card remains `legacy_engine_special_case`.

Missing CardImplementation building blocks:

- ICE subroutine CardImplementation DSL.
- A subroutine effect that creates a temporary run-duration `break_subroutine_cost` modifier.
- Source attribution for a modifier created by a resolved ICE subroutine rather than a passive board source.

Migration recommendation:

- Defer until either:
  - a narrow ICE-subroutine effect batch exists, or
  - a run-duration modifier batch extends the Crystal Palace break-cost infrastructure.

## 4. Priorisierung für P3.22+

### Jetzt korrigieren, aber nicht migrieren

1. `Restrictive Net Zoning`
   - Reason: confirmed primary-spoiler mismatch.
   - Recommended action: correct the legacy amount from `1` to `2`, update tests, and keep the card as `legacy_engine_special_case`.
   - This should happen before any migration batch that relies on current ICE install cost tests.

### Vorher kleiner Infrastrukturbaustein nötig

2. `Loan from Chiba`
   - Needs lifecycle infrastructure: `on_leave_play`, optional end-of-turn self-trash, pay-or-lose-game.
   - Good candidate for a dedicated lifecycle boundary because it avoids hidden information and target binding.

3. `Olivia Salazar`
   - Needs a run timing-window ability, dynamic quote, once-per-run limit, and end-of-run derez.
   - Current behavior is important enough that migration should be a focused batch with strong stale/revalidation tests.

4. `Virizz`
   - Can reuse the conceptual `break_subroutine_cost` family, but the source is a resolved ICE subroutine and the duration is run-scoped.
   - Best after an ICE subroutine or run-duration modifier boundary.

### Erst später, weil Target/Hidden-Info/ICE-DSL nötig ist

5. `Startup Immolator`
   - Combines timing, current ICE target binding, dynamic cost, and trashing.
   - Should follow target-binding and encounter-hook groundwork.

6. `Krash`
   - A normal icebreaker DSL candidate.
   - Should wait for a generic icebreaker ability batch.

7. `Corporate Negotiating Center`
   - Current behavior appears hidden-info safe.
   - Migration should wait for a hidden-zone choice/reveal batch.

### Vorläufig im Legacy belassen

- `Corporate Negotiating Center`, `Krash`, `Startup Immolator`, and `Olivia Salazar` should remain legacy until their supporting architecture is explicit and tested.
- `Virizz` can remain legacy safely while Crystal Palace covers passive break-cost modifiers.

## 5. Empfohlene Batch-Zuschnitte

### P3.22 Empfehlung: Restrictive Net Zoning Legacy Correctness Hotfix

Scope:

- Correct the Restrictive Net Zoning tax from `+1` to `+2`.
- Update tests that currently encode the wrong value.
- Do not migrate the card.
- Do not add target-binding architecture.

Why:

- This is the only confirmed primary-spoiler mismatch in the audited set.
- It is local and should be fixed before the wrong value becomes further entrenched in later cost-pipeline work.

### P3.23 Candidate: Loan from Chiba Lifecycle Boundary

Scope:

- Add narrow lifecycle support for `on_leave_play`.
- Add optional Runner end-of-turn self-trash for the source.
- Add a pay-or-lose-game resolution path.
- Migrate Loan only if all four spoiler clauses are implemented.

Why:

- Loan is incomplete today.
- It is a clean lifecycle problem without hidden-zone reveal or target binding.

### Later Candidate: Olivia Salazar Run Timing Window

Scope:

- Run approach-window CardImplementation ability.
- Dynamic half-rez-cost quote.
- Once-per-run source limit.
- End-of-run temporary derez.

Why:

- Current behavior appears correct but remains a large legacy island in cost-pipeline and `index.ts`.

### Later Candidate: Break-Cost Duration / Virizz

Scope:

- Subroutine-resolved temporary run-duration break-cost modifier.
- Preserve stacking with Crystal Palace.

Why:

- Reuses an existing modifier family but needs a different source and duration model.

### Later Candidate: Hidden-Zone Reveal / Corporate Negotiating Center

Scope:

- Private start-of-turn choices.
- Selected-card reveal with public/private payload split.

Why:

- This is architecturally important but high-risk for hidden-information boundaries.

### Later Candidate: Icebreaker Ability DSL / Krash

Scope:

- Declarative icebreaker break/pump actions.
- Current-encounter revalidation.
- Duration model for strength pump.

Why:

- Krash should migrate with the general icebreaker model, not as a bespoke exception.

## 6. Risiken

- Restrictive Net Zoning has a real amount mismatch against the primary spoiler. Leaving it untouched keeps a known rules bug in the legacy engine.
- Several legacy tests assert current behavior rather than spoiler conformance. Future correction batches should explicitly state when a test is being corrected rather than merely updated.
- Olivia Salazar and Startup Immolator both depend on tightly timed run windows. Migrating either without a clear timing/revalidation boundary would likely move complexity rather than reduce it.
- Corporate Negotiating Center is hidden-info sensitive. Its current bespoke path is safer than a premature generic reveal DSL.
- Krash depends on shared icebreaker fields and current encounter actions. A partial CardImplementation migration would risk duplicate break/pump actions.
- Virizz uses the same cost family as Crystal Palace conceptually, but it is not a passive board modifier. It needs a run-duration effect source from a resolved ICE subroutine.
