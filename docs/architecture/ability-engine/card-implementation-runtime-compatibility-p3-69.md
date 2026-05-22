# P3.69 Runtime-Compatibility-Konstanten

Stand: 2026-05-22

## 1. Kurzfazit

P3.69 hat die nach P3.68 verbliebenen direkten `onr_v1_`-Runtime-Konstanten in `packages/engine/src/index.ts` geprüft und ohne Verhaltensänderung in `packages/engine/src/compatibility/runtime-compatibility.ts` gekapselt.

Es wurden keine Kartenmechaniken, keine Action-IDs, keine PendingChoice-IDs, keine RNG-Purpose-Strings, keine PublicPayload-/PlayerView-/PublicEvent-Shapes und keine Registry-/Coverage-Zählungen geändert. `public-context.ts` bleibt frei von direkten `onr_v1_`-Treffern.

## 2. Trefferzahlen vor/nach P3.69

| Bereich | Vor P3.69 `onr_v1_` | Nach P3.69 `onr_v1_` | Einordnung |
| --- | ---: | ---: | --- |
| `packages/engine/src/index.ts` | 44 | 0 | Direkte Runtime- und Compatibility-Quellen aus `index.ts` entfernt. |
| `packages/engine/src/compatibility/` | 0 | 42 | Werte in `runtime-compatibility.ts` gekapselt; zwei mehrfach genutzte Source-Werte wurden dedupliziert. |
| `packages/engine/src/mechanics/` | 101 | 101 | Nicht geändert; Mechanik-Kataloge bleiben außerhalb P3.69. |
| `packages/engine/src/ability-engine/` | 0 | 0 | Bleibt ID-frei. |
| `packages/engine/src/public-context.ts` | 0 | 0 | Bleibt ID-frei. |

Zusätzliche Markerzählung im P3.69-Scope:

| Bereich | Vor P3.69 | Nach P3.69 | Einordnung |
| --- | ---: | ---: | --- |
| `index.ts` `v19xx` | 479 | 479 | Unverändert; bestehende Action-/Payload-/Choice-Verträge bleiben stabil. |
| `index.ts` `p3_` | 149 | 149 | Unverändert; bestehende Choice-/Hidden-Zone-Quellen bleiben stabil. |
| `index.ts` Compatibility-/Replay-/PendingChoice-/RunState-Marker | 444 | 446 | Nur durch neuen Compatibility-Importpfad und Benennung verändert, nicht semantisch. |
| `compatibility/` `v19xx` | 13 | 13 | Bestehende P3.68-Payload-Helper unverändert. |
| `compatibility/` `p3_` | 4 | 4 | Bestehende P3.68-Payload-Helper unverändert. |
| `compatibility/` Compatibility-/Replay-Marker | 8 | 11 | Neue Runtime-Compatibility-Dokumentation im Modul. |

## 3. Runtime-Konstantenfamilien

| Familie | Beispiele | Aktueller Ort | Zweck | Public Contract? | Replay relevant? | Kann gekapselt werden? | Maßnahme |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Virus Runtime Constants | `CODE_VIRAL_CACHE_ID`, `INCUBATOR_ID`, `PATTELS_VIRUS_ID`, `POX_ID`, `DUPRE_ID` | `runtime-compatibility.ts`, Nutzung in `index.ts` | Virus-Counter, Purge-/Preserve-Choices, Incubator-Transformation, Counter Stores | Teilweise über Payload/Choice | Ja, Choice-/State-Pfade | Ja, als Konstanten | Gekapselt, Werte unverändert. |
| B. Icebreaker Runtime Constants | `BARTMOSS_ID`, `BLINK_ID`, `MICROTECH_TRODE_SET_ID`, `PILE_DRIVER_ID`, `RAMMING_PISTON_ID`, `SKIVVISS_ID`, `ZZ22_SPEED_CHIP_ID` | `runtime-compatibility.ts`, Nutzung in `index.ts` | Run-/Breaker-Kosten, Schäden, Trode-AP, Hosted-Credit-/Speed-Chip-Guards | Teilweise | Ja, RunState und Revalidation | Ja, als Konstanten | Gekapselt, keine Icebreaker-Logik verschoben. |
| C. Recurring / Hosted / Restricted Credit Constants | `SHELL_TRADERS_ID`, `ARMADILLO_ARMORED_ROAD_HOME_ID`, `DRIFTER_MOBILE_ENVIRONMENT_ID`, `JUNKYARD_BBS_ID`, `ZZ22_SPEED_CHIP_ID` | `runtime-compatibility.ts`, lokale Sets in `index.ts` | Recurring-Credit-Initialisierung, Hosted-/Restricted-Credit-Auswahl, Shell-Traders-Set-Aside | Ja, über Payload-Attribution | Teilweise | Teilweise | ID-Werte gekapselt; Sets und Payment-Logik bleiben in `index.ts`. |
| D. Hidden-Zone / Special-Zone Constants | `SNEAK_PREVIEW_ID`, `SELF_MODIFYING_CODE_ID`, `BIZARRE_ENCRYPTION_SCHEME_ID`, `MIT_WEST_TIER_REMOVED_FROM_GAME_REASON` | `runtime-compatibility.ts` | Hidden-Zone-Choices, temporäre Installs, Delayed Claims, Removed-from-game-Gründe | Ja | Ja | Ja, als Konstanten | Gekapselt; `specialZoneReason`-Werte bleiben identisch. |
| E. Damage / Prevention / Flatline Constants | `BLINK_ID`, `EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID` aus Mechanics, `FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE` | `runtime-compatibility.ts` und Mechanics | Damage-Attribution, Flatline-/Replacement-Quellen | Teilweise | Ja | Nur Quellenwerte | Fatal-Attractor-Source gekapselt; Mechanik-Kataloge unverändert. |
| F. Access / Run / Encounter Constants | `BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE`, `TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE`, `TOO_MANY_DOORS_ID`, `ICE_PICK_WILLIE_ID` | `runtime-compatibility.ts` | Encounter-Tax, Run-Fallback-Attribution, Secret-Spend/Run-Folgeeffekte | Ja, über Payload-Kontext | Ja | Ja, als Konstanten | Gekapselt; Run-/Access-Funktionen nicht verschoben. |
| G. Random / Replay Purpose Constants | `TERRORIST_REPRISAL_ID`, `TOO_MANY_DOORS_ID`, Random-Mechanics-IDs in `mechanics/random-effects.ts` | `runtime-compatibility.ts` und Mechanics | RNG-Purpose-Stabilität für Replay/StateHash | Teilweise | Ja | Nur Werte/Attribution | Gekapselt, RNG-Purpose-Strings unverändert. |
| H. Legacy v19xx/P3 Payload Markers | `v1911*`, `v1921*`, `p3_58*`, `p3_56*` | `payload-compatibility.ts` und `index.ts` | Historische Payload-, Choice- und Action-ID-Stabilität | Ja | Ja | Nur nach Migration | Nicht entfernt; P3.68-Helper bleiben maßgeblich. |

