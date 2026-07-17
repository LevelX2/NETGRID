---
activityId: act-2026-07-17-own-deck-name-active-match-visibility
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt: 2026-07-17
completedAt: 2026-07-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/match-deck-details.ts
  - apps/web/app/match-deck-details.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/match-deck-details.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm exec prettier --check apps/web/app/match-deck-details.ts apps/web/app/match-deck-details.test.ts
  - git diff --check
---

# Eigenes Deck und KI-Deck in der Match-Statuszeile anzeigen

## Ziel

Die ein- und ausblendbare Match-Statuszeile soll den Namen des eigenen aktuellen Decks eindeutig anzeigen. In Partien eines Menschen gegen die KI soll sie zusätzlich den Namen des gegnerischen KI-Decks nennen; bei einem menschlichen Gegenüber bleibt dessen Deckname verborgen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-17: Während einer Partie gegen die KI ist der Name des eigenen Decks nicht klar auffindbar.
- Nutzerpräzisierung vom 2026-07-17: Es soll keine zusätzliche dauerhaft sichtbare Zeile entstehen. Die vorhandene ein- und ausblendbare Statuszeile reicht aus und soll dort `Eigenes Deck` sowie ausschließlich im Mensch-gegen-KI-Modus `KI-Deck` zeigen.
- `apps/web/app/page.tsx` rendert den eigenen Decknamen bereits aus `activeView.deckMetadata.own.deckName` im Match-Statusstreifen, bisher aber nur mehrdeutig als `Deck` und ohne KI-Decknamen.
- Der serverseitig ausgestellte und lokal persistierte `session.mode` unterscheidet `human_vs_human`, beide Mensch-gegen-KI-Seitenzuordnungen und den reinen Beobachtermodus `ai_vs_ai`.

## Scope

- In der vorhandenen ein- und ausblendbaren Match-Statuszeile den eigenen Namen als `Eigenes Deck` aus `activeView.deckMetadata.own.deckName` anzeigen.
- In `human_runner_vs_corp_ai` und `human_corp_vs_runner_ai` zusätzlich `KI-Deck` aus `activeView.deckMetadata.opponent.deckName` anzeigen.
- In `human_vs_human` keinen gegnerischen Decknamen anzeigen.
- Auch in `ai_vs_ai` keine Mensch-gegen-KI-Beschriftung vortäuschen; dieser Beobachtermodus bleibt außerhalb der gewünschten Gegenüberanzeige.
- Lange Namen über die vorhandene responsive Statuszeilen-Darstellung und den vollständigen `title`-Text zugänglich halten.
- Fokussierten Regression-Schutz für die Modusunterscheidung ergänzen.

## Nicht im Scope

- Keine zusätzliche dauerhaft sichtbare Deckzeile und kein Redesign der Topbar oder des Spielbretts.
- Keine Änderung an Deckauswahl, Deckeditor, KI-Deckauswahl oder Matchstart.
- Keine Anzeige oder Offenlegung gegnerischer Decklisten, Deck-Hashes oder anderer bislang nicht sichtbarer Deckmetadaten.
- Keine Anzeige des gegnerischen Decknamens in Mensch-gegen-Mensch-Partien.
- Keine Änderung an Rules Engine, KI-Entscheidungen, LegalActions, `applyAction`, Replay oder StateHash.

## Akzeptanzkriterien

- [x] Die ein- und ausblendbare Match-Statuszeile zeigt `Eigenes Deck` mit `activeView.deckMetadata.own.deckName`.
- [x] In beiden Mensch-gegen-KI-Modi zeigt dieselbe Statuszeile zusätzlich `KI-Deck` mit `activeView.deckMetadata.opponent.deckName`.
- [x] In Mensch-gegen-Mensch-Partien wird kein gegnerischer Deckname gerendert.
- [x] Der reine KI-gegen-KI-Beobachtermodus wird nicht als persönliches Mensch-gegen-KI-Spiel behandelt.
- [x] Fehlen `deckMetadata`, bleibt die Statuszeile stabil und zeigt keine irreführenden Deckplatzhalter.
- [x] Lange Decknamen bleiben über den vollständigen `title`-Text zugänglich und nutzen das vorhandene responsive Ellipsis-/Wrap-Verhalten der Statuszeile.
- [x] Es werden keine Decklisten, Deck-Hashes oder verdeckten Kartendaten offengelegt.
- [x] Fokussierter Webtest, Web-Typecheck und `git diff --check` sind grün oder ein bereits bestehender, paketfremder Fehler ist klar benannt.

## Umsetzungshinweise

- Maßgeblich bleiben die immutable Deckmetadaten aus dem aktiven `PlayerView`; nicht aus lokalem Deckeditor- oder Auswahlzustand ableiten.
- Die KI-Gegnererkennung soll auf dem serverseitig gelieferten `session.mode` beruhen und nur die beiden Mensch-gegen-KI-Modi akzeptieren.
- Wahrscheinliche Stellen:
  - `apps/web/app/page.tsx`
  - kleine testbare Modus-Hilfsfunktion unter `apps/web/app/`
- Bestehendes `matchStrip`-Styling weiterverwenden; keine neue permanente Leiste ergänzen.

## Ergebnisnotiz

Abgeschlossen. Die vorhandene ein- und ausblendbare Match-Statuszeile bezeichnet den eigenen Namen jetzt eindeutig als `Eigenes Deck`. Nur in den beiden Mensch-gegen-KI-Modi ergänzt sie das gegnerische `KI-Deck`; Mensch-gegen-Mensch und der reine KI-gegen-KI-Beobachtermodus zeigen keinen gegnerischen Decknamen. Die Zuordnung verwendet ausschließlich den serverseitigen Sessionmodus und die side-sicheren immutable Deckmetadaten des aktiven `PlayerView`. Es wurde keine zusätzliche Statuszeile angelegt.
