# ENGINE-ARCH-85: performAction Dispatcher Readiness nach ARCH-84

## Ausgangspunkt

- Worktree: `C:\Projekte\NETGRID-ability-engine-refactor`
- Branch: `codex/card-implementation-next-task`
- HEAD zu Beginn der Analyse: `811e6a3433abc25d580642ffd7ea5c72f91e466f`
- Relevante bestätigte Vorgänger:
  - ARCH-84: `811e6a3433abc25d580642ffd7ea5c72f91e466f`
  - ARCH-83: `9c6d6d1288675b4a9ee073a0f36885c1a9ab8622`
  - ARCH-82: `69c82ebcadf8a7f3a75befbd546a6dc140715490`
  - STATUS-4: `145222c8`

ARCH-84 hat die Access-Host-Komposition aus `index.ts` verlagert. Zusammen mit ARCH-83 sind Run- und Access-Host-Kompositionen jetzt eigene Boundaries. ARCH-85 prüft deshalb erneut, ob `performAction` selbst als Dispatcher-Boundary aus `index.ts` heraus kann.

## Messwerte vor Änderung

| Metrik | Stand |
| --- | ---: |
| `packages/engine/src/index.ts` | 13.958 LOC |
| `performAction` | 400 LOC |
| Switch-Case-Labels in `performAction` | 25 |
| Fachliche Branch-Gruppen inkl. Turn-Basic-Vorhandler | 24 |
| Überwiegend delegierende Branch-Gruppen | 13 |
| Branch-Gruppen mit direkter lokaler Mutation | 11 |
| Produktive `game/* -> index` Imports | 0 |

`performAction` ist nach ARCH-83/84 deutlich dispatcher-näher als im ARCH-1-/STATUS-1-Zustand, enthält aber weiterhin mehrere lokale Ausführungszweige mit direkter State-Mutation, Payload-Anreicherung und Spezialkarten-Kanten.

## Branch-Readiness-Audit

| Branch / Action | Delegiert nur? | Lokale Mutation? | Externe Boundary | Lokale Helper/Kanten | Risiko | Move-ready |
| --- | --- | --- | --- | --- | --- | --- |
| Turn-Basic-Vorhandler (`mandatory_draw`, `draw_card`, `remove_tag`, Purge, EndTurn-nahe Aktionen) | ja | nein | `handleTurnBasicExecution` | `turnBasicExecutionHost` | niedrig | ja |
| `activated_card_ability` | überwiegend | nein | CardImplementation / CorpTraceDamage / ScoredAgenda callbacks | lokaler Callback-Zuschnitt | mittel | bedingt |
| `gain_credit` | ja | nein | `handleCreditEconomyExecution` | `creditEconomyExecutionHost` | niedrig | ja |
| `play_event` | nein | ja | teilweise CardImplementation | `playRunnerEvent`, Zone-/Heap-Mutation | hoch | nein |
| `play_operation` | nein | ja | teilweise Operation-Resolver | inline Kostenprüfung, Zone-/Archive-Mutation, Payload-Felder | hoch | nein |
| `install_card` | ja | nein | `executeInstallCard` | `installCardHost` | niedrig | ja |
| `advance_card` | nein | ja | nur Roving-Submarine-Markierung extern | Click/Credit spend, Advancement-Counter, Servermarker | mittel | nein |
| `score_agenda` | ja | nein | `scoreAgenda` | `scoredAgendaFlowHost` | niedrig | ja |
| `start_run` | teilweise | ja | `startRun`, Run-Duration-Payment | Click/Bonus-Run-Flags, Wilson-Actions, Payload-Spending-Cap, Run-Tax | hoch | nein |
| `jack_out` | ja | nein | `handleRunMovementAction` | `runMovementHostForState` | niedrig | ja |
| `rez_ice` | überwiegend | ja | `executeRezCard` | `expireCorporateRetreatInstallCreditAbilities` | mittel | bedingt |
| `decline_rez` | ja | nein | RunRezWindow / RunMovement | lokale Verzweigung Root-vs-ICE | niedrig | ja |
| `pump_breaker` | nein | ja | Payment/Fort side families teilweise | Kostenprüfung, Run-Credits, Aardvark, Strength-Bonus, EffectCommands, ActionDebt, FinishRun | hoch | nein |
| `break_subroutine` | nein | ja | Payment/Fort side families teilweise | Multi-break, CurrentSubroutine-Validierung, Blink, EffectCommands, Stealth/Bartmoss/Dupre/Snowball | hoch | nein |
| `continue_run` | überwiegend | nein | RunMovement / RunContinuation | Fallback-Verzweigung | niedrig | ja |
| `access_card` / `steal_agenda` / `trash_accessed_card` | ja | nein | `handleAccessExecution` | `accessFlowHost` | niedrig | ja |
| `trash_resource` | nein | ja | keine eigene Boundary | `trashResource` | mittel | nein |
| `decline_trash` | ja | nein | `handleAccessExecution` | `accessFlowHost` | niedrig | ja |
| `move_to_set_aside` | nein | ja | keine eigene Boundary | `moveToSpecialZone` | mittel | nein |
| `move_to_removed_from_game` | nein | ja | keine eigene Boundary | `moveToSpecialZone` | mittel | nein |
| `return_from_set_aside` | nein | ja | keine eigene Boundary | `returnFromSetAside` | mittel | nein |
| `change_card_control` | nein | ja | keine eigene Boundary | `changeCardControl` | mittel | nein |
| `resolve_choice` | ja | nein | `resolvePendingChoice` | `pendingChoiceResolutionHost` | niedrig | ja |
| `trigger_ability` | ja | nein | `handleTriggerAbilityExecution` | `triggerAbilityExecutionHost` | niedrig | ja |

