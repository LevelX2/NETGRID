---
activityId: act-2026-05-19-result-modal-imagegen-victory-motifs
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: result modal UX
blockedBy: []
relatedActivities:
  - act-2026-05-19-result-modal-winner-visual-replay-save-label
resultArtifacts:
  - apps/web/public/result-motifs/result-runner-victory.png
  - apps/web/public/result-motifs/result-corp-victory.png
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/result-modal-ui.ts
  - apps/web/app/result-modal-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- result-modal-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
---

# Ergebnisfenster: ImageGen-Siegmotive und knapper Siegertext

## Ziel

Die aktuelle codebasierte Siegergrafik im Ergebnisfenster soll durch eigene generierte Bitmap-Motive ersetzt oder ergänzt werden. Die neuen Motive müssen mit ImageGen-2 aus dem Motiv der Startseite abgeleitet sein und im gleichen visuellen Stil jeweils eine Runner- und eine Korp-Siegvariante zeigen. Außerdem soll das Ergebnisfenster die Gewinnbotschaft nicht mehrfach wiederholen: Einmal deutlich `Du hast das Spiel gewonnen.` reicht.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19 mit Screenshot:
  - Die aktuelle Siegergrafik im Result Modal ist nicht nach Geschmack.
  - Gewünscht ist keine abstrakte Liniengrafik, sondern eine Variation des Startseitenmotivs.
  - Es soll je ein Motiv für Runner-Sieg und Korp-Sieg geben.
  - Die Motive sollen im gleichen Stil wie die Startseitengrafik wirken.
- Nutzerbeobachtung vom 2026-05-19:
  - Im Ergebnisfenster steht zu oft, dass man gewonnen hat.
  - Eine primäre Gewinn-Aussage reicht; weitere Stellen sollen nicht erneut `gewonnen`/`gewinnt` wiederholen.
- Bestehendes erledigtes Paket:
  - `act-2026-05-19-result-modal-winner-visual-replay-save-label` hat das Result Modal bereits um ein codebasiertes Runner-/Korp-/Draw-Motiv erweitert.
  - Dieses Follow-up ersetzt die gestalterische Ausführung, nicht die Ergebnislogik.
- Relevante aktuelle Artefakte:
  - Startseitenmotiv: `apps/web/public/backgrounds/netgrid-startscreen-cyberworld.png`.
  - Result Modal: `apps/web/app/page.tsx`, `ResultWinnerMotif`.
  - Styling: `apps/web/app/globals.css`, `.resultWinnerMotif`, `.resultMotifFrame`.
  - Helper/Test: `apps/web/app/result-modal-ui.ts`, `apps/web/app/result-modal-ui.test.ts`.

## Scope

- ImageGen-2 verwenden, um aus dem Startseitenmotiv zwei stilgleiche lokale Siegerbild-Varianten zu erzeugen:
  - Runner-Sieg: Runner-Motiv, klar als Runner-Sieg erkennbar.
  - Korp-Sieg: Korp-/Corporation-Motiv, klar als Korp-Sieg erkennbar.
- Die Motive sollen eine Variation des Startseitenmotivs sein, nicht ein völlig anderer Stil:
  - gleiche cyberweltartige Farb-/Lichtstimmung,
  - passende Linien-/Circuit-/Netzstruktur,
  - keine generischen Stock-Illustrationen,
  - keine offizielle Netrunner-/Fremd-Art, keine Card Frames, Logos oder Card Backs als Bildinhalt.
- Generierte Assets lokal versionieren, vorzugsweise unter einem passenden Web-Public-Pfad, z. B. `apps/web/public/result-motifs/`.
- Result Modal so anpassen, dass Runner-/Korp-Sieg diese Bitmap-Motive zeigt statt nur das aktuelle abstrakte CSS-Linienmotiv.
- Ergebnistext entdoppeln:
  - Die Hauptüberschrift darf weiter die klare Aussage tragen, z. B. `Du hast das Spiel gewonnen.`
  - Weitere Bereiche wie Motivlabel, Footer oder Statuszeile sollen neutraler formulieren, z. B. `Runner`, `Korp`, `Deine Seite`, `10 MP`, `Spielwertung`, statt erneut `Runner-Sieg`, `Deine Seite gewinnt` oder ähnliche Wiederholungen.
  - Bei Niederlage und Draw ebenfalls prüfen, dass die Botschaft nicht unnötig mehrfach wiederholt wird.
- Draw-Zustand sauber behandeln:
  - entweder eigene neutrale Variation,
  - oder bewusst keine Siegergrafik,
  - aber kein falsches Runner-/Korp-Motiv.
- Layout beibehalten oder nur eng anpassen:
  - Desktop: Motiv rechts/seitlich gut sichtbar, nicht zu klein.
  - Mobile: Motiv darf kompakter werden, aber nicht Texte, Serienwertung oder Buttons verdrängen.
