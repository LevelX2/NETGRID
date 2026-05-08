# NETGRID-Webapplikation – Kartenimplementierungsleitfaden

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** Demo-Karten und spätere Kartenintegration  
**Primäres Ziel:** kontrollierte, testbare und visibility-sichere Kartenimplementierung

## 1. Zweck

Dieses Dokument beschreibt, wie Karten in die Engine aufgenommen werden. Es trennt Kartendaten, gedruckten Text, MVP-Implementierung, Resolverlogik, Tests und bekannte Limitierungen.

Der Leitfaden verhindert, dass neue Karten uneinheitlich, ungetestet oder mit versteckten Regelannahmen eingebaut werden.

## 2. Grundsätze

1. Gedruckter Kartentext ist keine automatisch interpretierte Regelquelle.
2. Jede spielbare Karte hat einen Manifest-Eintrag.
3. Jede spielbare Fähigkeit ist explizit implementiert.
4. Jede nicht implementierte Fähigkeit ist dokumentiert.
5. Jede spielbare Karte hat Tests.
6. Jede Karte wird auf Visibility geprüft.
7. Kartenresolver enthalten keine UI-, Netzwerk- oder Datenbanklogik.
8. Eine Karte darf nur in Demo-Decks erscheinen, wenn ihr Status dies erlaubt.

## 3. CardImplementation-Statusmodell

```ts
type CardImplementationStatus =
  | "data_only"
  | "stub_visible_not_playable"
  | "playable_mvp"
  | "playable_full"
  | "blocked"
```

| Status | Bedeutung | Darf in aktivem Demo-Deck gespielt werden? |
|---|---|---:|
| `data_only` | Nur statische Daten vorhanden. | Nein |
| `stub_visible_not_playable` | Sichtbar für UI/Decklisten, aber nicht spielbar. | Nein |
| `playable_mvp` | Für den dokumentierten MVP-Kontext vollständig implementiert. | Ja |
| `playable_full` | Nach vollständigem Regelverständnis implementiert. | Ja |
| `blocked` | Karte darf nicht verwendet werden. | Nein |

## 4. Manifest-Schema

```ts
type CardImplementation = {
  cardCode: string
  title: string
  side: "corp" | "runner"
  type: CardType
  rulesTextSnapshot: string
  status: CardImplementationStatus
  implementedAbilities: string[]
  unsupportedAbilities: string[]
  allowedInDecks: string[]
  requiredTests: string[]
  knownLimitations: string[]
  visibilityNotes: string[]
  resolverId?: string
  lastReviewedAt: string
}
```

Beispiel:

```json
{
  "cardCode": "demo_runner_simple_fracter",
  "title": "Simple Fracter",
  "side": "runner",
  "type": "program",
  "rulesTextSnapshot": "1 Credit: +1 strength. 1 Credit: Break 1 barrier subroutine.",
  "status": "playable_mvp",
  "implementedAbilities": [
    "install_program",
    "pump_strength_current_encounter",
    "break_barrier_subroutine"
  ],
  "unsupportedAbilities": [],
  "allowedInDecks": ["demo_runner_001"],
  "requiredTests": [
    "card.simple_fracter.install",
    "card.simple_fracter.pump",
    "card.simple_fracter.break_barrier",
    "visibility.runner_rig_public_after_install"
  ],
  "knownLimitations": ["No interaction with hosted cards or recurring credits."],
  "visibilityNotes": ["Visible after install; not visible while in Runner grip to Corp."],
  "resolverId": "resolver_simple_fracter",
  "lastReviewedAt": "2026-05-03"
}
```

## 5. Auswahlkriterien für `playable_mvp`

Eine Karte kann `playable_mvp` werden, wenn sie:

- einen klar isolierbaren mechanischen Zweck hat,
- keine zusätzlichen Steal-Kosten benötigt,
- keine Traces, Tags, Damage oder Viren verwendet,
- keine Hosted-Card-Mechanik benötigt,
- keine Prevention-, Avoid-, Replacement- oder Interrupt-Effekte benötigt,
- keinen Bypass, keine Server-Umleitung und keine Forced Encounters benötigt,
- kein Multiaccess benötigt,
- kein komplexes Timing außerhalb vorhandener TimingPointIds benötigt,
- mindestens einen Unit-Test und einen Szenario-/Integrationstest hat,
- keine bekannten Visibility-Leaks verursacht.

## 6. Implementierungsworkflow

### 6.1 Schritt 1: Regelanalyse

Für jede Karte werden notiert:

- Kartentyp,
- Seite,
- Kosten,
- relevante Zonen,
- Timingfenster,
- Trigger,
- Kosten der Fähigkeiten,
- Targets,
- Effekte,
- öffentliche und private Informationen,
- mögliche Interaktion mit Runs, Access, Scoring oder Hidden Information.

### 6.2 Schritt 2: Manifest-Eintrag

