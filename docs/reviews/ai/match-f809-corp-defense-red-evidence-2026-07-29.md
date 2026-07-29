# Match f809 – rote Corp-Defense-Evidence

Stand: 2026-07-29

## Ergebnis

Alle fünf freigegebenen Zielabweichungen sind auf unverändertem Produktivcode
als `behavior_regression` reproduziert. Es liegt keine Fixture-, Engine-,
Runtime-, Redaction- oder Replay-Drift vor.

## Capture

Quelle:

- Match: `match_f8096c690c233533`
- Modus: `human_runner_vs_corp_ai`
- Akteur: Corp, Schwierigkeitsgrad hard
- Deck: `Proteus Korp - Variable ICE Gauntlet`
- DeckHash: `fnv1a:ee4233bc`

Der erste Strict-Warmup ab D1 stoppte erwartungsgemäß an D4 mit dem bereits
explizit fail-closed modellierten `invalid_support_graph` für die randomisierte
zentrale ICE-Near-Tie-Bindung. Es wurde kein Rebase verwendet. Alle Fixtures
wurden deshalb mit `--warmup-policy strict` ab D5 aufgenommen:

- D10: 5 Warmup-Entscheidungen, 0 Drifts, 17 Events;
- D13: 8 Warmup-Entscheidungen, 0 Drifts, 26 Events;
- D30: 25 Warmup-Entscheidungen, 0 Drifts, 67 Events;
- D34: 29 Warmup-Entscheidungen, 0 Drifts, 72 Events;
- D45: 40 Warmup-Entscheidungen, 0 Drifts, 101 Events.

In allen fünf Captures war `strategicIntent` vorhanden. Tactical Plan,
PlanPortfolio und RunnerRunPlan waren am Zielzustand bewusst nicht als
persistierter Runtime-Checkpoint erforderlich.

## Rote Checkpoints

| Checkpoint | Historischer Zustand | Erwartung | Unverändertes Ergebnis |
| --- | --- | --- | --- |
| `cp-f809-01-rd-funded-last-click-d10` | D10 / SV16 | ICE auf R&D unter `corp.defend_servers` | `corp.gain_credit`; `behavior_regression`; `corp_engine_certified_basic_liquidity_development` |
| `cp-f809-02-rd-rez-support-route-d13` | D13 / SV25 | Defense-Route auf R&D unter `corp.defend_servers` beginnen | `corp.gain_credit`; `behavior_regression`; `corp_engine_certified_basic_liquidity_development` |
| `cp-f809-03-retain-rd-defense-package-d30` | D30 / SV66 | Credit Blocks und Rent-to-Own als ausführbares Paket behalten | `corp.resolve_choice`; `behavior_regression`; Rent-to-Own wird nicht behalten |
| `cp-f809-04-rd-funded-last-click-d34` | D34 / SV71 | finanzierbares ICE auf R&D installieren | `corp.gain_credit`; `behavior_regression`; `corp_last_click_score_install_deferred:remote_1` |
| `cp-f809-05-rd-staged-bluff-last-click-d45` | D45 / SV100 | ICE auf R&D vorbereitend installieren | `corp.gain_credit`; `behavior_regression`; `corp_defense_exact_route_funding_required:rd` |

Der fokussierte Vitest-Lauf meldete exakt fünf rote Tests mit exakt fünf
`behavior_regression`-Codes.

## Deck-Hint-Consumer-Audit

Der Audit des roten D10-Checkpoints erfasste vollständig:

- 30 unterschiedliche Karten;
- 45 Karten insgesamt;
- keine ausgeschlossenen Karten;
- keine Hint-Warnungen.

Er endet erwartungsgemäß nur wegen der Checkpoint-Behavior-Regression mit
einem Blocker. Der bereits versionierte Checkpoint
`cp-3aac-01-corp-first-turn-no-premature-end-d4` enthält dasselbe Deck,
denselben DeckHash und dieselben 30/45 Karten. Der formale Audit dieses grünen
Vergleichsstands meldet:

- Status `ok`;
- 0 Blocker;
- 0 Warnungen;
- keine SearchTools und keine BankTools;
- vollständige aktive, reviewte Hinweise für die betroffenen ICE und
  Rez-Hilfen.

Damit ist ein Deck-, DeckHash-, Hint- oder Hint-Audit-Ursprung ausgeschlossen.
Die Abweichung liegt in den Defense-Consumern und der kontextlosen
Behalten-Auswahl.

## Grüne Schutzgrenzen auf unverändertem Code

Die vorhandenen Tests sichern bereits die Gegenrichtungen:

- eine reine `funding_only`-Route ohne sichtbaren Druck und bei null Credits
  bleibt an exakt gebundene Economy-Finanzierung delegiert;
- eine bereits ausreichend geschützte Scoreline darf ihre konkrete
  Agenda-Konversion fortsetzen;
- eine ungeschützte oder unbekannt bewertete Scoreline bleibt gegenüber einer
  sicheren Behauptung fail-closed;
- die zentralen Credit-Pool-/Rez-Checkpoints aus Match EC735A96 bleiben
  eigenständige positive Defense-Fälle.

Diese Schutzgrenzen werden in den Umsetzungspaketen um ausdrückliche
Staging-/Bluff- und Owner-Gegenproben ergänzt.

## Fixvertrag

- einziger Owner für Installation, Staging, Bluffbewertung und Rez-Hilfe:
  `corp.defend_servers`;
- Economy liefert nur exakt gebundene Finanzierung;
- Handmanagement konsumiert ein Defense-Paket nur für die Behalten-Auswahl;
- kein freier Bluff-Scorer, kein globaler Aktionsbonus und keine
  Karten-Sonderregel;
- vorbereitete Verteidigung behauptet keine unmittelbare Access-Reduktion.
