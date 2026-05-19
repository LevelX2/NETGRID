---
activityId: act-2026-05-19-mulligan-chronicle-texts
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "mulligan"
  - corepack pnpm --filter @netgrid/engine test -- index.test.ts -t "mulligan"
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Mulligan: Chronikmeldungen konkret formulieren

## Ziel

Die Chronikmeldungen für die Setup-/Mulligan-Entscheidung sollen verständlich sagen, ob Runner oder Korp die Starthand behalten oder einen Mulligan genommen hat. Die aktuelle Meldung `Runner/Korp hat die Setup-Entscheidung abgeschlossen.` ist zu technisch und sagt nicht, was tatsächlich passiert ist.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19 mit Screenshot:
  - Die Chronik zeigt `Korp hat die Setup-Entscheidung abgeschlossen.`
  - Die Chronik zeigt `Runner hat die Setup-Entscheidung abgeschlossen.`
  - Gewünscht ist eine überarbeitete Meldung für „Mulligan nehmen“ bzw. „keinen Mulligan nehmen“.
- Aktuelle Web-Chronik:
  - `apps/web/app/chronicle.ts` setzt bei `payload.setupStep === "mulligan"` pauschal `... hat die Setup-Entscheidung abgeschlossen`.
- Aktuelle Engine-/Payload-Hinweise:
  - `packages/engine/src/index.ts` setzt bei Mulligan-Auflösung `setupStep: "mulligan"`, `setupSide`, `setupDecisionPublic: "resolved"` und `hiddenZoneAction: "setup_mulligan"`.
  - Die tatsächliche Entscheidung `keep`/`mulligan` wird in `setup.resolved[side]` gespeichert, aber nach der schnellen Sichtung nicht offensichtlich in die öffentliche Payload übernommen.

## Scope

- Chroniktext für Setup-Mulligan konkretisieren:
  - bei behalten: `Runner hat die Starthand behalten.` / `Korp hat die Starthand behalten.`
  - bei Mulligan: `Runner hat einen Mulligan genommen.` / `Korp hat einen Mulligan genommen.`
- Prüfen, ob die öffentliche Event-/Chronik-Payload den Entscheidungstyp `keep` oder `mulligan` side-sicher enthalten darf und bereits enthält.
- Falls der Entscheidungstyp fehlt: kleinste Engine-Payload-Ergänzung vorsehen, z. B. `setupDecision: "keep" | "mulligan"`, ohne Karteninhalte, Handkartenanzahländerungen über das ohnehin erlaubte Maß hinaus oder private Zonen zu leaken.
- Web-Chronik so anpassen, dass sie den Entscheidungstyp nutzt und nur bei alten/legacy Events auf einen neutralen Fallback zurückfällt.
- Chips/Tags überarbeiten, z. B. `Setup`, `Starthand`, `Behalten` oder `Mulligan`.
- Web- und falls nötig Engine-Test ergänzen:
  - Runner behält Starthand,
  - Runner nimmt Mulligan,
  - Korp behält oder nimmt Mulligan,
  - Fallback für Legacy-Event ohne Entscheidungstyp.

## Nicht im Scope

- Keine Änderung an Mulligan-Regeln, Setup-Reihenfolge, Karten Ziehen, Shuffle, RandomDrawRecords, Replay oder StateHash außer einer ggf. notwendigen side-sicheren PublicPayload-Ergänzung.
- Keine Anzeige von Starthand-Karten, gezogenen Karten, Mulligan-Handinhalten oder privaten Deckinformationen.
- Keine Änderung an den Setup-Buttons selbst, sofern deren Text bereits klar ist.
- Keine komplette Chronik-Neufassung außerhalb der Setup-/Mulligan-Meldungen.

## Akzeptanzkriterien

- [ ] Die Chronik zeigt bei `keep` eine klare Meldung wie `Runner hat die Starthand behalten.`
- [ ] Die Chronik zeigt bei `mulligan` eine klare Meldung wie `Korp hat einen Mulligan genommen.`
- [ ] Die Meldung verwendet keine technische Formulierung `Setup-Entscheidung abgeschlossen`, wenn die Entscheidung bekannt ist.
- [ ] Legacy-/Fallback-Events ohne Entscheidungstyp bleiben verständlich und brechen die Chronik nicht.
- [ ] Keine Hidden-Info-Leaks: Es werden keine Starthandkarten, Deckinhalte oder nicht öffentliche Kartendetails angezeigt.
- [ ] Tests decken beide Entscheidungstypen ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
  - falls Payload fehlt: `packages/engine/src/index.ts`
  - falls Payload-Test nötig: `packages/engine/src/index.test.ts`
- In `resolveSetupMulliganChoice` liegt `selected` bereits als `keep` oder `mulligan` vor; falls ein Payload-Feld ergänzt wird, dort ansetzen.
- In der Chronik nur den Entscheidungstyp nutzen, nicht aus Kartenanzahlen, RandomRecords oder privaten Zonen rekonstruieren.

## Ergebnisnotiz

Erledigt: Die Engine-PublicPayload enthält für Setup-Mulligan-Choices jetzt den side-sicheren Entscheidungstyp `setupDecision: "keep" | "mulligan"`. Die Web-Chronik formuliert bekannte Entscheidungen konkret als `Runner hat die Starthand behalten.` beziehungsweise `Korp hat einen Mulligan genommen.` und fällt bei Legacy-Events ohne Entscheidungstyp auf `Mulligan-Entscheidung abgeschlossen` zurück.

Es werden keine Karten, Starthand-Inhalte oder privaten Zoneninformationen veröffentlicht. Chips unterscheiden `Behalten`, `Mulligan` und Legacy-`Entscheidung`.

Checks: fokussierte Web- und Engine-Tests sowie Web- und Engine-Typechecks bestanden. `git diff --check` wird vor dem Paketcommit ausgeführt.
