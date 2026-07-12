# AI Decision Checkpoint Testzone – Prozess 2026-07-12

## Status

Vorbereitet. Die laufende Partie bleibt unverändert. Der erste Pilot-Checkpoint
wird nach ihrem Abschluss aus dem gespeicherten Match abgeleitet.

Aktiver Agent für die Vorbereitung: `test-quality-agent`.

## Quelle und Problem

Playtest-Analysen belegen wiederholt denselben Qualitätsschaden:

1. Eine konkrete KI-Fehlentscheidung wird aus einem gespeicherten Match
   verstanden.
2. Ein enger Helper- oder synthetischer Runtime-Test wird ergänzt.
3. Dieser Test prüft nicht immer denselben Engine-, Input-, Memory- und
   Planpfad wie der Live-Server.
4. Eine spätere Änderung bleibt lokal grün, verschiebt aber an anderer Stelle
   die produktive Auswahl.

Der aktuelle Live-Fall `match_7bfe82501d0fdcb8` zeigt den Bedarf besonders
deutlich. Die Planebene ist aktiv, führt `corp.develop_finite_economy` als
Vordergrund und `corp.establish_scoring_remote` als Hintergrund, verwendet
daraufhin BBS Whispering Campaign wiederholt und verdrängt fast gleich hoch
bewertete R&D-Schutzaktionen. Der Fehler entsteht nicht in einem einzelnen
Score-Helper, sondern aus Board, LegalActions, Deckstrategie, Planportfolio,
Planfortschritt und wiederholter Auswahl.

## Gesamtziel

NETGRID erhält einen versionierten AI-Decision-Checkpoint-Vertrag und eine
lokale Testzone, mit denen eine konkrete Entscheidungssituation vollständig und
deterministisch reproduziert werden kann.

Ein Checkpoint muss denselben produktiven Pfad verwenden wie der Server:

```text
Engine-Checkpoint und Runtime-Memory laden
  -> PlayerView und LegalActions über die Engine erzeugen
  -> buildAiDecisionInput über den produktiven Adapter ausführen
  -> produktiven Corp-/Runner-Chooser ausführen
  -> Entscheidung, Planportfolio und Evidence prüfen
  -> optional Action anwenden und Sequenz fortsetzen
```

Jeder bestätigte Playtestfehler soll danach mindestens einen produktiven
Checkpoint-Test besitzen. Wenn eine generische Regel abgeleitet wird, kommt ein
semantischer Begleittest mit negativer Gegenprobe hinzu.

## Zielprüfung

Die Aufgabe ist umsetzungsreif. Vorhanden sind:

- Engine-Snapshots und Events in der lokalen SQLite;
- detaillierte AI-Decision-Traces;
- `RealEngineFixtureBuilder` für Engine-nahe Zustände;
- portable Replay-Fixtures und Real-Engine-Corpus;
- produktive `buildAiDecisionInput`- und Chooser-Einstiege;
- versionierte TacticalPlan-, StrategicIntent-, PlanPortfolio- und
  RunnerRunPlan-Strukturen.

Die zentrale Lücke ist ein gemeinsamer Export-/Restore-Vertrag für die
KI-internen Laufzeitspeicher. TacticalPlanMemory, PlanPortfolioMemory,
StrategicIntentMemory und RunnerRunPlanMemory liegen derzeit in separaten
Modul-Maps. Ein Board-Snapshot allein stellt deshalb nicht zwingend dieselbe
Entscheidungslage her.

## Nicht-Ziele

- Kein Ersatz aller Unit-Tests durch große Spielszenarien.
- Keine Speicherung von Sessiontokens, Reconnecttokens, privaten
  Server-Payloads oder zukünftigen Events im Fixture.
- Keine Nutzung gegnerischer Hidden Information durch die KI.
- Kein Produktiv-/Internet-Endpunkt zum Laden beliebiger GameStates.
- Keine automatische Änderung erwarteter Ergebnisse, nur damit ein Test nach
  einem KI-Umbau wieder grün wird.
