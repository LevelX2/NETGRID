# V1 CardImplementation Pattern Catalog

Stand: 2026-05-19. Dieses Dokument beschreibt die wiederkehrenden Muster im V1-Kartenpool und ordnet sie den vorhandenen bzw. fehlenden Ability-Engine-Bausteinen zu. Die konkreten Kartenbeispiele sind gegen das validierte Inventory zu lesen; die harte Printed-Text-Quelle sind die Originalspoiler unter `docs/source/`.

## A. Simple on_play effects

Vorhanden: `on_play`, `costs: "printed"`, `gain_credits`, `draw_cards`, `lose_credits`, `runner_is_tagged` conditions, ordered effect sequences, `ResolvedGameEffect` mit Kartenbezug.

Fehlend: `give_tag`, `remove_tag`, `damage`, `trash_card`, `install_card`, `make_run`, access replacement, reveal/expose/search/look-at-top.

Beispiele: umgesetzt sind Accounts Receivable, Efficiency Experts, Livewire's Contacts, Score!, Annual Reviews, Bodyweight Synthetic Blood, Jack 'n' Joe, Day Shift, Night Shift und Closed Accounts. Weitere on-play/economy/draw/zahlungsähnliche Kandidaten aus dem Inventar: Arasaka Owns You (onr_v1_078_arasaka-owns-you); Bodyweight™ Synthetic Blood (onr_v1_079_bodyweight-synthetic-blood); Core Command: Jettison Ice (onr_v1_080_core-command-jettison-ice); Edited Shipping Manifests (onr_v1_084_edited-shipping-manifests); Jack ’n’ Joe (onr_v1_095_jack-n-joe); Livewire’s Contacts (onr_v1_097_livewires-contacts); Lucidrine™ Booster Drug (onr_v1_098_lucidrine-booster-drug); misc.for-sale (onr_v1_100_misc-for-sale); MIT West Tier (onr_v1_101_mit-west-tier); Open-Ended® Mileage Program (onr_v1_102_open-ended-mileage-program); Organ Donor (onr_v1_103_organ-donor); Playful AI (onr_v1_104_playful-ai).

Komplexität: niedrig, solange keine Targets, Choices, Hidden-Info oder Trigger beteiligt sind.

Empfohlener POC: nach dem erledigten `lose_credits`-Pilot ein einzelner eindeutig formulierter `give_tag`-, `remove_tag`- oder damage-Effekt, nicht mehrere neue Effekte gleichzeitig.

Tests: printed cost, exact effect amount, resolvedEffects order, compatible payload fields, Chronik with card context, no Legacy+CardImplementation double effect, Hidden-Info guards bei Draw/Reveal/Search.

## B. Activated abilities

Vorhanden: `activated_card_ability`, Timing `runner_main` / `corp_main`, action cost, source/timing/cost revalidation vor Zahlung, Effects über `executeCardImplementationEffects`.

Fehlend: credit cost, trash cost, agenda point cost, counter cost, recurring/hosted credits as payment source, once-per-turn/run/source limits, conditional restrictions, target binding.

Beispiele: umgesetzt sind Newsgroup Filter und ESA Contract. Weitere aktivierte Fähigkeiten sollten aus dem validierten Inventory nur dann als Welle-2-Kandidat übernommen werden, wenn der Text wirklich eine nutzbare Kartenfähigkeit mit klaren Kosten und Timing enthält; Virus-/Counter- und Run-Replacement-Texte gehören nicht automatisch in diese Gruppe.

Empfohlener POC: eine weitere `A:`-Fähigkeit mit vorhandenen Effects oder ein kleiner neuer Kostenbaustein, aber nicht beides gleichzeitig.

Tests: LegalAction timing positive/negative, cost displayed and paid, stale source/timing rejected, unsupported ability shape rejected, Chronik uses ability/nutzen context.

## C. Passive modifiers

Vorhanden: `rez_cost`, `install_cost` für Corp ICE, `ice_strength`, `additional_subroutine` public ETR after_existing, gemeinsame rezzed-Corp-Root-Modifier-Query-Helfer, subtype matching und `sameServerAsSource`.

Fehlend: `trash_cost`, `agenda_difficulty`, hand_size, memory_units, link, break_subroutine_cost, trace_cost / trace_strength / trace_limit, run_cost / access_cost, score/steal restrictions, Runner-installed modifier query family.

Beispiele: Data Masons, Encoder, Inc., Skälderviken SA Beta Test Site, Fortress Architects, Jerusalem City Grid, MRAM Chip, Militech MRAM Chip, Krash, Virizz, Restrictive Net Zoning.

Empfohlener POC: hand_size für MRAM/Militech MRAM oder Region-Regeln für Jerusalem erst nach Server-/Region-Boundary.

Tests: active source only, appliesTo positive/negative, quote equals payment, PlayerView value if displayed, no card IDs in generic pipeline.

## D. Triggered abilities

Vorhanden: kein produktives generisches Trigger-System für neue CardImplementation-Migrationen; Legacy-Pfade existieren in `index.ts`.

Fehlend: on_install, on_rez, on_access, on_score, on_turn_start/end, on_run_start/success/unsuccess, on_approach/encounter/pass_ice, on_break_subroutine, on_draw_card, on_take_damage, on_receive_tag, on_leave_play, ordering and limits.

Beispiele: Loan from Chiba, Startup Immolator, Olivia Salazar. Trigger-like V1-Beispiele: AI Boon (onr_v1_002_ai-boon); Bartmoss Memorial Icebreaker (onr_v1_005_bartmoss-memorial-icebreaker); Boardwalk (onr_v1_008_boardwalk); Butcher Boy (onr_v1_009_butcher-boy); Cascade (onr_v1_010_cascade); Cloak (onr_v1_011_cloak); Cockroach (onr_v1_013_cockroach); Deep Thought (onr_v1_017_deep-thought); Dupré (onr_v1_020_dupre); Expert Schedule Analyzer (onr_v1_024_expert-schedule-analyzer); Fait Accompli (onr_v1_025_fait-accompli); False Echo (onr_v1_026_false-echo).

