# AI C142 Corp Fixes Evidence 2026-06-29

## Replay

- Match: `match_c1426609ec05a7d5`
- Modus: `human_runner_vs_corp_ai`
- Ende: Runner-Sieg bei `state_version` 219 durch HQ-Steal von `World Domination`
- AI-Traces: 95

## Befunde

1. `Social Engineering`: In `state_version` 55, 94, 137 und 214 wählte die Corp den Guess `2`, während der Runner sichtbar/verdeckt deutlich mehr Credits einsetzen konnte. Die Target-Choice-Evidence blieb Shadow-only (`selected_choices_created:false`) und sortierte niedrige Werte vor hohen.
2. `Twisty Passages`: In `state_version` 32, 171 und 185 wurde das ICE auf R&D/HQ zurückgenommen. Das entfernte aktive Zentralverteidigung; auf HQ ist die Rücknahme zusätzlich teuer, weil eine spätere HQ-Installation +2 Credits kostet.
3. Rez-Sequencing: In `state_version` 176-187 wurde erst ein leicht brechbares äußeres ICE genutzt; danach reichten die Credits nicht mehr für das stärkere innere `Bug Zapper`.
4. Scoreline-Aufbau: Agendas blieben lange in HQ, während Remote-Support ohne Agenda/Counter-Kontext installiert oder gerezzt wurde.
5. Zentraldruck: Späte HQ-Gefahr wurde trotz Runner-Score, sichtbarer Tools, vorheriger Zentralerfolge und HQ-Agenda-Druck nicht zuverlässig akut.
6. Credit-Loops: Nach mehreren Credit-Aktionen fehlte ein klarer Übergang zu Scoring, Zentralverteidigung oder Remote-Härtung.

## Freigegebene Anpassungsrichtung

- Echte, side-safe Target-Choices für konkrete LegalActions.
- Hochrisiko-Guess-Logik bei Secret-Spend-Defense.
- Bounce-/Rez-Entscheidungen mit Schutzverlust, Wiederinstallationskosten und downstream Rez-Floor.
- Remote-Scoreline-Aufbau stärker, aber ohne Remote-ICE-Spam.
- Zentraldruck mit HQ-Agenda-Dichte, Runner-Score, sichtbarer Coverage und früheren Erfolgen.
- Economy nur weiter bevorzugen, wenn ein konkreter Rez- oder Scoreline-Plan dadurch realistisch wird.
