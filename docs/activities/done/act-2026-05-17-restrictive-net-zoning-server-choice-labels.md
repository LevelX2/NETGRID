---
activityId: act-2026-05-17-restrictive-net-zoning-server-choice-labels
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Restrictive\""
  - "corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts app/chronicle.test.ts"
  - "corepack pnpm --filter @netgrid/shared typecheck"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
---

# Restrictive Net Zoning: Serverauswahl und Zielbindung sichtbar machen

## Ziel

`Restrictive Net Zoning` soll beim Ausspielen menschenlesbare Serveroptionen zeigen und den gewählten Server danach dauerhaft sichtbar halten.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Die Auswahl zeigt offenbar mehrfach nur Kostenwerte statt Servernamen.
- Nutzeranforderung vom 2026-05-17: Nach der Auswahl muss erkennbar bleiben, auf welchen Server sich die Karte bezieht.
- Lokaler Kartenanker: `onr_v1_173_restrictive-net-zoning`.

## Scope

- Choice-Erzeugung und Choice-Rendering für serverbezogene Optionen prüfen.
- Optionen mit klaren Labels wie `HQ`, `R&D`, `Archives`, `Remote Server 1` versehen.
- Gewählte Serverbindung persistent speichern und in Karte, Tooltip oder Statuschip anzeigen.
- Chronik-Eintrag für die gewählte Zielbindung ergänzen.
- Reload, Reconnect und Multiplayer-Sync berücksichtigen.

## Nicht im Scope

- Kein Redesign aller Choice-Dialoge.
- Keine Änderung an den eigentlichen Installkosten der Karte außer bei nachgewiesenem Bug.

## Akzeptanzkriterien

- [x] Jede auswählbare Serveroption hat ein menschenlesbares Label; Kosten sind höchstens Zusatzinformation.
- [x] Nach Ausspielen zeigt die Karte oder ihr Tooltip den Zielserver dauerhaft an.
- [x] Die Chronik nennt den gewählten Server ohne Hidden-Info-Leak.
- [x] Reload/Reconnect/Multiplayer erhalten die Zielbindung korrekt.
- [x] Regressionen decken mindestens zentrale Server und einen Remote Server ab.

## Umsetzungshinweise

- Prüfen, ob ein generisches Pflichtfeld `displayLabel` für Choice-Optionen sinnvoll ist.
- Hidden-Info-Grenze: Servernamen und öffentliche Serverstruktur sind erlaubt; verdeckte installierte Karten dürfen nicht namentlich leaken.

## Ergebnisnotiz

Abgeschlossen. `Restrictive Net Zoning` erzeugt servergebundene Installoptionen mit expliziten Labels für zentrale Server und Remote Server, zeigt die gewählte Zielbindung nach dem Installieren über die öffentliche `VisibleCard` im Karten-/Tooltip-Detail an und schreibt `selectedServerLabel` in die öffentliche Chronik. Die Bindung bleibt über PlayerView/Reconnect/Multiplayer erhalten, weil sie aus dem persistenten `CardInstance.selectedServerId` abgeleitet wird; es werden nur öffentliche Servernamen übertragen.