Empfohlener POC: Loan from Chiba als Lifecycle-Pilot oder Startup Immolator als pass_ice-Pilot, nicht beide gleichzeitig.

Tests: exact timing, source/target exists, optional/mandatory resolution, no duplicate fire, cleanup at duration end, replay/statehash.

## E. Counters and hosted credits

Vorhanden: kein generisches CardImplementation-Counter-System als Zielarchitektur.

Fehlend: on-card credits, recurring credits, virus counters, advancement counters, named counters, refresh timing, spend-from-card payment sources, trash/disable when empty.

Beispiele: Blink (onr_v1_007_blink); Boardwalk (onr_v1_008_boardwalk); Butcher Boy (onr_v1_009_butcher-boy); Cascade (onr_v1_010_cascade); Clown (onr_v1_012_clown); Cockroach (onr_v1_013_cockroach); Deep Thought (onr_v1_017_deep-thought); Dupré (onr_v1_020_dupre); Fait Accompli (onr_v1_025_fait-accompli); Gremlins (onr_v1_029_gremlins); Incubator (onr_v1_034_incubator); Pattel’s Virus (onr_v1_046_pattels-virus).

Empfohlener POC: eine Karte mit reinem on-card credit/counter ohne Hidden-Info und ohne Target, bevor recurring/spend-source allgemein wird.

Tests: counter creation, increment/decrement, payment source constraints, refresh timing, leave-play cleanup, public redaction.

## F. Run and access replacement

Vorhanden: Legacy-run/access logic in `index.ts`; noch kein generischer CardImplementation-Run/Access-Replacement-Baustein.

Fehlend: make_run, successful-run replacement, no-access replacement, additional access, trash accessed card at no cost, run target binding, replacement priority/stacking.

Beispiele: Afreet (onr_v1_001_afreet); AI Boon (onr_v1_002_ai-boon); Boardwalk (onr_v1_008_boardwalk); Butcher Boy (onr_v1_009_butcher-boy); Cascade (onr_v1_010_cascade); Cloak (onr_v1_011_cloak); Cockroach (onr_v1_013_cockroach); Deep Thought (onr_v1_017_deep-thought); Dupré (onr_v1_020_dupre); Expert Schedule Analyzer (onr_v1_024_expert-schedule-analyzer); Fait Accompli (onr_v1_025_fait-accompli); False Echo (onr_v1_026_false-echo).

Empfohlener POC: fixed-server run event after target binding, oder ein no-access replacement nach resolvedEffects/redaction stabilization.

Tests: legal target server, run starts/resolves correctly, access replacement prevents normal access, no hidden identity leak, stale server/ICE/action rejection.

## G. ICE and subroutines

Vorhanden: base ICE definitions/subroutines in Shared; dynamic `additional_subroutine` for public `end_the_run` after existing; dynamic attribution without public sourceCardInstanceId leak.

Fehlend: general base ICE CardImplementation DSL, repeated_subroutine, subroutine replacement, cannot-break restrictions, break restrictions, trace/damage/trash typed subroutine effects, runwide future effects, dynamic source Chronik wording.

Beispiele: Encoder, Inc. as implemented dynamic modifier; follow-up candidates Tesseract Fort Construction and Tutor; ICE examples: Asp (onr_v1_221_asp); Ball and Chain (onr_v1_222_ball-and-chain); Banpei (onr_v1_223_banpei); Bolter Cluster (onr_v1_224_bolter-cluster); Canis Major (onr_v1_225_canis-major); Canis Minor (onr_v1_226_canis-minor); Cerberus (onr_v1_227_cerberus); Cinderella (onr_v1_228_cinderella); Code Corpse (onr_v1_229_code-corpse); Cortical Scanner (onr_v1_230_cortical-scanner); Cortical Scrub (onr_v1_231_cortical-scrub); Crystal Wall (onr_v1_232_crystal-wall).

Empfohlener POC: one additional_subroutine follow-up only after verifying it uses the same public ETR semantics.

Tests: dynamic list order, break/resolve current subroutineId, stale dynamic list rejected, public payload redacted, printed subroutines unaffected.

## H. Regions and server-scoped effects

Vorhanden: `sameServerAsSource` for passive modifiers and server concepts in Engine state.

Fehlend: region rule model, install only in server, rez on install, one region per fort, trash older regions, persistent server-bound target labels, server install/run restrictions.

Beispiele: Jerusalem City Grid and other region/server cards: Dupré (onr_v1_020_dupre); Fait Accompli (onr_v1_025_fait-accompli); False Echo (onr_v1_026_false-echo); Mouse (onr_v1_042_mouse); Netspace Inverter (onr_v1_044_netspace-inverter); Pox (onr_v1_049_pox); Fortress Respecification (onr_v1_088_fortress-respecification); Ice and Data’s Guide to the Net (onr_v1_092_ice-and-datas-guide-to-the-net); Social Engineering (onr_v1_111_social-engineering); Restrictive Net Zoning (onr_v1_173_restrictive-net-zoning); Data Fort Reclamation (onr_v1_197_data-fort-reclamation); Security Net Optimization (onr_v1_215_security-net-optimization).

Empfohlener POC: finish Jerusalem City Grid region rules only after a small region-boundary design note.

Tests: install legal only where allowed, can pay to rez before install, old region trashed, same-fort scoping, stale server target rejection, public server labels no hidden leak.
