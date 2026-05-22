---
activityId: act-2026-05-22-human-corp-run-rez-window-root-cards
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/engine/src/public-context.ts
  - packages/shared/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t 'blocks Runner movement while Corp has a root rez decision during a run|does not spend Smarteye when declined'
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check -- packages/engine/src/index.ts packages/engine/src/index.test.ts packages/engine/src/public-context.ts packages/shared/src/index.ts docs/activities/in-progress/act-2026-05-22-human-corp-run-rez-window-root-cards.md
---

# Menschliche Korp-Rezfenster im Run blockierend machen

## Ziel

Wenn die Korp während eines Runs legal Karten rezzen darf, muss eine menschliche Korp eine echte Entscheidungsmöglichkeit erhalten. Der Run darf nicht automatisch weiterlaufen, solange eine legale Rez-/Pass-Entscheidung offen ist.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Runner macht einen Run auf Remote 1 mit zwei unrezzed Upgrades im Root; die Sequenz läuft nach kurzer Anzeigezeit automatisch weiter, ohne dass die Korp explizit rezzen oder passen kann.
- Nutzerbewertung: spielentscheidender Timing-Fehler, kein Komfortpunkt.
- Mögliche Ursachen laut Nutzer: Run-State-Machine berücksichtigt nur ICE-Rezfenster, Auto-Advance/AI/Animationslogik überspringt menschliche Korp-Rezfenster, LegalActions werden nicht blockierend behandelt oder ein Timer wird als implizites Passen interpretiert.
- Relevante UI-Hinweise: Webclient besitzt Auto-End-Turn/Korp-Pflichtdraw-Einstellungen und AI-Pacing; Run-Rezfenster dürfen dadurch nicht für menschliche Korp übersprungen werden.

## Scope

- Run-Timingpunkte identifizieren, an denen die Korp Root-Upgrades, Nodes oder andere rezbare Karten im betroffenen Server legal rezzen darf.
- Für menschliche Korp sicherstellen, dass legale Rez-Entscheidungen als blockierend gelten.
- Explizite Pass-/Weiter-Aktion anbieten, z. B. `Nichts rezzen / Weiter`, wenn die Korp nicht rezzen will.
- Auto-Advance, AI-Pacing und Animation/Countdown gegen diese blockierenden Entscheidungen absichern.
- Human-vs-Human und Human-vs-AI getrennt prüfen.

## Nicht im Scope

- Keine neue Automatikmodus-Funktion für Rezfenster.
- Keine Änderung an Rez-Kosten oder legalen Kartentypen außer zur korrekten Timingfenster-Ermittlung.
- Keine automatische Korp-Entscheidung bei menschlicher Korp.
- Keine Hidden-Info-Leaks über rezbare Root-Karten an den Runner.

## Akzeptanzkriterien

- [x] Bei einem Run auf einen Remote mit unrezzed Root-Upgrades erhält die menschliche Korp vor dem relevanten nächsten Schritt eine blockierende Rez-/Pass-Entscheidung.
- [x] Der Runner kann nicht automatisch in Access oder die nächste Run-Phase springen, solange diese Korp-Entscheidung offen ist.
- [x] `Nichts rezzen / Weiter` oder äquivalente Pass-Aktion ist klar sichtbar und wird als bewusste Korp-Entscheidung protokolliert.
- [x] Auto-End-Turn, AI-Pacing und Cue-Auto-Dismiss lösen kein implizites Korp-Passen aus.
- [x] Human-vs-Human und Human-vs-AI sind geprüft; KI darf nur für KI-Korp automatisiert entscheiden.
- [x] Tests decken ICE-Rezfenster und Root-Upgrade/Node-Rezfenster im Run getrennt ab.

## Umsetzungshinweise

- Zuerst Engine-LegalActions und Run-State-Machine prüfen: Gibt es an diesen Timingpunkten überhaupt Root-Rez-Actions?
- Danach Webclient prüfen: Falls LegalActions existieren, müssen sie in der aktiven Entscheidung bleiben und dürfen nicht durch lokale Timer/AI-Advance verborgen werden.
- PublicEvents und PlayerViews dürfen dem Runner nur zeigen, dass die Korp eine Entscheidung hat oder gepasst hat, nicht welche verdeckten Karten rezbar waren.

## Ergebnisnotiz

Erledigt. `run.jack_out_window` behandelt offene Korp-Root-Rez-Aktionen jetzt als blockierende Korp-Entscheidung: Runner-LegalActions bleiben leer, bis die Korp alle gewünschten Root-Karten gerezzt oder explizit `Nichts rezzen / Weiter` gewählt hat. Der Pass wird als öffentlicher `decline_rez`-Event mit Serverlabel protokolliert, ohne verdeckte Root-Kartennamen an den Runner zu leaken. Der bestehende ICE-Rez-Pass bleibt unverändert; ein neuer Engine-Test deckt Root-Rezfenster separat ab.
