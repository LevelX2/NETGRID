---
activityId: act-2026-07-31-accessed-unrezzed-root-temporary-visibility
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/activities-worktree-20260731-203648
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/access/access-flow-context.ts
  - packages/engine/src/game/view/card-view.ts
  - packages/engine/src/game/view/player-view-projection.test.ts
  - packages/engine/src/index-tests/proteus/agenda-suite.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/agenda-suite.test.ts src/game/access/access-flow.test.ts src/game/view/player-view-projection.test.ts
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm format:changed
---

# Accessete ungerezzte Root-Karten nur für den Breach sichtbar halten

## Ziel

Eine accessete, weiterhin installierte und ungerezzte Korp-Root-Karte bleibt
für den Runner bis zum Ende des laufenden Breaches sichtbar und wird danach
wieder verdeckt dargestellt. Der Access darf weder einen dauerhaften
`faceup`-Zustand noch einen aktiven/gerezzten Effekt vortäuschen oder
erzeugen.

## Kontext und Quellen

- Nutzer-Playtest und Screenshot vom 31.07.2026: Nach dem HQ-Breach blieben
  zwei nicht getrashte, ungerezzte Upgrades für den Runner mit sichtbarer
  Vorderseite und grauem Ungerezzt-Streifen im HQ-Root liegen.
- Die lokale Comprehensive-Rules-Referenz
  `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`
  bestimmt in Regel 7.3.1a: Ein während eines Breaches accessetes Objekt
  bleibt für den Runner für den Rest dieses Breaches sichtbar.
- `packages/engine/src/game/access/access-flow-context.ts` setzt die
  accessete Karteninstanz derzeit auf `faceup: true`. Die PlayerView-
  Projektion behandelt `instance.faceup` bei installierten Korp-Karten als
  dauerhaft sichtbar, auch wenn der Run bereits beendet ist.
- Verwandter erledigter Zugriffsschnitt:
  `docs/activities/done/act-2026-05-17-hq-access-root-upgrade-sequence.md`.
  Da der neue Befund nach dessen Abschluss fortbesteht, ist dieses Paket ein
  eigenständiges Follow-up.

## Scope

- Temporäre Runner-Sichtbarkeit accesseter Root-Karten für den Rest des
  laufenden Breaches ausdrücklich modellieren, ohne ein ungerezztes Upgrade
  dauerhaft `faceup` zu setzen.
- HQ-, R&D- und Remote-Roots sowie mehrere Root-Kandidaten im selben Breach
  prüfen.
- Während des Breaches bereits accessete Root-Karten weiterhin für den Runner
  sichtbar halten, auch wenn gerade ein anderer Kandidat accesset wird.
- Beim Ende oder Abbruch des Breaches temporäre Sichtbarkeit deterministisch
  entfernen; gerezzte, dauerhaft exponierte oder durch einen anderen
  anhaltenden Effekt sichtbare Karten bleiben gemäß ihrem eigenen Vertrag
  sichtbar.
- Sicherstellen, dass bloßes Accessen keine Kartenfähigkeit aktiviert und
  kein Codepfad `faceup || rezzed` fälschlich als aktiven Effekt auswertet.
- PlayerView-, PublicEvent-, Reconnect-, Undo-, Replay- und StateHash-
  Verhalten für den Sichtbarkeitswechsel absichern.

## Nicht im Scope

- Kein dauerhafter persönlicher Notiz- oder Memory-Ledger für menschliche
  Spieler nach Ende des Breaches.
- Keine Änderung an Rez-Regeln, Trash-Entscheidungen, Access-Reihenfolge oder
  den Effekten von `Twenty-Four-Hour Surveillance`.
- Keine Offenlegung nicht accesseter HQ-Handkarten oder noch nicht accesseter
  Root-Kandidaten.
- Keine pauschale Umdeutung von `faceup` für Archives, Expose-Effekte oder
  tatsächlich gerezzte Karten.

## Akzeptanzkriterien

- [x] Ein ungerezztes Root-Upgrade ist vor seinem Access für den Runner
      verdeckt, während des eigenen Access sichtbar und bleibt für den Rest
      desselben Breaches sichtbar.
- [x] Nach Breach-/Run-Ende ist dasselbe weiterhin ungerezzte Upgrade wieder
      verdeckt; Titel, Definition und Regeltext fehlen in der aktuellen
      Runner-PlayerView.
- [x] Ein gerezztes oder anderweitig dauerhaft sichtbares Upgrade bleibt nach
      dem Breach korrekt offen.
- [x] Access allein setzt keinen aktiven Kartenstatus und löst keinen Effekt
      aus, der Rez oder eine andere ausdrückliche Aktivierung verlangt.
- [x] Reconnect und Undo rekonstruieren die Sichtbarkeit aus dem jeweiligen
      Breach-Zustand, ohne zusätzliche Hidden-Info preiszugeben.
- [x] PublicEvents und Chronik dürfen den rechtmäßig beobachteten Access
      side-sicher dokumentieren, machen die installierte Karte aber nicht als
      aktuelle öffentliche Boardkarte sichtbar.
- [x] Replay und StateHash bleiben deterministisch; fokussierte Tests decken
      HQ-Multiaccess, Remote-Root, Breach-Ende und dauerhafte Sichtbarkeits-
      Gegenfälle ab.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Die temporäre Sichtbarkeit gehört in den Breach-/Run-Vertrag oder eine
  gleichwertige explizite Zustandsstruktur, nicht in ein UI-seitiges
  Erinnerungs-Flag und nicht in `CardInstance.faceup`.
- Besonders `visibleCorpCard` und alle Mechanikpfade prüfen, die
  `faceup || rezzed` als Sichtbarkeits- oder Aktivitätsabkürzung verwenden.
- Die aktuelle Karte und die Menge früherer Zugriffe desselben Breaches
  müssen getrennt von zukünftigen Kandidaten bleiben.

## Ergebnisnotiz

Der Access mutiert installierte Root-Karten sowie Karten in HQ und R&D nicht
mehr dauerhaft auf `faceup`. Die Runner-PlayerView leitet die temporäre
Sichtbarkeit bereits accesseter installierter Root-Karten stattdessen aus der
laufenden Breach-Queue ab. Damit bleiben sie innerhalb desselben Breaches
sichtbar und werden bei Run-Ende, Reconnect oder Undo automatisch wieder
verdeckt. Archives behalten ihre bestehende dauerhafte Aufdeckung. Remote-,
HQ- und R&D-Zugriffe, Hidden-Info-Gegenfälle sowie Replay und StateHash sind
durch fokussierte und vollständige Engine-Tests abgesichert.
