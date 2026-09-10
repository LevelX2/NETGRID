# KI-Programmlogik – Änderungskompass

Status: **verbindliches Agenten-Konzentrat**  
Stand: 2026-09-10

## Zweck und Quellen

Vor Änderungen an produktiver KI-Programmlogik diese Seite vollständig lesen.
Sie führt zur maßgeblichen Definition, ohne die Detailverträge zu duplizieren.
Bei Dokumentations- oder Formatkorrekturen gilt die begrenzte Prüfung aus
[packages/ai/AGENTS.md](../../../packages/ai/AGENTS.md).

- [Zielbild](target-architecture.md): Haltung, Schichten und Autoritätsgrenzen.
- [Planvertrag](planning-architecture.md): reale Modul-API, Lifecycle,
  Parent-/Need-Bindung und aktuelle Ausführung.
- [Zug-/Kampagnenvertrag](turn-campaign-planner.md): Suche, Ressourcenprojektion,
  Commitment, Revalidierung und Kampagnenwert.
- [Ownerkarte](README.md#planowner-und-implementierungen): fachliche Zuständigkeit,
  Code und Runner-/Corp-Detailverträge.

## Haltung

Engine-Korrektheit zuerst. Nur Pläne handeln; Doctrine, Hints, Sensoren und
Quotes beraten. Bestehende Owner werden erweitert. Fachwissen entsteht an
der engsten wiederverwendbaren Stelle, keine globale Kartenliste ersetzt
Funktionssemantik. Zugkohärenz und erhaltene Bindungen gehen vor einem
isolierten Action-Wert. Unknown bleibt sichtbar; fehlende aktuelle Fakten
oder Bindungen werden ursachenorientiert behoben und nicht durch Ersatzwerte
oder einen nachgelagerten Chooser verdeckt.

## Pflichtfragen vor dem ersten Verhaltenspatch

1. Welche fachliche Entscheidung soll sich konkret ändern?
2. Welcher registrierte Plan besitzt sie, und wo entstehen seine Fakten?
3. Liegt der Fehler bei Fact/Quote, Planwahl, planinterner Route,
   Zuglinienbewertung, Engine-Fortsetzung oder Choice-Payload?
4. Welche Planinstanz, welcher Step, welche Route und welcher
   `PlanExecutionOrigin` müssen erhalten bleiben?
5. Welche aktuelle LegalAction und `stateVersion` autorisieren die Ausführung?
6. Ist die Information side-sicher und die Regel-/Kostenbehauptung Engine-gequotet?
7. Wo endet belastbare Projektion an neuer Information oder Reaktion?
8. Welche Parent-/Need-/Supportbindung verhindert Doppelzählung und Zielverlust?
9. Welche zusätzliche Entscheidungsautorität würde eine lokale Abkürzung erzeugen?
10. Welcher Test beweist Ergebnis, Ownership und den relevanten Gegenfall?

Fehlt eine entscheidungsrelevante Antwort, zuerst den Vertrag oder den
erzeugenden Pfad klären; noch keinen Verhaltenspatch vornehmen.

## Schichtzuordnung

| Änderungsbedarf                                     | Zuständige Definition                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Regel, Legalität, Kosten, zustandsabhängige Wirkung | Engine / vollständige Engine-Quote; [Controllergrenze](controller-contract.md)           |
| Wiederverwendbare Kartenfunktion                    | [Hintquelle und Action-Semantik](hint-architecture.md)                                   |
| Deckweite Tendenz und Rollenkomposition             | [Strategiereferenz](strategy-signals-guide.md)                                           |
| Ziel, Quelle, Server, Ressource, Sequenz            | [zuständiger Owner](README.md#planowner-und-implementierungen)                           |
| Vergleich kohärenter Restzuglinien                  | [TurnPlanner](turn-campaign-planner.md)                                                  |
| Payload einer gewählten Action                      | [gebundene Ausführung](planning-architecture.md); keine erneute Ziel- oder Strategiewahl |
| Darstellung und Erklärung                           | [Trace-Vertrag](decision-trace-contract.md); keine Bewertungswirkung                     |

Vor einer Kerneländerung die Aufnahmebedingungen im Planvertrag prüfen.
Domainregeln bleiben bei ihrem Owner. Insbesondere besitzt Defense globale
ICE-Allokation und freiwillige Install-/Rezentscheidungen; Score, Economy und
Handmanagement liefern ihre exakt gebundenen Bedarfe. Die Details stehen im
[Corp-Vertrag](corp-plan-contracts.md), Access-/Rig-/Run-Grenzen im
[Runner-Vertrag](runner-plan-contracts.md).

## Pflichtnachweis und Pflege

- Realistischer `PlayerView` und echte oder exakt nachgebildete LegalActions.
- Plan, Step, Route, Executor sowie Parent-/Need-Bindung belegt.
- Aktuelle Action-/Choice-/Target-/StateVersion-Bindung belegt.
- Keine zweite Entscheidungsautorität und kein Hidden-Info-Leak.
- Passender Known-/Unknown-, Boundary- oder anderer Gegenfall geprüft.
- Zunächst kleinster belastbarer Regressionstest; weitere Gates nach
  [AI-Testvertrag](../../../packages/ai/AGENTS.md), breite Shards erst bei
  breiter Wirkung, Integrationscheckpoint oder ausdrücklichem Auftrag.
- Betroffene Definition und Verweise nach dem
  [Pflegevertrag](README.md#pflegevertrag) aktualisieren.

## No-Go-Muster

- Freie Action-Auswahl nach der Planentscheidung oder im Choice-Resolver.
- Karten-ID als globale Strategieheuristik statt Funktions- und Quellenbindung.
- Unknown als null, sicherer Effekt oder Beweis der Routenausschöpfung.
- Diagnosezeichenfolgen als Ersatz für entscheidungswirksame typisierte Fakten.
- Zukünftige Action-IDs hinter einer Informationsgrenze festschreiben.
- Fehlende Coverage mit First-LegalAction, stillen Fallbacks oder Ersatzbudget kaschieren.
- Nur die gewählte Action testen und ihre Ownership offenlassen.
