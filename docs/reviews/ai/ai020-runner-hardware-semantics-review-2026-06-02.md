# AI020 Runner Hardware Semantics Review

## Kurzfazit

AI020 prüft alle 35 aktiven/compiled Runner-Hardwarekarten aus Originalset und Proteus sowie 5 bekannte, aber nicht aktive Classic-Hardwarekarten. Alle aktiven Hardwarekarten erhalten kontrollierte Taktiksignale. Neue Strategy IDs wurden nicht eingeführt. Strategieanker bleiben auf echte Payoff-/Ankerfälle begrenzt: HQ Interface, R&D Interface und Full Body Conversion. Memory, Hand Size, Link/Trace, Tag-Clear, normale Damage Prevention und Recurring-Credit-Hardware bleiben support-only.

## Scope und Out-of-Scope

- Scope: aktive/compiled Runner Hardware aus Originalset und Proteus; bekannte inaktive Classic-Hardware als Count-/Abweichungscheck.
- Out-of-Scope: Runner-Programme, Preps, Resources, Corp-Karten, Plannerverbrauch, ActionScore-/PlanWeight-Änderung, Engine-/Legalitätsänderung, Targeting-KI und Profil-/Default-Umschaltung.
- AI019a ist umgesetzt und wurde als Regression mitgeprüft: Viral Pipeline, Skivviss, Emergency Self-Construct und R&D-Protocol Files bleiben getrennt von AI020.

## Inventarcounts

| Kategorie | Anzahl |
| --- | ---: |
| Aktive/compiled Runner-Hardware | 35 |
| Originalset aktiv/compiled | 29 |
| Proteus aktiv/compiled | 6 |
| Inaktive/known Classic-Hardware | 5 |
| Geänderte Hardwarekarten | 35 |
| Neue Taktiksignale | 27 |
| Geänderte bestehende Signale | 14 |
| Neue Strategy IDs | 0 |
| Strategy-Support-Paare | 5 |

## Clusterübersicht

| Cluster | Karten | Strategy-Anker |
| --- | ---: | ---: |
| access_interface | 2 | 2 |
| ap_or_break_cost_modification | 1 | 0 |
| archives_or_rnd_manipulation | 1 | 0 |
| damage_prevention_survival | 6 | 1 |
| deck_memory_console | 7 | 0 |
| extra_run_or_action_engine | 2 | 0 |
| hand_size_cybernetics | 2 | 0 |
| memory_chip | 3 | 0 |
| program_backup_or_recovery | 2 | 0 |
| recurring_breaker_credit | 1 | 0 |
| recurring_killer_credit | 2 | 0 |
| recurring_link_credit | 3 | 0 |
| tag_prevention_or_tag_clear | 3 | 0 |

## Taktiksignale

AI020 fügt 27 neue katalogisierte Signale hinzu. Alle neuen Signale sind support-only und sideScope Runner, inklusive Deck-Exklusivität, Memory-Chip/Cybernetics/Vehicle-Typisierung, non-noisy/Killer/Link/Tag-Clear-Recurring-Credits, finite/pay-through Damage Prevention, Program-Backup/-Recovery, Extra-Run/Extra-Action, AP-Mitigation und Archives/R&D-Setup.

Bestehende Signale wurden gezielt nachgeschärft: `defense.damage_prevention` und `defense.tag_prevention` sind support-only; `economy.trash_credit` wird nicht mehr aus Hardware abgeleitet; HQ/R&D-Multiaccess, Base-Link, Trace-Boost, subtype Damage Prevention, Replacement Access und Program-Trash-Prevention dürfen Hardware sauber erkennen.

## Strategieanker und strategySupportPairs

Neue Strategy IDs: keine.

- HQ Interface: `runner.hq_pressure` -> `payoff_anchor`, `runner.interface_closeout` -> `payoff_anchor`.
- R&D Interface: `runner.rnd_pressure` -> `payoff_anchor`, `runner.interface_closeout` -> `payoff_anchor`.
- Full Body Conversion: `runner.survival_defense` -> `defensive_tool`, mit mittlerer Confidence wegen Pay-through-Drawback.

Alle anderen aktiven Hardwarekarten bleiben ohne kanonische Strategieanker. Legacy-`support_tool`/`defensive_tool`-Rollen wurden für support-only Hardware entfernt oder im Report nur als Legacy-Kontext geführt.

## TargetProfile-Kandidaten

- Microtech Backup Drive: `replacement_target` für Program-Trash-Replacement, TargetProfile V1 aktiv.
- Eurocorpse (TM) Spin Chip: `hosted_install_target` für MU<=1-Icebreaker, TargetProfile V1 aktiv.
- Record Reconstructor: Kandidat für Run-/Access-Replacement; aktuell kein aktives TargetProfile nötig.

## Count-Abweichungen

- Proteus: Prompt erwartet 7 Hardwarekarten; `data/cards/proteus-cards.json` enthält 6 Runner-Hardwarekarten, alle 6 sind active/compiled. Repo-Wahrheit führt.
- Classic/Originalset: Die 29-Karten-Zahl passt zu `originalset-v1`; `classic-cards.json` enthält zusätzlich 5 bekannte, aber nicht active/compiled Hardwarekarten.

## Deferred Items

- Kein generischer `runner.hardware`-, `runner.cybernetics`-, Program-Recovery- oder Action-Economy-Strategy-Anker.
- Record Reconstructor bleibt TargetProfile-Kandidat bis zur separaten LegalAction Semantic Bridge.
- Neue Hardware-Taktiksignale bleiben read-only und werden nicht von Planner, ActionScore, PlanWeight, Engine oder Targeting-KI verbraucht.

## Verifikation

Finale Verifikation ist im JSON-Report unter `verification` dokumentiert. Alle AI-Gates, die AI-Test-Suite, beide Typechecks, der AI020-Invariant-Check und `git diff --check` wurden ohne Fehler geführt.
