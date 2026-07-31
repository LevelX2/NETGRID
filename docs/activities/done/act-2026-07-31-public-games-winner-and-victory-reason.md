---
activityId: act-2026-07-31-public-games-winner-and-victory-reason
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/activities-worktree-20260731-215600
releaseTarget: Current private playtest
blockedBy: []
resultArtifacts:
  - apps/web/features/games/public-games-model.ts
  - apps/web/features/games/PublicGamesPanel.tsx
  - apps/web/app/globals.css
  - apps/web/features/games/public-games-model.test.ts
  - apps/web/features/games/public-games-winner-display.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- apps/web/features/games/public-games-model.test.ts apps/web/features/games/public-games-compact-view.test.ts apps/web/features/games/public-games-winner-display.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web build
  - corepack pnpm format:changed
  - git diff --check
---

# Spieleliste: Gewinner und konkreten Sieggrund hervorheben

## Ziel

Abgeschlossene Partien in der öffentlichen `Spiele`-Liste sollen in der
ausführlichen Darstellung auf einen Blick zeigen, welcher Teilnehmer gewonnen
hat und wodurch das Spiel entschieden wurde. Nicht über Agenda-Punkte
entschiedene Spiele – insbesondere Flatline und leeres Korp-R&D – dürfen nicht
mehr unter der unspezifischen Anzeige `Regulär beendet` verschwinden.

## Kontext und Quellen

- Nutzeranforderung vom 31.07.2026: Bei einem abgeschlossenen Spiel
  `Spieler gegen Spieler` war in der Spieleliste an den beiden Namen nicht
  unmittelbar erkennbar, wer gewonnen hatte. Der Gewinner soll dort sichtbar
  und hochwertig hervorgehoben werden, beispielsweise durch einen
  Glitzer-/Sieger-Effekt oder ein ähnlich prägnantes Motiv.
- In der ausführlichen Listenansicht sollen neben Agenda-Siegen mindestens
  Flatline und ein Sieg durch leeres Korp-R&D verständlich erkennbar sein.
- `packages/shared/src/api-contracts.ts` stellt mit
  `ApiMatchResultSnapshot` bereits eine viewer-neutrale autoritative
  Ergebnisquelle bereit. Sie enthält `winner`, `winnerSide`, optional
  `loserSide`, die Anzeigenamen beider Seiten und `reason`.
- Der vorhandene `ApiGameResultReason` unterscheidet aktuell
  `agenda_points`, `bad_publicity_7`, `corp_deck_empty`, `flatline`, `draw`,
  `forfeit`, `time_expired` und `unknown`.
- `apps/web/features/games/public-games-model.ts` unterscheidet derzeit nur
  Aufgabe, Zeitablauf und unbekannten Abschluss. Alle übrigen Gründe werden
  pauschal als `Regulär beendet` dargestellt.
- `apps/web/features/games/PublicGamesPanel.tsx` zeigt in der ausführlichen
  Form zwar Agenda-/Matchpunkte und den generischen Text `Runner gewinnt`
  beziehungsweise `Korp gewinnt`, rendert die beiden Teilnehmernamen aber
  nur als gemeinsamen unstrukturierten `A vs B`-Text. Dadurch kann genau der
  Gewinnername nicht gezielt markiert werden.
- `apps/web/features/recent/RecentGamesPanel.tsx` besitzt bereits deutsche
  Bedeutungen für die unterstützten Ergebnisgründe und kann als sprachliche
  Referenz dienen; die öffentliche Liste soll aber einen eigenen kompakten
  Listenvertrag behalten.
- Führender bestehender Gesamtvertrag:
  `docs/reviews/public-game-directory-and-personal-history-final-review-2026-07-20.md`.
- Visueller Präzedenzfall für eine klare Gewinnerdarstellung:
  `docs/activities/done/act-2026-05-19-result-modal-winner-visual-replay-save-label.md`.

## Scope

- In der ausführlichen Darstellung abgeschlossener Spiele den konkreten
  `ApiGameResultReason` mit verständlichem deutschem Text anzeigen, mindestens:
  - `agenda_points`: Sieg durch Agenda-Punkte;
  - `flatline`: Runner wurde flatlined beziehungsweise Korp-Sieg durch
    Flatline;
  - `corp_deck_empty`: Korp konnte nicht mehr aus R&D ziehen beziehungsweise
    Runner-Sieg durch leeres R&D;
  - `bad_publicity_7`: Korp verliert durch 7 Bad Publicity;
  - `forfeit`: Aufgabe einschließlich aufgebendem Teilnehmer, sofern
    vorhanden;
  - `time_expired`: Zeitablauf einschließlich betroffener Seite, sofern
    vorhanden;
  - `draw`: Unentschieden;
  - `unknown`: Abschlussart unbekannt.
