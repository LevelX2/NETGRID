---
activityId: act-2026-05-22-card-editor-originalset-filter
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Karteneditor-Filter für Original NetGrid Set reparieren

## Ziel

Der Karteneditor muss beim Filter `Original NetGrid Set` ausschließlich Karten dieses Sets anzeigen und darf Karten anderer Sets nicht sichtbar lassen.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Der Set-Filter `Original NetGrid Set` liefert nicht das erwartete Ergebnis oder wirkt fehlerhaft.
- Mögliche Ursache laut Nutzer: Mapping-Fehler zwischen sichtbarer Set-Bezeichnung und internem Set-Identifier.
- Lokaler Suchbefund: Kartendaten verwenden Set-IDs wie `originalset-v1`, während UI-/Kataloglogik teilweise mit Präfix-/Gruppierungslogik arbeitet.

## Scope

- Karteneditor-Filterpfad lokalisieren und klären, ob nach Anzeigename, Set-Code, Set-ID oder Gruppe gefiltert wird.
- `Original NetGrid Set` korrekt auf die tatsächlich verwendeten Originalset-Karten abbilden.
- Wechselwirkungen mit Suche, Kartentypfilter, Deckwechsel, Reload und Editor-Neuöffnung prüfen.
- Regressionstest für mindestens Originalset vs. Testset/Proteus/weitere Sets ergänzen.

## Nicht im Scope

- Keine Neugestaltung des Karteneditors.
- Keine Änderung an Kartendaten außer einem klar notwendigen Set-Mapping-Fix.
- Keine Änderung an Decklegalität, Kartenpromotion oder Release-Gates.
- Keine Umbenennung interner Set-IDs ohne eigenes Migrationspaket.

## Akzeptanzkriterien

- [ ] Auswahl `Original NetGrid Set` filtert stabil auf Originalset-Karten.
- [ ] Karten aus anderen Sets bleiben bei aktivem Filter unsichtbar.
- [ ] Der Filter funktioniert gemeinsam mit Suche und Typfilter.
- [ ] Reload, Deckwechsel und erneutes Öffnen des Editors erhalten oder rekonstruieren den Filter korrekt.
- [ ] Test oder reproduzierbarer Komponenten-Smoke deckt den Set-ID/Label-Mapping-Fall ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind `apps/web/app/catalog-ui.ts`, Karteneditor-Komponenten in `apps/web/app/page.tsx` und Katalogdaten aus `packages/catalog`.
- Sichtbare Labels dürfen deutsch/benutzerfreundlich sein; Persistenz und Filterlogik sollten auf stabilen IDs beruhen.

## Ergebnisnotiz

Noch offen.