- Accessibility:
  - Motiv hat ein sinnvolles `alt`/`aria-label` wie `Runner-Sieg` oder `Korp-Sieg`, wenn es informativ ist.
  - Rein dekorative Teile bleiben `aria-hidden`.

## Nicht im Scope

- Keine Änderung an Gewinnerermittlung, ResultSummary, Serienwertung, Replay, StateHash oder Retention-Sicherung.
- Kein erneutes Redesign des gesamten Endbildschirms.
- Keine offiziellen oder extern geschützten Artworks.
- Keine Änderung an Startseite oder Startseitenmotiv selbst.
- Keine dynamische Generierung zur Laufzeit; die ImageGen-2-Ergebnisse sollen als lokale statische Assets eingebunden werden.
- Kein Remote-Asset-Laden im Client.

## Akzeptanzkriterien

- [ ] Es gibt ein lokales, generiertes Runner-Sieg-Bitmapmotiv im Stil des Startseitenmotivs.
- [ ] Es gibt ein lokales, generiertes Korp-Sieg-Bitmapmotiv im Stil des Startseitenmotivs.
- [ ] Die Motive wurden aus `apps/web/public/backgrounds/netgrid-startscreen-cyberworld.png` beziehungsweise dessen visueller Richtung abgeleitet und wirken stilistisch zusammengehörig.
- [ ] Das Result Modal zeigt bei Runner-Sieg das Runner-Motiv und bei Korp-Sieg das Korp-Motiv.
- [ ] Draw zeigt keine falsche Seitenvariante.
- [ ] Die aktuelle abstrakte Liniengrafik wird nicht mehr als primäres Siegmotiv verwendet, sofern die Bitmap-Assets vorhanden sind.
- [ ] Das Ergebnisfenster enthält die direkte Gewinnbotschaft für den Betrachter nur einmal prominent.
- [ ] Motivlabel, Footer und Sekundärtexte wiederholen nicht unnötig `gewonnen`/`gewinnt`, sondern liefern ergänzende Information.
- [ ] Niederlage- und Draw-Zustand sind ebenfalls textlich nicht redundant.
- [ ] Desktop- und Mobile-Ansicht überlappen nicht mit Ergebnistext, Spielwertung, Serienblock oder Footer-Buttons.
- [ ] Assets sind lokal versioniert und werden ohne externe Requests geladen.
- [ ] Asset-/Rechts-Gate bleibt sauber: keine offiziellen Artworks, Logos, Frames, Card Backs oder externen Datenbankassets.
- [ ] Web-Tests oder eine dokumentierte Browser-/Screenshot-Prüfung decken Runner- und Korp-Variante ab.

## Umsetzungshinweise

- Beim Umsetzen den Skill `imagegen` verwenden und das Startseitenmotiv als Stilreferenz berücksichtigen.
- Die Prompts sollten explizit NETGRID-eigene, abstrakt-cybernetische Motive anfordern, keine bekannten Marken, keine Kartenrahmen und keine fremden Spiellogos.
- Ergebnisdateien sinnvoll benennen, z. B.:
  - `result-runner-victory.png`
  - `result-corp-victory.png`
- Falls ImageGen-2 nur ein breiteres Bild erzeugt, vor dem Einbau auf das Result-Modal-Format zuschneiden/optimieren und responsive testen.
- Bestehende `resultWinnerMotifFor`-Logik kann weiter die Seitenvariante wählen; geändert werden soll primär die Darstellung in `ResultWinnerMotif`.
- Aktuelle Wiederholstellen prüfen:
  - Hauptheadline `Du hast das Spiel gewonnen.`
  - Motivlabel `Runner-Sieg`/`Korp-Sieg`
  - Footer `Deine Seite gewinnt`/`Gegenseite gewinnt`
  - Serien-/Spielwertungstexte, falls sie ebenfalls Gewinnwörter wiederholen.

## Ergebnisnotiz

Erledigt: Zwei ImageGen-Bitmapmotive wurden aus der visuellen Richtung des Startseitenmotivs abgeleitet und lokal unter `apps/web/public/result-motifs/` versioniert. Runner- und Korp-Siege nutzen diese Assets im Result Modal; Draw bleibt neutral und verwendet kein falsches Seitenmotiv.

Die sichtbaren Sekundärtexte wurden entdoppelt: Das Motiv zeigt nur `Runner`/`Korp`/`Draw`, der Footer `Deine Seite` oder die Gegenseite statt erneut `gewinnt`, und Serienabschlusszeilen formulieren neutraler. Die informative Accessibility-Benennung bleibt als `Runner-Sieg` beziehungsweise `Korp-Sieg` erhalten.

Checks: Result-Modal-Helper-Test und Web-Typecheck bestanden. `git diff --check` wird vor dem Paketcommit ausgeführt. Die Motive enthalten keine Logos, Kartenrahmen, Card Backs oder Fremd-Artworks.
