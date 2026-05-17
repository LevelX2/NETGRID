---
activityId: act-2026-05-17-web-page-hooks-extraction
status: done
kind: architecture
area: web
priority: low
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test -- match-start-storage.test.ts action-board-ui.test.ts
  - git diff --check
---

# Webclient-Page durch fokussierte Hooks entlasten

## Ziel

`apps/web/app/page.tsx` soll schrittweise kleiner und kollisionsärmer werden, indem klar begrenzte State-/Effect-Bereiche in Hooks extrahiert werden.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: `Page()` hält Matchstart, Session, WebSocket, Katalog, Deckeditor, Audio, Board und Optionen in einer Komponente.
- Betroffener Anker: `apps/web/app/page.tsx` ca. Zeile 1711.
- Dateiumfang: ca. 11.813 Zeilen.
- Risiko: Kleine UX-Fixes können Gameplay-State berühren; parallele Arbeiten kollidieren häufiger.

## Scope

- Einen ersten risikoarmen Hook extrahieren, z. B.:
  - `useMultiplayerSession`.
  - `useCatalogData`.
  - `useDeckEditorState`.
  - `useAudioCues`.
- Keine UI-Neugestaltung und keine State-Semantik ändern.
- Nach erfolgreichem ersten Hook weitere Hook-Pakete als Folgeactivities anlegen.

## Nicht im Scope

- Kein vollständiger Page-Refactor in einem Schritt.
- Keine Änderung an WebSocket-Protokoll, Engine-Interaktion oder Server-Payloads.
- Keine Board-Layout-Neugestaltung.
- Keine Änderung an LegalAction-Ausführung.

## Akzeptanzkriterien

- [ ] Ein klar begrenzter Hook ist aus `Page()` extrahiert.
- [ ] Sichtbares Verhalten bleibt unverändert.
- [ ] Typecheck und passende Web-Tests sind grün.
- [ ] Browser-E2E/Visual-Smoke ist ausgeführt oder als begründete Testauslassung dokumentiert.
- [ ] Weitere Extraktionskandidaten sind bei Bedarf als Folgepakete benannt.

## Umsetzungshinweise

- Mit einem Bereich beginnen, der wenig direkte Kopplung an Gameplay-Aktionen hat, z. B. Audio oder Katalogdaten.
- Laufende UI-Fix-Pakete beachten, da `page.tsx` häufig geändert wird.
- Keine kosmetischen Änderungen mit der Extraktion vermischen.

## Ergebnisnotiz

Erledigt. Der risikoarme Karten-Skalierungs-/LocalStorage-Bereich wurde aus `Page()` in `usePersistentCardScaleSettings` extrahiert. Sichtbares Verhalten und Storage-Keys bleiben unveraendert; Gameplay, WebSocket-Protokoll und LegalAction-Ausfuehrung wurden nicht beruehrt. Browser-E2E/Visual-Smoke wurde fuer diesen reinen State-/Effect-Schnitt nicht gestartet; Web-Typecheck und bestehende Web-Smokes sind gruen. Sinnvolle naechste Extraktionskandidaten: `useAudioCues`, `useCatalogData`, danach Deckeditor-State.
