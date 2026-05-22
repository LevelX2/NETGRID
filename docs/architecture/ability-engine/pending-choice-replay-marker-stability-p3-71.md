# P3.71 PendingChoice-/HiddenZone-/Replay-Marker-Stabilität

Stand: 2026-05-22

## 1. Kurzfazit

P3.71 stabilisiert die nach P3.70 bewusst verbliebenen PendingChoice-, HiddenZone-, Replay-, RNG- und Compatibility-Marker dokumentarisch und durch kleine fokussierte Marker-Tests. Es wurden keine Markerwerte, keine ActionIDs, keine PendingChoice-IDs, keine RNG-Purpose-Strings und keine PublicPayload-/PlayerView-/PublicEvent-Shapes geändert.

Der Worktree war zu Beginn sauber. Die vorausgesetzten Commits waren vorhanden:

| Voraussetzung | Befund |
| --- | --- |
| P3.70 | `983f3c4c109372a4f5b42ad1c5b653556350841f docs(engine): finalize card implementation phase` |
| P3.69 | `1d6215bb34f95ab3bd574d7ed189a8a032717b87 refactor(engine): organize runtime compatibility constants` |
| P3.68 | `0d6830c7e4072d82bb322b3a80e0381e648b502d refactor(engine): isolate payload replay compatibility markers` |

Alle angeforderten Vorbefunde P3.66 bis P3.70 waren im Worktree vorhanden.

## 2. Warum diese Marker noch existieren

Die Marker sind kein Rest einer offenen Kartenimplementierung. ONR-v1 CardImplementation ist mit P3.70 abgeschlossen. Die verbleibenden Strings existieren, weil sie in gespeicherten oder laufenden Verträgen vorkommen:

- `PendingChoice.source`, `choiceId` und `kind` routen offene Choices und stale Revalidation.
- `hiddenZoneAction`, `specialZoneReason`, `encounterTaxSource`, Legacy-Ability-Payloadfelder und RNG-Marker werden in PublicPayload, Chronik, ActionBoard oder Replay weitergereicht.
- RNG-Purpose-Strings bestimmen deterministische Zufallsrecords und damit Replay/StateHash.
- Runtime-Source-Marker attributieren alte RunState-, Damage-, Special-Zone-, Payment- und Replacement-Pfade.

Eine Entfernung oder Umbenennung braucht deshalb ein eigenes Payload-/Replay-/Web-Migrationsgate. P3.71 benennt die Stabilitätsgrenzen nur.

## 3. Markerfamilien

Inventarisiert wurden diese Familien:

- PendingChoice-Kinds: `select_cards`, `select_option`; Trace-Choices nutzen ebenfalls `select_option` mit `trace:*`, `trace_base_link:*` oder `trace_post_bid_link:*`-Quellen.
- HiddenZone- und Secret-Choice-Quellen: `p3_33.private_look:*`, `v1911.search_stack:*`, `p3_37.*`, `p3_38.*`, `v1911.sneak_preview_*`, `v1912.hunt_club_bbs_expose:*`, `v1921.playful_ai:*`.
- Payment-/Trace-/Reorder-/Trash-/Access-/Delayed-Choice-Quellen: `p3_35.access_payment:*`, `trace:*`, `trace_base_link:*`, `trace_post_bid_link:*`, `p3_47.*`, `p3_50.*`, `p3_54.delayed_success:*`, `p3_56.*`, `p3_58.*`, `v099.host_program:*`, `v191.incubator_transform:*`, `v1913.code_viral_cache_purge:*`, `v1922.*`.
- HiddenZoneAction-Namen: private HQ/R&D/Stack/Grip-Aktionen, shown/revealed-card-Aktionen, `hidden_info_barrier`-Aktionen und Web-/Chronik-Marker wie `hq_random_discard`, `search_stack`, `arrange_stack`, `discard_phase`, `setup_mulligan`, `archives_breach_reveal`, `p3_33_private_look`, `p3_37_*`, `p3_38_*`, `p3_47_*`, `p3_54_*`, `p3_58_*`, `v1911_*`, `v1917_*`, `v1918_*`, `v1919_*`, `v1922_*`.
- Replay-/RNG-Purpose-Strings: `v190.random.*.hq_discard`, `v191.random.*.hq_discard_phase`, `v190.die.*`, `v1921.die.*.tag_damage`, `v1921.die.*.program_probe`, `v1921.die.*.resource_probe`, `v1921.die.*.run_start_strength`, `v1921.die.*.passed_ice.*`, `v1921.die.*.dice_loop.*`, `p3_50.corporate_downsizing.*`, `p3_59.die.*`, `v1917.rescheduler.*`, `hq_random_access`.
- Legacy PublicPayload-Marker: `v19xx`-Abilityfelder, `p3_`-Marker, `sourceDefinitionId`, `cardDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource`, temporäre Credits, delayed-agenda-/future-agenda-/future-action-Marker.
- Runtime-Kompatibilitätsquellen: Ball and Chain, Fatal Attractor, Tokyo-Chiba Infighting, MIT West Tier, The Shell Traders, Bizarre Encryption Scheme, Code Viral Cache, Microtech Trode Set und Microtech Backup Drive.