Vor Codeänderung wird ein Manifest-Eintrag mit Status `data_only` oder `stub_visible_not_playable` erstellt. Der Eintrag enthält bekannte Limitierungen und geplante Tests.

### 6.3 Schritt 3: CardDefinition

Statische Kartendaten werden in `CardDefinition` ergänzt:

```ts
type CardDefinition = {
  cardId: string
  title: string
  side: Side
  type: CardType
  subtypes: string[]
  cost?: number
  rezCost?: number
  trashCost?: number
  advancementRequirement?: number
  agendaPoints?: number
  strength?: number
  memoryCost?: number
  text: string
  abilities: AbilityDefinition[]
}
```

### 6.4 Schritt 4: AbilityDefinition oder Resolver

Einfache Karten verwenden generische `AbilityDefinition`. Komplexere Karten erhalten einen `CardResolver`.

```ts
type AbilityDefinition = {
  abilityId: string
  trigger: Trigger
  cost?: Cost[]
  effect: Effect[]
  timing: TimingWindow
}
```

```ts
type CardResolver = {
  cardId: string
  getLegalActions(gameState: GameState, cardInstance: CardInstance): LegalAction[]
  resolveAbility(gameState: GameState, action: PlayerAction): EngineResult
}
```

### 6.5 Schritt 5: Tests

Pflichttests:

- Daten-/Schema-Test,
- LegalAction-Test,
- Kosten-Test,
- Effekt-Test,
- Zonenbewegungs-Test,
- EventLog-Test,
- StateHash-/Replay-Test,
- Visibility-Test,
- Szenariotest mit Demo-Deck oder Fixture.

### 6.6 Schritt 6: Statuswechsel

Eine Karte wird nur auf `playable_mvp` gesetzt, wenn:

- alle Pflichtmechaniken implementiert sind,
- alle Tests bestehen,
- bekannte Limitierungen für den MVP-Kontext akzeptiert sind,
- Karte im Abweichungsregister nicht blockiert ist,
- Visibility-Oracle keine Leaks findet.

## 7. Standardmuster

### 7.1 Einfaches Economy-Event

Beispiel: Simple Economy Event.

```json
{
  "abilityId": "simple_economy_event_gain_4",
  "trigger": "on_play",
  "cost": [],
  "effect": [{ "type": "gain_credits", "side": "runner", "amount": 4 }],
  "timing": "runner_action_take_action"
}
```

Tests:

- Event ist legal, wenn Runner Click und Karte in Grip hat.
- Nach Spielen: Runner -1 Click, +4 Credits, Karte im Heap.
- CorpView sieht nicht die restliche Runner-Hand.

### 7.2 Einfaches Economy-Operation

Beispiel: Simple Economy Operation.

```json
{
  "abilityId": "simple_economy_operation_gain_4",
  "trigger": "on_play",
  "cost": [],
  "effect": [{ "type": "gain_credits", "side": "corp", "amount": 4 }],
  "timing": "corp_action_take_action"
}
```

Tests analog zum Event, aber Karte geht nach Archives und Runner darf keine HQ-Restkarten sehen.

### 7.3 Simple Agenda

Pflichtlogik:

- Corp kann Agenda in Remote installieren.
- Corp kann Advancement-Token legen.
- Corp kann scoren, wenn Requirement erreicht ist.
- Runner kann Agenda beim Access stehlen.
- Score Areas sind öffentlich.

### 7.4 Simple ICE

Pflichtlogik:

- Corp kann ICE vor Server installieren.
- ICE ist unrezzed für Runner verdeckt.
- Corp kann ICE beim Approach rezzen, wenn Credits reichen.
- Gerezztes ICE zeigt Stärke, Subtypes und Subroutinen.
- Subroutinen können gebrochen oder aufgelöst werden.

### 7.5 Simple Icebreaker

Pflichtlogik:

- Runner kann Program installieren, wenn Credits und MU reichen.
- Programm ist öffentlich im Rig.
- Pump erhöht Stärke für aktuellen Encounter.
- Break-Fähigkeit wirkt nur gegen passenden ICE-Subtype.
- Break-Fähigkeit erfordert ausreichende Stärke.

### 7.6 Simple Economy Asset

Pflichtlogik:

- Corp installiert Asset verdeckt im Remote.
- Runner sieht verdeckte Root-Karte ohne Titel.
- Corp rezzt Asset für 1 Credit.
- On-Rez-Effekt gibt Corp 3 Credits.
- Runner kann beim Access Trash Cost 3 zahlen und Asset trashen.

## 8. Demo-Kartenmanifest

### 8.1 Runner Demo Deck 01

