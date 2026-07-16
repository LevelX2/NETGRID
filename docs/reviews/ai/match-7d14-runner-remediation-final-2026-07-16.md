# Match 7D14 Runner-Remediation: Final Review (2026-07-16)

Status: umgesetzt und zur lokalen Integration verifiziert  
Aktiver Agent: card-enablement-ai-knowledge-agent  
Scope: Runner-Plan-Revalidation und Matchpoint-Discard

## Ergebnis

Die zwei freigegebenen Findings aus `match_7d14d0a3bc0ecd79` sind auf dem aktuellen Code als spielgleiche, side-sichere Verträge gebunden und generisch behoben:

| Anker | Vorher | Nachher |
| --- | --- | --- |
| D105 / SV190 | `runner.gain_credit` trotz Score-Gap 3489 zum erreichbaren dringlichen R&D-Run | `runner.start_run.rd` über `urgent_run_now_development_yield` |
| D106 / SV191 | Raven-Microcyb-Owl-Installation statt desselben R&D-Fensters | `runner.start_run.rd` über dieselbe generische Revalidation |
| D152 / SV256 | Discard von HQ Interface, Livewire's Contacts und Score! | Discard von Score!, Cyfermaster und Broker; HQ Interface und Livewire's Contacts bleiben erhalten |

Die Engine-LegalActions waren in allen drei Zuständen korrekt. Die Ursachen lagen ausschließlich in der KI-Arbitration beziehungsweise im Runner-Keep-Score.

## Plan-Revalidation

Ein Handentwicklungsplan darf jetzt gegen einen klar positiven Run weichen, wenn alle folgenden Bedingungen gleichzeitig sichtbar belegt sind:

- der gemappte Finanzierungs-, Installations- oder Event-Schritt ist nichtpositiv;
- der alternative Run ist positiv, mehr als 600 Punkte besser und sein TacticalGoal meldet `urgency:high` sowie `recommendation:run_now`;
- bei Basic-Credit-Finanzierung ist der Handentwicklungsfit tatsächlich `blocked`;
- der gemappte Schritt besitzt keinen positiven `semantic_strategic_action_fit`.

Die Ausnahme greift nicht bei einem nicht dringlichen Run und nicht, wenn ein letzter Runner-Click genau den fehlenden Credit eines Entwicklungsplans beschaffen kann. Damit bleiben der historische F450-Cybermodem-Vertrag und sinnvoll positive Entwicklung geschützt.

## Matchpoint-Discard

Der Runner-Keep-Score berücksichtigt zwei neue, strukturierte Werte:

- Unmittelbare Liquidität erhält bei weniger als vier Credits einen Bonus, wenn der aktuelle Kartenpreis bezahlbar ist und der kompilierte Economy-Hint einen positiven Netto-Credit-Ertrag ausweist.
- Eine einzigartige, noch nicht installierte Multiaccess-Karte erhält innerhalb von zwei Agenda-Punkten zum Sieg einen Closeout-Bonus, wenn ihr `lineSupport` zu einer aktuellen primären oder sekundären Deckstrategie beziehungsweise zum StrategicIntent passt.

Beide Regeln verwenden ausschließlich PlayerView, aktuelle Deck-/Intent-Signale und kompilierte strukturierte Hints. Kartentitel, spätere Matchinformationen und verdeckte Corp-Daten sind keine Entscheidungsfaktoren. Eine zweite Handkopie oder dieselbe bereits installierte Kartendefinition erhält den Matchpoint-Bonus nicht.

## Verworfene D101-Hypothese

Die angrenzende Vermutung, Multiaccess-Äquivalenz müsse allgemein serverbezogen statt rollenbezogen modelliert werden, wurde mit einem fokussierten Unit-Probe reproduziert, aber nicht in den finalen Patch übernommen. Der breitere Eingriff veränderte bestehende Broker-/Portfolio-Verträge und war für D152 nicht erforderlich. Er wurde vollständig zurückgenommen; der finale Fix wertet nur echte Kopien und dieselbe bereits installierte Kartendefinition als vorhandenes Äquivalent.

## Regression und Gegenproben

Vor dem Fix waren ausschließlich die drei Zielproben mit `behavior_regression` rot. Zwei enge Gegenproben waren bereits grün und bleiben grün:

- Bei null Runner-Credits ist der R&D-Pfad unbezahlbar; D105 darf weiter finanzieren.
- Bei bereits installierter HQ-Interface-Definition darf die Handkopie in D152 abgeworfen werden.

Zusätzliche Unit-Gegenproben schützen nicht dringliche Runs, Finanzierung mit dem letzten Click, frühe Nicht-Matchpoint-Situationen, echte Duplikate und bereits installierte gleiche Definitionen.

## Verifikation

- Strikte Captures: D105 104/104 Warmup-Entscheidungen, D106 105/105 und D152 151/151; jeweils null Drift und gültiger StateHash.
- Fokus- und Nachbartests: 8 Dateien, 146/146 Tests grün.
- AI-Typecheck: grün.
- `git diff --check`: grün.
- Ein vollständiger `@netgrid/ai`-Lauf über 348 Dateien und 2411 Tests wurde als breite Sicherheitsprobe ausgeführt. Er deckte neben bekannten Altfehlern auch zu breite Zwischenentwürfe auf; diese Änderungen wurden zurückgenommen oder enger begrenzt.
- Nach der finalen Eingrenzung wurden alle im vollständigen Lauf auffälligen Dateien erneut ausgeführt: 10 Dateien, 147 Tests, davon 132 grün und 15 rot. Alle 15 roten Verträge sind auf dem unveränderten lokalen `main` identisch bestätigt: 14 im gemeinsamen Baseline-Satz sowie der historische F450-Streetware-Kontrollfall. Der finale 7D14-Diff fügt keinen weiteren roten Vertrag hinzu.

Der vollständige AI-Gesamtstand ist damit nicht pauschal grün; die 15 bekannten roten Altverträge bleiben außerhalb dieses Match-Scopes sichtbar. Die zwei Hint-Quality-Fehler daraus entsprechen den bereits vor diesem Fix bestehenden Hint-Gate-Blockern und sind nicht kausal mit D105, D106 oder D152 verbunden.

## Sicherheitsgrenzen

- Keine Änderung an Engine, `LegalActions`, `applyAction`, Replay, StateHash oder Randomness.
- Keine FullState- oder Hidden-Info-Nutzung.
- Keine Kartenname-Sonderregel.
- Keine Abschwächung bestehender Testassertions und kein `skip`/`only`.

Führende Artefakte sind der Prozessvertrag, die Red Evidence und die drei Checkpoint-Fixtures unter `data/scenarios/ai-decision-checkpoints/`.
