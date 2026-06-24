# AI Corp Tag-Punish Hint-Audit - 2026-06-24

## Anlass

CTPE-2 aus dem Paketprozess `docs/architecture/ai/ai-corp-tag-punish-endgame-process-2026-06-24.md` prüft die Hint-Semantik der Karten, die im letzten gespeicherten Spiel für Corp-Tag-Punish, Ressourcen-Trash und Meat-Damage-Endgame relevant waren.

Die Prüfung bleibt side-safe: Hints beschreiben nur öffentlich bekannte Kartenfunktionen und erzeugen keine LegalActions. Die Runtime darf weiter ausschließlich LegalActions und Corp-PlayerView auswerten.

## Korrigierte Hint-Fehler

- `onr_v1_160_diplomatic-immunity`: war als `remote_upgrade_modifier` geführt, obwohl es eine Runner-Resource mit Meat-Damage-Verhinderung ist. Korrektur auf `damage_prevention` und `survive_meat_damage`.
- `onr_v1_125_dermatech-bodyplating`: war zusätzlich als Economy-Recovery geplant, obwohl es Hardware für Meat-Damage-Verhinderung ist. Korrektur auf `build_rig` plus `survive_meat_damage`.
- `onr_v1_283_audit-of-call-records`: war als Economy-Recovery markiert, hat aber Tag-/Trace-Druck ohne Credit-Effekt. Economy-PlanRole entfernt.
- `onr_v1_284_chance-observation`: war als Economy-Recovery markiert, hat aber Tag-/Trace-Druck ohne Credit-Effekt. Economy-PlanRole entfernt.
- `onr_v1_287_datapool-by-zetatech`: war als Economy-Recovery markiert, erzeugt aber zusätzliche Tags bei bereits getaggtem Runner. Korrektur auf `punish_tagged_runner` plus `bait_runner`.
- `onr_v1_306_trojan-horse`: war als Economy-Recovery markiert, erzeugt aber nur einen Tag nach Agenda-Diebstahl. Economy-PlanRole entfernt; die Karte bleibt als Tag-Fenster-/Punish-Enabler über `punish_tagged_runner` plus `bait_runner` planbar.

## Bewusst unverändert

- `onr_v1_293_netwatch-credit-voucher` bleibt `recover_economy`, weil der Karteneffekt tatsächlich Corp-Credits erzeugt und zugleich Tag-Punish-Semantik besitzt.
- `onr_v1_339_schlaghund` war bereits als `punish_tagged_runner`, `damage.corp_tagged_meat_payoff` und `tag.payoff` geführt. Der im Spiel beobachtete Fehler lag nicht an einem falschen Schlaghund-Hint, sondern an Priorisierung und Sequencing.
- `onr_v1_170_nomad-allies`, `onr_v1_181_the-springboard`, `onr_v1_182_submarine-uplink`, `onr_v1_183_technician-lover` und `onr_v1_159_databroker` waren für die nächste Runtime-Anpassung als Trash-Ziele brauchbar beschrieben. Die Runtime nutzte diese Semantik bisher nur nicht breit genug.

## Folge für CTPE-3

Die Runtime-Anpassung soll nicht kartenspezifisch auf diese Namen verzweigen. Stattdessen sollen generische, sichtbare Signale genutzt werden:

- Tag-/Trace-Schutz des Runners als Trash-Ziel bei getaggtem Runner.
- Meat-Damage-Verhinderung als Trash-Ziel vor Damage-Payoffs.
- R&D-Informationsdruck und High-Risk-Burst-Economy als Trash-Ziele, wenn Agenda-Druck hoch ist.
- Tag-Punish-Payoffs und Funding sollen Economy-Aufbau, Remotesetup und langsame Archiv-/ICE-Linien übersteuern, sobald der Runner viele Tags hat.