| Karte | Status | Pflichttests |
|---|---|---|
| Runner Identity | `playable_mvp` | Initialisierung, Visibility. |
| Simple Economy Event | `playable_mvp` | Play Event, +4 Credits, Heap, Visibility. |
| Simple Run Event | `playable_mvp` | Run-Start, Serverwahl, Erfolgsbonus, Run-Ende. |
| Simple Fracter | `playable_mvp` | Install, MU, Pump, Break Barrier. |
| Simple Decoder | `playable_mvp` | Install, MU, Pump, Break Code Gate. |
| Simple Killer | `playable_mvp` | Install, MU, Pump, Break Sentry. |

### 8.2 Corp Demo Deck 01

| Karte | Status | Pflichttests |
|---|---|---|
| Corp Identity | `playable_mvp` | Initialisierung, Visibility. |
| Simple Agenda | `playable_mvp` | Install, Advance, Score, Steal. |
| Simple Economy Operation | `playable_mvp` | Play Operation, +4 Credits, Archives, Visibility. |
| Simple Economy Asset | `playable_mvp` | Install facedown, Rez, On-Rez +3, Trash Cost. |
| Simple Barrier ICE | `playable_mvp` | Install, Rez, Encounter, End the Run, Barrier Break. |
| Simple Code Gate ICE | `playable_mvp` | Multi-Subroutine, Corp +1, End the Run, Decoder Break. |
| Simple Sentry ICE | `playable_mvp` | Runner loses credits, End the Run, Killer Break. |

## 9. Visibility-Checkliste pro Karte

Für jede Karte ist zu beantworten:

| Frage | Beispiel |
|---|---|
| In welcher Zone ist die Karte verdeckt? | HQ, R&D, Grip, Stack, unrezzed Remote. |
| Wann wird der Titel öffentlich? | Rez, Install im Runner Rig, Access, Score/Steal. |
| Welche LegalActions enthalten private Details? | Corp-Rez-Optionen, Runner-Handoptionen. |
| Welche Events sind öffentlich? | Rez, Score, Steal. |
| Welche Events sind privat? | Ziehen aus R&D, Handkartenbewegungen. |
| Kann die Karte Hidden-Info-Barrier erzeugen? | Access, zufällige Auswahl, Deckblick. |
| Welche Fehler könnten private Details leaken? | Abgelehnte Targets, nicht bezahlbare private Actions. |

## 10. Testnamenskonvention

Empfohlenes Schema:

```text
card.<card_code>.<behavior>
scenario.<deck_or_flow>.<behavior>
visibility.<side>.<payload>.<forbidden_info>
replay.<scenario>.<state_hash>
```

Beispiele:

```text
card.simple_barrier_ice.rez_and_end_run
card.simple_fracter.breaks_barrier_only
scenario.run_and_steal.remote_agenda
visibility.runner.websocket.no_unrezzed_ice_title
replay.demo_runner_win.final_state_hash
```

## 11. Häufige Fehler

| Fehler | Folge | Gegenmaßnahme |
|---|---|---|
| Kartentext wird direkt interpretiert | Unkontrollierbare Sonderfälle | Explizite AbilityDefinition oder Resolver. |
| Karte ohne Manifest in Deck | Unklarer Implementierungsstatus | Deckvalidierung gegen Manifest. |
| UI baut Sonderregel nach | Server/Engine-Divergenz | Nur LegalActions verwenden. |
| Private Targets in PublicEvent | Hidden-Info-Leak | EventPayload trennen und testen. |
| Kosten nur in UI geprüft | Manipulierbare Action | `applyAction` validiert erneut. |
| Resolver verändert Storage | Architekturbruch | Resolver nur auf GameState. |
| Keine Replay-Tests | Nondeterminismus bleibt unentdeckt | StateHash-Test pro Szenario. |

## 12. Copyright- und Asset-Regeln

Für interne Demo-Karten sollen eigene Arbeitstitel und Testtexte verwendet werden. Offizielle Kartendaten, Artworks und Assets sind getrennt zu behandeln. Das Projekt darf nicht davon ausgehen, dass offizielle Assets frei weiterverwendet werden können.

Regeln:

- Demo-Karten sind interne Testkarten.
- Kartentext-Snapshots dienen Implementierungsdokumentation.
- Artworks werden für MVP nicht benötigt.
- Attribution und Lizenzprüfung werden vor öffentlicher Nutzung erforderlich.

## 13. Review-Checkliste für neue Karten

Eine neue Karte darf gemerged werden, wenn alle Punkte erfüllt sind:

- Manifest-Eintrag vorhanden.
- Status korrekt.
- CardDefinition vollständig.
- Resolver oder AbilityDefinition implementiert.
- Keine UI-/Netzwerk-/Storage-Abhängigkeit im Resolver.
- Kosten und Targets werden engine-seitig validiert.
- Events trennen public/private Payload.
- Hidden-Info-Barrier geprüft.
- Unit-Test vorhanden.
- Szenariotest vorhanden.
- Visibility-Test vorhanden.
- Replay/StateHash-Test vorhanden, falls Karte StateTransitions erzeugt.
- Bekannte Limitierungen dokumentiert.
