# AI C142 Corp Fixes Prozess 2026-06-29

## Anlass

Das Replay `match_c1426609ec05a7d5` zeigte trotz der vorherigen Scoring-Window-Arbeit weiter mehrere Corp-Fehlmuster:

- `Social Engineering`-Secret-Spend-Guesses wurden nur als Target-Choice-Shadow bewertet und nicht als echte Choices umgesetzt.
- Die Guess-Rangfolge bevorzugte niedrige Werte, obwohl der Zugriff auf HQ/R&D in mehreren Hochrisiko-Situationen verteidigt werden musste.
- `Twisty Passages` wurde auf Zentralservern wiederholt nach HQ zurückgenommen, obwohl das ICE danach nicht mehr schützt und eine erneute HQ-Installation zusätzlich 2 Credits kostet.
- Die Corp gab Credits für ein triviales oder breakbares äußeres ICE aus und konnte danach das stärkere innere ICE nicht mehr rezzen.
- Agenda-Druck in HQ führte zu wenig zu Remote-Scoreline-Aufbau.
- Zentraldruck wurde in Endgame-Situationen zu flach bewertet.
- Nach erfülltem Rez-Floor blieb die Corp zu oft in Credit-Loops.

## Umsetzungspakete

1. Target-Choice-Pfad für side-safe LegalActions aktivieren und Secret-Spend-Choices bei Hochrisiko-Defense höher gewichten.
2. `Twisty Passages`-Bounce als Schutzverlust bewerten, bei HQ zusätzlich die +2 Wiederinstallationskosten berücksichtigen und Rez-Sequencing gegen stärkere innere ICE absichern.
3. Scoreline-, Remote-ICE-, Central-Pressure- und Economy-Bewertungen nach Replay-Funden schärfen.
4. Fokussierte Regressionstests ergänzen und bestehende AI-Gates ausführen.
5. Branch lokal committen, nach `main` integrieren und ein schnelles, KI-freundliches Corp-Deck in den Benutzerdecks speichern.

## Grenzen

Die Änderungen dürfen kein Parallel-Planner werden. Sie bleiben an vorhandene LegalActions, PlayerViews, side-safe PublicEvents und Runtime-Scorer gebunden. Verdeckte Runner-Hand, Runner-Stack oder nicht öffentliche Corp-Informationen dürfen nicht in öffentliche Evidence- oder Debug-Kanäle gelangen.
