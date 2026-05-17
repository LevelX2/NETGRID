---
activityId: act-2026-05-17-region-upgrade-replacement-ux-and-log
status: in_progress
kind: fix
area: engine
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Installation einer Region über vorhandener Region zeigt vorab eine klare Konsequenzwarnung.
- [ ] Fortfahren ersetzt die alte Region regelgerecht; Abbrechen verändert keinen Spielzustand.
- [ ] Chronik nennt Auslöser und automatische Bewegung.
- [ ] Verdeckte alte Regions werden nicht namentlich geleakt.
- [ ] Regression deckt offene und verdeckte alte Region ab.

## Umsetzungshinweise

- Mögliche Texte: `Diese Installation ersetzt die vorhandene Region. Die bisherige Region wird ins Archiv gelegt. Fortfahren?`

## Ergebnisnotiz

Noch offen.
