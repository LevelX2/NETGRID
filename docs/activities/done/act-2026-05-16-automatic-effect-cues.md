---
activityId: act-2026-05-16-automatic-effect-cues
status: done
kind: concept
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-16
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-cues.ts
  - apps/web/app/action-cues.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - corepack pnpm --filter @netgrid/web test -- action-cues.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
---

# Automatische Effekte als optionale Aktionshinweise

## Ziel

Automatische, side-sichere Effekte sollen optional im Aktionshinweis-Fenster sichtbar werden, damit wichtige Start-of-turn-, Economy- oder Kartenfolgen bewusster wahrgenommen werden.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-16: automatische Effekte wie Start-of-turn-Credits könnten im Aktionsfenster auftauchen.
- `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`
- `docs/derived/ACTION_BOARD_UX_1_0_5_SPEC.md`
- `apps/web/app/action-cues.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

## Scope

- Prüfen, welche `PublicGameEvent`-Typen automatische Effekte side-sicher abbilden.
- Eine lokale Option für automatische Effekt-Cues entwerfen, z. B. `Automatische Effekte anzeigen`.
- Cues nur aus side-sicheren PublicEvents und PlayerViews ableiten.
- Darstellung klar von gegnerischen Spieleraktionen unterscheiden, ohne Hidden-Info-Grenzen zu schwächen.

## Nicht im Scope

- Keine Engine-Regeländerung.
- Keine zusätzlichen privaten Payloads.
- Keine Anzeige verdeckter Kartendaten.
- Keine Änderung an Replay, StateHash oder KI-Entscheidungen.

## Akzeptanzkriterien

- [ ] Automatische Effekt-Cues sind fachlich von gegnerischen Aktionen unterscheidbar.
- [ ] Es gibt eine lokale Ein-/Aus-Option.
- [ ] Hidden-Info- und Reconnect-Grenzen bleiben erhalten.
- [ ] Passende Web-/Cue-Tests oder begründete Testauslassung sind dokumentiert.

## Umsetzungshinweise

- Wahrscheinlich braucht `deriveOpponentActionCues` eine erweiterte Filteroption für System-/Autoevents.
- Die bestehende Cue-Queue und Auto-Dismiss-Logik sollte wiederverwendet werden.
- Cues für automatische Effekte sollten nicht wie menschliche Aktionen wirken; eine eigene Quelle oder ein eigener visueller Ton kann sinnvoll sein.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17.

- `deriveOpponentActionCues` kennt jetzt `includeAutomaticEffectCues`; automatische Systemevents bleiben ohne lokale Option aus der Overlay-Queue.
- Die lokale Infofenster-Einstellung speichert `automaticEffectsEnabled` in `netgrid.actionCueSettings.v1`.
- Das Optionspanel bietet `Automatische Effekte anzeigen` als eigene Checkbox.
- System-/Auto-Cues bekommen ein eigenes `Auto-Effekt`-Label und eine neutrale Systemoptik.
- Hidden-Info-Grenze bleibt unverändert: Cues entstehen nur aus `PublicGameEvent`, `PlayerView` und Chronicle-Formatierung; keine Engine-, Replay- oder StateHash-Änderung.

Checks:

- `corepack pnpm --filter @netgrid/web test -- action-cues.test.ts`: grün, 17 Dateien / 141 Tests.
- `corepack pnpm --filter @netgrid/web typecheck`: grün.
