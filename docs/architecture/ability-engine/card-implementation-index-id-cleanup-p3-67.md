# P3.67 Index Resolver-/Payload-ID-Residue-Cleanup

Stand: 2026-05-22

## Ausgangspunkt

P3.67 baut auf P3.66 (`5677b0e1aa0143c37c886f6312a5c025fb04eb3a`), P3.65 (`ef4d3cb4189a19e52dc24b5a3ad1bbcb3ff43f3f`), P3.64 (`dcc3cbca4cee8f773890cc0f67cbe79e3f898c40`) und P3.63 (`c670e4a302b8cff17a53e44d06c3917c024a5f88`) auf. Der Worktree war zu Beginn sauber.

Initiale direkte `onr_v1_`-Treffer in `packages/engine/src/index.ts`: 63.

`packages/engine/src/public-context.ts` blieb weiter ID-frei.

## Klassifikation

| Familie | Einordnung | Maßnahme |
| --- | --- | --- |
| Runner-Event-Resolver-Keys für vorhandene printed-cost CardImplementations | Tote alte Resolver-Keys; LegalAction-Erzeugung und Resolution laufen bereits über typed `abilities` und `effect.kind`. | Entfernt. |
| Fortress Respecification | Bewusst verbleibender Hidden-Replacement-Longtail ohne printed-cost Ability. | Direkter Resolver-Key durch `hiddenReplacementLongtail.kind === "fortress_respecification_ice_reorder"` ersetzt. |
| Corp-Operation-Resolver-Keys für vorhandene `corpUtility` oder printed-cost CardImplementations | Tote alte Resolver-Keys; `canPlayCorpOperation` und `resolveCorpOperation` bevorzugen bereits CardImplementation-Utility oder on-play Ability. | Entfernt. |
| New Blood | Bewusst verbleibender Hidden-Replacement-Longtail ohne printed-cost Ability. | Direkter Resolver-Key durch `hiddenReplacementLongtail.kind === "new_blood_conceal_reorder_installed_ice"` ersetzt. |
| ACME Savings and Loan Root-Rez | Root-Rez-Effekt war als direkter Resolver-Key hinterlegt, während Kosten, Verpflichtung und Debt-State bereits über `remainingReplacementLongtail` erkannt werden. | Root-Rez-Gain über `remainingReplacementLongtail.kind === "acme_savings_and_loan_debt"` und `gainCreditsOnRez` hergeleitet. |
| Power Grid Overload LegalAction-Sonderfall | Variable X-Auswahl bleibt Host-Logik, aber die Gating-Entscheidung braucht keine konkrete ID mehr. | LegalAction-Zweig und Resolution laufen über `corpUtility.kind === "power_grid_overload"`. |
| v19xx-/P3.x-Payloadmarker, PendingChoice-Quellen, Replay-/RunState-Felder | Stabile Kompatibilitätsmarker für Choice-Auflösung, RNG-Purpose, Replays, Chronik und alte PublicPayload-Felder. | Belassen. |
| Runtime-Konstanten für Virus, Icebreaker, Recurring Credits, Hidden-Zone, Damage und Access | Echte Runtime-/Revalidation-Quellen außerhalb dieses engen Resolver-/Payload-Batches. | Belassen. |

## Entfernte direkte Treffer

P3.67 reduzierte die direkten `onr_v1_`-Treffer in `index.ts` von 63 auf 44.

Entfernt oder typisiert wurden:

- Runner-Event-Keys: Total Genetic Retrofit, Forgotten Backup Chip, Fortress Respecification, Gideon's Pawnshop, Ice and Data's Guide to the Net, Mantis, Fixer-at-Large, Desperate Competitor, Hot Tip for WNS, Inside Job, Temple Microcode Outlet und MIT West Tier.
- Corp-Operation-Keys: Corporate Detective Agency, Power Grid Overload, Trojan Horse, Overtime Incentives und New Blood.
- Corp-Root-Rez-Key: ACME Savings and Loan.

## Bewusst verbliebene Treffer

Verbleibende direkte `index.ts`-Treffer sind nicht blind löschbar:

- Top-Level-Konstanten für laufende Runtime-Familien wie Virus-Counter, Icebreaker-/Stealth-Kosten, Recurring-Credits, Hidden-Zone-Followups, Damage/Prevention und Access.
- `onr_v1_101_mit_west_tier` als alter Shuffle-/Special-Zone-Marker. Die moderne CardImplementation schreibt `sourceDefinitionId`, aber alte Payload-/Replay-Erwartungen bleiben separat zu prüfen.
- `onr_v1_222_ball-and-chain` als RunState-/Encounter-Tax-Kompatibilitätsquelle.
- `subroutine:onr_v1_242_fatal-attractor:next_encounter` als Subroutine-/Replay-Source.
- `onr_v1_371_tokyo-chiba-infighting` als Fallback-Source, wenn der konkrete Source-Card-Id-Snapshot fehlt.
- `onr_v1_147_zz22-speed-chip` und `onr_v1_158_danshis-second-id` als alte Legacy-/Hosted-Credit- beziehungsweise Activated-Ability-Guards.

## Stabilitätsnotiz

P3.67 ändert keine Kartenmechanik, keine Action-IDs, keine PendingChoice-IDs, keine RNG-Purpose-Semantik, keine PublicPayload-/PlayerView-/PublicEvent-Shape und keine Registry-/Coverage-Zählung. Entfernt wurden alte Keys nur dort, wo der bestehende Ablauf bereits durch CardImplementation-Kinds oder typed Effects geführt wird.

## Risiken und nächster Schritt

Restrisiko bleibt bei den bewusst erhaltenen RunState-/Replay-/Payload-Markern. Der nächste sinnvolle Cleanup ist ein eigener Legacy-Payload-/Replay-Kompatibilitätsbatch für alte `v19xx`-, `p3_`- und PendingChoice-Quellen in `index.ts`; kein Modulsplit und keine allgemeine Trigger-Registry.
