# Upgrade Install Placement Guardrails Evidence 2026-07-05

## Status

`package_1_evidence`

## Datenbasis

- Quelle: `docs/reviews/ai/upgrades-semantic-review-v2-implementation-2026-07-03.json`
- Geprüfte Corp-Upgrades: 45
- Ausgangsbefund: Die v2-Hints klassifizieren Upgrades semantisch, aber die Runtime nutzt diese Signale noch nicht als harte Zielserver-Fit-Bewertung für `install_card` mit `placement: "root"`.
- Nutzerbeispiel: `Washington, D.C., City Grid` darf nicht sinnvoll auf HQ/R&D landen, weil `remote.agenda_difficulty_discount` und `score.agenda_difficulty_discount` einen scoring-faehigen Remote-Fort-Payoff brauchen.

## Placement-Klassen

### Remote-Scoring Agenda-Difficulty

Diese Upgrades sind auf HQ/R&D strategisch inkompatibel, solange keine aktuelle Regelmechanik Agendas in diesen Central-Forts scoring-faehig installiert. Sie sollen nur auf einem vorhandenen oder plausibel vorbereiteten Scoring-Remote positiven Fit erhalten.

| Upgrade | Card-ID | Signale | Runtime-Fit |
| --- | --- | --- | --- |
| Washington, D.C., City Grid | `onr_v1_374_washington-d-c-city-grid` | `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount` | Remote-Scoring-Fort; harter Malus auf HQ/R&D/Archives |
| Networked Center | `onr_proteus_065_networked-center` | `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount` | Remote-Scoring-Fort mit Agenda-Subtype-Payoff; harter Central-Malus |
| Research Bunker | `onr_proteus_072_research-bunker` | `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.research_difficulty_discount` | Remote-Scoring-Fort mit Agenda-Subtype-Payoff; harter Central-Malus |
| Weapons Depot | `onr_proteus_077_weapons-depot` | `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount` | Remote-Scoring-Fort mit Agenda-Subtype-Payoff; harter Central-Malus |

### Central- oder spezifischer Fort-Fit

Diese Upgrades dürfen nicht pauschal durch Remote-Scoring-Regeln verdrängt werden. Einige sind strikt Central-bound, andere brauchen HQ-Ressourcen oder spezifische Fort-Zustände.

| Upgrade | Card-ID | Signale | Runtime-Fit |
| --- | --- | --- | --- |
| Panic Button | `onr_proteus_067_panic-button` | `draw.corp_draw`, `condition.during_hq_run` | Nur HQ sinnvoll; Remote-Install hart abwerten |
| Simon Francisco | `onr_proteus_073_simon-francisco` | `access.corp_central_access_reduction` | HQ/R&D sinnvoll; Remote-Install hart abwerten |
| Dr. Dreff | `onr_v1_358_dr-dreff` | `ice.corp_temporary_encounter`, `risk.temporary_ice_trash` | Fort-spezifisch, HQ-ICE-Ressource; Fit braucht geschützten/bedrohten Server |
| Jenny Jett | `onr_v1_359_jenny-jett` | `ice.corp_hq_runpath_insert`, `ice.corp_install_during_run`, `remote.scoring_protection` | Remote-Scoring-Defense möglich, aber nur mit HQ-ICE-Payoff |
| Omni Kismet, Ph.D. | `onr_v1_364_omni-kismet-ph-d` | `ice.corp_ice_swap` | Fort mit unrezzed ICE und HQ-ICE-Payoff |
| Singapore City Grid | `onr_v1_369_singapore-city-grid` | `ice.corp_ice_swap` | Region/Fort mit unrezzed ICE und HQ-ICE-Payoff |
| Marcel DeSoleil | `onr_proteus_064_marcel-desoleil` | `ice.corp_subroutine_repeat`, `risk.rnd_trash_cost` | Fort mit relevantem installed ICE |
| Pavit Bharat | `onr_proteus_069_pavit-bharat` | `hq.corp_installed_card_bounce`, `install.corp_uninstall_to_hq`, `remote.content_swap_defense` | Subsidiary-Fort mit Inhalt plus HQ-Ersatzkarten; hidden-info-safe prüfen |

### Remote-Tax, Ambush und Access-Punish

Diese Upgrades sind grundsätzlich Fort-/Remote-orientiert, brauchen aber einen Server-Payoff: Agenda/Asset/Node/Upgrade-Schutz, erwartete Runs, Runner-Tags, Trace-Payoff, ICE-Dichte oder Ambush-Bluff. Sie dürfen nicht als generische Central-Stabilisierung missverstanden werden.

| Klasse | Upgrades |
| --- | --- |
| Remote-Scoring-/Access-Schutz | Bizarre Encryption Scheme, Crystal Palace Station Grid, Red Herrings, Tesseract Fort Construction, Rasmin Bridger |
| Ambush-/Access-Punish | Chimera, Crybaby, Dedicated Response Team, Dieter Esslin, Turbeau Delacroix, Lesley Major, Self-Destruct, Shock Treatment |
| Fort-Tax/Trace/Tag | Jerusalem City Grid, New Galveston City Grid, Paris City Grid, Obfuscated Fortress, London City Grid, Street Enforcer |

Runtime-Fit:

