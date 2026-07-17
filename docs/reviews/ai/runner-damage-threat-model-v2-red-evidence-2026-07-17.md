# Runner Damage Threat Model v2: Red Evidence

Status: vor Modellumbau reproduziert

## Ausgangspunkt

Der aktuelle `runnerDamageThreatAssessment` liefert eine einzelne Gefahrenstufe
aus öffentlichen Damage-Ereignissen, sichtbaren Kartenhinweisen, Tags und
Handgröße. Sechs fokussierte Regressionen belegen, dass dieses skalare Modell
dauerhaftes Deckwissen und akute Gefahr nicht sauber trennt.

## Erwartete rote Zieltests

Datei: `packages/ai/src/runner-damage-threat-model-v2.test.ts`

1. Runner-Self-Damage darf weder Korp-Damage-Belief noch akute Korp-Gefahr
   erzeugen.
2. Ein vollständig verhinderter Korp-Damage-Versuch bleibt sichtbare
   Deck-Evidence, zählt aber nicht als tatsächlich erlittener aktueller
   Schaden.
3. Ein unprofiliertes generisches Trace-Ereignis ist allein kein
   Damage-Deck-Signal.
4. Unabhängig sichtbare Delivery- und Payoff-Hints bestätigen das Deck-Belief.
5. Bestätigtes Deckwissen bleibt bestehen, während die akute Gefahr nach sechs
   unbestätigten Turn-Serien auf `suspected` fällt.
6. Bei maximaler Handgröße zwei ist der dauerhafte Handfloor auf zwei begrenzt;
   ein voller Puffer erzeugt auf dem letzten Klick keinen falschen
   Handbuffer-Draw.

## Reproduzierter Red-Stand

Der direkte Vitest-Lauf liefert exakt sechs rote Tests. Die aktuelle flache
Struktur besitzt weder `deckBelief` noch `flatlineRisk`; zusätzlich zeigen die
alten Debug-Facts die fachlichen Fehlklassifikationen:

- Runner-Self-Damage bleibt als historisches Damage-Ereignis `suspected`.
- Ein generischer Trace erzeugt `trace_tag_event` und damit `suspected`.
- Turn-gleicher tatsächlicher Schaden liegt nach neun StateVersions bereits
  außerhalb des bisherigen Acht-StateVersion-Fensters.
- Das Modell kann Deck-Evidence nicht unabhängig von akuter Gefahr erhalten.
- Der Handfloor besitzt keinen ausdrücklichen effektiven Zielvertrag.

## Grüne Schutzproben vor dem Umbau

- `runner-damage-threat-assessment.test.ts`: 10/10 grün
- F5D-Decision-Checkpoints: 7/7 grün
- zusammen: 17/17 grün

Die vorhandene F5D-Korrektur für sichtbaren Access-Damage, marginale
Entwicklung und Reaktionsreserve ist damit als unveränderter Gegenvertrag
gesichert.

## Done-Gate

P3 darf erst abgeschlossen werden, wenn die sechs Zieltests ohne Abschwächung
grün sind und die 17 Schutzproben weiterhin bestehen.
