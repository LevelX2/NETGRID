---
activityId: act-2026-05-17-effect-event-chronicle-visibility-audit
status: inbox
kind: architecture
area: shared
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Effekt-Events: Chronik und sichtbare Darstellung härten

## Ziel

Wichtige Effekte sollen nicht nur intern korrekt passieren, sondern einheitlich sichtbar und chronikalisch nachvollziehbar sein, ohne verdeckte Informationen zu leaken.

## Kontext und Quellen

- Nutzerquerschnitt vom 2026-05-17: Mehrere Funde betreffen Reveals, Dice Rolls, Trace, Damage, Subroutine Resolution, Access, automatische Trashes, Kostenreduktionen und temporäre Modifier.
- Betroffene Einzelpakete bleiben separat; dieses Paket prüft den gemeinsamen Event-/Chronik-Vertrag.

## Scope

- PublicEvent-/Chronik-/UI-Cue-Vertrag für Auslöser, Quelle, Timing, Ziel, Kosten, Ergebnis, Kartenbewegungen, Credit-Änderungen, Damage und Run-Folgen prüfen.
- Anzeigezeit oder Bestätigungsmodell für wichtige Ereignisse vereinheitlichen.
- Hidden-Info-Formulierungen für verdeckte Kartenbewegungen definieren.
- Aus den Erkenntnissen höchstens kleine Folgepakete anlegen, falls der Umbau zu groß wird.

## Nicht im Scope

- Keine Pauschalreparatur aller oben genannten Karten in diesem Paket.
- Kein Leaken verdeckter Karten in Logs, PlayerViews, Reconnect, Replay oder Fehlern.

## Akzeptanzkriterien

- [ ] Gemeinsame Lücken in Eventprojektion, Chronik und UI-Cues sind identifiziert.
- [ ] Mindestens ein konkreter, kleiner gemeinsamer Fix ist umgesetzt oder als Folgeactivity geschnitten.
- [ ] Hidden-Info-Textmuster für verdeckte Kartenbewegungen sind festgehalten.
- [ ] Regressionen prüfen, dass verdeckte Kartennamen nicht in öffentliche Chronik/Events gelangen.

## Umsetzungshinweise

- Gute generische Formulierungen: `Eine verdeckte Karte wurde ins Archiv gelegt.`, `Ein verdecktes Region Upgrade wurde ersetzt.`
- Dieses Paket nicht vor den Hotfix-Karten als Blocker behandeln; es ist ein Struktur-Nachlauf.

## Ergebnisnotiz

Noch offen.
