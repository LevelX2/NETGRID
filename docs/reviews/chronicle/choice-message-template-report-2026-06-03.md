# Chronicle Choice Message Template Report

Stand: 2026-06-03

## Zusammenfassung

- Fixtures: 60
- Gerenderte Perspektiven: 120
- Generische Fallbacks: 0
- Übersprungene Fixtures: 0

## Meldungsschablonen

| Nr. | Testfall | Zeile | Schlüssel | Runner-Meldung | Corp-Meldung |
| ---: | --- | ---: | --- | --- | --- |
| 1 | formats setup mulligan choices with the public decision | 70 | mulligan | Runner hat die Starthand behalten. | Runner hat die Starthand behalten. |
| 2 | formats setup mulligan choices with the public decision | 79 | mulligan | Korp hat einen Mulligan genommen. | Korp hat einen Mulligan genommen. |
| 3 | formats setup mulligan choices with the public decision | 88 | mulligan | Runner hat die Mulligan-Entscheidung abgeschlossen. | Runner hat die Mulligan-Entscheidung abgeschlossen. |
| 4 | shows Corporate Negotiating Center HQ agenda reveals with public card names | 403 | v1917_corporate_negotiating_center_hq_agenda_reveal | Die Korp hat 2 Agenden aus HQ durch Corporate Negotiating Center vorgezeigt. | Du hast 2 Agenden aus HQ durch Corporate Negotiating Center vorgezeigt. |
| 5 | shows Smith's Pawnshop choices with the corrected 2-credit gain | 429 | onr_v1_180_smiths-pawnshop | Du hast Force Shield mit Smith's Pawnshop getrasht und 2 Credits erhalten. | Der Runner hat Force Shield mit Smith's Pawnshop getrasht und 2 Credits erhalten. |
| 6 | does not claim a stack-search program was installed when the engine reports failure | 449 | search_stack | Du hast Worm aus dem Stack vorgezeigt, aber nicht installiert. | Der Runner hat Worm aus dem Stack vorgezeigt, aber nicht installiert. |
| 7 | does not claim a stack-search program was installed when the engine reports failure | 461 | search_stack | Du hast Worm aus dem Stack vorgezeigt und im Rig installiert. | Der Runner hat Worm aus dem Stack vorgezeigt und im Rig installiert. |
| 8 | shows Self-Modifying Code stack choices with the selected program | 489 | self_modifying_code_install_program | Du hast Simple Decoder aus dem Stack vorgezeigt und im Rig installiert. | Der Runner hat Simple Decoder aus dem Stack vorgezeigt und im Rig installiert. |
| 9 | shows The Short Circuit activation and selected program concretely | 517 | v1911_short_circuit_search | Du hast The Short Circuit genutzt, Simple Decoder der Korp gezeigt und in die Hand genommen. | Der Runner hat The Short Circuit genutzt, Simple Decoder der Korp gezeigt und in die Hand genommen. |
| 10 | shows Mystery Box Runner-AI install choices with selected program and run context | 539 | p3_38_look_top_stack_show_to_corp_then_install_matching | Du hast Simple Decoder mit Mystery Box gewählt und im Rig installiert. | Die Runner-KI hat Simple Decoder mit Mystery Box gewählt und im Rig installiert. |
| 11 | shows Mystery Box no-program reviews without the generic choice fallback | 568 | p3_38_look_top_stack_show_to_corp_then_install_matching | Die Korp hat Mystery Box bestätigt; kein installierbares Programm wurde gefunden. | Du hast Mystery Box bestätigt; kein installierbares Programm wurde gefunden. |
| 12 | shows Systematic Layoffs advancement choices with target context | 595 | add_advancement_counters | Die Korp hat 2 Advancement-Counter durch Systematic Layoffs auf Corporate War gelegt. | Du hast 2 Advancement-Counter durch Systematic Layoffs auf Corporate War gelegt. |
| 13 | shows Self-Modifying Code blocked and MU follow-up choices concretely | 615 | self_modifying_code_install_program | Du hast Simple Decoder aus dem Stack vorgezeigt, aber nicht installiert. | Der Runner hat Simple Decoder aus dem Stack vorgezeigt, aber nicht installiert. |
| 14 | shows Self-Modifying Code blocked and MU follow-up choices concretely | 627 | self_modifying_code_install_program | Du hast Simple Decoder aus dem Stack vorgezeigt; MU muss freigemacht werden. | Der Runner hat Simple Decoder aus dem Stack vorgezeigt; MU muss freigemacht werden. |
| 15 | shows Self-Modifying Code blocked and MU follow-up choices concretely | 639 | self_modifying_code_free_mu | Du hast Simple Decoder nach MU-Auswahl im Rig installiert. | Der Runner hat Simple Decoder nach MU-Auswahl im Rig installiert. |
| 16 | shows access ambush payment choices in the chronicle | 660 | onr_proteus_057_doppelganger-antibody | Die Korp hat 2 Credits für den Access-Ambush von Doppelganger Antibody bezahlt. | Du hast 2 Credits für den Access-Ambush von Doppelganger Antibody bezahlt. |
| 17 | shows access ambush payment choices in the chronicle | 668 | onr_proteus_057_doppelganger-antibody | Die Korp hat den Access-Ambush von Doppelganger Antibody nicht bezahlt. | Du hast den Access-Ambush von Doppelganger Antibody nicht bezahlt. |
| 18 | names access ambush choices from resolved effects when payment payload is missing | 686 | resolve_choice | Die Korp hat den Access-Ambush von Doppelganger Antibody ausgelöst. | Du hast den Access-Ambush von Doppelganger Antibody ausgelöst. |
| 19 | shows access ambush counter effects in the chronicle | 711 | onr_proteus_057_doppelganger-antibody | Die Korp hat 2 Credits für den Access-Ambush von Doppelganger Antibody bezahlt. | Du hast 2 Credits für den Access-Ambush von Doppelganger Antibody bezahlt. |
| 20 | shows Playful AI die results and follow-up choices in the chronicle | 750 | playful_ai_dice_loop | Du hast Playful AI aufgelöst: 1 Credit genommen und 2 Würfel beiseitegelegt. | Der Runner hat Playful AI aufgelöst: 1 Credit genommen und 2 Würfel beiseitegelegt. |
| 21 | shows partial Playful AI queued dice without treating the roll history as newly rolled dice | 777 | playful_ai_dice_loop | Du hast Playful AI aufgelöst: 0 Credits genommen und 2 Würfel beiseitegelegt. | Der Runner hat Playful AI aufgelöst: 0 Credits genommen und 2 Würfel beiseitegelegt. |
| 22 | shows partial Playful AI queued dice without treating the roll history as newly rolled dice | 795 | playful_ai_dice_loop | Du hast Playful AI aufgelöst: 3 Credits genommen. | Der Runner hat Playful AI aufgelöst: 3 Credits genommen. |
| 23 | names Core Command Jettison Ice targets and paid rez costs in the chronicle | 1079 | successful_hq_run_pay_rez_cost_trash_rezzed_ice | Du hast ein gerezztes ICE in R&D getrasht und 3 Credits bezahlt. | Der Runner hat ein gerezztes ICE in R&D getrasht und 3 Credits bezahlt. |
| 24 | summarizes Synchronized Attack on HQ retain choices without hidden card details | 1100 | successful_hq_run_corp_pay_to_retain_hq | Die Korp-KI behält mit Synchronized Attack on HQ 2 HQ-Karten, wirft 3 HQ-Karten verdeckt ab und bezahlt dafür 4 Credits. | Du behältst mit Synchronized Attack on HQ 2 HQ-Karten, wirfst 3 HQ-Karten verdeckt ab und bezahlst dafür 4 Credits. |
| 25 | summarizes Synchronized Attack on HQ retain choices without hidden card details | 1111 | successful_hq_run_corp_pay_to_retain_hq | Die Korp behält mit Synchronized Attack on HQ 1 HQ-Karte, wirft 1 HQ-Karte verdeckt ab und bezahlt dafür 2 Credits. | Du behältst mit Synchronized Attack on HQ 1 HQ-Karte, wirfst 1 HQ-Karte verdeckt ab und bezahlst dafür 2 Credits. |
| 26 | names Forged Activation Orders target and Corp rez-or-trash decisions in the chronicle | 1132 | force_rez_or_trash_ice | Du hast ICE 2 in HQ für Forged Activation Orders gewählt. | Der Runner hat ICE 2 in HQ für Forged Activation Orders gewählt. |
| 27 | names Forged Activation Orders target and Corp rez-or-trash decisions in the chronicle | 1142 | force_rez_or_trash_ice | Die Korp-KI hat entschieden, Simple Barrier ICE als ICE 2 in HQ zu rezzen. | Du hast entschieden, Simple Barrier ICE als ICE 2 in HQ zu rezzen. |
| 28 | names Forged Activation Orders target and Corp rez-or-trash decisions in the chronicle | 1155 | force_rez_or_trash_ice | Die Korp-KI hat entschieden, Simple Barrier ICE als ICE 2 in HQ zu trashen. | Du hast entschieden, Simple Barrier ICE als ICE 2 in HQ zu trashen. |
| 29 | describes V1.8.1 Pattel and Pox run-success counters | 1201 | resolve_choice | Du hast 1 Virus-Counter mit Pattel's Virus auf ein ICE gelegt. | Der Runner hat 1 Virus-Counter mit Pattel's Virus auf ein ICE gelegt. |
| 30 | describes Data Fort Reclamation and Aardvark hidden-zone choices | 1330 | v1922_data_fort_reclamation_install_sequence | Die Korp hat 3 Karten mit Data Fort Reclamation installiert. | Du hast 3 Karten mit Data Fort Reclamation installiert. |
| 31 | describes Data Fort Reclamation and Aardvark hidden-zone choices | 1343 | v1922_data_fort_reclamation_rez_sequence | Die Korp hat 2 Karten aus Data Fort Reclamation gerezzt. | Du hast 2 Karten aus Data Fort Reclamation gerezzt. |
| 32 | describes Data Fort Reclamation and Aardvark hidden-zone choices | 1356 | aardvark_rez_trash_worm | Die Korp hat Aardvark gerezzt und Worm getrasht. | Du hast Aardvark gerezzt und Worm getrasht. |
| 33 | names the ICE rezzed by Priority Requisition | 1377 | v162_priority_requisition_free_rez | Die Korp hat ein ICE durch Priority Requisition kostenlos gerezzt. | Du hast ein ICE durch Priority Requisition kostenlos gerezzt. |
| 34 | summarizes Superior Net Barriers reveal and credit counts | 1398 | superior_net_barriers_reveal_walls | Die Korp hat Superior Net Barriers genutzt: 2 Walls aufgedeckt, 3 Credits erhalten. | Du hast Superior Net Barriers genutzt: 2 Walls aufgedeckt, 3 Credits erhalten. |
| 35 | distinguishes Employee Empowerment optional start draw from its agenda action | 1986 | onr_v1_199_employee-empowerment | Die Korp hat Employee Empowerment genutzt und eine Karte zusätzlich gezogen. | Du hast Employee Empowerment genutzt und eine Karte zusätzlich gezogen. |
| 36 | distinguishes Employee Empowerment optional start draw from its agenda action | 2005 | onr_v1_199_employee-empowerment | Die Korp hat Employee Empowerment übersprungen. | Du hast Employee Empowerment übersprungen. |
| 37 | shows Too Many Doors as paid by both sides after reveal | 2075 | onr_v1_272_too-many-doors | Too Many Doors aufgedeckt: Korp 1 Credit, Runner 2 Credits; Run endet. | Too Many Doors aufgedeckt: Korp 1 Credit, Runner 2 Credits; Run endet. |
| 38 | describes public stack-search reveals with the selected card and destination | 2585 | search_stack | Du hast Jackhammer aus dem Stack vorgezeigt und in den Grip genommen. | Der Runner hat Jackhammer aus dem Stack vorgezeigt und in den Grip genommen. |
| 39 | describes card-implementation stack-to-hand searches with the revealed selected card | 2608 | p3_37_search_stack_to_grip | Du hast Krash aus dem Stack vorgezeigt und auf die Hand genommen. | Die Runner-KI hat Krash aus dem Stack vorgezeigt und auf die Hand genommen. |
| 40 | redacts private card-implementation stack-to-hand searches | 2635 | p3_37_search_stack_to_grip | Du hast eine Karte verdeckt aus dem Stack auf die Hand genommen. | Die Runner-KI hat eine Karte verdeckt aus dem Stack auf die Hand genommen. |
| 41 | describes Aujourd'Oui top-five program choices with revealed selected programs only | 2659 | v1911_aujourdoui_top5 | Du hast Aujourd'Oui genutzt, Simple Decoder, Simple Fracter vorgezeigt, in den Grip genommen und danach den Stack gemischt. | Der Runner hat Aujourd'Oui genutzt, Simple Decoder, Simple Fracter vorgezeigt, in den Grip genommen und danach den Stack gemischt. |
| 42 | describes Aujourd'Oui empty top-five choices with the required shuffle | 2682 | v1911_aujourdoui_top5 | Du hast Aujourd'Oui genutzt, keine Programme aus den obersten 5 genommen und danach den Stack gemischt. | Der Runner hat Aujourd'Oui genutzt, keine Programme aus den obersten 5 genommen und danach den Stack gemischt. |
| 43 | describes hidden stack-search moves without leaking the selected card | 2701 | search_stack | Du hast eine Karte verdeckt aus dem Stack in den Grip genommen. | Der Runner hat eine Karte verdeckt aus dem Stack in den Grip genommen. |
| 44 | describes Trace start, bids, and outcome with public bid amounts | 2735 | corp_bid | Die Korp-KI hat im Trace 2 Credits geboten. | Du hast im Trace 2 Credits geboten. |
| 45 | describes Trace start, bids, and outcome with public bid amounts | 2748 | runner_bid | Trace entschieden: Korp 2 Credits, Du 1 Credit; Trace erfolgreich. | Trace entschieden: Du 2 Credits, Runner 1 Credit; Trace erfolgreich. |
| 46 | describes trace base-link and post-bid link choices | 2777 | base_link | Du hast Baedeker's Net Map als Base Link 1 genutzt. | Der Runner hat Baedeker's Net Map als Base Link 1 genutzt. |
| 47 | describes trace base-link and post-bid link choices | 2792 | post_bid_link | Du hast Baedeker's Net Map für +1 Link genutzt; Trace abgewehrt. | Der Runner hat Baedeker's Net Map für +1 Link genutzt; Trace abgewehrt. |
| 48 | describes trace base-link and post-bid link choices | 2812 | post_bid_link | Trace entschieden: Korp 1 Credit, Du 4 Credits; Trace abgewehrt. | Trace entschieden: Du 1 Credit, Runner 4 Credits; Trace abgewehrt. |
| 49 | keeps Cinderella trace outcome and break costs distinct | 2840 | runner_bid | Trace entschieden: Korp 1 Credit, Du 0 Credits; Trace erfolgreich. | Trace entschieden: Du 1 Credit, Runner 0 Credits; Trace erfolgreich. |
| 50 | describes Hacker Tracker, Fang 2.0 and Arasaka Owns You follow-up payloads | 2883 | runner_bid | Trace entschieden: Korp 6 Credits, Du 0 Credits; Trace erfolgreich. | Trace entschieden: Du 6 Credits, Runner 0 Credits; Trace erfolgreich. |
| 51 | describes Hacker Tracker, Fang 2.0 and Arasaka Owns You follow-up payloads | 2909 | onr_v1_078_arasaka-owns-you | Du hast Arasaka Owns You gespielt und 4 Schaden ersetzt. | Der Runner hat Arasaka Owns You gespielt und 4 Schaden ersetzt. |
| 52 | describes Fall Guy tag prevention during Marked Accounts access | 2932 | v1917_access_ambush | Du hast Fall Guy getrasht und 1 Tag durch Marked Accounts verhindert. | Der Runner hat Fall Guy getrasht und 1 Tag durch Marked Accounts verhindert. |
| 53 | describes complex card payloads from the Originalset spot-check clearly | 3000 | onr_v1_061_shield | Du hast 2 Schaden mit Shield verhindert. | Der Runner hat 2 Schaden mit Shield verhindert. |
| 54 | counts Korp and Runner turns as one shared sequence | 3194 | discard_phase | Die Korp hat 0 Karten abgeworfen. | Du hast 0 Karten abgeworfen. |
| 55 | counts Korp and Runner turns as one shared sequence | 3197 | force_rez_or_trash_ice | Die Korp hat einem Server für Forged Activation Orders gewählt. | Du hast einem Server für Forged Activation Orders gewählt. |
| 56 | counts Korp and Runner turns as one shared sequence | 3199 | discard_phase | Du hast 0 Karten abgeworfen. | Der Runner hat 0 Karten abgeworfen. |
| 57 | names access-effect damage with source and discarded cards | 3821 | resolve_choice | Die Korp hat den Access-Ambush von Bel-Digmo Antibody ausgelöst. | Du hast den Access-Ambush von Bel-Digmo Antibody ausgelöst. |
| 58 | describes Pattel access counters by affected icebreakers or absence | 3962 | resolve_choice | Die Korp hat 3 Credits für den Access-Ambush von Pattel Antibody bezahlt. | Du hast 3 Credits für den Access-Ambush von Pattel Antibody bezahlt. |
| 59 | describes Pattel access counters by affected icebreakers or absence | 3984 | resolve_choice | Die Korp hat 3 Credits für den Access-Ambush von Pattel Antibody bezahlt. | Du hast 3 Credits für den Access-Ambush von Pattel Antibody bezahlt. |
| 60 | names legacy Pattel payment choices from counter effects | 4015 | resolve_choice | Die Korp hat 3 Credits für den Access-Ambush von Pattel Antibody bezahlt. | Du hast 3 Credits für den Access-Ambush von Pattel Antibody bezahlt. |

## Hinweise

Die Tabelle zeigt konkrete gerenderte Meldungen aus den vorhandenen Web-Chronicle-Fixtures. Sie ist eine belastbare Regressionsbasis für bekannte `resolve_choice`-Payload-Formate, aber noch kein Vollscan aller Engine-Pfade.