- Keine sofortige fachliche Reparatur des laufenden BBS-Falls in diesem
  Vorbereitungspaket.

## Grundmodell: zwei komplementäre Testklassen

### Exakter Decision Checkpoint

Der exakte Checkpoint friert die konkrete Entscheidungssituation ein:

- Engine-Zustand unmittelbar vor der Entscheidung;
- Actor, Difficulty, Profile und Deck-Snapshot;
- Event-Prefix und öffentliche Wissensgrundlage;
- alle relevanten AI-Runtime-Memories;
- erwartete oder verbotene Auswahl;
- optional mehrere aufeinanderfolgende Entscheidungen.

Er ist bewusst empfindlich gegen Verhaltensregressionen und darf bei
inkompatiblen Runtime-Schemas kontrolliert auf `fixture_migration_required`
fallen.

### Semantischer Companion Contract

Der Companion Contract baut die fachliche Situation mit einem kleineren,
Engine-erzeugten Szenario nach. Er prüft die generische Regel statt historischer
Objektformen.

Beispiel für den aktuellen Fall:

> Eine finite Economy-Fähigkeit darf nicht jeden verbleibenden Klick eines
> Zuges beanspruchen, wenn die Reserve bereits hoch ist, ein sinnvoller
> Schutz-/Scoreline-Schritt legal ist und ein fälliger Hintergrundplan dadurch
> verhungert.

Der Checkpoint schützt den realen Fund. Der Companion Contract schützt die
dauerhafte fachliche Intention bei späteren Architekturumbauten.

## Versionierter Checkpoint-Vertrag

Vorgesehene Schema-ID:

```text
ai-decision-checkpoint-v1
```

Vorgesehene Kernstruktur:

```ts
type AiDecisionCheckpointV1 = {
  schemaVersion: "ai-decision-checkpoint-v1";
  checkpointId: string;
  source: {
    kind: "captured_match" | "synthetic_companion";
    matchId?: string;
    decisionIndex?: number;
    stateVersion?: number;
    findingId: string;
    capturedAt: string;
  };
  compatibility: {
    engineBaseline: string;
    gameStateSchemaVersion: string;
    aiInputSchemaVersion: string;
    aiRuntimeCheckpointVersion: string;
  };
  actor: "corp" | "runner";
  difficulty: "easy" | "normal" | "hard";
  profileId: string;
  deckSnapshot: AiDeckStrategyDeckSnapshot;
  engine: {
    stateVersion: number;
    stateHash: string;
    testOnlyGameState: GameState;
    eventPrefix: PublicGameEvent[];
  };
  runtime: AiRuntimeCheckpointV1;
  expectation: AiDecisionCheckpointExpectationV1;
};
```

`testOnlyGameState` ist ausschließlich server-/testseitig verfügbar. Das
Fixture darf niemals in Webbundles, REST-/WebSocket-Payloads, öffentliche
Replays oder Reports gelangen.

## AI-Runtime-Checkpoint

Vorgesehene Schema-ID:

```text
ai-runtime-checkpoint-v1
```

Mindestens abzudecken sind:

- `TacticalPlanMemorySnapshot`;
- `PlanPortfolioSnapshot` inklusive Vordergrund, Hintergründen, Lifecycle und
  Cadence;
- `StrategicIntentMemorySnapshot`;
- `RunnerRunPlan`, falls ein Run aktiv ist;
- explizit übergebene Access-Outcome-/Commitment-Zustände, soweit sie die
  Entscheidung beeinflussen;
- Memory-Kontextschlüssel aus Match/Decision, Side, Profil und Deck-Snapshot.

Für jeden Memory-Bestandteil werden bereitgestellt:

```text
export -> validate -> restore -> reset
```

Restore muss fail-closed arbeiten. Ein unbekanntes Schema oder eine falsche
Side-/Match-/Deckbindung darf nicht still als leeres Memory behandelt werden.

