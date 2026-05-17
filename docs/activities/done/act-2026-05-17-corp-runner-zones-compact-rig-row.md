---
activityId: act-2026-05-17-corp-runner-zones-compact-rig-row
status: done
kind: fix
area: ui
priority: hotfix
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: board UX
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test
  - Browser/Playwright layout check desktop 1280x900
  - Playwright layout check narrow 390x900
---

# Runner-Zonen in Korp-Sicht kompakt hinter dem Rig platzieren

## Ziel

Die Runner-Zonen `Crib`/`Grip`, `Stack` und `Heap` sollen aus Korp-Sicht nicht mehr in der HQ-/Korp-Zeile liegen, sondern kompakt beim Runner-Bereich hinter bzw. neben dem Rig erscheinen. Die Runner-Hand (`Crib`/`Grip`) darf dabei nur als Zähler sichtbar sein und braucht keinen Karten-Slot oder eine große Platzhalterfläche.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Nach der früheren Ergänzung der Runner-Zonen aus Korp-Sicht liegen `Crib`, `Stack` und `Heap` aktuell visuell in bzw. bei der Headquarter-Zeile der Korp. Erwartet ist eine Platzierung ganz oben im Runner-Bereich, hinter dem Rig in einer Zeile.
- Nutzerpriorität: als `Fixed Priority` gemeldet; nach erweiterter Activity-Konvention als `priority: hotfix` eingeordnet, damit das Paket bei passender Rolle vor normalen `high`-Paketen bearbeitet wird.
- Vorgängerpaket: `docs/activities/done/act-2026-05-17-runner-heap-and-hidden-zone-counts.md` hat die Daten-/Sichtbarkeitsgrundlage hergestellt. Dieses Follow-up betrifft primär Layout und Informationsdichte.
- Aktueller Code-Spotcheck aus der Suche: `apps/web/app/page.tsx` enthält in der Korp-Perspektive `RunnerRigStrip` und danach separate `SideZoneFrame`-Blöcke für `Grip`, `Stack` und `Heap`; diese Struktur ist der wahrscheinliche Startpunkt.
- Hidden-Info-Grenze bleibt führend: Die Korp darf Runner-Hand- und Stack-Inhalte nicht sehen; öffentliche Heap-Karten dürfen weiterhin einsehbar bleiben.

## Scope

- Korp-Perspektive des Spielbretts anpassen: Runner-`Crib`/`Grip`, `Stack` und `Heap` kompakt in den Runner-Bereich hinter/neben das Rig verschieben.
- `Crib`/`Grip` als schmalen Informationsbalken oder kompaktes Stat-Element darstellen, z. B. `Crib 5 von 5 Karten` bzw. der projektweit gültige UI-Begriff.
- Große Platzhalterfläche wie `Crib-Inhalte verborgen` entfernen, weil dort aus Korp-Sicht nie Karteninhalte sichtbar sein dürfen.
- `Stack` ebenfalls kompakt als Zähler darstellen; keine verdeckten Stack-Karten, Kartenrücken oder unterscheidbaren Ladezustände anzeigen.
- `Heap` in derselben kompakten Zeile aufnehmen, dabei die öffentliche Einsehbarkeit des Heaps erhalten, z. B. über kompakten Zähler plus bestehende/aufklappbare Detailansicht.
- Tooltips oder kurze Accessible Labels nutzen, um `Crib`/`Grip` als Runner-Handkarten, `Stack` als Runner-Deck und `Heap` als Runner-Ablage verständlich zu machen.
- Mobile und schmale Viewports prüfen, damit Rig und Zonenzähler nicht überlappen.

## Nicht im Scope

- Keine Änderung an Engine, PlayerView-Datenvertrag, LegalActions, Replay oder StateHash.
- Keine Anzeige verdeckter Runner-Hand- oder Stack-Inhalte für die Korp.
- Keine Änderung an Heap-/Grip-/Stack-Regeln, Damage, Draw, Trash oder Such-/Reveal-Effekten.
- Keine komplette Board-Neugestaltung und keine Änderung der Korp-HQ-/R&D-/Archives-Serverlogik.
- Keine Änderung an der Runner-Eigensicht, außer kleine Layout-Anpassungen sind technisch nötig und regressionsfrei.

## Akzeptanzkriterien

- [x] In der Korp-Sicht stehen Runner-`Crib`/`Grip`, `Stack` und `Heap` nicht mehr in der HQ-/Korp-Zeile.
- [x] Die drei Runner-Zonen erscheinen kompakt beim Runner-Rig in einer Zeile oder einem vergleichbar schmalen Runner-Zonenbalken.
- [x] `Crib`/`Grip` zeigt nur den Count bzw. Handlimit-Count, keine Karten-Slots und keine große `Inhalte verborgen`-Fläche.
- [x] `Stack` zeigt nur öffentliche Zählinformationen und leakt keine Karteninhalte oder unterscheidbaren Kartenrücken.
- [x] `Heap` bleibt als öffentliche Zone weiterhin auffindbar und bei Bedarf einsehbar.
- [x] Bestehende Hidden-Info-/Visibility-Regressionen bleiben grün; bei UI-Tests wird die Korp-Sicht der Runner-Zonen ergänzt oder angepasst.
- [x] Das Layout bleibt auf Desktop und schmalem Viewport ohne Überlappung lesbar.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Wahrscheinliche Startpunkte: `apps/web/app/page.tsx` rund um `RunnerRigStrip`, `runnerGripHeapLayout`, `SideZoneFrame` für `Grip`, `Stack`, `Heap` und die zugehörigen Styles in `apps/web/app/globals.css`.
- Den bestehenden Sichtbarkeitsvertrag aus `act-2026-05-17-runner-heap-and-hidden-zone-counts` wiederverwenden, nicht neu modellieren.
- Wenn die UI einen endgültigen Begriff erzwingt, `Grip` als regelüblichen Runner-Hand-Begriff und `Crib` als Nutzerbezeichnung im Kontext behandeln; sichtbare deutsche UI-Texte knapp halten.

## Ergebnisnotiz

Erledigt. Die Korp-Sicht rendert Runner-`Grip`, `Stack` und `Heap` jetzt in einem neuen kompakten `RunnerOpponentZonesStrip` direkt beim gegnerischen Rig. `Grip` und `Stack` zeigen nur Zähler und Accessible Labels; der `Stack` nutzt dort keine Kartenrücken mehr. `Heap` bleibt über ein kompaktes Details-Element auffindbar und kann öffentliche Heap-Karten weiterhin anzeigen.

Der untere Zonenblock der Korp-Sicht enthält nur noch `HQ`; Runner-Zonen liegen dort nicht mehr. Desktop- und schmale Playwright-Prüfungen bestätigten den neuen Block innerhalb des Board-Rahmens, `lowerRunnerZoneFrames: 0`, `opponentStackBacks: 0` und genau einen `HQ`-Block in der unteren Zonenfläche.
