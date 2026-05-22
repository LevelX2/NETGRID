# P3.68 Payload-/Replay-Kompatibilitätsmarker

Stand: 2026-05-22

## Ausgangspunkt

P3.68 baut auf P3.67 (`e21f760d74d33c7cf322c94dc9aab9236636ea56`), P3.66 (`5677b0e1aa0143c37c886f6312a5c025fb04eb3a`), P3.65 (`ef4d3cb4189a19e52dc24b5a3ad1bbcb3ff43f3f`) und P3.63 (`c670e4a302b8cff17a53e44d06c3917c024a5f88`) auf. Der Worktree war zu Beginn sauber.

Die geprüften Architekturartefakte waren:

- `docs/architecture/ability-engine/card-implementation-engine-id-residue-p3-64.md`
- `docs/architecture/ability-engine/card-implementation-trace-run-access-id-cleanup-p3-66.md`
- `docs/architecture/ability-engine/card-implementation-index-id-cleanup-p3-67.md`

Ein separates `card-implementation-mechanics-id-cleanup-p3-65.md` war im Worktree nicht vorhanden; P3.65 ist in P3.64 ergänzt dokumentiert.

## Messung

| Suche in `packages/engine/src/index.ts` | Vor P3.68 | Nach P3.68 | Einordnung |
| --- | ---: | ---: | --- |
| Direkte `onr_v1_`-Treffer | 44 | 44 | Nicht pauschal gelöscht; verbleibende Treffer sind Runtime-, Replay- oder alte Payload-Quellen. |
| `v19`-/`p3_`-/`P3`-Treffer | 653 | 644 | Ein Teil der P3.58- und Legacy-Action-ID-Marker wurde in `payload-compatibility.ts` gekapselt. |
| PendingChoice-/Replay-/RunState-Treffer | 409 | 409 | Keine semantische Änderung; Dispatcher nutzt Helper. |
| Legacy-/Compatibility-Treffer | 30 | 35 | Zusätzliche Benennung durch Compatibility-Helper und Importnamen. |

`packages/engine/src/public-context.ts` bleibt frei von direkten `onr_v1_`-Treffern.

## Klassifikation der verbleibenden Markerfamilien

| Marker / Feld | Kategorie | Aktuelle Nutzung | Public Contract? | Replay-Relevanz? | Sicher ersetzbar? | Maßnahme |
| --- | --- | --- | --- | --- | --- | --- |
| `v1911HiddenZoneAbility`, `v1917AssetAbility`, `v1918UpgradeAbility`, `v1919*`, `v1920*`, `v1921*`, `resourceAbility`, `runnerAbility`, `shellTradersAbility`, `acmeSavingsAndLoanAbility`, `agendaAbility` | A/B | Werden in Action-IDs, PublicPayload und Chronik-Kontext weitergeführt. | Ja | Ja, über Action-ID-Stabilität | Nein | In `ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS` gekapselt. |
| `p3_58.*` PendingChoice-Quellen | B/C | Hidden-Replacement-Choices für Fortress Respecification, Social Engineering und New Blood. | Indirekt über Choice-Auflösung und öffentliche Choice-Resultate | Ja, Choice-ID und Source-Präfix | Nein | In enge P3.58-Helper gekapselt; Source-Werte bleiben unverändert. |
| Replay-Action-Struktur (`matchId`, `side`, `actionId`, `clientKnownStateVersion`) | B | Alte Eventlogs speichern die ursprüngliche `PlayerAction` im privaten Eventpayload. | Nein, private Replay-Nutzlast | Ja | Nein | In `isReplayCompatibilityActionPayload` gekapselt. |
| `sourceDefinitionId`, `cardDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource` | A/B/C/E | PublicPayload-/Chronik-Felder und Revalidation-/Choice-Attribution. | Ja | Teilweise | Nein | Bewusst beibehalten; spätere Payload-/Web-Migration erforderlich. |
| `onr_v1_101_mit_west_tier` | A/B | Alter Shuffle- und `specialZoneReason`-Marker; moderner CardImplementation-Pfad befüllt weiterhin kompatible Felder. | Ja | Ja, RNG-Purpose und Chronik | Nein | Beibehalten. |
| `onr_v1_222_ball-and-chain` | C | `encounterTaxSource` für alten RunState-/Encounter-Tax-Pfad. | Ja, über PublicPayload-Kontext | Ja, RunState-Folgeeffekt | Nein | Beibehalten. |
| `subroutine:onr_v1_242_fatal-attractor:next_encounter` | B/C | Schadensquelle für next-encounter-Fatal-Damage. | Ereignis-/Damage-Kontext | Ja | Nein | Beibehalten. |
| `onr_v1_371_tokyo-chiba-infighting` | A/G | Fallback-Source, wenn kein konkreter Source-Card-Snapshot vorhanden ist. | Ja | Möglich | Nein | Beibehalten. |
| `onr_v1_147_zz22-speed-chip`, `onr_v1_158_danshis-second-id` | D/G | Legacy-Guards in Hosted-Credit-/Activated-Ability-Pfaden. | Nein | Möglich über Action-Legalität/Revalidation | Nicht in P3.68 | Beibehalten. |
| Weitere Top-Level-ONR-Konstanten für Virus, Icebreaker, Recurring Credits, Hidden-Zone, Damage und Access | D/G | Bestehende Runtime- und Revalidation-Pfade. | Teilweise | Teilweise | Nicht ohne Mechanikbatch | Beibehalten. |

## Gekapselte Helper

Neu angelegt wurde `packages/engine/src/compatibility/payload-compatibility.ts` mit:

- `ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS`
- `isP358HiddenReplacementCompatibilityChoiceSource`
- `isP358FortressRespecificationChoiceSource`
- `isP358SocialEngineeringChoiceSource`
- `isP358NewBloodReorderChoiceSource`
- `isReplayCompatibilityActionPayload`

Diese Helper erzeugen keine neue Kartenlogik. Sie benennen nur alte Markerfamilien, deren Stringwerte wegen Replay, Action-ID-Stabilität, stale Revalidation, PublicPayload oder Chronik stabil bleiben müssen.

## Entfernt oder ersetzt

Keine öffentlichen Markerwerte wurden entfernt. Keine `onr_v1_`-Quelle wurde in P3.68 gelöscht.

Verhaltensneutral ersetzt wurden nur lokale direkte Stringprüfungen und die lokale Replay-Action-Guard-Funktion durch die neuen Compatibility-Helper. Die P3.58-Choice-IDs, `source`-Strings, `hiddenZoneAction`-Werte, Action-ID-Bestandteile und Replay-Struktur bleiben unverändert.

## Stabilitätsnotiz

P3.68 ändert keine Kartenmechanik, keine LegalActions, keine Action-IDs, keine PendingChoice-IDs, keine RNG-Purpose-Semantik, kein Replay-Verhalten, keine RunState-Semantik und keine PublicPayload-/PlayerView-/PublicEvent-Shape. `public-context.ts` bleibt ID-frei. CardImplementation-Coverage und Registry wurden nicht geändert.

## Spätere Migration

Die alten `v19xx`-, `p3_`- und direkten Quellen sollten erst entfernt werden, wenn eine eigene Web-/Payload-/Replay-Migration vorliegt. Besonders migrationspflichtig sind:

- Legacy-Payloadfelder, die Chronik und ActionBoard noch lesen.
- `hiddenZoneAction`- und `specialZoneReason`-Strings.
- PendingChoice-`source`-Präfixe und Choice-IDs.
- RNG-Purpose-Strings.
- alte RunState-Quellen wie `encounterTaxSource`.
