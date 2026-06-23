# Engine CardImplementation Architecture Process 2026-06-23

Status: completed

## Quelle/Vorgabe

Nutzerauftrag vom 2026-06-23: Regelengine, CardImplementation und Regelausführung möglichst umfassend in Richtung deklarativer, wiederverwendbarer CardImplementation-Bausteine restrukturieren. `packages/ai` ist nicht Ziel.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung. Scope, Nicht-Ziele, Kernbereiche, Leitplanken und Mindestchecks sind genannt. Kleine Lücken werden konservativ behandelt: Verhaltensgleichheit hat Vorrang vor großem Umbenennen; vollständige Monolithenauflösung darf in belastbaren vertikalen Slices erfolgen.

## Gesamtziel

CardImplementation-Dateien bleiben kartennah und deklarativ. Runtime-Ausführung, Effect-Interpreter, Mechanics und Registry bewegen sich weg von kartennamenspezifischen Runtime-Zweigen und hin zu funktional benannten, typisierten und wiederverwendbaren Bausteinen.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Arbeitsbranch: `codex/engine-card-architecture`.
- Worktree: `C:\Projekte\NETGRID_engine_card_architecture`.
- Der Nutzer hat direkte Umsetzung verlangt; es wird kein Prompt-only-Artefakt ausgegeben.
- Wegen der Vorgabe "keine git-status- oder git-diff-Prüfungen" werden diese Befehle nicht verwendet. Staging erfolgt nur über explizit bearbeitete Pfade.

## Nicht-Ziele

- Keine KI-Spieler-Logik in die Engine verschieben.
- Keine neuen Kartenfreigaben.
- Keine neuen LegalActions, außer ein Test erzwingt eine fachlich notwendige Korrektur.
- Keine Hidden-Info-Grenzen aufweichen.
- Keine großen Prozessdokumente statt Codeverbesserung.

## Controller-Invarianten

- Engine-Korrektheit und Hidden-Info-Schutz gehen vor Strukturästhetik.
- `LegalActions` bleiben die einzige Quelle für spielbare Aktionen.
- Runtime-Kinds, Payload-Keys, State-Felder und Resolver werden nach Funktion benannt, wenn die Funktion generisch modellierbar ist.
- Registry bleibt Katalog, keine Ausführung.
- Effect-Interpreter bleibt Orchestrator; neue Effektlogik gehört in fokussierte Effektfamilien.

## Automatische Fehlerbehandlung

- Bei roten Checks: Ursache eng debuggen und im aktiven Paket beheben.
- Bei Scope-Ausweitung: als Follow-up dokumentieren, nicht still in das Paket ziehen.
- Bei fachlichem Konflikt zwischen bestehendem Verhalten und Zielarchitektur: Verhalten erhalten, Restpunkt dokumentieren.

## Sicherheitsblocker

Stoppen ohne Rückfrage bei:

- potenzieller Offenlegung verdeckter Karten in PublicEvents, PlayerViews, Reconnect, Replay oder Tests;
- LegalAction-Erzeugung außerhalb Engine-Pfaden;
- erforderlicher KI-Semantikänderung als Nebenfolge;
- unklarem Regelvertrag, der nicht aus bestehenden Tests/Implementierungen ableitbar ist.

## State Machine

`process_created -> package_active -> package_verified -> package_committed -> next_package | final_verify -> merge_main -> complete`

## Paketfolge

1. `ENG-CARD-0` Prozessartefakt und Hotspot-Inventar.
2. `ENG-CARD-1` Effect-Interpreter in erste Effektfamilien schneiden.
3. `ENG-CARD-2` funktionale Kinds/Resolver für bekannte Kartennamen neutralisieren.
4. `ENG-CARD-3` Mechanics-ID-Sets schrittweise aus CardImplementation-Profilen ableiten oder bewusst kommentieren.
5. `ENG-CARD-4` RuntimeDeps/Host-Grenze in einem vertikalen Slice typisieren und kommentieren.
6. `ENG-CARD-5` Registry als Katalog entlasten.
7. `ENG-CARD-6` Finaler Reviewbericht, Checks, lokaler Merge nach `main`.

## Paketdetails

### ENG-CARD-0 Prozessartefakt und Hotspot-Inventar

Ziel: Prozess festlegen, aktuelle Reststellen priorisieren.

Kernartefakte: dieses Dokument.

Checks: Lesbarkeit und Scope-Abgleich.

