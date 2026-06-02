# AI021 Runner Prep Semantics Review

## Kurzfazit

AI021 prüft alle 70 aktiven/compiled Runner-Preps aus Originalset und Proteus sowie 10 bekannte, aber nicht aktive Classic-Preps. Alle aktiven Preps erhalten kontrollierte Taktiksignale. Neue Strategy IDs wurden nicht eingeführt. Strategieanker bleiben auf echte Central-/Score-/Search-/Survival-Payoffs begrenzt; einfache Economy-, Draw-, Expose-, Tag-Clear- und generische Search-Preps bleiben support-only.

## Scope und Out-of-Scope

- Scope: aktive/compiled Runner Preps aus Originalset und Proteus; bekannte inaktive Classic-Preps als Count-/Abweichungscheck.
- Out-of-Scope: Runner-Programme, Runner-Hardware, Runner-Resources, Corp-Karten, Plannerverbrauch, ActionScore-/PlanWeight-Änderung, Engine-/Legalitätsänderung, Targeting-KI und Profil-/Default-Umschaltung.
- AI018/AI019/AI019a/AI020 bleiben getrennt: Icebreaker-, Programm- und Hardware-Semantik wurde nicht fachlich migriert.

## Inventarcounts

| Kategorie | Anzahl |
| --- | ---: |
| Aktive/compiled Runner-Preps | 70 |
| Originalset aktiv/compiled | 43 |
| Proteus aktiv/compiled | 27 |
| Inaktive/known Classic-Preps | 10 |
| Geänderte Prep-Karten | 70 |
| Neue Taktiksignale | 67 |
| Geänderte bestehende Signale | 0 |
| Neue Strategy IDs | 0 |
| Strategy-Support-Paare | 21 |

## Clusterübersicht

| Cluster | Karten | Strategy-Anker |
| --- | ---: | ---: |
| access_replacement_or_conversion | 1 | 1 |
| bad_publicity_pressure | 6 | 0 |
| damage_prevention_or_survival | 3 | 1 |
| draw_or_hand_setup | 3 | 0 |
| economy_burst | 9 | 0 |
| expose_or_scouting | 5 | 0 |
| fort_or_server_manipulation | 1 | 0 |
| hq_access_pressure | 8 | 5 |
| ice_control_or_sabotage | 7 | 0 |
| multi_run_event | 2 | 0 |
| rnd_access_pressure | 3 | 3 |
| run_event | 3 | 0 |
| score_or_agenda_point_effect | 5 | 2 |
| search_recovery_or_install | 11 | 4 |
| tag_clear_or_tag_prevention | 2 | 0 |
| trace_link_or_run_protection | 1 | 0 |

## Taktiksignale

AI021 ergänzt 67 katalogisierte Runner-Prep-Signale für Run-Struktur, Access-Replacement, Score-/Agenda-Point-Effekte, Economy, Search/Recovery/Install, ICE-/Fort-Sabotage, Scouting, Bad Publicity, Defense und Risiko. Signale bleiben Funktionssprache; sie erzeugen keine Planner-, Engine-, Legalitäts-, Targeting-, Profile-/Default- oder UI-Derivationswirkung.

## Strategieanker und strategySupportPairs

Neue Strategy IDs: keine.

| Karte | Strategieanker | Rolle | Confidence |
| --- | --- | --- | --- |
| All-Hands | runner.hq_pressure | payoff_anchor | high |
| All-Hands | runner.interface_closeout | payoff_anchor | medium |
| Blackmail | runner.hq_pressure | payoff_anchor | high |
| Blackmail | runner.interface_closeout | payoff_anchor | medium |
| Promises, Promises | runner.interface_closeout | payoff_anchor | medium |
| Rush Hour | runner.rnd_pressure | payoff_anchor | high |
| Rush Hour | runner.interface_closeout | payoff_anchor | medium |
| Test Spin | runner.search.breaker | enabler | medium |
| Arasaka Owns You | runner.survival_defense | emergency_tool | high |
| Custodial Position | runner.rnd_pressure | payoff_anchor | high |
| Custodial Position | runner.interface_closeout | payoff_anchor | high |
| Edited Shipping Manifests | runner.hq_pressure | payoff_anchor | medium |
| Executive Wiretaps | runner.hq_pressure | payoff_anchor | high |
| Executive Wiretaps | runner.interface_closeout | payoff_anchor | high |
| Forgotten Backup Chip | runner.search.breaker | enabler | medium |
| Kilroy Was Here | runner.rnd_pressure | payoff_anchor | high |
| Priority Wreck | runner.hq_pressure | payoff_anchor | medium |
| Private LDL Access | runner.rnd_pressure | enabler | medium |
| Romp through HQ | runner.hq_pressure | payoff_anchor | high |
| Sneak Preview | runner.search.breaker | enabler | high |
| Temple Microcode Outlet | runner.search.breaker | enabler | high |

Karten ohne Strategieanker tragen keine kanonische strategische Rolle. Legacy-Rollen wie `support_tool` wurden bei support-only Preps entfernt oder im JSON-Report nur als Legacy-Kontext geführt.

## TargetProfile-Kandidaten

TargetProfile V1 wurde nur diagnostisch genutzt, wenn das bestehende Schema hinreichend passt. Schema-Gaps bleiben unter anderem bei Multi-Expose, Top-five-Reorder, mehrstufigem Social-Engineering-Ziel und Test-Spin-Temporärinstallation sichtbar. Es gibt keine Targeting-KI und keine Hidden-Info-Zielableitung.

## Deferred Items

- `runner.bad_publicity_pressure`: deferred; Bad-Publicity-Preps sind eine Familie, aber noch keine belastbare Deckstrategie-ID.
- Remote-/ICE-Control-Preps: candidate-only; vorhandene Runner-Strategien tragen diese One-shot-Sabotage nicht sauber als Anker.
- Generische Search/Recovery: Gideon’s Pawnshop, Mantis und If You Want It Done Right... bleiben support-only und werden nicht auf `runner.search.breaker` gezogen.

## Post-Review-Liste

Die vollständige Kartenliste mit Taktiksignalen, Strategieankern, `strategySupportPairs`, TargetProfile-Status und Rationale steht im JSON-Report `ai021-runner-preps-semantics-review-report-2026-06-02.json`.

## Count-Abweichungen

- Proteus: Prompt/Spoiler-Header nennt 26 Preps; `data/cards/proteus-cards.json` enthält 27 aktive/compiled Runner-Events. Repo-Wahrheit führt.
- Classic/Originalset: 43 aktive Originalset-Preps plus 10 bekannte inaktive Classic-Preps.

## Verifikation

Finale Verifikation wird im JSON-Report unter `verification` dokumentiert. Der AI021-Invariant-Check prüft vollständige Post-Review-Abdeckung, katalogisierte Signale, Strategy-Pair-Konsistenz, keine generische `runner.prep`-Strategie, keine Corp-Fast-Advance-Ableitung aus Runner-Preps und die No-Effect-Flags.