## Langfristige Zielarchitektur

Die kurzfristige Umsetzung darf kontrollierte Checkpoint-Adapter für die
bestehenden Modul-Maps verwenden. Das langfristig robustere Modell ist jedoch:

```ts
chooseAiAction(input, runtimeState)
  -> { decision, nextRuntimeState }
```

Damit wird Runtime-State explizit pro Match geführt statt implizit in globalen
Maps. Der Checkpoint-Vertrag soll so gestaltet werden, dass eine spätere
Umstellung auf dieses Modell keine Änderung der Fixture-Intention erfordert.

## Erwartungsvertrag

Ein Checkpoint darf unterschiedliche Strenge verwenden.

### Exakte Auswahl

Geeignet für vollständig bestimmte Fälle:

- konkretes Trace-Gebot;
- Mulligan-Entscheidung;
- Score- oder Steal-Closeout;
- verpflichtende Choice-Option.

### Akzeptable Auswahlmenge

Geeignet, wenn mehrere fachlich gute Aktionen möglich sind:

```ts
acceptableActions: [
  { type: "install_card", targetServerId: "rd", sourceRole: "ice" },
  { type: "install_card", targetServerId: "hq", sourceRole: "ice" },
];
```

### Verbotene Auswahl

Geeignet für den BBS-/Planverhungerungsfall:

```ts
forbiddenActions: [
  { sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
    abilityKind: "finite_economy_drain",
    whenActionsAlreadyUsedThisTurnAtLeast: 2 },
  { type: "end_turn", whenActionableProtectionExists: true },
];
```

### Relationale Erwartungen

- Schutzaktion muss nach zwei BBS-Nutzungen höher als eine dritte Nutzung
  liegen;
- fälliger Hintergrundplan darf nicht ausschließlich durch Planbonus
  verdrängt werden;
- ein erzwungener Fall behält Diagnose, zählt aber nicht als vermeidbare
  Fehlentscheidung.

### Sequenz-Erwartungen

- maximale Anzahl einer Aktionsfamilie pro Zug;
- Hintergrundplan muss innerhalb eines Aktionsbudgets Fortschritt erzielen;
- nach N Entscheidungen muss eine Board-/Planinvariante erfüllt sein;
- die Sequenz darf keine illegale oder erfundene Aktion enthalten.

Erwartungen referenzieren bevorzugt Action-Typ, Quelle, Semantik und Ziel statt
instanzabhängiger `actionId`. Exakte `actionId` bleibt nur dort Pflicht, wo sie
Teil des Vertrags ist.

## Capture- und Promotion-Workflow

### Lokaler Roh-Capture

Vorgesehener Befehl:

```powershell
corepack pnpm ai:checkpoint:capture -- \
  --match-id <match_id> \
  --decision-index <n> \
  --out data/local/ai-decision-checkpoints/<checkpoint>.json
```

Der Capture:

- öffnet SQLite ausschließlich read-only;
- nimmt nur den Zustand vor der gewählten Entscheidung;
- schließt zukünftige Events aus;
- entfernt Tokens und private Servertransportdaten;
- erfasst Engine-State, Deck-Snapshot, Inputzeugen, Trace und vorhandene
  Memory-Evidence;
- schreibt Rohdaten nur unter `data/local/`.

### Promotion zum versionierten Fixture

Vorgesehener Befehl:

```powershell
corepack pnpm ai:checkpoint:promote -- \
  --input data/local/ai-decision-checkpoints/<checkpoint>.json \
  --fixture-id <fixture_id>
```

Promotion verlangt:

- fachlich formulierte Erwartung;
- Hidden-Info- und Redaction-Prüfung;
- validierte Deck-/Kartenquellen;
- Entscheidung zwischen exaktem GameState und synthetischem Rebuild;
- negative Gegenprobe;
- Mutation Witness: Eine absichtlich falsche Auswahl muss den Test rot machen.

