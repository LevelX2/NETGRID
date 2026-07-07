# Runner-KI Plancontroller Evidence 2026-07-07

## Match

- Match: `match_c1057cdd40d936ed`
- Modus: `human_corp_vs_runner_ai`
- KI-Seite: Runner
- Abschluss: 2026-07-07T21:16:54.326Z
- Winner: Corp
- Endgrund: `agenda_points`
- StateVersion: 292
- AI-Traces: 158
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

## Relevante Befunde

### Remote Contest wird nicht als Plan abgearbeitet

StateVersion 78 bis 86 zeigt einen Remote-Run auf `remote_1` trotz `RunTargetEvaluation`-Hinweis `gain_credits_first`. Nach Keeper bleiben nur 2 Credits; bei Razorwire ist der Pile-Driver-Break für 3 Credits nicht legal. Der direkte Fehler ist also nicht fehlendes Breaken, sondern Runstart beziehungsweise Weiterlaufen ohne Reserve-Plan.

Erwartung: `runner.contest_remote:remote_1` bleibt aktiv, aber `currentStep` wird `gain_credits`, wenn die sichtbare Route noch nicht mit Reserve bezahlbar ist.

### Coverage Search verdrängt vollständiges Rig und Remote-Druck

StateVersion 222 aus dem Nutzerexport zeigt `The Short Circuit` mit `coverage_search` und Score 1427, während `remote_1` eine advanced Root-Karte hat. Zu diesem Zeitpunkt liegen mehrere Breaker installiert; `Short Circuit` ist off-plan, solange kein konkreter fehlender Coverage-Blocker existiert.

Erwartung: Coverage Search ist nur plan-kompatibel, wenn der aktive Plan `runner.obtain_breaker_coverage` oder `runner.develop_hand_card` mit konkretem Such-/Installationsbedarf ist.

### Draw/Discard statt Planfortschritt

StateVersion 108 bis 124 zeigt wiederholtes Ziehen bis zum Discard, obwohl Runner bereits wichtige Rig-Komponenten hat und Geld/Planfortschritt braucht.

Erwartung: Draw ist kein eigener Hauptplan. Draw bleibt nur erlaubt, wenn `restore_hand_buffer`, konkrete Antwortsuche oder Setup-Plan aktiv ist und der Overflow-Check den Schritt nicht blockiert.

### Deckstrategie muss Planinstanzen gewichten

Die Runner-Strategieprojektion existiert bereits als `RunnerStrategicIntent`. Bisher wirkt sie vor allem als Score-/Goal-Signal. Sie muss in der Planebene Remote-, R&D- oder HQ-Planinstanzen priorisieren, ohne akute Score-Threats oder Funding-Blocker zu verdrängen.

Erwartung: Deckstrategie wird als Planprioritätskomponente dokumentiert und getestet.

## Nicht in diesem Paket

Security Purge trasht im aktuellen Projektvertrag faceup nach Archives. Das ist nach aktueller Dokumentation kein UI-only-Bug, sondern eine Regel-/Engine-Vertragsfrage. Eine Umstellung auf facedown gehört in ein separates Engine-/Regelpaket.
