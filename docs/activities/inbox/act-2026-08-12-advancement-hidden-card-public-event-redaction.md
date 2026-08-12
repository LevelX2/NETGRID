---
activityId: act-2026-08-12-advancement-hidden-card-public-event-redaction
status: inbox
kind: fix
area: engine
priority: hotfix
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-12
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Advancement-Effekte dürfen verdeckte Corp-Karten nicht offenlegen

## Ziel

Öffentliche Events und die daraus erzeugte Spielchronik nennen bei
Advancement-Effekten nur öffentlich bekannte Karten. Wird ein Counter auf eine
verdeckte Corp-Karte gelegt oder von beziehungsweise zu ihr bewegt, bleiben
Definition, Titel und interne Karten-ID verborgen; Counterzahl, Zielanzahl und
eine zulässige öffentliche Positionsangabe bleiben weiterhin nachvollziehbar.

## Kontext und Quellen

- Nutzerfund vom 2026-08-12 im Spiel `match_3db1fd17f4af938b`:
  **Systematic Layoffs** legte zwei Advancement-Counter auf eine verdeckte
  Karte. Die Chronik verriet das Ziel trotzdem als **Project Babylon**.
- Der Fehler entsteht bereits vor der Darstellung: Der gemeinsame
  Verteilungs-Resolver in
  `packages/engine/src/game/engine-runtime-internal/turn-corp-runtime.ts`
  schreibt `targetCardDefinitionId`, `targetCardDefinitionIds`,
  `targetCardId` und eine instanzbezogene Verteilung ohne
  Sichtbarkeitsprüfung in den aufgelösten Action-Payload.
- `packages/engine/src/public-context.ts` übernimmt diese Zielangaben in den
  öffentlichen Kontext. `apps/web/app/chronicle.ts` löst die Definitions-IDs
  anschließend zu Kartentiteln auf. Eine reine UI-Maskierung wäre deshalb
  kein ausreichender Ursachen-Fix.
- Der gesonderte Verschiebe-Resolver schreibt Quell- und Zieldefinition
  ebenfalls ohne individuelle Sichtbarkeitsprüfung in den Payload.
- **Lesley Major** verwendet in
  `packages/engine/src/game/run/fort-pass-window.ts` einen eigenen Pfad und
  veröffentlicht derzeit ebenfalls `targetCardDefinitionId` für eine
  potenziell verdeckte Karte im Fort.
- Der normale Basiszug `advance_card` ist ein wichtiger Kontrollfall: Seine
  öffentliche Chronik ist bereits als verdeckte installierte Karte ausgelegt
  und darf durch die Korrektur nicht verschlechtert werden.

## Scope

- Die öffentliche Projektion für das Legen und Verschieben von
  Advancement-Countern an der erzeugenden Engine-/Event-Schicht
  sichtbarkeitsabhängig machen.
- Die fünf Karten am gemeinsamen Verteilungspfad prüfen und absichern:
  **Management Shake-Up**, **Project Consultants**, **Systematic Layoffs**,
  **Team Restructuring** und **Chicago Branch**.
- Den gemeinsamen Verschiebepfad mit **Falsified-Transactions Expert** und
  **Vapor Ops** prüfen. Quell- und Zielkarte sind dabei unabhängig voneinander
  zu redigieren; insbesondere darf eine öffentliche Quelle kein verdecktes
  Ziel offenlegen.
- Den separaten Fort-Pass-Pfad von **Lesley Major** gleichwertig absichern.
- Noch vorhandene ältere beziehungsweise alternative Advancement-Resolver
  (`resolveCorpOperationAddAdvancementCounters` und
  `applyAdvancementCounterPlacement`) auf denselben Vertrag bringen oder, wenn
  sie nachweislich nicht mehr zuständig sind, ohne parallele
  Projektionsautorität bereinigen.
- PublicEvent, Runner-PlayerView, WebSocket-/Reconnect-Projektion,
  öffentliche Replays und Chronik gegen dieselbe Hidden-Info-Invariante
  prüfen.
- Den normalen `advance_card`-Pfad als positiven Redaktions-Kontrollfall
  beibehalten.

## Nicht im Scope

