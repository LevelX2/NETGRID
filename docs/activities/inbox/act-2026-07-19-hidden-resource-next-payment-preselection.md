---
activityId: act-2026-07-19-hidden-resource-next-payment-preselection
status: inbox
kind: concept
area: web
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-07-19
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-07-19-hidden-bank-continuation-central-action
resultArtifacts: []
checks: []
---

# Hidden Resource für die nächste passende Zahlung vormerken

## Ziel

Prüfen und konkretisieren, ob der Runner eine Hidden-Resource-Fähigkeit direkt
an der Karte als Absicht für die nächste regeltechnisch passende Kosten- oder
Penalty-Zahlung vormerken kann. Die Vorwahl soll Pump-, Break- und andere
Zahlungen beschleunigen, ohne das autoritative Payment-Support-Fenster oder die
Engine-Revalidierung zu ersetzen.

## Kontext und Quellen

- Nutzeridee vom 2026-07-19: An der Hidden Resource ein kleines Häkchen setzen;
  beim nächsten Pumpen, Brechen oder einer anderen passenden Zahlung soll die
  Anwendung wissen, dass diese Resource mit aufgelöst werden soll.
- Bezug zum offenen Sichtbarkeits-Hotfix
  `docs/activities/inbox/act-2026-07-19-hidden-bank-continuation-central-action.md`.
- Der bestehende Engine-Vertrag bietet Hidden-Bank-Fähigkeiten erst in einem
  gebundenen `runner_cost_penalty_support`-Fenster als `LegalActions` an und
  revalidiert anschließend die ursprüngliche Zahlung.
- `Swiss Bank Account` zeigt, dass eine pauschale Kartenvorwahl nicht immer
  eindeutig ist: Die Karte besitzt mehrere Zahlungsfähigkeiten mit
  unterschiedlichen Kosten und Gewinnen.

## Scope

- UX und Zustandsvertrag für `Für die nächste passende Zahlung vormerken`
  beschreiben.
- Entscheiden, ob die Vorwahl ausschließlich lokaler, privater UI-Zustand sein
  kann oder für Reconnect/Mehrgerätebetrieb als private Engine-Absicht modelliert
  werden muss.
- Bei Karten mit mehreren passenden Fähigkeiten die konkrete Fähigkeit statt
  nur der Karte auswählbar machen.
- Festlegen, wann eine Vormerkung verbraucht oder gelöscht wird: erfolgreiche
  Nutzung, bewusstes Fortsetzen ohne Support, nicht mehr legale Quelle,
  Kartenverlust, Zug-/Run-Ende, Abbruch, Reconnect und Undo.
- Einen sicheren Automationsablauf definieren: Die Vorwahl darf erst ausgeführt
  werden, nachdem die Engine im echten Zahlungsfenster die identische
  Support-`LegalAction` angeboten hat.
- Das zentrale Zahlungsfenster als sichtbaren Fallback für ungültige,
  mehrdeutige oder nicht automatisch auflösbare Vorwahlen erhalten.

## Nicht im Scope

- Keine unmittelbare Codeumsetzung in diesem Konzeptpaket.
- Kein Vorab-Reveal, Tap, Trashen oder Bezahlen beim Setzen des Häkchens.
- Keine PlayerAction, die nicht aus einer aktuellen Engine-`LegalAction`
  abgeleitet ist.
- Keine pauschale automatische Wahl einer Fähigkeit bei mehreren Optionen.
- Kein Ersatz des offenen Hotfixes für die zentral sichtbare
  Fortsetzungsentscheidung.
- Keine öffentliche Anzeige der Vormerkung für die Korp und kein Leak der
  verdeckten Kartenidentität.

## Akzeptanzkriterien

- [ ] Das Konzept trennt klar zwischen unverbindlicher Vorwahl und tatsächlicher
  regelwirksamer Aktivierung im Payment-Support-Fenster.
- [ ] Für `Chiba Bank Account` ist ein eindeutiger Ablauf vom Vormerken über eine
  Pump-/Break-Zahlung bis zur validierten Aktivierung beschrieben.
- [ ] Für `Swiss Bank Account` ist die Auswahl zwischen den verschiedenen
  Fähigkeiten eindeutig gelöst.
- [ ] Ist die vorgemerkte Fähigkeit beim nächsten Zahlungsfenster nicht legal,
  wird sie nicht ausgeführt; der Runner erhält stattdessen das normale zentrale
  Entscheidungsfenster mit verständlichem Hinweis.
- [ ] Reconnect-, Undo-, StateVersion-, Replay-, StateHash- und
  Hidden-Info-Auswirkungen sind bewertet.
- [ ] Das Konzept entscheidet explizit, ob nach positiver Bewertung ein kleines
  Umsetzungs-Folgepaket für Engine/Web und passende Tests angelegt wird.

## Umsetzungshinweise

- Bevorzugte Ausgangshypothese: Die Vormerkung ist privater UI-Zustand und
  löst niemals selbst Spielzustand aus. Sobald die Engine das echte
  Support-Fenster publiziert, darf der Client nur eine exakt passende aktuelle
  LegalAction automatisch einreichen; bei jeder Abweichung fällt er auf die
  sichtbare manuelle Entscheidung zurück.
- Eine stille automatische Kette aus Support-Aktivierung und Fortsetzung ist
  nur dann vertretbar, wenn beide Schritte einzeln als aktuelle LegalActions
  bestätigt, geloggt und gegen Doppelübermittlung geschützt bleiben. Sonst nach
  der vorgemerkten Support-Aktivierung die Fortsetzung weiterhin sichtbar
  bestätigen lassen.
- UI-seitig eher eine kleine Fähigkeitenauswahl mit aktivem Marker verwenden als
  ein einziges unspezifisches Karten-Häkchen.

## Ergebnisnotiz

Noch offen.