- positiver Fit nur auf Remote/Fort mit relevantem Root- oder ICE-Payoff;
- harter oder starker Malus auf Central-Zielen, wenn die Signale remote-/access-/fort-payoff ohne Central-Bedingung sind;
- kein Scoreline-Bonus nur wegen `remote.scoring_protection`, wenn kein Scoreline-Remote oder keine sinnvolle Remote-Pipeline existiert.

### ICE-/Rez-Support

Diese Upgrades brauchen vorhandene oder unmittelbar geplante ICE-Struktur auf dem Zielserver.

| Upgrade | Card-ID | Signale | Runtime-Fit |
| --- | --- | --- | --- |
| Antiquated Interface Routines | `onr_v1_350_antiquated-interface-routines` | `ice.corp_strength_support` | Server mit relevantem ICE; Malus auf leerem/irrelevantem Fort |
| Chester Mix | `onr_v1_352_chester-mix` | `ice.corp_install_discount` | Fort, in dem weitere ICE-Installationen plausibel sind |
| Olivia Salazar | `onr_v1_363_olivia-salazar` | `ice.corp_rez_discount`, `ice.corp_temporary_rez` | Fort mit rezbarem ICE und Kosten-Payoff |
| Roving Submarine | `onr_v1_368_roving-submarine` | `run.corp_server_lock`, `condition.corp_installed_or_advanced_this_fort_last_turn` | Subsidiary-Remote mit letztem Install/Advance-Payoff |
| Herman Revista | `onr_proteus_060_herman-revista` | `ice.corp_reorder_fort` | Fort mit mehreren ICE oder konkretem Runpath-Payoff |
| Lisa Blight | `onr_proteus_063_lisa-blight` | `ice.corp_subroutine_repeat` | Fort mit ICE/Subroutine-Payoff |
| Sterdroid | `onr_classic_024_sterdroid` | `ice.corp_targeted_strength_boost`, `ice.corp_strength_support` | Fort mit relevantem ICE-Ziel |

### Generic Remote Support

| Upgrade | Card-ID | Signale | Runtime-Fit |
| --- | --- | --- | --- |
| Namatoki Plaza | `onr_v1_361_namatoki-plaza` | `remote.capacity_support` | Subsidiary-Remote mit Root-Pipeline; Central-Malus |
| Rio de Janeiro City Grid | `onr_v1_367_rio-de-janeiro-city-grid` | `remote.scoring_protection`, `run.corp_random_end_run` | Scoring-Remote oder stark contesteter Remote |
| Raymond Ellison | `onr_proteus_071_raymond-ellison` | `advance.corp_counter_bank`, `economy.corp_run_temporary_credit` | Fort mit Advancement-Counter-/Run-Credit-Payoff |

### Support-only oder Low-Value

Diese Upgrades dürfen nicht durch generische Upgrade-/Remote-Rollen zu einem Scoreline-Anker werden.

| Upgrade | Card-ID | Signale | Runtime-Fit |
| --- | --- | --- | --- |
| Aardvark | `onr_v1_349_aardvark` | `run.corp_worm_lockout` | Nur bei sichtbarem Worm-/Program-Relevanzsignal; sonst Defer |
| Tokyo-Chiba Infighting | `onr_v1_371_tokyo-chiba-infighting` | `economy.corp_unsuccessful_run_credit` | Nur in häufig angegriffenem Fort; sonst Defer |
| Twenty-Four-Hour Surveillance | `onr_v1_373_twenty-four-hour-surveillance` | `run.corp_stealth_credit_lockout` | Nur bei Stealth-Payoff; sonst Defer |
| Simple Upgrade | `simple_upgrade` | keine | Test-/Low-Value-Placeholder; keine positive Placement-Komponente |

## Runtime-Kontrakt

Der neue Verbraucher soll für Corp-Root-Installs mit sichtbarer oder aus der LegalAction ableitbarer Upgrade-Quelle eine eigene Score-Komponente erzeugen:

- `corp_upgrade_install_placement_fit` für positive Zielserver-Passung;
- `corp_upgrade_install_placement_mismatch` für harte Inkompatibilität;
- `corp_upgrade_install_placement_defer` für support-only oder payofflosen Einbau.

Harte Inkompatibilitäten:

- Agenda-Difficulty-Discount auf HQ/R&D/Archives.
- Central-bound Signale wie `condition.during_hq_run` auf Nicht-HQ.
- Central-access Signale wie `access.corp_central_access_reduction` auf Remote.
- Remote-capacity/remote-scoring Signale auf Central, wenn keine explizite Central-Bedingung vorliegt.

Positive Fit-Beispiele:

- Agenda-Difficulty-Discount auf geschütztem oder vorbereitbarem Scoring-Remote.
- Central-access reduction auf HQ/R&D mit sichtbarer Central-Gefahr.
- ICE-/Rez-Support auf Servern mit relevantem ICE-Payoff.
- Remote-Tax/Ambush auf contestetem Remote oder Remote mit wertvollem Root-/Agenda-Payoff.

## Abnahmekriterien

- Washington und die drei subtype-spezifischen Agenda-Difficulty-Upgrades erhalten einen Central-Mismatch-Malus.
- Ein vorbereitetes Scoring-Remote erzeugt für Agenda-Difficulty-Upgrades positiven Fit.
- Panic Button und Simon Francisco bleiben legitime Central-Gegenbeispiele.
- Simple Upgrade und support-only Upgrades erhalten ohne Payoff keine positive Placement-Komponente.
- Tests bleiben side-safe und nutzen keine verdeckte Runner-Information.
