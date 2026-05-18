---
activityId: act-2026-05-17-effect-event-chronicle-visibility-audit
status: done
kind: architecture
area: shared
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17T18:51:59+02:00
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/architecture/card-rules/effect-event-chronicle-visibility-audit-2026-05-17.md
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm exec vitest run apps/web/app/chronicle.test.ts apps/web/app/action-cues.test.ts --passWithNoTests
  - corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts --passWithNoTests (known existing failures in page.tsx string-contract expectations)
  - git diff --check
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

- [x] Gemeinsame Lücken in Eventprojektion, Chronik und UI-Cues sind identifiziert.
- [x] Mindestens ein konkreter, kleiner gemeinsamer Fix ist umgesetzt oder als Folgeactivity geschnitten.
- [x] Hidden-Info-Textmuster für verdeckte Kartenbewegungen sind festgehalten.
- [x] Regressionen prüfen, dass verdeckte Kartennamen nicht in öffentliche Chronik/Events gelangen.

## Umsetzungshinweise

- Gute generische Formulierungen: `Eine verdeckte Karte wurde ins Archiv gelegt.`, `Ein verdecktes Region Upgrade wurde ersetzt.`
- Dieses Paket nicht vor den Hotfix-Karten als Blocker behandeln; es ist ein Struktur-Nachlauf.

## Ergebnisnotiz

Abgeschlossen. Der gemeinsame Event-/Chronik-/Cue-Vertrag wurde auditiert; Ergebnis und Hidden-Info-Textmuster sind in `docs/architecture/card-rules/effect-event-chronicle-visibility-audit-2026-05-17.md` festgehalten. Als kleiner gemeinsamer Fix redigiert `formatChronicleEffectItems` automatische `resolvedEffects` jetzt side-bewusst, bevor Titel oder Kartenfelder aus `cardTitle`, `sourceTitle` oder Definition-IDs entstehen. Der neue Regressionstest deckt `hidden_info_barrier` und fremde `private_to_side`-Trash-Effekte ab. Betroffene Chronik-/Cue-Tests sind grün; der separate alte `visibility-contract.test.ts` bleibt wegen bestehenden String-Contract-Abweichungen in `apps/web/app/page.tsx` rot und wurde nicht im Scope repariert.
