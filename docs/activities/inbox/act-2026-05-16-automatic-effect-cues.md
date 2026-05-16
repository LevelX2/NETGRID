---
activityId: act-2026-05-16-automatic-effect-cues
status: inbox
kind: concept
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

Noch offen.
