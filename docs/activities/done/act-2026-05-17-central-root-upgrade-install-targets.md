---
activityId: act-2026-05-17-central-root-upgrade-install-targets
status: done
kind: fix
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "offers HQ and R&D root install targets for Antiquated Interface Routines|attributes Antiquated Interface Routines strength only to its own fort"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Upgrades in zentrale Server-Roots installieren

## Ziel

Die Korp soll Upgrades grundsätzlich nicht nur in neue oder bestehende Remote-Forts installieren können, sondern auch in die Root-Bereiche zentraler Server, insbesondere HQ und R&D. Ausnahmen gelten nur für Upgrades mit expliziter kartenspezifischer Einschränkung, insbesondere Regions oder andere server-/fortgebundene Sondertexte.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Beim Installieren eines Upgrades bietet die App aktuell nur `neues Fort` oder `Fort 1` an, aber keine zentralen Ziele wie HQ oder R&D.
- Konkreter Kartenfall vom 2026-05-17: `Antiquated Interface Routines` bietet bei der Installation nur externe/Remote-Forts an. Es sollte in HQ/R&D bzw. passende Server-Roots installierbar sein, sofern der Kartentext keine engere Einschränkung enthält.
- Nutzererinnerung: Upgrades können auch in HQ bzw. Research and Development installiert werden.
- Präzisierung vom 2026-05-17: Das soll grundsätzlich für alle Upgrades gelten, die es erlauben. Ausnahmeverdacht vor allem bei Regions bzw. Upgrades mit explizitem Einschränkungstext.
- Lokaler Doku-Anker: `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` nennt `Region-, Unique-, Console- und zentrale Root-Upgrade-Sonderfälle` als frühen No-Scope-Punkt. Das spricht dafür, dass zentrale Root-Upgrades als echter Regelfall existieren, aber ursprünglich nicht im MVP-Demo-Scope lagen.
- Board-Modell-Anker: Die Engine hat zentrale Server mit `root: []` für HQ und R&D; diese Root-Bereiche sollten für geeignete Upgrades nutzbar sein.

## Scope

- Regel-/Quellenlage für Upgrade-Installation in zentrale Server-Roots prüfen: HQ, R&D und ggf. Archives.
- `Antiquated Interface Routines` als konkreten Repro- und Regressionfall abdecken.
- Install-LegalActions für Upgrades so erweitern, dass zentrale Root-Ziele angeboten werden, wenn legal.
- Kartenspezifische Einschränkungen beachten, z. B. Region-/Serverbindung, Remote-only oder sonstige Zieltexte. Standardfall ist erlaubt; Einschränkungen sind die Ausnahme.
- UI-Zielauswahl und Board-Darstellung für zentrale Root-Upgrades prüfen.
- Access-/Trash-/Rez-/Redaction-Verhalten für zentrale Root-Upgrades gegen bestehende Remote-Root-Upgrades abgleichen.

## Nicht im Scope

- Keine Änderung daran, dass Nodes/Assets und Agendas grundsätzlich andere Installationsregeln als Upgrades haben.
- Keine Freischaltung kartenspezifischer Effekte, die über die Installation im zentralen Root hinausgehen.
- Keine Änderung an ICE-Installationsregeln.
- Keine Aufweichung von Hidden-Info-Redaction, Reconnect, Replay oder StateHash.

## Akzeptanzkriterien

- [x] Beim Installieren eines geeigneten Upgrades werden HQ und R&D als legale Ziele angeboten.
- [x] Die Zielableitung behandelt zentrale Root-Installation als Standard für Upgrades, nicht als einzelne Karten-Sonderfreigabe.
- [x] `Antiquated Interface Routines` kann in HQ/R&D bzw. passende zentrale Server-Roots installiert werden, wenn keine kartenspezifische Einschränkung entgegensteht.
- [x] Archives ist regelgeprüft und entweder korrekt angeboten oder begründet ausgeschlossen.
- [x] Remote-Fort-Installation für Upgrades bleibt weiterhin möglich.
- [x] Nodes/Assets und Agendas werden nicht fälschlich in zentrale Roots installierbar.
- [x] Rez-, Trash-, Access- und Sichtbarkeitsverhalten zentraler Root-Upgrades bleibt side-sicher.
- [x] `applyAction` revalidiert Zielserver, Kartentyp, Side, StateVersion und kartenspezifische Einschränkungen.
- [x] Fokussierte Engine- und Web-Regressionen decken mindestens HQ- und R&D-Upgrade-Installation ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind Upgrade-Install-Zielableitung in `packages/engine/src/index.ts` und Zielauswahl-/Board-Renderingpfade in `apps/web/app/page.tsx` bzw. `apps/web/app/action-board-ui.ts`.
- Zentrale Server besitzen bereits Root-Strukturen; prüfen, ob nur LegalAction-Generierung/UI-Auswahl fehlt oder ob Access-/Rez-Pfade Remote-only Annahmen enthalten.
- Bei Region-Upgrades besonders prüfen, ob sie zentrale Roots ausschließen oder mit `nur eine Region pro Fort` auch dort legal wären; diese Ausnahme nicht ungeprüft auf alle Upgrades übertragen.

## Ergebnisnotiz

Abgeschlossen. Die Engine erzeugt Root-Install-LegalActions für Upgrades nun über alle Server und validiert denselben Pfad in `applyAction`; zentrale HQ- und R&D-Roots sind damit für geeignete Upgrades legal, Remote-Forts bleiben legal. Archives bleibt bewusst ausgeschlossen, weil das aktuelle Modell `archives.root` bereits für die öffentlich projizierten Archivkarten verwendet und eine installierte Root-Karte dort ohne separates Modell-/Sichtbarkeits-Gate nicht sauber unterscheidbar wäre.

`Antiquated Interface Routines` ist als fokussierter Regressionsfall abgedeckt: HQ/R&D werden angeboten, `new_remote` bleibt verfügbar, Archives wird nicht angeboten, Agenda und Asset werden nicht in HQ/R&D angeboten, Side-/StateVersion-Revalidation schlägt erwartungsgemäß fehl, HQ-Installation bleibt bis zum Rez für den Runner verdeckt, nach dem Rez sichtbar, und Replay/StateHash bleiben deterministisch. Bestehende Root-Rez-, Access- und Trash-Pfade sind serverroot-basiert; der neue Test deckt den zentralen Root-Rez- und Sichtbarkeitspfad explizit ab.
