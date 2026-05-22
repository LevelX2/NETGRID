# P3.66 Trace-/Run-/Access-ID-Residue-Cleanup

Stand: 2026-05-22

## Ausgangspunkt

P3.66 baut auf P3.65 (`ef4d3cb4189a19e52dc24b5a3ad1bbcb3ff43f3f`), P3.64 (`dcc3cbca4cee8f773890cc0f67cbe79e3f898c40`) und P3.63 (`c670e4a302b8cff17a53e44d06c3917c024a5f88`) auf. Der Worktree war zu Beginn sauber.

Der enge Scope bestand aus:

- `packages/engine/src/index.ts`
- `packages/engine/src/mechanics/trace-tags.ts`
- `packages/engine/src/mechanics/run-access.ts`
- `packages/engine/src/mechanics/random-effects.ts`
- `packages/engine/src/ability-engine/active-modifiers.ts`
- `packages/engine/src/public-context.ts`

Nicht vorhanden waren `packages/engine/src/mechanics/access*.ts` und `packages/engine/src/mechanics/encounter*.ts`.

## Initiale Scope-Treffer

| Datei | Treffer vor Cleanup | Einordnung |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 67 | gemischt: Runtime-Konstanten, Runner-/Korp-Resolver, Hidden-Replacement-Choices, alte v19xx-Payload-/RunState-Marker |
| `packages/engine/src/mechanics/trace-tags.ts` | 1 | Trace-Asset-Konstante |
| `packages/engine/src/mechanics/run-access.ts` | 9 | Run-/Access-Event-Konstanten |
| `packages/engine/src/mechanics/random-effects.ts` | 5 | Random-/Replay-nahe Konstanten |
| `packages/engine/src/ability-engine/active-modifiers.ts` | 0 | ID-frei nach P3.65 |
| `packages/engine/src/public-context.ts` | 0 | ID-frei |

Gesamt im engen P3.66-Scope: 82 direkte `onr_v1_`-Treffer.

## Entfernt oder ersetzt

Die folgenden direkten Literale wurden durch vorhandene CardImplementation-Definitionen ersetzt:

- `onr_v1_310_blood-cat` in `trace-tags.ts` über `bloodCatImplementation.cardDefinitionId`.
- `onr_v1_081_custodial-position`, `onr_v1_085_executive-wiretaps`, `onr_v1_084_edited-shipping-manifests`, `onr_v1_106_private-ldl-access`, `onr_v1_118_weather-to-finance-pipe`, `onr_v1_098_lucidrine-booster-drug`, `onr_v1_105_priority-wreck`, `onr_v1_111_social-engineering` und `onr_v1_112_stumble-through-wilderspace` in `run-access.ts`.
- `onr_v1_002_ai-boon`, `onr_v1_008_boardwalk`, `onr_v1_172_quest-for-cattekin`, `onr_v1_339_schlaghund` und `onr_v1_367_rio-de-janeiro-city-grid` in `random-effects.ts`.

In `index.ts` wurden zwei P3.58-Hidden-Replacement-Choice-Resolver umgestellt:

- Fortress Respecification prüft die Quelle über `hiddenReplacementLongtail.kind === "fortress_respecification_ice_reorder"` und schreibt `sourceDefinition.id` in das bestehende `sourceDefinitionId`-Payload-Feld.
- New Blood prüft die Quelle über `hiddenReplacementLongtail.kind === "new_blood_conceal_reorder_installed_ice"` und schreibt `sourceDefinition.id` in das bestehende `sourceDefinitionId`-Payload-Feld.

Damit bleiben die öffentlichen Feldnamen und Werte unverändert; nur die interne Quelle der ID-Prüfung ist typisiert.

## Bewusst geblieben

In `index.ts` bleiben direkte `onr_v1_`-Treffer, weil sie nicht sicher Teil dieses engen Cleanup-Schritts sind oder alte Kompatibilität tragen:

- Top-Level-Konstanten für weitere Runtime-Familien wie Virus, Icebreaker, Payment, Hidden-Zone, Damage und andere Nicht-P3.66-Familien.
- Runner- und Korp-Resolver-Keys, die noch bestehende LegalAction- und Revalidation-Pfade adressieren.
- Alte v19xx-/P3.58-Payload-Marker wie `onr_v1_101_mit_west_tier`.
- RunState-/Encounter-Compatibility-Felder wie `encounterTaxSource`.
- Subroutine-/Replay-Quellen wie `subroutine:onr_v1_242_fatal-attractor:next_encounter`.
- PublicPayload-nahe Source-Identifier, deren Entfernung ein eigenes Replay-/Payload-Kompatibilitätsgate braucht.

`public-context.ts` bleibt ID-frei. `active-modifiers.ts` bleibt ID-frei. Coverage und Registry wurden nicht geändert.

## Stabilitätsnotiz

P3.66 ändert keine Action-IDs, keine LegalAction-Erzeugung, keine Kosten, keine Payment-Reihenfolge, keine Trace-Ergebnisse, keine Link-Berechnung, keine Tags, keine Access-Replacement-Semantik, keine Run-/Encounter-Cleanup-Regeln, keine RNG-/Replay-Formate und keine PublicPayload-/PlayerView-/PublicEvent-Verträge.

## Verbleibendes Risiko und nächster Schritt

Das verbleibende Risiko liegt in den bewusst erhaltenen `index.ts`-Resolver- und Kompatibilitätspfaden. Der nächste sinnvolle Cleanup-Schritt ist ein eigener enger Batch für alte Runner-/Korp-Resolver-Keys und v19xx-Payload-Marker mit Replay-/PublicPayload-Abgleich, nicht ein Modulsplit und keine allgemeine Trigger-Registry.
