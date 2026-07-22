# Match e2f2: Corp-Entscheidungsfenster – Final Review

Stand: 2026-07-22
Status: abgeschlossen

## Ergebnis

Die sieben bestätigten Corp-Findings aus `match_e2f2f6f433debe00`
(`Purge Window` gegen `Universal Fast Advance`) sind generisch geschlossen.
Zehn spielgleiche Decision-Checkpoints sichern die fehlerhaften Entscheidungen
D7, D14, D45, D63, D75 und D78 bis D80 sowie die positiven Rez-Gegenfälle D36
und D56. Der vollständige KI-Lauf besteht mit 444 Testdateien und 3.109 Tests.

Die Runtime enthält weder Match-, Deck-, Kartenname-, Seed- noch
Karteninstanz-Sonderregeln. Sie bewertet ausschließlich vorhandene
LegalActions, side-sichere PlayerViews und öffentliche beziehungsweise
side-gefilterte Ereignisse. Es wurde kein Fallback ergänzt.

## Geschlossene Diagnosen

| Finding                | Historisches Verhalten                                                                                             | Finaler Vertrag                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rez-Ertrag             | D7 rezzte Data Wall ohne marginale Runner-Kosten; D14 tauschte 3 Credits gegen höchstens 2 Tax am agenda-freien HQ | Rez-Kosten werden gegen sichtbaren Break-Tax, Stop-Wirkung und den aktuellen Schutzbedarf gestellt; D36 und D56 bleiben positive Rezzes                           |
| Quantitativer Draw     | Annual Reviews mit drei gezogenen Karten verlor gegen Basic Draw und einen weiteren Credit                         | LegalAction-Drawmengen werden quantitativ bewertet; nur zusätzliche Karten über den bereits kontextuell bewerteten ersten Draw erhalten den Mehrkartenbonus       |
| Credit-Sättigung       | Die Corp sammelte ohne konkreten Bedarf bis zu 25 Credits                                                          | Der Sättigungsmalus greift erst fünf Credits oberhalb der sichtbaren Zielreserve, nur ohne offenen CreditDemand und bei vorhandener Draw-Alternative              |
| Persistenter R&D-Druck | Ein erfolgreicher Zugriff je Runner-Zug fiel aus dem kurzen Ereignisfenster                                        | Erfolgreiche Zugriffe werden über verschiedene abgeschlossene Runner-Züge gezählt und verfallen nach drei sauberen Runner-Zügen                                   |
| HQ-Matchpointschutz    | D63 schützte agenda-freies HQ statt bedrängtes R&D                                                                 | HQ-Schutz verlangt sichtbare HQ-Agendaexposition; bei realen HQ-Agendas bleibt er wirksam, ein garantierter Same-Turn-Scorepfad geht jedoch vor                   |
| Scorepfad-Priorität    | D75 installierte ein viertes HQ-ICE vor der garantierten Overtime-Konversion                                       | Vollständig finanzierbare Same-Turn-Konversionen werden vor zusätzlicher Verteidigung fortgesetzt                                                                 |
| Scorepfad-Risiko       | D78 bis D80 galten trotz ausreichender Restklicks und Credits als verzögert und contestable                        | Install-/Advance-Aktionen mit nachgewiesenem Same-Turn-Closeout erhalten keine Exposure-Strafen; fehlen Klicks oder Credits, bleiben alle Risikokomponenten aktiv |

## Breiter Regressionslauf

Der erste vollständige Lauf fand acht betroffene Altverträge. Die Ursache war
nicht ein einzelner Zahlenwert, sondern drei zu breite Grenzen:

1. Ein Basic Draw erhielt zusätzlich zur vorhandenen Hand- und
   Verteidigungskontextwertung nochmals den vollen quantitativen Kartenwert.
   Der quantitative Anteil bewertet deshalb nur Mehrkarten-Ertrag ab der
   zweiten Karte.
2. Credit-Sättigung begann bereits exakt an der Zielreserve. Der Malus beginnt
   nun erst bei einem echten Überschuss; offene Fundingbedarfe bleiben wie
   zuvor geschützt.
3. Die erste HQ-Korrektur verlangte selbst bei mehreren sichtbaren
   HQ-Agendas zwingend einen ganz aktuellen Zugriff. HQ-Agendaexposition ist
   am Runner-Matchpoint wieder ausreichend, wird aber von einer garantiert
   noch im selben Zug abschließbaren Scoreline verdrängt.

Der ältere Checkpoint CP-7BFE-05 widersprach dem freigegebenen neuen Vertrag:
Er verlangte Filter am agenda-freien HQ, obwohl R&D als kritisch bedrängt
bewertet wurde. Seine Expectation verlangt nun Funding für die R&D-Abwehr und
verbietet weiterhin den Draw sowie die alte HQ-Installation.

## Deck- und Hint-Audit

Der Consumer-Audit des im Match gespeicherten Corp-Snapshots
`fnv1a:94aba061:corp` umfasst 16 verschiedene Karten und 45 Karten insgesamt.
Es wurden keine Karten ausgeschlossen. Ergebnis: null blockierende Findings
und null Warnungen. Das produktive Strategieprofil erkennt
`corp.fast_advance`, `corp.remote_scoring` und `corp.rush_score` als
Primärstrategien.

## Verifikation

```text
Match-e2f2-Decision-Checkpoints: 10/10 grün
Breiter gezielter Regressionssatz: 9 Dateien, 94/94 Tests grün
Vollständige @netgrid/ai-Suite: 444/444 Dateien, 3109/3109 Tests grün
@netgrid/ai Typecheck: grün
corepack pnpm check:ai: grün
AI-Source-Structure: 690 Produktionsmodule, 0 Runtime-Zyklen, 0 Typzyklen
corepack pnpm check:ai-deck-doctrine-strategy: grün
Deck-Hint-Consumer-Audit: 16/16 Karten, 45 Karten, 0 Ausschlüsse,
  0 Blocker, 0 Warnungen
corepack pnpm format:changed: grün
git diff --check: grün
```

## Abschlussbewertung

Die Corp reagiert jetzt zustandsgebunden statt reflexhaft: Sie lehnt
wirtschaftlich wirkungslose Rezzes ab, unterscheidet einen einzelnen Draw von
echtem Mehrkarten-Ertrag, stoppt Credit-Horten erst bei realem Überschuss,
hält wiederholten R&D-Druck über Zuggrenzen und schützt HQ nur bei sichtbarer
Agendaexposition. Gleichzeitig führt sie einen garantierten Overtime- und
Same-Turn-Scorepfad aus, ohne ihn fälschlich als Runner-exponiert zu bestrafen.