- Die Texte aus dem autoritativen Ergebnisgrund ableiten und nicht aus dem
  Agenda-Punktestand erraten. Ein Flatline- oder R&D-Deckout-Sieg darf daher
  auch bei einem nicht siegfähigen Agenda-Zwischenstand korrekt erscheinen.
- Die Teilnehmerzeile für abgeschlossene Spiele strukturiert nach Runner und
  Korp rendern, sodass der durch `winnerSide` bezeichnete konkrete Name
  gezielt hervorgehoben werden kann.
- Den Gewinnernamen mit einem klaren, hochwertigen Siegersignal markieren,
  beispielsweise einer kleinen Krone oder Trophäe, einem goldenen Rahmen und
  einem dezenten einmaligen Glanz-/Sparkle-Effekt. Die Gestaltung soll zum
  bestehenden NETGRID-Stil passen und nicht wie ein generischer Browser-Badge
  wirken.
- Die Hervorhebung zusätzlich semantisch als `Gewinner` zugänglich machen.
  Sie darf nicht ausschließlich von Farbe, Animation oder visueller
  Wahrnehmung abhängen.
- Animationen müssen `prefers-reduced-motion` respektieren. In diesem Modus
  bleiben Krone/Trophäe, Label und statische Hervorhebung erhalten.
- Bei `human_vs_human` müssen tatsächliche Anzeigenamen sichtbar bleiben,
  etwa sinngemäß `🏆 Alice (Runner) vs Bob (Korp)`. Dieselbe Seitenlogik gilt
  für Mensch-gegen-KI und KI-gegen-KI.
- Bei Unentschieden keinen der beiden Teilnehmer fälschlich als Gewinner
  markieren; stattdessen einen neutralen Abschlussstatus verwenden.
- Für fehlende oder historische Ergebnisfelder robuste Fallbacks behalten:
  `winner` beziehungsweise der vorhandene Listeneintrag darf als
  Seitenfallback dienen, Namensgleichheit aber niemals zur Gewinnerermittlung.
- Die kompakte Darstellung darf weiterhin platzsparend bleiben. Sie soll
  mindestens keinen falschen Grund anzeigen und kann einen kurzen Grund wie
  `Flatline`, `R&D leer`, `Agenda-Sieg` oder `Bad Publicity` verwenden, sofern
  dies ohne Layoutbruch möglich ist.

## Nicht im Scope

- Keine Änderung an Engine-Siegbedingungen, deren Priorität oder dem
  autoritativen Gewinner.
- Keine Änderung an `ApiMatchResultSnapshot`, Persistenz, historischem
  Backfill oder Server-Endpunkten, solange die bereits gelieferten Felder
  ausreichen.
- Keine Unterscheidung der konkreten Damage-Art einer Flatline. Der aktuelle
  Ergebnisvertrag enthält `flatline`, aber keinen terminalen Net-, Meat- oder
  Core-/Brain-Damage-Untergrund; eine solche Erweiterung wäre ein separates
  Datenvertragspaket.
- Kein Redesign der gesamten öffentlichen Spieleübersicht, ihrer Filter,
  Sortierung oder Aktionen `Beitreten`, `Zuschauen`, `Replay ansehen` und
  `Spielprotokoll herunterladen`.
- Keine dauerhafte, flächige oder stark blinkende Animation, die mehrere
  abgeschlossene Listeneinträge gleichzeitig unruhig macht.
- Keine Gewinnerermittlung anhand von Anzeigenamen, CSS-Reihenfolge,
  Agenda-Punktestand oder Clientannahmen.
- Keine Offenlegung zusätzlicher Match-, Replay-, Account-, Deck- oder
  Hidden-Info-Daten.
- Keine parallele Neugestaltung von Result Modal oder `Meine Spiele`. Eine
  kleine gemeinsame Reason-Label-Hilfe ist zulässig, wenn dadurch keine
  bestehende persönliche Darstellung regressiert.

## Akzeptanzkriterien

- [x] Die ausführliche Darstellung eines Agenda-Siegs nennt Agenda-Punkte als
      Sieggrund und markiert genau den autoritativen Gewinnernamen.