Versionierte Fixtures liegen vorgesehen unter:

```text
data/scenarios/ai-decision-checkpoints/
```

Roh-Captures unter `data/local/` werden nicht committed.

## Besonderheit der aktuell laufenden Partie

Der Server persistiert zurzeit nicht den vollständigen internen
`AiRuntimeCheckpoint` an jeder Entscheidung. Für die laufende Partie gilt
daher nach Abschluss:

1. Engine-Snapshot, Event-Prefix und AI-Traces aus SQLite sichern.
2. Plan-/Memory-Zustand durch deterministisches Replay des Entscheidungspräfixes
   rekonstruieren.
3. Rekonstruktion gegen die im Trace sichtbaren PlanPortfolio-, Doctrine-,
   Plan-, Lifecycle- und Cadence-Fakten prüfen.
4. Abweichungen ausdrücklich als `reconstructed_memory` markieren.
5. Den versionierten Companion Contract unabhängig davon vollständig
   Engine-erzeugt anlegen.

Nach Einführung des Checkpoint-Exports werden künftige detaillierte
Testserver-Traces optional direkt mit exaktem Memory-Checkpoint erfasst.

## Testzone

Die Testzone baut auf demselben Headless-Runner auf. Vorgesehene lokale
Funktionen:

- Fixture auswählen und Kompatibilitätsstatus sehen;
- Board aus Sicht der KI anzeigen;
- Engine-interne Testansicht getrennt und klar markiert anzeigen;
- LegalActions, Scores und Alternativen anzeigen;
- StrategicIntent, Planportfolio, Vordergrund, Hintergründe, Lifecycle,
  Cadence und Blocker anzeigen;
- erwartete, akzeptable und verbotene Aktionen hervorheben;
- eine Entscheidung oder eine Sequenz ausführen;
- Vorher-/Nachher-Diff für Board und Runtime-Memory zeigen;
- Checkpoint nicht still überschreiben;
- Migration oder neue Erwartung nur als explizite Review-Aktion exportieren.

Die Testzone ist ausschließlich im lokalen Profil mit explizitem
`NETGRID_AI_TESTZONE=1` verfügbar. Es gibt keinen Zugriff aus normalem Spiel,
LAN-Produktprofil oder Internetprofil.

## Strategie zum Ersetzen bestehender Tests

Bestehende Tests werden in vier Klassen sortiert.

### Behalten

- reine Rechen-, Parser-, Redaction- und Schema-Unit-Tests;
- kleine Invarianten mit klar begrenztem Vertrag;
- negative Engine-/LegalAction-Guards.

### Zu Unit-Tests herabstufen

Helper-Tests, die weiterhin lokalen Nutzen haben, aber keine Aussage über das
Live-Spielverhalten mehr beanspruchen dürfen.

### Durch Checkpoints ersetzen

- handgebaute `AiDecisionInput`-Tests, die einen Live-Fehler beweisen sollen;
- Tests, die produktive Payload-Felder direkt injizieren;
- Tests ohne plausible Konkurrenzaktion;
- Tests, die Memory/Planstatus pauschal auf `undefined` setzen, obwohl der
  Live-Fehler von Planfortschritt abhängt;
- direkte Helper-Auswahltests ohne Engine-/Chooser-Vertrag.

### Als Companion Contract behalten oder neu schreiben

Generische Regeln, die unabhängig vom historischen Snapshot gelten sollen.

Kein Alt-Test wird entfernt, bevor eine Coverage-Matrix dokumentiert:

```text
alter Test -> Prüfintention -> neuer Checkpoint/Companion -> Negativprobe
```

## Verbindlicher Vertrag für neue Playtestfehler

Jeder bestätigte KI-Playtestfehler erzeugt künftig:

1. einen Decision Checkpoint oder begründete Ausnahme;
2. einen semantischen Companion Contract bei generischer Korrektur;
3. eine negative Gegenprobe;
4. einen Sensitivitätsnachweis, dass die ursprüngliche Fehlentscheidung den
   Test tatsächlich rot macht;
