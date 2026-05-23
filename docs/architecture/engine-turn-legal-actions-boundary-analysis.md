# ENGINE-ARCH-2: Turn LegalActions Boundary Analysis

Stand: 2026-05-23

Scope: enger Produktionscode-Refactor zur Vorbereitung der Turn-/LegalActions-Grenze. Keine Gameplay-Änderung, keine Kartenmigration, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung, keine Marker-/ActionID-/PendingChoice-Änderung und kein Big-Bang-Move von `corpMainActions`, `runnerMainActions`, `getLegalActions` oder `performAction`.

## 1. Ist-Zustand

| Bereich | Ort | Größe | Befund |
| --- | --- | ---: | --- |
| `index.ts` | `packages/engine/src/index.ts` | 32.110 LOC vor Schnitt | weiterhin Host-/Engine-Monolith |
| `getLegalActions` | `index.ts:2005-2052` | 48 LOC | zentrale Revalidation-Quelle |
| `corpMainActions` | `index.ts:2394-3244` | 851 LOC | MainAction-Erzeugung plus Scoring, Install, Rez, Assets, Agendas, Spezialflags |
| `runnerMainActions` | `index.ts:3433-4473` | 1.041 LOC | MainAction-Erzeugung plus Install, Events, Resources, Runs, Bonus-Runs, Spezialflags |
| `game/legal-actions.ts` | `packages/engine/src/game/legal-actions.ts` | 9 LOC | Übergangswrapper auf `getLegalActions` |
| `game/index.ts` | `packages/engine/src/game/index.ts` | 27 LOC vor Schnitt | Game-Fassade |
| `game/index.test.ts` | `packages/engine/src/game/index.test.ts` | 236 LOC | Fassade-Smokes |
| `index.test.ts` | `packages/engine/src/index.test.ts` | 45.696 LOC | großer Regressionsbestand |

Produktive `game/*`-Imports aus `../index` bleiben die bekannten Übergangswrapper:

- `game/apply-game-action.ts` importiert `applyAction`.
- `game/legal-actions.ts` importiert `getLegalActions`.
- `game/player-view.ts` importiert `getPlayerView`.
- `game/replay.ts` importiert `replayEvents`.

`index.ts` importiert weiterhin nicht aus `./game/index`; neue Imports gehen direkt auf konkrete Module.

## 2. Dependency-Gruppen

| Gruppe | Beispiele in `corpMainActions` / `runnerMainActions` | Bewertung |
| --- | --- | --- |
| A. Pure read-only helpers | Definition lookup, Card-Type-Checks, Unique-Checks, Server-/Rig-Scans | später gut extrahierbar, aber oft mit vielen lokalen Helpern verwoben |
| B. Cost quote helpers | Installkosten, Rez-Kosten, Run-Start-Tax, Tag-Removal-Credits | teils schon in `game/payment`, aber MainActions mischen Anzeige und Revalidation |
| C. Action builders | `action(...)`, ActionID, Visibility, Payload-Stabilisierung | in diesem Schritt sicher extrahiert |
| D. Flow-coupled builders | Run-Start, Encounter, Access, PendingChoice, Trace, Damage | nicht bewegt |
| E. CardImplementation legal action adapters | `pushActivatedCardImplementationActions`, Lifecycle-End-of-turn | Host-Vertrag bleibt in `index.ts` |
| F. Compatibility / Replay / Payload marker | `v19xx`, `p3_`, ActionID-Legacy-Felder | Werte bleiben unverändert, Builder nutzt bestehende Compatibility-Listen |
| G. Zu gekoppelt für jetzt | Install-/Rez-/Run-/Access-/Damage-/Trace-Gruppen | bewusst nicht bewegt |

## 3. Verhaltenssicher extrahiert

Neu:

- `packages/engine/src/game/turn/action-builders.ts`
- `packages/engine/src/game/turn/index.ts`
- `packages/engine/src/game/turn/action-builders.test.ts`

Extrahiert wurden:

- `buildLegalAction(...)`: pure Konstruktion eines `LegalAction`-Objekts.
- `stableLegalActionPayload(...)`: gleiche Payload-Stabilisierung über `buildPublicAbilitySchemaContext`.
- `makeActionId(...)`: gleiche ActionID-Zusammensetzung inklusive Legacy-Ability-Payload-Feldern.

`index.ts` nutzt den Builder direkt als lokalen `action`-Import. Dadurch bleiben alle Call Sites, Reihenfolgen, Kosten, Payloads und Revalidation-Pfade unverändert.

## 4. Bewusst in `index.ts` geblieben

Nicht bewegt wurden:

- `getLegalActions`: bleibt zentrale Revalidation-Quelle.
- `corpMainActions` und `runnerMainActions`: bleiben wegen breiter lokaler Dependencies vorerst zusammen.
- `runnerDrawCardActions`: hängt an City-Surveillance-/Crash-Everett-Spezialpayloads.
- `specialZoneHarnessActions`, Run-/Access-/Trace-/Damage-Actions und PendingChoice-Actions.
- `performAction`: bleibt unverändert in `index.ts`.

Der Grund ist jeweils derselbe: Ein Move würde sofort große Helper-Netzwerke, Compatibility-Marker oder Flow-Revalidation mitziehen und wäre kein enger Turn-LegalActions-Schnitt mehr.

## 5. Nächster sicherer Schnitt

Der nächste ARCH-Schritt sollte eine kleine read-only Candidate-Gruppe aus `corpMainActions` oder `runnerMainActions` isolieren, nicht die ganzen Funktionen:

1. Corp Basic Main Actions: Gain Credit, Draw, End Turn, Purge als kleine Builder-Gruppe, sofern Action-Reihenfolge durch Einfügestelle in `corpMainActions` erhalten bleibt.
2. Runner Basic Main Actions: Gain Credit, Draw, Remove Tag, End Turn nur nach separater Prüfung von City Surveillance, Crash Everett und Bonus-Run-Restriktionen.
3. Danach erst Install-/Rez-/Run-Gruppen, jeweils mit eigenen Regressionen für LegalAction-Listen und ActionIDs.
