# Corp-Rez-Payoff-Remediation – Final Review

## Match-Evidence

`match_27195c96204c4515`, Corp Decision 25, StateVersion 62: Bei 2 Credits
lehnte die Corp das kostenlose Rezzen von `Misleading Access Menus` ab. Der
sichtbare `Codecracker` neutralisierte die Stop-Subroutine, nicht aber den
garantierten Rez-Payoff von 3 Credits.

## Umsetzung

Die generische Effective-Defense-Bewertung liest nun einen sichtbaren
„Gain N when you rez“-Credit-Payoff. Ein vorhandener Payoff verhindert, dass
ein neutralisierter Stop-Effekt als vollständige Nullwirkung klassifiziert
wird. Die Änderung nutzt nur den Corp sichtbaren Kartentext und enthält keine
Kartennamen-Sonderregel.

## Checkpoint und Gegenprobe

- `corp-rez-payoff-menus` wurde mit striktem Warmup aus dem Match capturiert
  (`warmupDriftCount = 0`).
- Vor dem Fix: `behavior_regression`, Auswahl `corp.decline_rez`.
- Nach dem Fix: legale Auswahl `rez_ice`.
- Bestehende Effective-Defense-Tests bleiben als Gegenproben für ICE ohne
  wirtschaftlichen Rez-Payoff grün.

## Credit versus Draw

Die mehrfachen Basic-Credit-Entscheidungen des Matches sind kein bestätigter
zweiter Fehler. Insbesondere bei R&D-Druck kann ein Draw weitere Agenden
exponieren. Die Trace-Evidence reicht nicht aus, um den generischen
Credit-vs-Draw-Consumer sicher zu ändern; das bleibt ein separater Follow-up.

## Verifikation

- Checkpoint und `semantic-runtime-corp-effective-defense.test.ts`: grün.
- Deck-Hint-/Consumer-Audit: 16 eindeutige Corp-Karten, Status `ok`, keine
  blockierenden Findings.
- `@netgrid/ai typecheck`: aktuell blockiert durch drei vorbestehende
  TS18048-Fehler in `src/actions/run-access-decision-model.ts`.
