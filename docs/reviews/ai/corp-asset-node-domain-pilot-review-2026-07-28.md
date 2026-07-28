# Corp-Asset-/Node-Domainpilot

Stand: 2026-07-28

Scope: Corp-Karten der in P1 geprüften Pilotdecks. Der Review bewertet keine
allgemeine Freischaltung aller Assets und Nodes, sondern nur Familien mit
vollständigem, side-sicherem Runtime-Vertrag.

## Ergebnis

| Karte/Familie | Bestehender Owner | P5-Status | Begründung |
| --- | --- | --- | --- |
| BBS Whispering Campaign | `corp.economy` | Install, Rez und Auszahlung abgedeckt | Install/Rez bleiben beim bestehenden Campaign-Vertrag. Die Auszahlung wird nur aus der aktuellen LegalAction mit exaktem `gainCreditsAmount`, `hostedCreditTakeAmount` und `hostedCreditTakeMode` erzeugt. Hint-Beträge bestimmen weder Auszahlung noch Restpool. |
| Setup! | `corp.ambush_and_bluff` | bereits abgedeckt | Die vorhandene Ambush-Route besitzt Installziel, Kosten, Reserve und Abschluss. P5 fügt keinen zweiten Owner hinzu. |
| Vapor Ops | `corp.score_agenda` | bereits abgedeckt | Der vorhandene Counter-Bank-Vertrag bindet Install, Advancement, Zielremote und Übergabe an den Scoreplan. Eine generische Economy-Route bleibt ausgeschlossen. |
| Red Herrings | `corp.defend_servers` | Install und Rez abgedeckt | Install ist nur neben einer sichtbar bekannten Agenda im exakten bestehenden Remote zulässig. Kosten und bestehende Score-Reserve müssen erhalten bleiben. Rez ist nur auf demselben Fort und im letzten relevanten Runfenster produktiv. |
| Lesley Major | keiner | enger Follow-up | Der Hint beschreibt eine During-run-Counter-Familie, liefert der Plan-first-Runtime aber noch keinen vollständigen exakten Ziel-, Timing-, Counter- und Abschlussvertrag. Die Karte bleibt `unsupported_domain_contract` und fail-closed. |

## Sicherheitsgrenzen

- Alle ausgeführten Schritte stammen aus aktuellen LegalActions.
- BBS verwendet die tatsächlich angebotene Auszahlung. Der strategische Hint
  mit `amount: 2` und Poolgröße 16 ist nur Familienklassifikation und keine
  Effektquote.
- Red Herrings verwendet ausschließlich die strukturierten Felder
  `remoteRole`, `planRoles`, `functionSignals` und `effects`. Der redundante,
  nicht konsumierte Freitext unter `strategicNotes` wurde entfernt.
- Weder ein leeres Remote noch ein vorbereitetes Remote ohne sichtbar bekannte
  Agenda rechtfertigt Red Herrings.
- Ein Rez vor dem letzten relevanten Fenster oder unter Verletzung einer
  residenten Score-Reserve bleibt ohne ausführbare Defense-Route.
- Nach jeder BBS-Auszahlung, jedem Install und jedem Rez wird der neue State
  vollständig revalidiert. Es gibt keine unrevalidierte Asset-Makroaktion.

## Follow-up-Grenze

Lesley Major darf erst freigeschaltet werden, wenn die Rules Engine in der
LegalAction den exakten Countereinsatz, das betroffene Run-/Encounter-Ziel,
alle Kosten und die Abschlussbedingung side-sicher quotiert. Ein Kartenname-
Sonderfall oder ein pauschaler `play_any_asset`-Fallback ist ausdrücklich
keine zulässige Zwischenlösung.
