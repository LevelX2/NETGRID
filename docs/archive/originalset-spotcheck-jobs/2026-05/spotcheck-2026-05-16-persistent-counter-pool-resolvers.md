---
jobId: spotcheck-2026-05-16-persistent-counter-pool-resolvers
status: done
startedAt: 2026-05-16T14:02:00Z
doneAt: 2026-05-16T16:31:50+02:00
createdAt: 2026-05-16T12:30:00+02:00
requiresImplementation: true
priority: high
sourceBlockedJobs:
  - spotcheck-2026-05-15-trace-cache-ambush
cards:
  - cardId: onr_v1_155_code-viral-cache
    title: Code Viral Cache
  - cardId: onr_v1_227_cerberus
    title: Cerberus
  - cardId: onr_v1_365_paris-city-grid
    title: Paris City Grid
---

# Originalset-Spotcheck Follow-up Job spotcheck-2026-05-16-persistent-counter-pool-resolvers

## Herkunft

Dieser Folgejob zieht die persistenten Counter-, Purge-Replacement-, Run-Start-Damage- und Trace-Pool-Removal-Conditions aus `blocked/spotcheck-2026-05-15-trace-cache-ambush.md` in einen kleineren Inbox-Scope.

## Aktueller Befund

### onr_v1_155_code-viral-cache - Code Viral Cache

Status: offen.

Aktueller Runtime-Stand: generisches Net-Damage-Prevention-Profil. Der lokale Vertrag verlangt HQ-Erfolgsbedingung, Virus-Purge-Replacement und Korp-Trash-Aktion.

Umsetzung:

- Installation und Wirkung an erfolgreichen HQ-Run nach lokalem Vertrag binden.
- Purge-Replacement-Fenster mit Runner-Choice für bis zu zwei legale Counterquellen modellieren.
- Korp-Aktion zum Trash von Code Viral Cache mit Kosten, Sourcebindung und StateVersion-Revalidation ergänzen.
- Damage-Prevention-Stub entfernen oder bewusst als finalen reduzierten Vertrag dokumentieren, damit kein fremder Effekt aktiv bleibt.

Akzeptanz:

- Code Viral Cache erhält nur legale Counter und nur in erlaubter Menge beim Purge.
- Korp-Trash-Aktion ist kosten-, side- und timingvalidiert.
- Replay/StateHash bleibt für Purge, Trash und Noop stabil.

### onr_v1_227_cerberus - Cerberus

Status: teilweise umgesetzt, Folgeeffekt offen.

Aktueller Runtime-Stand: Teilfix korrigierte Cerberus auf 3 Net Damage und entfernte falschen Trace-Tag-Erfolg. Der persistente Counter-Loop bleibt offen.

Umsetzung:

- Finalen Cerberus-Vertrag gegen lokale Faktenbasis festziehen.
- Bei vollständigem Vertrag: Trace-Erfolg legt source-bound Counter auf Runner/Identity.
- Start jedes Runs löst Counter-Damage aus; Runner-Aktion zum Entfernen eines Counters modellieren.
- Damage-/Flatline-Payloads ohne Gripkarten-Leak; Counterzustand öffentlich und replay-stabil.

Akzeptanz:

- Cerberus erzeugt nur nach erfolgreichem Trace den final vorgesehenen Folgezustand.
- Start-of-run-Damage skaliert exakt mit legalem Counterzustand.
- Runner-Removal-Aktion ist kosten-, side- und StateVersion-validiert.

### onr_v1_365_paris-city-grid - Paris City Grid

Status: offen.

Aktueller Runtime-Stand: rezzed City-Grid-Upgrade mit Trace-2-Tag-Aktion. Der lokale Vertrag verlangt servergebundenen 6-Bit-Trace-Pool während Runs auf diesem Fort plus Refresh zu Beginn des nächsten Korp-Zugs.

Umsetzung:

- Trace-Pool-Counter bei Rez setzen oder nach finalem Vertrag initialisieren.
- Pool nur für Tracekosten während Runs auf dem geschützten Fort nutzbar machen.
- Payment-Priorität zwischen Pool und allgemeinen Korp-Credits eindeutig und revalidiert abbilden.
- Poolverbrauch, Serverbindung, Trace-ID und Corp-Turnstart-Refresh testen.

Akzeptanz:

- Paris City Grid wirkt nur im finalen servergebundenen Trace-Vertrag.
- Falscher Server oder stale Trace-ID kann keine Poolcredits ausgeben.
- Poolverbrauch und Refresh sind public-payloadfähig und StateHash-stabil.

## Empfohlene Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm typecheck`

## Umsetzungsergebnis

Status: erledigt.

Geänderte Hauptpfade:

- `packages/engine/src/index.ts`: Code-Viral-Cache-Purge-Replacement, Korp-Trash-Aktion, Cerberus-Counter-/Runstart-Damage-/Removal-Pfad und Paris-City-Grid-Trace-Pool umgesetzt.
- `packages/engine/src/index.test.ts`: fokussierte Regressionen für Code Viral Cache, Cerberus und Paris City Grid ergänzt.
- `packages/shared/src/index.ts` und `packages/engine/src/mechanics/public-payload-schema.ts`: TraceState, CounterType und PublicPayload-Felder für Counter-/Pool-Zustände erweitert.
- `packages/engine/src/mechanics/damage-prevention.ts`: falsches generisches Code-Viral-Cache-Damage-Prevention-Profil entfernt.
- `packages/catalog/src/catalog-gates.ts`, `data/ai/ai-card-hints-active.json` und V1.9.13/15/18-Manifeste: finale Verträge und AI-Hints synchronisiert.
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_PERSISTENT_COUNTER_POOL_RESOLVERS_IMPLEMENTATION.md`, Register, JSON-Register und Projektlog dokumentieren den Abschluss.

Checks:

- `corepack pnpm --filter @netgrid/engine test` - grün, 464 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 48 Tests.
- `corepack pnpm --filter @netgrid/ai test` - grün, 119 Tests.
- `corepack pnpm typecheck` - grün.

Removal Conditions aus diesem Job sind erfüllt. Der ursprüngliche Sammeljob `spotcheck-2026-05-15-trace-cache-ambush` bleibt nur noch wegen `Signpost` und `The Springboard` blockiert.
