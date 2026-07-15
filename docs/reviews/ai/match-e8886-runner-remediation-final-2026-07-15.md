# Match E8886 Runner-Remediation: Final Review (2026-07-15)

## Ergebnis

Die vier freigegebenen Fehlentscheidungen aus
`match_e8886c6f5a9d0c24` sind auf aktuellem Code spielgleich reproduziert,
generisch behoben und gegen sechs positive Gegenbeispiele abgesichert. Alle
zehn Decision-Checkpoints sind grün. Es wurden weder Engine-Regeln noch
LegalActions, PlayerView-Redaktion, Replay oder Kartenimplementierungen
geändert.

## Behobene Entscheidungsfehler

1. **D13/SV24, unfinanzierter unbekannter R&D-Pfad:** Die vorhandene
   side-safe `unrezzedIceRiskModel`-Bewertung wird nun vom RunTarget-Consumer
   als kleine Kreditreserve genutzt. Gezählt wird nur tatsächlich unbekanntes,
   nicht gerezztes ICE des projizierten Pfads. Ein Corp ohne Rez-Credits,
   finanzierte Probes, hohe sichtbare Payoffs und Score-Threats bleiben
   laufbar.
2. **D16/SV28, Junkyard BBS als Economy:** Der aktive und kompilierte Hint
   enthält keine Economy-Rolle mehr. Recovery-only-Suche wird ohne sichtbares
   Heap-Ziel nicht durch persistente Installationsboni wieder zu aktuellem
   Setup aufgewertet; mit sichtbarem Recovery-Ziel bleibt sie nutzbar.
3. **D22/SV39, unbezahlbarer Inside Job:** Die harte Action-Exclusion
   konsumiert jetzt die vollständige aktionsspezifische RunTargetEvaluation
   einschließlich Eventkosten, Bypass und Restpfad. Ein bezahltes Run-Event
   wird außerdem gegenüber dem legalen Basic Run ausgeschlossen, wenn seine
   konkrete Sonderwirkung am gewählten Ziel nicht eintritt. Damit weicht der
   unbezahlbare R&D-Inside-Job weder auf denselben Basic Run noch auf einen
   nutzlosen Inside Job gegen das freie HQ aus.
4. **D23/SV41, Continue trotz konkretem Abort:** Die aktive Restpfad-Quote
   bestimmt ihren Known-Status nur aus noch nicht passiertem ICE. Eine im
   aktuellen State revalidierte, vollständig bekannte und nicht bezahlbare
   Reststrecke darf nicht mehr durch einen höheren generischen Continue-Score
   überstimmt werden.

## Bewusst erhaltene Gegenbeispiele

- Der frühe Remote-Check-Run vor einer Breaker-Installation bleibt erhalten.
  Ein unbekanntes billiges ICE kann einen installierten falschen Breaker
  bestrafen oder trashen; die KI soll solche Informationsläufe nicht pauschal
  durch Installation ersetzen.
- Der vollständig bekannte und exakt finanzierte R&D-Pfad bleibt laufbar.
- Livewire's Contacts bleibt echte Economy.
- Ein erreichbarer Inside-Job-Bypass bleibt wählbar.
- Junkyard bleibt mit sichtbarem Heap-Ziel ein valider Recovery-Setup-Schritt.
- Dieselbe bekannte Reststrecke wird mit ausreichenden Credits fortgesetzt.
- Eine alte oder weiterhin unbekannte vorsichtige Abort-Schätzung darf weiter
  an eine sichtbar bessere Continue-Entscheidung abgeben.

## Architektur- und Sicherheitsprüfung

- Die Engine bleibt alleinige Regelautorität; es wurden keine Actions erzeugt
  oder umgeschrieben.
- Alle neuen Signale stammen aus PlayerView, LegalActions, öffentlichen Events
  oder daraus side-safe rekonstruierter Belief-State-Evidence.
- Es gibt keine Match-, Seed-, Karteninstanz- oder Kartentitel-Sonderlogik im
  produktiven Entscheidungsweg.
- Der Fix folgt der bestehenden Schichtung: Hint-Vertrag, Handentwicklung,
  RunTarget-Projektion, Action-Exclusion und RunnerRunPlan-Policy.
- Die RunTarget-Schemaergänzungen sind für ältere Test-/Diagnose-Builder
  optional, werden vom produktiven Evaluator aber immer ausgegeben.

## Verifikation

Vor dem Fix waren genau die vier Ziele mit `behavior_regression` rot; alle
sechs Kontrollen waren grün. Nach dem Fix:

- Decision-Checkpoint-Datei: 10/10 grün.
- Fokussierte Matrix aus fünf Dateien: 135/135 Tests grün.
- Vollständige `@netgrid/ai`-Suite: 334/334 Testdateien und 2279/2279 Tests
  grün.
- `@netgrid/ai`-Typecheck grün.
- `check:ai` vollständig grün: kompilierte Hints, Derived Facts,
  Hint-Inspector-Index, manuelle Overlays und Action-Signal-Katalog jeweils
  ohne Fehler. Die ausgegebenen Warnungen entsprechen dem bestehenden
  nicht-blockierenden Backlog.
- `git diff --check` grün.

Führende Prozess- und Red-Evidence-Artefakte:

- `docs/architecture/ai/match-e8886-runner-remediation-process-2026-07-15.md`
- `docs/reviews/ai/match-e8886-runner-remediation-red-evidence-2026-07-15.md`
- `packages/ai/src/evaluation/decision-checkpoints/match-e8886-runner-decision-checkpoints.test.ts`