## 4. Stabilitätsklassifikation

| Marker | Bereich | Wird von Replay genutzt? | Wird von PendingChoice genutzt? | Wird von PublicPayload/Web genutzt? | Darf Wert geändert werden? | Test vorhanden? | Empfehlung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS` (`v1911HiddenZoneAbility`, `v1921RunnerProgramAbility`, `resourceAbility`, `agendaAbility`, usw.) | PublicPayload/ActionID | Ja | Indirekt | Ja | Nein | Ja, P3.71-Pin plus ActionBoard-/Chronik-Tests | `stable_public_contract` |
| `p3_58.*` Hidden-Replacement-Choice-Quellen | PendingChoice | Ja | Ja | Indirekt | Nein | Ja, P3.71-Helper-Test plus Social/New-Blood/Fortress-Tests | `stable_pending_choice_contract` |
| `p3_33.*`, `p3_37.*`, `p3_38.*`, `v1911.*`, `v1912.*` HiddenZone-Choice-Quellen | PendingChoice/HiddenZone | Ja | Ja | Teilweise | Nein | Ja, bestehende Hidden-Zone-Tests | `stable_pending_choice_contract` |
| `p3_35.access_payment:*`, `trace:*`, `trace_base_link:*`, `trace_post_bid_link:*` | Payment/Trace | Ja | Ja | Ja, Trace-Payload | Nein | Ja, Trace- und Access-Payment-Tests | `stable_pending_choice_contract` |
| `p3_47.*`, `p3_56.*`, `v1922.*trash*`, `v1922.hammer_stealth_loss:*` | Trash/Reorder/Secret/Pass-Ice | Ja | Ja | Ja, HiddenZoneAction | Nein | Ja, bestehende V1.9.21/V1.9.22-Tests | `stable_pending_choice_contract` |
| `p3_54.delayed_success:*` | Delayed-success | Ja | Ja | Ja | Nein | Ja, existing delayed-success behavior tests | `stable_pending_choice_contract` |
| `v191.incubator_transform:*`, `v1913.code_viral_cache_purge:*` | Runtime/PendingChoice | Ja | Ja | Ja | Nein | Ja, Incubator/Code-Viral-Cache-Tests plus P3.71 runtime marker pin | `stable_pending_choice_contract` |
| `hiddenZoneAction` values | PublicPayload/Chronik | Ja | Nein | Ja | Nein | Ja, viele bestehende PublicPayload-Assertions | `stable_public_contract` |
| `specialZoneReason` values | PublicPayload/SpecialZone | Ja | Teilweise | Ja | Nein | Ja, MIT West Tier und Special-Zone-Tests | `stable_public_contract` |
| `encounterTaxSource` | RunState/PublicPayload | Ja | Nein | Ja | Nein | Ja, Ball-and-Chain-Test plus P3.71 marker pin | `stable_public_contract` |
| RNG-Purpose `v190.random.*`, `v191.random.*`, `v190.die.*`, `v1921.die.*`, `p3_50.*`, `p3_59.*`, `v1917.rescheduler.*` | Replay/RNG | Ja | Nein | Teilweise, als `randomPurpose`/`randomCounterAfter` | Nein | Ja, deterministic-random Tests | `stable_replay_contract` |
| Replay-PlayerAction-Struktur (`matchId`, `side`, `actionId`, `clientKnownStateVersion`) | Replay | Ja | Nein | Nein | Nein | Ja, P3.71 narrow guard test | `stable_replay_contract` |
| Ball and Chain, Fatal Attractor, Tokyo-Chiba | Runtime source attribution | Ja | Nein | Teilweise | Nein | Ja, existing run/damage tests plus P3.71 marker pin | `internal_runtime_marker` mit Replay-/Payload-Berührung |
| MIT West Tier, The Shell Traders, Bizarre Encryption Scheme | Runtime/SpecialZone/Delayed agenda | Ja | Teilweise | Ja | Nein | Ja, existing scenario tests plus P3.71 marker pin | `stable_public_contract` bzw. `internal_runtime_marker` |
| Code Viral Cache, Microtech Trode Set, Microtech Backup Drive | Runtime preservation/payment/host-return | Ja | Teilweise | Ja | Nein | Ja, existing card tests plus P3.71 marker pin für zentrale Konstanten | `internal_runtime_marker` |
| Legacy `v19xx`-/`p3_` PublicPayload-Marker allgemein | PublicPayload/Web | Ja | Teilweise | Ja | Nein | Teilweise durch bestehende Engine/Web-Tests | `candidate_for_future_payload_migration` |
| RNG-Purpose- und Replay-Stringfamilien allgemein | Replay/RNG | Ja | Nein | Teilweise | Nein | Teilweise durch random/replay Tests | `candidate_for_future_replay_migration` |

## 5. Welche Marker sind PublicPayload-Vertrag?

Als PublicPayload-/Web-Vertrag gelten:

- Feldnamen: `sourceDefinitionId`, `cardDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource`, `randomPurpose`, `randomCounterAfter`, `temporaryCreditsProvided`, `temporaryCreditsSpent`, delayed-/future-agenda- und future-action-Felder.
- Legacy-Ability-Felder: `v1911HiddenZoneAbility`, `v1917AssetAbility`, `v1918UpgradeAbility`, `v1919*`, `v1920*`, `v1921*`, `v1922*`, `resourceAbility`, `runnerAbility`, `shellTradersAbility`, `acmeSavingsAndLoanAbility`, `agendaAbility`.
- HiddenZoneAction-Werte, die `apps/web/app/chronicle.ts` direkt interpretiert, darunter `search_stack`, `v162_priority_requisition_free_rez`, `self_modifying_code_install_program`, `sneak_preview_*`, `v1917_corporate_negotiating_center_hq_agenda_reveal`, `v1922_runner_*`, `discard_phase` und `p3_*`.

Diese Werte dürfen ohne Web-/Chronik-/Replay-Migration nicht geändert werden.

## 6. Welche Marker sind Replay-/PendingChoice-Vertrag?

Replay-Vertrag:

- `PlayerAction`-Replaystruktur mit `matchId`, `side`, `actionId`, `clientKnownStateVersion`.
- ActionID-Bestandteile aus `ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS`.
- RNG-Purpose-Strings und `randomCounter`-Sequenz.
- RunState-/Damage-Attribution wie `encounterTaxSource`, Fatal-Attractor-Source und Tokyo-Chiba-Fallback.

PendingChoice-Vertrag:

- `choiceId`, `source`, `kind`, `options`, `stateVersion`.
- Choice-Source-Präfixe wie `p3_33.*`, `p3_35.*`, `p3_37.*`, `p3_38.*`, `p3_47.*`, `p3_54.*`, `p3_56.*`, `p3_58.*`, `trace:*`, `trace_base_link:*`, `trace_post_bid_link:*`, `v099.*`, `v181.*`, `v191.*`, `v1911.*`, `v1912.*`, `v1913.*`, `v1914.*`, `v1915.*`, `v1917.*`, `v1918.*`, `v1919.*`, `v1920.*`, `v1921.playful_ai:*`, `v1922.*`.
- `kind` bleibt aktuell `select_cards` oder `select_option`; der Wert ist Teil der PlayerView-Choice-Darstellung und darf nicht ohne Migration geändert werden.

## 7. Welche Marker sind nur interne Runtime-Kompatibilität?

Nur interne Runtime-Kompatibilität, aber teils mit Replay-/Payload-Berührung:

- Card-/Source-Konstanten in `packages/engine/src/compatibility/runtime-compatibility.ts`.
- Payment- und Revalidation-Guards wie `MICROTECH_TRODE_SET_ID`, `ZZ22_SPEED_CHIP_ID`, `DANSHIS_SECOND_ID`.
- Virus-/Counter-/Preservation-Quellen wie `CODE_VIRAL_CACHE_ID`, `INCUBATOR_ID`, `PATTELS_VIRUS_ID`, `POX_ID`.
- Spezialquellen wie `BIZARRE_ENCRYPTION_SCHEME_ID`, `SHELL_TRADERS_ID`, `MIT_WEST_TIER_REMOVED_FROM_GAME_REASON`, `BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE`, `FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE`, `TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE`.

Auch diese Werte werden nicht umbenannt, solange gespeicherte Replays, offene Choices oder PublicPayloads sie erwarten können.

## 8. Welche Tests sichern sie?

Neu in P3.71:

- `P3.71 PendingChoice replay compatibility marker stability` pinnt die Legacy-PublicPayload-Ability-Feldliste.
- Derselbe Block pinnt die P3.58-PendingChoice-Source-Helper für Fortress Respecification, Social Engineering und New Blood.
- Derselbe Block pinnt die enge Replay-`PlayerAction`-Struktur.
- Derselbe Block pinnt zentrale Runtime-Compatibility-Werte: MIT West Tier, Ball and Chain, Fatal Attractor, Tokyo-Chiba, The Shell Traders, Bizarre Encryption Scheme, Code Viral Cache und Microtech Trode Set.

Bereits vorhanden und bestätigt:

- Hidden-Zone-/Search-/Reveal-/Reorder-Tests in `packages/engine/src/index.test.ts`.
- Deterministic-random-Tests für Schlaghund, Rio, AI Boon, Playful AI und Quest for Cattekin.
- Code Viral Cache-, Incubator-, Bizarre-Delayed-Agenda-, Ball-and-Chain-, Fatal-Attractor-, Tokyo-Chiba-, Shell-Traders- und Microtech-Backup-Tests.
- Web-ActionBoard-Tests für Legacy-Ability-Payloadfelder und Choice-Quellen.
- Chronik-Codepfade, die `hiddenZoneAction`, temporäre Credits und Legacy-Felder direkt lesen.

## 9. Was darf erst in einer späteren Migration geändert werden?

Erst nach einem eigenen Migrationsgate dürfen geändert werden:

- `hiddenZoneAction`-Werte und `specialZoneReason`-Werte.
- `PendingChoice.source`, `choiceId` und `kind`.
- RNG-Purpose-Strings und RandomDrawRecord-Purpose-Werte.
- Legacy-PublicPayload-Feldnamen und ActionID-Bestandteile.
- Replay-`PlayerAction`-Struktur.
- Web-/Chronik-Interpretation von `v19xx`-/`p3_`-Markern.
- Runtime-Source-Marker, sofern sie in Eventlogs, Replays, PendingChoices, RunState oder PublicPayload vorkommen.

## 10. Empfehlung für nächsten Schritt

Der nächste Schritt sollte kein Kartenmechanikbatch, keine Markerwert-Migration und kein `index.ts`-Modulsplit sein. Sinnvoll ist ein separates, kleines Teststruktur-Paket, das bestehende Marker- und Replay-Tests fachlich gruppiert, ohne Coverage-Status, Registry, ActionIDs, PublicPayload oder Replay-Verhalten zu verändern.
