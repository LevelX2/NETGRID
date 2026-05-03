# MVP 0.93 Implementation Review

Status: bestanden
Stand: 2026-05-03

## Ergebnis

`ready_for_hardening: true`

Die M1-Grundlage ist umgesetzt. Bestehende spielbare Mechaniken bleiben kompatibel, und V0.93 macht keine M2- oder V0.94+-Mechanik spielbar.

## Umgesetzter Scope

- Shared Types für Effects, Abilities, Choices, Costs, Visibility-Klassen und optionale `pendingChoice`.
- Engine-Helfer für `applyEffectCommands`, Eventklassifikation und Hidden-Info-Barriere-Erkennung.
- `pendingChoice` in GameState und side-gefilterter PlayerView.
- Choice-Revalidierung in `applyAction`.
- Breaker Pump/Break als Ability-Pilot mit `abilityRef`, `effectRef` und Target-Metadaten.
- Zentrale `visibilityClass` auf PublicEvents/GameEvents.
- Server Bootstrap, Reconnect und WebSocket für side-sichere `pendingChoice`-Payloads.
- AI-Test für LegalActions-only-Verhalten bei offener Choice.

## Bewusste Schemaänderung

V0.93 ergänzt:

- `GameState.pendingChoice?: PendingChoice`.
- `PlayerView.pendingChoice?: VisibleChoiceRequest`.
- `PublicGameEvent.visibilityClass?: EventVisibilityClass`.
- `LegalAction.choiceRequirements`, `abilityRef` und `effectRef`.
- `PlayerAction.selectedChoices`.

Diese Felder sind additiv. `visibilityClass` ändert den StateHash nicht, weil `hashState` das Eventlog weiterhin ausklammert. Ein offenes `pendingChoice` ist bewusst Teil des GameState und daher hashrelevant, solange eine Choice offen ist. Es wurden keine Golden-Hash-Rebaselines durchgeführt.

## Nicht umgesetzt

- Kein Mulligan im Matchstart.
- Kein Damage oder Flatline.
- Kein Trace/Bidding.
- Keine Runner-Resources.
- Keine Multiaccess-Queue.
- Keine Identity-Abilities.
- Keine Prevention-, Avoid-, Interrupt- oder Replacement-Kette.
- Keine neue spielbare Karte.

## Vertragsprüfung

- LegalActions bleiben die einzige Quelle für PlayerActions.
- `applyAction` revalidiert Side, ActionId, StateVersion, Choice und die bestehende LegalAction-Erzeugung.
- Public Choice-Events enthalten keine Options- oder Promptdetails.
- Server und WebSocket senden `pendingChoice` nur an die berechtigte Seite.
- AI erhält keine FullState-Informationen.