5. einen Link vom Evidence-/Final-Report zum Fixture.

## Fehlerklassen des Checkpoint-Runners

Der Runner unterscheidet sichtbar:

- `behavior_regression`: Fixture lädt, Auswahl verletzt Erwartung;
- `engine_legality_drift`: Engine erzeugt andere relevante LegalActions;
- `runtime_state_drift`: Memory wurde geladen, aber Runtime-Invarianten weichen
  vor der Auswahl ab;
- `fixture_migration_required`: Schema nicht kompatibel;
- `fixture_redaction_violation`: Fixture oder Output verletzt Side-Safety;
- `fixture_invalid`: Hash, Deck, StateVersion oder Quelle inkonsistent.

Ein Schemafehler darf nicht als vermeintliche KI-Regression erscheinen. Eine
Verhaltensregression darf nicht durch automatisches Regenerieren des Fixtures
verschwinden.

## State Machine

```text
PREPARED
  -> CONTRACT
  -> RUNTIME_CHECKPOINT
  -> CAPTURE_PROMOTION
  -> HEADLESS_RUNNER
  -> SEQUENCE_TESTZONE
  -> PILOT_FIXTURES
  -> TEST_MIGRATION
  -> FINAL_VERIFY
  -> INTEGRATED
```

Genau ein Paket ist aktiv. Kein Paket wird ohne bestandenes Done-Gate
übersprungen.

## Paketfolge

### ACP-00 – Prozess, Baseline und Scope

- Ziel: vorhandene Fixture-, Real-Engine-, Replay- und Memory-Verträge
  inventarisieren und Zielpfade festhalten.
- Kernartefakte: dieser Prozess und Kandidatenregister.
- Checks: Workspace-/Worktree-Preflight, `git diff --check`.
- Done-Gate: Schema-, Sicherheits- und Migrationsgrenzen sind freigegeben.
- Commit: `docs(ai): define decision checkpoint testzone process`

### ACP-01 – Checkpoint-Schema und Validator

- Ziel: `ai-decision-checkpoint-v1` und Erwartungsmatcher definieren.
- Arbeit: TypeScript-Typen, JSON-Schema, Validator, Fehlerklassen,
  Action-Semantik-Matcher und Schema-Gate.
- Kernartefakte: `packages/ai/src/evaluation/decision-checkpoints/` und
  `data/schemas/ai-decision-checkpoint-v1.schema.json`.
- Tests: valide/ungültige Fixtures, Action-ID-Drift, Side-/Deck-/Hash-Fehler.
- Done-Gate: inkompatible oder unsichere Fixtures fallen fail-closed.
- Commit: `feat(ai): define versioned decision checkpoints`

### ACP-02 – AI-Runtime-State exportieren und wiederherstellen

- Ziel: alle produktiv relevanten Memory-Bestandteile gemeinsam sichern.
- Arbeit: versionierter Runtime-Checkpoint, Export/Restore/Reset, Kontext- und
  Side-Validierung, Roundtrip-Tests.
- Kernartefakte: PlanMemory, PlanPortfolioMemory, StrategicIntentMemory,
  RunnerRunPlanMemory sowie Registry/Adapter.
- Tests: leerer Zustand, voller Corp-/Runner-Zustand, falscher Match-/Deck-Key,
  unbekannte Version, Roundtrip vor/nach Entscheidung.
- Done-Gate: dieselbe Eingabe plus derselbe Runtime-Checkpoint erzeugt
  deterministisch dieselbe Auswahl und denselben Folgezustand.
- Commit: `feat(ai): checkpoint runtime planning state`

### ACP-03 – Read-only Capture und kontrollierte Promotion

- Ziel: gespeicherte Matches reproduzierbar in lokale Roh-Checkpoints und
  reviewte Fixtures überführen.
