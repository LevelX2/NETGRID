# AI Activated Card Tag Semantics Inventory 2026-06-22

## Scope

Inventur für `AI-TAG-SEM-1`: vorhandene Runner-Karten- und LegalAction-Formen, die Tags entfernen, Tag-Entfernung unterstützen oder zukünftige Tags vermeiden. Die Inventur nutzt ausschließlich side-safe Quellen: CardImplementation-Definitionen, öffentliche LegalAction-/Payload-Metadaten und AI-Hints.

## Ergebnis

Aktive Tag-Entfernung ist im aktuellen Engine-Pfad generisch über zwei Formen sichtbar:

- BasicAction `remove_tag` für die normale Runner-Tag-Entfernung.
- CardImplementation-Effect `kind: "remove_tags"` in legalen Runner-CardActions (`play_event` oder `activated_card_ability`).

Tag-Vermeidung und Tag-Clear-Credits sind getrennte Support-Signale. Sie werden nicht als akute Tag-Entfernung gewertet, solange keine LegalAction mit sicherem `remove_tags`-Effect vorliegt.

## Karteninventar

| CardId | Titel | Quelle | Effektfamilie | Aktuelle LegalAction-Form | Aktuelle Semantiklage | Runtime betroffen |
| --- | --- | --- | --- | --- | --- | --- |
| `basic_action/remove_tag` | Runner BasicAction | `packages/ai/src/**`, Engine LegalActions | Tag entfernen | `remove_tag` | bereits `tag.remove` / Scope `tag_removal` | nein, Referenzpfad |
| `onr_v1_158_danshis-second-id` | Danshi's Second ID | `packages/engine/src/card-implementations/onr-v1/runner/resources/danshis-second-id.ts` | bis zu 3 Tags entfernen, Source trash | `activated_card_ability` | aktuell ohne CardImplementation-Effect-Join als CardAbility/unknown gefährdet | ja |
| `onr_v1_170_nomad-allies` | Nomad Allies | `.../resources/nomad-allies.ts` | 1 Tag entfernen; zusätzlich Tag vermeiden | `activated_card_ability` | gleiche CardAction-Familie wie Danish | ja |
| `onr_v1_102_open-ended-mileage-program` | Open-Ended Mileage Program | `.../preps/open-ended-mileage-program.ts` | 1 Tag entfernen; optional zurück auf die Hand | `play_event` plus Choice | Eventpfad mit `remove_tags`; nicht primärer Danish-Fall | potenziell, aber nicht `activated_card_ability` |
| `onr_v1_116_total-genetic-retrofit` | Total Genetic Retrofit | `.../preps/total-genetic-retrofit.ts` | alle Tags entfernen; nächsten Tag vermeiden | `play_event` | Eventpfad mit `remove_tags` + Support-Vermeidung | potenziell, aber nicht `activated_card_ability` |
| `onr_v1_120_armadillo-armored-road-home` | "Armadillo" Armored Road Home | `.../hardware/armadillo-armored-road-home.ts` | Hosted Credits nur für Tag-Entfernung | keine eigene Tag-Entfernungsaktion | Support für Kosten, keine Tag-Cleanup-Projektion | nein |
| `onr_v1_126_drifter-mobile-environment` | "Drifter" Mobile Environment | `.../hardware/drifter-mobile-environment.ts` | Hosted Credits nur für Tag-Entfernung | keine eigene Tag-Entfernungsaktion | Support für Kosten, keine Tag-Cleanup-Projektion | nein |
| `onr_v1_161_fall-guy` | Fall Guy | `.../resources/fall-guy.ts` | Tag vermeiden | Prevention-Window / Trigger, wenn Engine anbietet | support-only | nein für akute Tag-Entfernung |
| `onr_v1_135_nasuko-cycle` | Nasuko Cycle | `.../hardware/nasuko-cycle.ts` | Tag vermeiden gegen Credits | Prevention-Window / Trigger, wenn Engine anbietet | support-only | nein für akute Tag-Entfernung |
| `onr_v1_167_leland-corporate-bodyguard` | Leland, Corporate Bodyguard | `.../resources/leland-corporate-bodyguard.ts` | Tag vermeiden; Meat Prevention | Prevention-Window / Trigger, wenn Engine anbietet | support-only | nein für akute Tag-Entfernung |
| `onr_v1_187_wilson-weeflerunner-apprentice` | Wilson, Weeflerunner Apprentice | `.../resources/wilson-weeflerunner-apprentice.ts` | Tag vermeiden; Meat Prevention; Run-Action-Support | Prevention-Window / Trigger, wenn Engine anbietet | support-only | nein für akute Tag-Entfernung |
| `onr_proteus_*_expendable-family-member` | Expendable Family Member | `packages/engine/src/card-implementations/proteus/runner/resources/expendable-family-member.ts` | Tag vermeiden | Prevention-Window / Trigger, wenn Engine anbietet | support-only | nein für akute Tag-Entfernung |

## AI-Hint-Befund

- `Danshi's Second ID` ist in aktiven und kompilierten Hints als `tag_removal` / `remove_tags` markiert, aber `planRoles` führen aktuell `build_rig` und `recover_economy`, nicht den akuten `remove_tags`-Plan. Die Projektion darf deshalb nicht nur auf Hints vertrauen.
- `Nomad Allies`, `Total Genetic Retrofit` und `Drifter Mobile Environment` tragen bestehende `clear_tags`-/`remove_tags`-/`tag_remove`-Rollen.
- `Fall Guy`, `Nasuko Cycle`, `Leland` und `Wilson` tragen `avoid_tags`/`tag_avoid`-Rollen und bleiben Support, solange keine aktuelle Tag-Entfernungswirkung in der LegalAction sichtbar ist.
- `Open-Ended Mileage Program` hat Engine-`remove_tags`, aber der aktive Hint ist noch als Per-Card-Longtail/Event-Choice formuliert. Das ist kein Blocker, weil der CardImplementation-Effect führend ist.

## Schlussfolgerung für Folgepakete

Der generische Fix sollte an side-safe CardImplementation-/Payload-Metadaten ansetzen:

1. LegalAction bleibt Eingang und einzige Aktionsquelle.
2. Bei `activated_card_ability`, `trigger_ability` und `play_event` wird nur dann `tag.remove` projiziert, wenn die gebundene, side-safe Quelle einen öffentlichen Runner-`remove_tags`-Effect hat oder die Engine diesen Effect in der LegalAction-Payload nennt.
3. Tag-Vermeidung (`avoid_tag`, `avoid_next_tag`) wird als Tag-Support erfasst, aber ohne aktuelle Tags nicht in den akuten `tag_removal`-Scope geroutet.
4. Hosted-Credit-Quellen mit `usableFor: ["remove_tags"]` beeinflussen Kosten-/Supportbewertung, erzeugen aber selbst keine Tag-Cleanup-Action.

## Checks

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`: grün, 1 Datei / 5 Tests.
- `git diff --check`: vor Paketcommit grün.
