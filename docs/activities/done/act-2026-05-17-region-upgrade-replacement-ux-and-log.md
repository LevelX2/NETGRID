---
activityId: act-2026-05-17-region-upgrade-replacement-ux-and-log
status: done
kind: fix
area: engine
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17T18:53:04+02:00
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/action-payload.ts
  - apps/web/app/action-payload.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm exec vitest run packages/engine/src/index.test.ts -t "region"
  - corepack pnpm exec vitest run apps/web/app/chronicle.test.ts apps/web/app/action-payload.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Region Upgrade: Ersetzung warnen und chronikalisch protokollieren

## Ziel

Wenn eine Region in einem Server mit vorhandener Region installiert wird, muss die App vorab warnen und die automatische Ersetzung der alten Region in der Chronik side-sicher dokumentieren.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Alte Region wird regelbedingt ins Archiv gelegt, aber der Chronik-Eintrag fehlt.
- Nutzeranforderung vom 2026-05-17: Vor der Installation soll ein Hinweis mit Fortfahren/Abbrechen erscheinen.
- Verwandter lokaler Anker: Region-Upgrades ersetzen ältere Regions im selben Fort.

## Scope

- Installation-Flow vor Commit um Warn-/Bestätigungsschritt ergänzen.
- Automatische Bewegung der alten Region ins Archiv chronikalisch protokollieren.
- Hidden-Info beachten: verdeckte alte Region nur generisch benennen.
- Abbruch ohne State-Änderung sicherstellen.

## Nicht im Scope

- Keine Änderung an der Grundregel `nur eine Region pro Server/Fort`.
- Keine neue generelle Confirm-Dialog-Plattform außer dem benötigten Muster.

## Akzeptanzkriterien

- [x] Installation einer Region über vorhandener Region zeigt vorab eine klare Konsequenzwarnung.
- [x] Fortfahren ersetzt die alte Region regelgerecht; Abbrechen verändert keinen Spielzustand.
- [x] Chronik nennt Auslöser und automatische Bewegung.
- [x] Verdeckte alte Regions werden nicht namentlich geleakt.
- [x] Regression deckt offene und verdeckte alte Region ab.

## Umsetzungshinweise

- Mögliche Texte: `Diese Installation ersetzt die vorhandene Region. Die bisherige Region wird ins Archiv gelegt. Fortfahren?`

## Ergebnisnotiz

Erledigt. Region-Installationen über einer vorhandenen Region tragen jetzt eine side-sichere Warnmarkierung für den Webclient. Der Webclient zeigt vor dem Senden der LegalAction den bestehenden Bestätigungsdialog mit Fortfahren/Abbrechen; Abbrechen sendet keine Aktion und ändert dadurch keinen Spielzustand. Beim Fortfahren ersetzt die Engine die alte Region unverändert regelgerecht und hängt einen automatischen Chronik-Effekt für die Bewegung ins Archiv an. Offene alte Regionen werden namentlich genannt, verdeckte alte Regionen bleiben generisch und leaken weder Titel noch Definition-ID in PublicPayload oder Chroniktext.