- Arbeit: Capture-/Promote-Skripte, Token-/Future-Event-Entfernung,
  Deckprüfung, Herkunftsmetadaten, Hidden-Info-Gate.
- Tests: SQLite read-only, keine Zukunftsdaten, keine Secrets, ungültige
  Entscheidung/StateVersion, synthetischer Rebuild.
- Done-Gate: ein gespeichertes Match kann ohne manuelles Payload-Basteln
  erfasst und sicher promoted werden.
- Commit: `feat(ai): capture replay decisions as checkpoints`

### ACP-04 – Produktiver Headless-Checkpoint-Runner

- Ziel: Checkpoints über Engine, `buildAiDecisionInput` und Live-Chooser
  ausführen.
- Arbeit: Restore, LegalAction-Neuerzeugung, Auswahl, Erwartungsmatcher,
  ApplyAction, State-/Memory-Diff, deterministischer Doppellauf.
- Tests: Corp, Runner, Choice, Run-Fenster, genaue und akzeptable Auswahl,
  verbotene Auswahl, relationale Erwartung.
- Done-Gate: eine Mutation zur ursprünglichen Fehlentscheidung macht den
  Checkpoint zuverlässig rot.
- Commit: `test(ai): run production decision checkpoints`

### ACP-05 – Sequenzrunner und lokale Testzone

- Ziel: Memory-/Cadence-Fehler über mehrere Aktionen sichtbar machen und
  interaktiv untersuchen.
- Arbeit: N-Step-Ausführung, kontrollierte menschliche/Engine-Schritte,
  Plan-/Memory-Diff, lokale Testzone hinter explizitem Flag.
- Tests: Wiederholungsbudget, Hintergrundplan-Fortschritt, Choice-Sequenz,
  Restart/Restore, Testzone außerhalb Local-Profil nicht erreichbar.
- Done-Gate: der BBS-Fehlertyp ist als Sequenz und nicht nur als Einzelwert
  prüfbar.
- Commit: `feat(ai): add checkpoint sequence testzone`

### ACP-06 – Pilotfixtures aus echten Funden

- Ziel: das System an mehreren bereits verstandenen Fehlerklassen belegen.
- Pflichtpilot 1: aktuelles BBS-/Planportfolio-Match nach Abschluss.
- Pflichtpilot 2: Runner-Event-Run mit post-cost nicht finanzierbarem Pfad.
- Pflichtpilot 3: Corp-Mulligan-/Trace-Follow-up-Vertrag.
- Pflichtpilot 4: alternativloses Zugende mit erhaltener Rohdiagnose.
- Tests: exakter Checkpoint, Companion Contract, negative Gegenprobe und
  Mutation Witness je Pilot.
- Done-Gate: beide Seiten, Choice, PlanMemory und Sequenz sind abgedeckt.
- Commit: `test(ai): preserve live playtest decisions as checkpoints`

### ACP-07 – Schwache Alt-Tests migrieren

- Ziel: bestehende KI-Testmenge auf aussagekräftige Ebenen reduzieren.
- Arbeit: Coverage-Matrix, Duplikate entfernen, Helper-Tests klassifizieren,
  produktive Aussagen auf Checkpoints/Companions umstellen.
- Priorität: Tests mit direkter Payload-Injektion, leerem Memory trotz
  Planfehler, nur einer LegalAction oder direktem Helper-Aufruf.
- Checks: Testinventur vorher/nachher, kein verlorener Fachvertrag,
  fokussierte und vollständige AI-Suite.
- Done-Gate: jede entfernte Live-Verhaltensbehauptung besitzt einen stärkeren
  Ersatz; reine Unit-Tests sind als solche benannt.
- Commit: `test(ai): replace weak behavior fixtures with checkpoints`

### ACP-08 – Gates, Runbook, Wissenspflege und Integration

- Ziel: Checkpoint-Suite als verbindliches Gate etablieren.
- Arbeit: Package-Scripts, CI-/lokale Gates, Runbook, Testzone-Anleitung,
  Final Review, Monatslog, Main-Abgleich und Cleanup.
