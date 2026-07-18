# Access Runtime Architecture

Status: Current State seit E12 des Engine Architecture Refresh 2026-07-18

## Zweck

Die Access-Domäne trennt Breach-Navigation, Hidden-Info-Freigabe, die
eigentliche Steal-/Trash-/Install-Auflösung und kartenspezifische Access-Effekte.
Die Aufteilung ist verhaltensneutral und bewahrt die Rules Engine als einzige
Regelautorität.

## Module

| Modul                          | Verantwortung                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `breach-state.ts`              | Deterministischer Queue-Aufbau und Zugriffszählung für Central-, Remote- und Archives-Breaches |
| `access-flow.ts`               | Kleine öffentliche Fassade für Runtime und Tests                                               |
| `access-flow-context.ts`       | Typisierter Host, aktive Run-/Breach-Typen und sichtbarkeitskritische gemeinsame Hilfen        |
| `access-breach-lifecycle.ts`   | Aktuelle Karte wählen, Breach fortschreiben, Archives-Autozugriffe und Access abschließen      |
| `access-resolution-actions.ts` | LegalAction-Dispatch sowie Steal-, Trash-, Agenda-Install- und Decline-Auflösung               |
| `access-actions.ts`            | Erzeugung und Kostenberechnung legaler Access-Aktionen                                         |
| `access-effect-context.ts`     | Host- und Ergebnisverträge kartenspezifischer Access-Effekte                                   |
| `access-effect-execution.ts`   | Deklarative CardImplementation-Bedingungen, Schritte, Choices und Kosten                       |
| `access-effect-legacy.ts`      | Explizit begrenzte Fallbacks für noch nicht deklarativ migrierte Karten                        |
| `access-effect-handlers.ts`    | Öffentliche Effekt-Fassade und Resume-Choice-Orchestrierung                                    |

## Abhängigkeitsrichtung

```text
access-flow-context ---> access-breach-lifecycle ---> access-resolution-actions
          ^                       ^                           |
          |                       |                           v
      breach-state          access-actions               access-flow

access-effect-context ---> access-effect-execution ---> access-effect-legacy
          ^                         ^                         |
          |                         |                         v
          +-------------------------+------------- access-effect-handlers
```

Produktive Consumer importieren weiterhin die beiden Fassaden
`access-flow.ts` und `access-effect-handlers.ts`. Die Unterdomänen sind ein
azyklischer interner Implementierungsschnitt.

## Nicht offensichtliche Verträge

- Die Breach-Queue darf verdeckte Karten intern referenzieren, aber weder ihre
  Identität noch ihre Zone vorzeitig in öffentliche Payloads oder Views tragen.
- `revealAccessedCard` ist der einzige gemeinsame Übergang, der die konkret
  zugegriffene Karte aufdeckt. Queue-Aufbau und Navigation bleiben davor
  side-sicher.
- HQ-Auswahl bleibt Seed-/RandomCounter-gesteuert; die Modultrennung erzeugt
  keinen zusätzlichen Zufallszug und verändert keine Zieh-Reihenfolge.
- Steal-, Trash- und Install-Aktionen revalidieren Zustand, Kosten und Choices
  bei der Ausführung. LegalActions sind keine Autorisierung durch Vertrauen in
  den Client.
- CardImplementation-Effekte und Legacy-Fallbacks sind gegenseitig exklusiv.
  Dadurch wird derselbe Karteneffekt nicht doppelt ausgeführt.
- Archives-Autozugriffe verwenden dieselbe Queue und denselben Abschluss wie
  interaktive Zugriffe; nur Karten ohne Entscheidung oder Effekt werden
  automatisch übersprungen.

## Ausführbare Strukturgrenzen

`scripts/check-engine-source-structure.mjs` verlangt die acht neu geschnittenen
Access-Module und setzt pro Verantwortung ein Zeilenlimit. Die vorhandenen
Access-, Breach-, Archives-, Hidden-Info-, Replay- und vollständigen
Engine-Tests schützen die Verhaltensparität.