- [x] Ein Korp-Sieg mit `reason: flatline` zeigt verständlich `Flatline` und
      markiert den Korp-Teilnehmer als Gewinner, unabhängig vom
      Agenda-Punktestand.
- [x] Ein Runner-Sieg mit `reason: corp_deck_empty` zeigt verständlich, dass
      die Korp nicht mehr aus R&D ziehen konnte beziehungsweise R&D leer war,
      und markiert den Runner-Teilnehmer als Gewinner.
- [x] `bad_publicity_7`, `forfeit`, `time_expired`, `draw` und `unknown`
      besitzen jeweils eine passende, nicht irreführende Darstellung.
- [x] Bei `human_vs_human` mit zwei individuellen Anzeigenamen wird der
      richtige Name unabhängig von Runner-/Korp-Seite eindeutig als Gewinner
      hervorgehoben.
- [x] Zwei identische Anzeigenamen führen nicht zu zwei Gewinner-Markierungen;
      allein `winnerSide` beziehungsweise der autoritative Seitenfallback
      entscheidet.
- [x] Bei Unentschieden erhält kein Teilnehmer Krone, Trophäe,
      Gewinner-Label oder Siegeranimation.
- [x] Die Gewinnerkennzeichnung ist per Text beziehungsweise ARIA-Semantik
      zugänglich und bleibt ohne Farbe sowie bei `prefers-reduced-motion`
      verständlich.
- [x] Der visuelle Effekt ist in mehreren abgeschlossenen Zeilen ruhig und
      lesbar; Namen, Status, Punkte, Grund und Aktionen überdecken sich auf
      Desktop und schmalem Layout nicht.
- [x] Die kompakte Ansicht bleibt einzeilig und höhenstabil oder dokumentiert
      bewusst, warum dort nur ein kurzer Sieggrund ohne Namensanimation
      erscheint.
- [x] Web-Regressionstests decken mindestens Agenda-Sieg, Flatline,
      `corp_deck_empty`, Bad Publicity, Aufgabe, Zeitablauf, Draw, unbekannten
      Abschluss, Mensch-gegen-Mensch mit individuellen Namen sowie
      Reduced-Motion-/Semantikklassen ab.
- [x] Web-Typecheck, fokussierte Webtests, Web-Build,
      `corepack pnpm format:changed` und `git diff --check` sind erfolgreich.

## Umsetzungshinweise

- Primärer Folgeagent ist `small-adjustments-agent`; Ergebnis- und
  Persistenzverträge sind bereits vorhanden, der Schnitt betrifft
  Modelableitung, strukturiertes Rendering, Texte und Styling.
- Ausgangspunkte sind
  `apps/web/features/games/public-games-model.ts`,
  `apps/web/features/games/PublicGamesPanel.tsx`,
  `apps/web/features/match-start/public-match-navigation.ts`, die zugehörigen
  Webtests und `apps/web/app/globals.css`.
- Eine abgeleitete View-Struktur wie
  `{ side, displayName, isWinner }` ist robuster als nachträgliches Parsen des
  bestehenden Strings aus `publicMatchParticipantLabel(...)`.
- Den Sieggrund möglichst über eine exhaustive Abbildung von
  `ApiGameResultReason` formatieren, damit neu hinzukommende Gründe nicht
  unbemerkt wieder als `Regulär beendet` erscheinen.
- Visuellen Glanz auf ein kurzes Intro oder eine sehr dezente statische
  Oberfläche begrenzen. `prefers-reduced-motion: reduce` muss jede Bewegung
  abschalten, ohne die Gewinnerbedeutung zu verlieren.

## Ergebnisnotiz

Die öffentliche Spieleliste leitet nun sämtliche vorhandenen Ergebnisgründe
exhaustiv aus `ApiGameResultReason` ab. Abgeschlossene Partien rendern Runner
und Korp getrennt; ausschließlich die autoritative Gewinnerseite erhält eine
zugängliche Gewinnerkennzeichnung, Krone, goldene Kontur und einen einmaligen
Glanz. Draws bleiben neutral, Namensgleichheit beeinflusst die Auswertung
nicht, historische Listeneinträge nutzen weiterhin den vorhandenen
seitenbasierten Fallback. Die kompakte 38-Pixel-Zeile zeigt Kurzgründe und
unterdrückt die Animation; Reduced Motion erhält alle statischen Signale.