## 4. Gekapselte Familien

Neu angelegt wurde `packages/engine/src/compatibility/runtime-compatibility.ts`. Das Modul enthält nur Runtime-/Compatibility-Konstanten und kurze Begründungskommentare. Es importiert keine CardImplementation-Dateien und verschiebt keine Game-, Run-, Access- oder Choice-Logik.

Gekapselt wurden:

- direkte `index.ts`-Konstanten für Virus, Icebreaker, Recurring, Hidden-Zone, Damage, Run/Encounter und Random/Replay-nahe Quellen;
- `DANSHIS_SECOND_ID` als alter Activated-Ability-Guard;
- `ZZ22_SPEED_CHIP_ID` als alter Hosted-Credit-/Speed-Chip-Guard;
- `MIT_WEST_TIER_REMOVED_FROM_GAME_REASON` für RNG-Purpose und `specialZoneReason`;
- `BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE` für RunState-/Encounter-Tax-Payload;
- `FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE` für Damage-Attribution;
- `TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE` für alte Run-Finish-Attribution ohne konkrete Source-Card.

## 5. Marker, die unverändert bleiben müssen

Die Markerwerte bleiben unverändert, weil sie in mindestens einem stabilen Vertrag liegen:

- Action-ID- und LegalAction-Payload-Felder wie `v1911HiddenZoneAbility`, `v1920AssetAbility`, `v1921RunnerProgramAbility`, `resourceAbility`, `runnerAbility`, `shellTradersAbility`, `agendaAbility`.
- PendingChoice-Quellen wie `p3_58.*`, `p3_56.*`, `v191.incubator_transform`, `v1913.code_viral_cache_purge`, `v1921.playful_ai`.
- PublicPayload-/Chronik-Felder wie `sourceDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource`.
- RNG-Purpose-Strings wie `v190.random.*`, `v190.die.*`, `v1921.die.*`.
- RunState-/Damage-Attributionsquellen wie Ball and Chain, Fatal Attractor und Tokyo-Chiba Infighting.

## 6. Warum v19xx-/p3-/RunState-Werte noch nicht entfernt werden

Diese Werte sind keine bloßen toten IDs. Sie sind Teil historischer Eventlogs, PendingChoice-Revalidation, Replay, StateHash-relevanter RNG-Zwecke, öffentlicher Payload-Kontexte oder Web-/Chronik-Auswertung. Eine Entfernung braucht ein eigenes PublicPayload-/Replay-/Web-Migrationsgate mit Backward-Compatibility-Strategie. P3.69 benennt und kapselt die Werte nur.

## 7. Risiken

Das Rest-Risiko liegt nicht in geänderten Werten, sondern in der weiterhin großen Menge alter `v19xx`-/`p3_`-Choice- und Payload-Verträge in `index.ts`. Diese sind absichtlich nicht Teil eines Runtime-Constant-Cleanups. Die neue Importgrenze kann künftige Arbeit erleichtern, ersetzt aber keine Semantikmigration.

## 8. Empfehlung für nächsten Schritt

Der nächste enge Schritt sollte kein Game-/Run-/Index-Modulsplit sein. Sinnvoll ist ein separater Audit für PendingChoice-Source-Präfixe und Hidden-Zone-Action-Namen mit dem Ziel, nur weitere benannte Compatibility-Helper zu schaffen. Entfernen oder Umbenennen der Werte sollte erst nach einem expliziten Replay-/PublicPayload-Migrationsplan erfolgen.