- Mindestchecks:
  - fokussierte Checkpoint-/Schema-/Memory-Tests;
  - `corepack pnpm --filter @netgrid/ai typecheck`;
  - vollständige `@netgrid/ai`-Suite;
  - relevante Engine-/Server-/Web-Tests;
  - `corepack pnpm check:ai`;
  - `git diff --check`;
  - Testzone-Local-only-Gate.
- Done-Gate: Checkpoints laufen auf `main`, Worktree/Branch sind entfernt und
  kein Remote wurde ohne Nutzerauftrag verändert.
- Commit: `docs(ai): finalize decision checkpoint testzone`

## Worktree- und Git-Vorgabe für die spätere Umsetzung

- Worktree:
  `C:\Projekte\NETGRID_AI_DECISION_CHECKPOINT_TESTZONE`
- Branch:
  `codex/ai-decision-checkpoint-testzone`
- Integrationsbranch: lokales `main`
- Hauptworkspace nur für finalen Merge verwenden.
- Aktuelles `main` vor Integration defensiv in den Arbeitsbranch übernehmen.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Sicherheitsblocker

Sofort stoppen, wenn:

- ein Fixture Tokens, private Server-Payloads oder zukünftige Events enthält;
- ein Test gegnerische Hidden-Zone-Daten in den AI-Input übernimmt;
- Restore einen unbekannten Memory-Stand still verwirft;
- ein Fixture in den normalen Web-/Serverproduktpfad importiert wird;
- eine Testmigration einen bisherigen Fachvertrag ohne stärkeren Ersatz
  entfernt;
- der aktuelle Live-Match durch Capture, Neustart oder Schreibzugriff gestört
  werden müsste.

## `/Goal` für die spätere direkte Umsetzung

```text
/Goal Arbeite die AI Decision Checkpoint Testzone vollständig und sequenziell
von ACP-00 bis ACP-08 ab und merge den abgeschlossenen Arbeitsbranch lokal nach
main.

Lies zuerst AGENTS.md, AGENTS.local.md, agents/test-quality-agent.md, die
Pflichtseiten in KI-Wissen-NETGRID und
docs/architecture/ai/ai-decision-checkpoint-testzone-process-2026-07-12.md.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_DECISION_CHECKPOINT_TESTZONE auf Branch
codex/ai-decision-checkpoint-testzone. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket. Erzeuge PlayerView und
LegalActions im Checkpoint-Runner ausschließlich über den produktiven
Engine-/Serverpfad. Sichere und restore alle entscheidungsrelevanten
Runtime-Memories versioniert und fail-closed. Jeder Pilotfehler benötigt einen
exakten Checkpoint, einen semantischen Companion Contract, eine negative
Gegenprobe und einen Mutation Witness. Entferne keinen Alt-Test ohne
dokumentierten stärkeren Ersatz. Nach ACP-08 final verifizieren, aktuelles main
defensiv abgleichen, lokal nach main mergen, main prüfen, den sauberen Worktree
aus Git und Dateisystem entfernen, den gemergten Branch löschen und das Goal
erst danach als complete markieren. Kein Push und kein PR.
```

## Abschlusskriterien

- Exakte Board-/Plan-/Memory-Situationen sind versioniert reproduzierbar.
- Der Runner verwendet denselben Engine-, Input- und Chooser-Pfad wie der
  Live-Server.
- Schema-, Engine-, Runtime- und Verhaltensdrift werden getrennt gemeldet.
- Der aktuelle BBS-Fall ist als Mehraktions-Regression konserviert.
- Bestätigte Playtestfehler erzeugen künftig standardmäßig Checkpoints.
- Schwache Alt-Tests sind ersetzt oder ehrlich als lokale Unit-Verträge
  klassifiziert.
- Eine lokale Testzone kann dieselben Checkpoints sichtbar und schrittweise
  ausführen.