Done-Gate: Paketfolge ist eindeutig, Sicherheitsgrenzen sind dokumentiert.

Commit: `docs(engine): define card implementation architecture process`

### ENG-CARD-1 Effect-Interpreter-Familien

Ziel: `effect-interpreter.ts` in erste fokussierte Effektfamilien zerlegen, ohne Effekt-Reihenfolge, Payload-Merge oder `ResolvedEffects` zu ändern.

Konkrete Arbeit: klare Familien wie Credits, Draw, Tags, Damage, Counters/Hosted Credits extrahieren; Dispatcher-Kommentar ergänzen.

Checks: `corepack pnpm --filter @netgrid/engine typecheck`, fokussierte Engine-Tests falls verfügbar.

Commit: `refactor(engine): split common card effect families`

### ENG-CARD-2 Funktionale Kinds und Resolver

Ziel: echte Reststellen aus dem Card-Function-Abstraction-Review neutralisieren.

Konkrete Arbeit: mindestens Silver Lining, Omniscience Foundation, Fortress Respecification, Social Engineering, New Blood und Shell Traders auf funktional benannte Kinds/Hidden-Zone-Actions/Resolvernamen umstellen, soweit kompatibel.

Checks: `corepack pnpm check:card-function-abstraction`, fokussierte Tests für betroffene Karten.

Commit: `refactor(engine): replace card-named runtime kinds`

### ENG-CARD-3 Mechanics-ID-Sets

Ziel: verhaltenssteuernde Mechanics-Sets dort aus CardImplementation-Profilen ableiten, wo bereits Profile existieren.

Konkrete Arbeit: kleine Ableitungshelfer aus Registry/CardImplementation-Definitionen; bewusst verbleibende ID-Sets knapp kommentieren.

Checks: Engine typecheck/test, betroffene Mechanics-Tests.

Commit: `refactor(engine): derive mechanic sets from card profiles`

### ENG-CARD-4 RuntimeDeps-Typschnitt

Ziel: einen belastbaren vertikalen Slice von `RuntimeDeps` enger typisieren und `any`-Verteiler reduzieren.

Konkrete Arbeit: bevorzugt HiddenZone- oder Effect/State-bezogener Host-Slice; keine vollständige Bootstrap-Umschreibung erzwingen.

Checks: Engine typecheck/test.

Commit: `refactor(engine): tighten runtime deps boundary`

### ENG-CARD-5 Registry-Katalogstruktur

Ziel: `registry.ts` entlasten, ohne Ausführungslogik einzubauen.

Konkrete Arbeit: Subregistries nach vorhandener Dateistruktur oder anderes repo-nahes Katalogmuster; Imports bleiben rein deklarativ.

Checks: Registry-/Coverage-Tests, Engine typecheck.

Commit: `refactor(engine): split card implementation registry catalog`

### ENG-CARD-6 Abschluss

Ziel: Reviewbericht schreiben, Mindestchecks ausführen, lokal nach `main` mergen.

Checks: mindestens `corepack pnpm --filter @netgrid/engine typecheck`, `corepack pnpm --filter @netgrid/engine test`, `corepack pnpm check:card-function-abstraction`; zusätzliche Checks bei Shared- oder AI-Berührung.

Commit: `docs(engine): review card implementation architecture refactor`

## Verifikationsregeln

- Nach jedem Paket passende fokussierte Checks.
- Vor Abschluss vollständige Mindestchecks.
- Kein `git status`, kein `git diff`.
- Kein Push, kein PR.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_engine_card_architecture`.
- Je Paket ein Commit auf `codex/engine-card-architecture`.
- Hauptworkspace nur für finalen lokalen Merge nach `main`.
- Dateien werden explizit nach Paket ges staged.
- Konflikte werden defensiv gelöst, beide fachlichen Intentionen bleiben erhalten, soweit kompatibel.

## Controller-Prompt-Kern

Arbeite `ENG-CARD-0` bis `ENG-CARD-6` sequenziell ab. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Bei Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Nach Abschluss final prüfen, lokal nach `main` mergen und erst dann das Goal als complete markieren.

## Abschlusskriterien

- Strukturverbesserungen sind lauffähig implementiert.
- Restliche kartennamenspezifische Runtime-Stellen sind reduziert oder begründet offen.
- Checks sind ausgeführt und dokumentiert.
- Reviewbericht liegt unter `docs/reviews/engine/`.
- Arbeitsbranch ist lokal nach `main` integriert.
