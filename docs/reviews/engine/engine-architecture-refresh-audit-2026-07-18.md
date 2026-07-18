# Engine Architecture Refresh Audit 2026-07-18

Status: implementation baseline
Primary agent: `architecture-review-agent`

## Ergebnis

Die frühere Aufteilung des `index.ts`-Monolithen war erfolgreich und hat die
öffentliche Engine-API deutlich verbessert. Nachfolgende Karten-, Classic- und
Regelarbeiten haben die Komplexität jedoch teilweise in
`game/engine-runtime-internal`, große Domänenresolver und versionierte
Payload-Kompatibilität verlagert. Die Engine ist fachlich breit getestet, aber
das Architekturziel ist aktuell nicht vollständig grün.

## Verifizierter Ausgangsstand

- `packages/engine/src/index.ts`: 91 Zeilen, expliziter Facade.
- Produktive Engine-Abhängigkeit: nur `@netgrid/shared`.
- `engine-runtime-internal`: 57 produktive Dateien, rund 48.700 Zeilen und
  rund 3.744 interne Importkanten.
- 914 produktive TypeScript-`any`-Typknoten; 860 davon in fünf
  Runtime-Delegate-Dateien.
- Zwei erkannte relative Importzyklen: Runtime-Komposition und Run-Window.
- `publicContextForAction`: rund 2.192 Zeilen und mehr als 500 Verzweigungen.
- `definition-types.ts`: 2.635 Zeilen, 144 Type Aliases und 31 Union-Typen.
- Engine-Typecheck: grün.
- Package-Boundary-Check: grün.
- Vollständige Engine-Suite: 1.731/1.732 Tests grün.
- Roter Test: `turn-runtime-resolvers.ts` überschreitet mit 3.280 Zeilen das
  bestehende 3.200-Zeilen-Limit.
- Architekturziel-Check: 41 produktive kartenspezifische Namen.
- Card-Function-Abstraction-Guard: Inventardrift.

## Findings hoch

1. Die aktuell roten Architektur-Gates belegen eine reale Strukturregression.
2. Runtime-Bootstraps, Hostdateien und dynamische Delegates bilden einen
   verteilten Monolithen mit sehr breitem Fan-out.
3. Der Typecheck wird an der zentralen Routinggrenze durch
   `(...args: any[]): any` und dynamische Funktionsnamen umgangen.
4. Versionierte PublicPayload- und Kompatibilitätsfelder bilden neben
   `ResolvedGameEffect` einen zweiten, schwer wartbaren Vertrag.

## Findings mittel

1. Classic hat fehlende generische Run-, Access-, Payment- und
   Hidden-Zone-Fähigkeiten sichtbar gemacht. Das volle Classic-Paket erhöhte
   besonders `game/run`, Runtime Internal, Access und Ability Engine.
2. Die Silent-Impact-Erweiterung blieb demgegenüber weitgehend sauber in
   CardImplementations, Ability-Verträgen und Tests.
3. `definition-types.ts`, Turn, Damage, Access und Run sind neue
   Komplexitätsschwerpunkte.
4. Ability Engine und konkrete CardImplementation-Registry sind bidirektional
   gekoppelt.
5. Nummerierte Registrygruppen und große Sammeltests erschweren Navigation und
   parallele Wartung.
6. Kritische Runtime- und Hidden-Info-Grenzen sind nur punktuell durch
   Quellverträge kommentiert.

## Erhaltene Stärken

- Engine bleibt UI-, Netzwerk-, Datenbank- und KI-unabhängig.
- `applyAction` revalidiert weiterhin Match, Seite, StateVersion, Action und
  Choice.
- State-Validierung, GameEvent, StateHash und Replay-Verträge sind vorhanden.
- Classic und Proteus besitzen vollständige Registry-/Manifest-Parität.
- CardImplementations sind pro Karte getrennt.
- Fokussierte Effektfamilien bilden eine tragfähige Refactoring-Basis.

## Zielmetriken

- Alle bestehenden Architekturchecks grün; keine Baseline-Abnahme echter
  Regressionen.
- Keine produktiven `any`-Delegate-Signaturen und kein dynamischer
  Delegate-Store.
- Keine produktiven relativen Importzyklen.
- Kein dreistelliger Fan-out außerhalb eines begründeten, kleinen Composition
  Root.
- PublicContext als kleiner Dispatcher über typisierte Projektoren.
- Ability-Verträge nach Fachfamilien statt in einer einzelnen 2.600-Zeilen-
  Datei.
- Set-/Side-/Type-Registry statt nummerierter Kartenblöcke.
- Große Tests entlang stabiler Mechanikfamilien geteilt.

## Umsetzung

Die verbindliche Paketfolge, State Machine, Checks und Integrationsregeln stehen
in `docs/architecture/engine/engine-architecture-refresh-process-2026-07-18.md`.
