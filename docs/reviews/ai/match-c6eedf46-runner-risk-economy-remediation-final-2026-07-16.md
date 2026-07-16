# Match C6EEDF46: Runner-Risiko- und Ökonomie-Remediation

Status: merge-bereit

## Ergebnis

Die aus `match_c6eedf46e777c169` freigegebenen Korrekturen sind umgesetzt.
Verzögerte Ökonomie kann einen exakt finanzierten Installationsplan nicht mehr
über die nötige Restreserve hinweg erzwingen. Der produktive Runtime-Pfad
prüft bezahlte Runner-Installationen am konkreten Zustand nach der Aktion und
unterscheidet unmittelbare Liquidität von Raten-, Turn-Start- und sonstiger
verzögerter Ökonomie.

Die Damage-Risikohaltung verwendet ausschließlich side-safe sichtbare Karten
und öffentliche Memory-Evidence. Eine bekannte Damage-Quelle oder ein
strukturierter Tag-/Trace-Punish-Pfad erhöht die Vorsicht abgestuft; allgemeine
Trace-Karten, Access-Ambushes und ein Tag allein reichen nicht. Der erste
Facecheck ohne sichtbares Warnsignal bleibt dadurch legitim. Grenzfälle
zwischen kostenlosen sicheren Zentral-Probes und Credit-Hold variieren nur
innerhalb einer engen fachlich zulässigen Menge und bleiben für identischen
Replay-Kontext deterministisch.

Chicago Branch und Pacifica Regional AI besitzen jetzt die eigenständige
Remote-Rolle `score_acceleration`. Der Trash-Consumer erkennt ihren
Scorewert, ohne ihn als Credit-Ökonomie oder Scoring-Protection umzudeuten.
Eine Compiler-/Inspector-Invariante verhindert `asset_economy` ohne
unabhängigen Economy-Nachweis. Öffentliche Nicht-ICE-Rez-Ereignisse werden als
`rez_card` ausgegeben; interne LegalAction, Sichtbarkeitsbarriere, Replay und
StateHash bleiben unverändert.

## Nachgezogene Präzisierungen

- Ein exakt im vorherigen Schritt finanzierter strategischer Install darf den
  allgemeinen Creditfloor eng übersteuern, solange er keine verzögerte
  Ökonomie ist.
- Bei bestätigtem Damage-Risiko und niedrigem Pool kann ein großer sofortiger
  Broker-Cashout den Reaktionsfloor wiederherstellen. Das ist kein genereller
  Früh-Cashout und kein Freibrief für weiteres Bankladen.
- Persistent-Draw-Karten wie ESA Contract bleiben produktiv konsumierbar,
  ohne dafür fälschlich als `asset_economy` markiert zu werden.
- Corporate Negotiating Center erhält seine aus der Implementation belegte
  Agenda-Reveal-Economy als abgeleiteten Fakt.
- Event-Run-Aktionen mit eigenem Payload werden nicht von der optionalen
  Safe-Probe-Varianz verdrängt.

## Verifikation

| Prüfung | Ergebnis |
| --- | --- |
| C6EEDF46 und angrenzende AI-Regressionen | 11 Dateien, 107/107 grün |
| Hint-/Ontology-/Engine-Fokus | 7 Dateien, 99/99 grün |
| Derived-, Full-Derived-, Compiled-, Inspector- und Pilot-Index-Gates | grün |
| AI-, Engine- und Shared-Typecheck | grün |
| Vollständige AI-Suite | 346 Dateien, 2371/2381 grün |
| Vergleich zum Ausgangsstand `70b3f985c` | keine neue rote Erwartung |
| `git diff --check` | grün |

Die zehn roten Tests der vollständigen Suite sind auf dem unveränderten
Ausgangsstand identisch reproduziert: drei Broker-, vier 424A-, ein DFE6-, ein
MRGSG- und ein Streetware-Control-Checkpoint. Diese bestehende Testschuld ist
kein Ergebnis des vorliegenden Branches; keine ihrer Erwartungen wurde für
den Abschluss abgeschwächt.

## Grenzen

Der Fix errät keine zukünftige Chance Observation oder Urban Renewal aus dem
Quellmatch. Vor deren öffentlicher Enthüllung gab es dort kein Damage-Deck-
Signal. Der Fehler in Decision 9 war deshalb die objektive Liquiditäts- und
Reserveverletzung, nicht ein rückwirkend konstruierter Deck-Read.

Die breite Suite belegt technische und verhaltensbezogene Regressionstreue,
nicht globale Spieloptimalität. Weitere gespeicherte Spiele werden weiterhin
einzeln aus LegalActions, PlayerViews, Traces, Hints und Consumer-Ketten
bewertet.
