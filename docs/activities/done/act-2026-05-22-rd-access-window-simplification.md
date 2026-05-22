---
activityId: act-2026-05-22-rd-access-window-simplification
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/access-reveal-ui.ts
  - apps/web/app/access-reveal-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/run-layering.test.ts
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/access-reveal-ui.test.ts app/run-layering.test.ts"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:3100"
  - "git diff --check"
---

# R&D-Access-Fenster vereinfachen

## Ziel

Das Access-/Anzeigefenster beim Zugriff auf R&D soll die aufgedeckte Karte klar in den Mittelpunkt stellen und die Entscheidung mit wenigen eindeutigen Aktionsknöpfen unterstützen.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Beim Zugriff auf R&D zeigt das Fenster links die Karte und rechts zusätzlich viel wiederholten Text, Regeltext und Details.
- Erwartung: Das Fenster soll primär die Karte selbst anzeigen; der rechte Textbereich soll entfallen oder stark reduziert werden.
- Erwartete Aktionen: klare runde Aktionsknöpfe, zum Beispiel `OK` und, falls legal möglich, `Trash`/`Dreschen`.
- Relevante Regel-/Release-Spuren: Run/Access/Multiaccess ist ein Engine-kritischer Bereich; UI darf keine Legalität erfinden.

## Scope

- R&D-Access-Dialog oder CardChoice-/Access-Panel identifizieren.
- Redundante Wiederholung von Kartentext und Details im Access-Fenster entfernen oder stark reduzieren.
- Aktionsbereich auf die tatsächlich legalen Access-Aktionen fokussieren.
- `OK`/Weiter und Trash/Dreschen nur anzeigen, wenn sie aus LegalActions beziehungsweise PendingChoice-Optionen ableitbar sind.
- Layout auf Desktop und Tablet/Mobile prüfen.

## Nicht im Scope

- Keine Änderung an Access-Queue, Multiaccess, Steal-/Trash-Kosten oder Ambush-Regeln.
- Keine Änderung an Hidden-Info-Projection oder PublicEvents.
- Kein komplettes Redesign aller Choice-Modals.
- Keine Vereinheitlichung sämtlicher HQ/Archives/Remote-Access-Ansichten, außer kleine gemeinsame Komponenten fallen ohne Mehrscope ab.

## Akzeptanzkriterien

- [x] R&D-Access zeigt die Karte groß und lesbar als primären Inhalt.
- [x] Wiederholter Textwust rechts ist entfernt oder auf entscheidungsrelevante Kurzinfos reduziert.
- [x] Legal verfügbare Aktionen sind als klare, schnell erfassbare Buttons sichtbar.
- [x] Nicht legale Aktionen werden nicht angezeigt oder nicht ausführbar gemacht.
- [x] Hidden-Info bleibt geschützt; keine späteren R&D-Karten oder Queue-Inhalte werden vorzeitig sichtbar.
- [x] Fokussierte Web-Tests oder Browser-Screenshot-Prüfung decken R&D-Access mit und ohne Trash-Möglichkeit ab.
- [x] Checks: passende Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Vor einer UI-Änderung prüfen, ob derselbe Dialog auch für HQ/Archives/Remote verwendet wird; falls ja, den R&D-Fix so schneiden, dass andere Access-Flows nicht beschädigt werden.
- Buttontexte müssen zum Projektglossar passen; wenn `Dreschen` nicht bereits etablierter Begriff ist, bestehende UI-Begriffe bevorzugen.

## Ergebnisnotiz

Der Access-Reveal-Dialog nutzt jetzt die Karte als primären Inhalt und entfernt den redundanten rechten Kartentitel- und Regeltextblock. Rechts bleiben nur die kurze Trash-/Entscheidungsinfo und die aus den vorhandenen LegalActions abgeleiteten Aktionsbuttons. `decline_trash` wird im Reveal als `OK` angezeigt, Trash-/Steal-/Multiaccess-Aktionen bleiben nur sichtbar, wenn sie in den LegalActions vorhanden sind. Die Button-Gruppe ist kompakter und rund dargestellt; die Karte wird im Dialog größer priorisiert. Es wurden keine Access-Legalität, Hidden-Info-Projection, PublicEvents, Replay- oder StateHash-Daten geändert. Der Browser-Check hat den lokalen Client geladen; ein aktiver R&D-Access-Zustand war in der bestehenden Startansicht nicht vorhanden, daher decken die fokussierten Tests Access mit und ohne Trash-Möglichkeit ab.