- Änderungen an Kartentext, Kosten, Ziellegalität, Counterregeln oder
  KI-Zielauswahl.
- Ein allgemeines Redesign der Spielchronik.
- Das Verbergen öffentlicher Informationen: Quelle, Counterzahl, Zielanzahl
  und zulässige öffentliche Server-/Positionsangaben sollen sichtbar bleiben.
- Datenmigrationen oder Reparaturen historischer lokaler Replays.

## Akzeptanzkriterien

- [ ] Legt **Systematic Layoffs** Counter auf eine verdeckte Corp-Karte,
  enthalten PublicEvent und öffentliche Folgeflächen weder deren
  `CardDefinitionId` beziehungsweise Titel noch eine interne oder
  rückverfolgbare Karteninstanz-ID.
- [ ] Die Chronik beschreibt ein verdecktes Einzel- oder Mehrfachziel
  verständlich, ohne seine Identität zu verraten; Counterzahl und Zielanzahl
  stimmen weiterhin.
- [ ] Bei vollständig öffentlich bekannten beziehungsweise aufgedeckten
  Zielkarten dürfen deren Titel weiterhin erscheinen.
- [ ] Gemischte Mehrfachziele werden pro Ziel sichtbarkeitskonform projiziert:
  öffentliche Ziele dürfen benannt, verdeckte Ziele nur neutral oder über
  eine bereits öffentliche Position beschrieben werden.
- [ ] Die gemeinsamen Verteilungs- und Verschiebepfade sind mit fokussierten
  Regressionstests abgedeckt; die oben aufgeführten Karten sind entweder
  direkt getestet oder nachweislich über denselben abgesicherten Pfad
  erfasst.
- [ ] **Lesley Major** besitzt einen eigenen Regressionstest mit verdecktem
  Ziel; ihr öffentliches Event nennt die rezzte Quelle, aber nicht die
  verdeckte Zielkarte.
- [ ] Runner-PlayerView, PublicEvent, WebSocket-/Reconnect-Payload und
  öffentliches Replay enthalten für verdeckte Ziele keine Kartendefinition,
  keinen Titel und keine unzulässige Instanzreferenz.
- [ ] Der Corp-private Aktions- und Choice-Pfad behält die zur legalen
  Auflösung nötige Zielbindung; die öffentliche Redaktion verändert weder
  Legalität noch Replay-Determinismus oder StateHash.
- [ ] Der Basiszug `advance_card` bleibt redigiert und ein öffentliches Ziel
  bleibt in der Chronik weiterhin namentlich darstellbar.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Die Sichtbarkeit an der Stelle bestimmen, an der der öffentliche
  Ergebnis-Payload erzeugt wird. Private `LegalAction`- und Choice-Daten
  dürfen die gebundene Karten-ID behalten; öffentliche Felder müssen aus
  explizit sicheren Zielbeschreibungen entstehen.
- `public-context.ts` übernimmt derzeit mehrere allgemeine Ziel-Felder sowie
  normalisierte Ability-Metadaten. Die Korrektur darf nicht nur den
  Chronik-Formatter behandeln, weil sonst PublicEvents, Reconnect und Replay
  weiterhin leaken.
- Für verdeckte installierte Karten kann der vorhandene öffentliche
  Positionsvertrag (`serverId`, Platzierung und opaker
  `installedPositionKey`) verwendet oder passend erweitert werden. Die
  Kartendefinition darf daraus nicht ableitbar sein.
- Bei Verschiebe-Effekten Quelle und Ziel separat bewerten. **Vapor Ops** ist
  als rezzte Quelle öffentlich, sein Ziel kann dennoch verdeckt sein;
  **Falsified-Transactions Expert** kann auch eine verdeckte Quellkarte
  betreffen.
- Keine UI-Fallbacks, stillen Ersatzwerte oder zweite Projektionslogik als
  Abschlusslösung einführen.
- Entsprechend der Projektvorgabe zunächst nur die fokussierten Engine- und
  Chroniktests ausführen; breite Workspace- oder E2E-Läufe sind für dieses
  Paket nicht automatisch erforderlich.

## Ergebnisnotiz

Noch offen.
