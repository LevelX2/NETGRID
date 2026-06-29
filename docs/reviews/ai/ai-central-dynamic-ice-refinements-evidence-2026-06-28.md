# AI Central Dynamic ICE Refinements Evidence, 2026-06-28

## Primärspiel

- Match: `match_28b304f024323f9d`
- Modus: `human_runner_vs_corp_ai`
- Decks: Runner `Redline Riot`, Corp `Proteus Korp - Hidden Node & Region Trap`
- Stand der Analyse: aktiv, `stateVersion` 101, 102 Events, 42 AI-Traces
- Score: Runner 4, Corp 0
- Board: Runner mit `Loony Goon` und `R&D Interface`; Corp mit rezzed `Dog Pile` auf R&D, unrezzed `Bug Zapper`/`Riddler` auf HQ, unrezzed `Bug Zapper` auf Archives, rezzed `Credit Blocks` in Remote 1, unrezzed `Mobile Barricade` in Remote 2.

## Relevante Replay-Beobachtungen

- Event 23: Runner installiert `R&D Interface`.
- Events 26 bis 31: R&D-Run mit effektivem Multiaccess; Corp kann `Dog Pile` nicht rezzed nutzen; `Viral Breeding Ground` wird gestohlen.
- Events 41 bis 48: weiterer R&D-Run; `Dog Pile` wird teuer rezzed und dann mit sichtbarem `Loony Goon` gebrochen; `Marked Accounts` wird gestohlen.
- Events 68 bis 72: `Executive Wiretaps` auf HQ erzeugt sichtbaren HQ-Multiaccess-Druck.
- Events 73 bis 78 und 89 bis 95: weitere R&D-Runs durch den vorhandenen R&D-Schutz.
- Entscheidung D10/SV18: `Dog Pile` wird bei 0 Credits auf R&D installiert und erzeugt faktisch nur eine nicht bezahlbare Drohung.
- Entscheidungen D28 bis D41: Trotz `rndPressure` bis 0.85 und wiederholten R&D-Zugriffen werden Credit-Gewinn, HQ/Archives-ICE oder Remote-ICE teils höher bewertet als R&D-Stabilisierung.
- Entscheidungen D21 bis D31: Passive Tagged-Payoff-Strafen erscheinen, obwohl im sichtbaren LegalAction-Set kein konkreter Meat-Damage-Payoff erkennbar ist.

## Vergleichsspiel

- Match: `match_e89eab80ded7ab16`
- Status: beendet vor den letzten Remote-Scoring-Korrekturen.
- Nutzen für dieses Paket: nur Vergleich, weil dort Central-Run-Memory teils `centralRuns=0` blieb, obwohl HQ/R&D-Runs stattfanden.

## Abgeleitete Fehlerklassen

1. Central-Druck wird nicht robust aus allen side-safe Eventformen abgeleitet.
2. Multiaccess-Hardware und Multiaccess-Events wirken zu wenig servergenau auf HQ/R&D-Absicherung.
3. Central-ICE-Installationen werden nach generischer Schutzrolle bewertet, aber zu wenig nach Bezahlbarkeit und tatsächlicher Wirkung gegen sichtbare Coverage.
4. Dynamische ICE-Karten fehlen als Risiko in Hint- und Runtime-Bewertung, wenn sie solo, innen/außen falsch, X=0 oder im falschen Modus liegen.
5. Passive Tag-Payoff-Strafen verwechseln sichtbare spätere Payoff-Möglichkeit mit aktueller konkreter LegalAction.

## Erwartete Verbesserungsrichtung

Die Änderungen sollen nicht alle Corp-Fehler durch pauschale Prioritätserhöhung kaschieren. Sie müssen die konkrete falsche Bewertung drehen:

- R&D/HQ unter sichtbarem Multiaccess wird akut, wenn Access realistisch und Schutz unzureichend ist.
- Economy wird besser als Scheinschutz, wenn die Corp den relevanten Rez-Floor nicht erreicht.
- ICE-Installation gewinnt nur, wenn sie eine konkrete Central-Schwachstelle verbessert.
- Passive Strafen greifen nur gegen Setup-/Economy-/Draw-Aktionen, wenn im selben LegalAction-Set eine konkrete sichere oder relevante Payoff-Aktion existiert.

