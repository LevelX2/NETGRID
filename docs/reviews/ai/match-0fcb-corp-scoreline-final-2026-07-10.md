# Match 0fcb: Corp-Scoreline-Abschlussbericht

## Ergebnis

Alle sechs freigegebenen Befunde aus `match_0fcb17642297a8a2` sind an ihrer
jeweiligen Quelle korrigiert. Die Corp-Runtime beginnt oder verfolgt eine
mehrzuegige Scoreline nicht mehr gegen belegte Remote-Erreichbarkeit. Support,
Schutz, Finanzierung und endliche Oekonomie sind als konkrete Schritte ihrer
Plaene an die Aktionsauswahl gebunden. KI-Traces speichern echte Zugnummern.

## Fachliche Verträge

1. Zeitdruck ist kein Sicherheitsbeweis und hebt ein unsicheres Scorefenster
   nicht auf.
2. Sichtbare Runner-Aktionsoekonomie gehoert zur Mehrzugprognose.
3. Ein erfolgreicher Remote-Zugriff bleibt bis zu einer relevanten
   Pfadaenderung Reachability-Evidence.
4. Agenda-Ziel, Advancement-Support und Remote-Schutz sind getrennte Rollen.
5. Ein aktiver Plan steuert eine passende LegalAction oder nennt einen
   konkreten Blocker.
6. `AiDecisionTrace.turn` bezeichnet den Chronicle-Zug, nicht die
   StateVersion.

## Umsetzung

- `semantic-runtime-corp-remote-reachability.ts` kapselt sichtbare
  Runner-Oekonomie und empirische Remote-Erreichbarkeit.
- Scoreline-Assessment und Remote-Scoring konsumieren diese gemeinsame
  Prognose und behandeln unsichere spielentscheidende Linien fail-closed.
- Tactical Plans unterscheiden Agenda-, Support- und Schutzrollen; der
  Semantic-Controller bindet fortschreitende Scoreline- und
  Finite-Economy-Schritte.
- `chronicle-turn-context.ts` ist die gemeinsame Serverquelle fuer
  Chronikdarstellung und Trace-Persistenz.

## Abgrenzung

- Keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash- oder
  Randomness-Regel wurde verändert.
- Es werden keine verborgenen Runner-Handkarten oder Deckinformationen
  ausgewertet.
- Die bereits separat behobene Root-Rez-Aufdeckung ist kein Bestandteil
  dieses Pakets.
- Die Korrektur verändert das Entscheidungsmodell; sie kaschiert keine
  Differenz durch Anzeige- oder Runtime-Score-Aufschläge.

## Verifikation

- Vollständige `@netgrid/ai`-Suite: 284 Testdateien und 1.843 Tests grün.
- Vollständige `@netgrid/server`-Suite: 9 Testdateien und 140 Tests grün.
- `@netgrid/ai`- und `@netgrid/server`-Typecheck grün.
- Historische Matchzustände liefern die im Evidence-Bericht dokumentierten,
  plan-konsistenten Entscheidungen.
- Diff-Hygiene grün; die direkt betroffenen Gates werden nach dem Abgleich mit
  aktuellem `main` erneut ausgeführt.

Führende Artefakte:

- `docs/architecture/ai/corp-scoreline-reachability-match-0fcb-process.md`
- `docs/reviews/ai/match-0fcb-corp-scoreline-evidence-2026-07-10.md`
- `docs/reviews/ai/match-0fcb-corp-scoreline-final-2026-07-10.md`