## Entscheidung

ARCH-85 wird als Audit-Dokument umgesetzt, nicht als Code-Move.

Ein vollständiger Move von `performAction` wäre derzeit nur mit einer zu breiten `PerformActionExecutionHost`-Fläche oder durch Mitnahme mehrerer fachlich heterogener Engine-Helper möglich. Das würde die harte ARCH-85-Grenze verletzen: keine 30+-Property-Host-Wand, keine zweite Run-/Access-/Payment-/Damage-/Trace-Engine und keine semantische Migration.

## Konkrete Blocker

1. `playRunnerEvent` ist noch lokale Execution-Logik direkt hinter `performAction`.
   Der Branch entfernt Karten aus Zonen, legt sie in den Runner-Heap, setzt Instanzfelder und ruft danach On-Play-/CardImplementation-Kanten auf. Das ist mehr als Dispatch.

2. `play_operation` enthält weiterhin Inline-Operation-Execution.
   Der Branch validiert Operation-Kosten und Ziele, verbraucht Click/Credits, bewegt Karten in Archives, setzt `faceup`/`rezzed`, ruft `resolveCorpOperation` und schreibt Hidden-Zone-/Bad-Publicity-Payload-Felder.

3. `advance_card` ist noch lokale Economy-/Counter-/Servermutation.
   Click/Credit-Verbrauch, Advancement-Counter und Roving-Submarine-Aktivitätsmarker sitzen noch direkt im Branch.

4. `start_run` ist trotz externer RunFlow-Boundary noch kein reiner Adapter.
   Bonus-Run-Flags, Wilson-Run-Only-Actions, Wilson-Spending-Cap-Payload und Run-Start-Tax bleiben lokal um den externen `startRun`-Aufruf herum.

5. `pump_breaker` und `break_subroutine` sind die größten verbleibenden lokalen Mutationszweige.
   Sie verbinden Run-Credits, Icebreaker-Kostenprüfung, Aardvark-Choice, EffectCommands, FutureActionDebt, Subroutine-State, Blink-Schaden, Stealth-Verlust, Bartmoss/Dupre/Snowball-Tracking und optionales `finishRun`.

6. Special-Zone- und Control-Actions sind noch lokale Host-Primitives.
   `trashResource`, `moveToSpecialZone`, `returnFromSetAside` und `changeCardControl` sind noch nicht hinter einer fachlichen Boundary.

7. Ein sofortiger `performAction`-Move würde die Host-Schnittstelle zu breit machen.
   Eine saubere `PerformActionExecutionHost` müsste aktuell mindestens Actions, Cards, Choices, Run, Access, Payment, Economy, Corp, HiddenZone, SpecialZones, Icebreaker/Encounter, Damage, Trace, Install, Rez und mehrere Callbacks abdecken. Das ist formal gruppierbar, aber praktisch noch eine Dispatcher-Host-Wand statt einer stabilen Boundary.

## Was move-ready ist

Diese Branches sind heute bereits weitgehend Dispatcher und sollten beim späteren Move ohne große Risiken mitgehen:

- Turn-Basic-Vorhandler
- `gain_credit`
- `install_card`
- `score_agenda`
- `jack_out`
- `continue_run`
- Access-Gruppe: `access_card`, `steal_agenda`, `trash_accessed_card`, `decline_trash`
- `resolve_choice`
- `trigger_ability`

`activated_card_ability`, `rez_ice` und `decline_rez` sind nahe an move-ready, haben aber noch lokale Callback- oder Nachlaufkanten, die beim finalen Move bewusst modelliert werden müssen.

## Minimaler nächster Code-Schnitt

Der nächste sinnvolle Produktionsschnitt ist nicht `performAction` selbst, sondern die größte verbliebene Mutationsfamilie innerhalb von `performAction`:

**ENGINE-ARCH-86-runner-breaker-action-execution-boundary**

Ziel:

- `pump_breaker` und `break_subroutine` aus `performAction` herauslösen
- neues Modul unter `packages/engine/src/game/run/` oder `packages/engine/src/game/icebreaker/`
- bestehende Payment-, FortRunSideFamilies-, Damage-, EffectCommand- und RunEndCleanup-Kanten nur delegieren
- keine RunFlow-/Damage-/Payment-Neuarchitektur
- keine PendingChoice-/Payload-/Replay-/StateHash-Änderung

Danach sollte erneut geprüft werden:

1. Operation/Event-Play-Boundary für `play_event` und `play_operation`
2. StartRun-Action-Wrapper-Boundary für die lokalen Bonus-/Wilson-/Tax-Kanten
3. Special-Zone-/Control-Action-Boundary für `moveToSpecialZone`, `returnFromSetAside`, `changeCardControl` und `trashResource`
4. erneuter `performAction`-Move, wenn nur noch Dispatcher-Branches und schmale Action-Familien-Callbacks verbleiben

## Stabilitätsbewertung

Da ARCH-85 nur dieses Audit-Dokument erstellt, bleiben stabil:

- `performAction`-Semantik
- PendingChoice source/kind/id Werte
- ActionIDs und Payload-Formen
- EventLog, PublicPayload, PublicEvent und PlayerView
- Replay und StateHash
- Hidden-Info-Grenzen
- Payment, Damage, Trace, Access, Run und RNG
- CardImplementation Runtime und Registry

## Ergebnis

`performAction` ist nach ARCH-84 deutlich näher an einer Dispatcher-Boundary, aber noch nicht move-ready. Der Move soll erst erfolgen, wenn die lokalen Mutationsfamilien in eigenen fachlichen Boundaries liegen und ein späterer `PerformActionExecutionHost` ohne breite Callback-Wand auskommt.
