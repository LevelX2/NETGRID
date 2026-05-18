---
activityId: act-2026-05-19-result-modal-winner-visual-replay-save-label
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: result modal UX
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/result-modal-ui.ts
  - apps/web/app/result-modal-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- result-modal-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Ergebnisfenster: Siegergrafik und Replay-Sichern-Text

## Ziel

Der Endbildschirm soll visuell stärker wirken: Je nach Gewinner wird ein Runner- oder Korp-Motiv im Ergebnisfenster angezeigt. Außerdem soll die bestehende Option `Spiel aufheben` verständlicher heißen, z. B. `Spiel für Replay sichern`, damit klar ist, dass das Spiel in der Historie gegen Löschung geschützt wird.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-19: Der Endbildschirm soll zusätzlich eine coole Grafik vom Sieger zeigen, entweder Runner- oder Korp-Motiv. Die Grafik kann seitlich eingeblendet oder anderweitig im Ergebnisfenster sichtbar gemacht werden.
- Nutzerwunsch vom 2026-05-19: Die Option `Spiel aufheben` klingt unklar. Gemeint ist ein Schutz-/Markierungsflag, damit das Spiel nicht aus der Historie gelöscht wird. Bessere Begriffe wären `Spiel sichern` oder `Spiel für Replay sichern`.
- Nutzerwunsch vom 2026-05-19: Im Ergebnisfenster gibt es aktuell auch bei verfügbarem nächsten Serienspiel einen Button `Zurück zum Startbildschirm`. Der normale Serienpfad ist aber `Nächstes Serienspiel`; der Startbildschirm-Pfad wirkt potenziell wie ein Serien-/Matchabbruch und soll optisch weniger dominant, klarer getrennt und gegebenenfalls mit einer Sicherheitsabfrage versehen werden.
- `docs/releases/special/s01/result-modal-spec.md` erlaubt bisher nur eine lokale abstrakte UI-Grafik per CSS und verbietet offizielle NETGRID-Artworks, Logos, Frames oder Backs.
- `apps/web/app/page.tsx` enthält `GameOverModal`; dort steht aktuell der Buttontext `{retentionProtected ? "Nicht mehr aufheben" : "Spiel aufheben"}`.
- `apps/web/app/page.tsx` erhält bereits `result.winner`, `result.viewerOutcome`, `result.winnerSide`/Sichtseite über `GameResultSummary` und kann damit side-sicher zwischen Runner-, Korp- und Draw-Variante unterscheiden.
- `apps/web/app/page.tsx` rendert im Result Modal aktuell `Nächstes Serienspiel`, wenn `resultSummary.series?.nextAvailable` gilt, und weiterhin `Zurück zum Startbildschirm`.

## Scope

- `GameOverModal` so erweitern, dass eine sichtbare Gewinnergrafik oder ein klares Gewinner-Motiv im Ergebnisfenster erscheint:
  - Runner-Sieg: Runner-Motiv.
  - Korp-Sieg: Korp-Motiv.
  - Draw: neutrale Variante oder bewusst keine Gewinnerfigur, aber ohne kaputten Layoutzustand.
- Grafik seitlich oder als visuelles Panel in das bestehende Ergebnisfenster integrieren, ohne das Modal komplett neu zu gestalten.
- Nur eigene/lokale/generierte Assets oder codebasierte NETGRID-eigene Grafik nutzen. Keine offiziellen Netrunner-/NETGRID-Artworks, Logos, Card Frames, Card Backs oder externen Kartendatenbank-Assets.
- Responsive Layout prüfen: Desktop und Mobile dürfen keine Überlappungen mit Ergebnistext, Serienstand, Statistik, Footer oder Aktionsbuttons erzeugen.
- Retention-Buttontext umbenennen:
  - inaktiv bevorzugt `Spiel für Replay sichern` oder ein ähnlich klarer deutscher Text.
  - aktiv ohne `aufheben`, z. B. `Replay-Sicherung entfernen` oder `Nicht mehr für Replay sichern`.
- Tooltip/Accessible-Label so formulieren, dass klar ist: Diese Aktion schützt das Spiel vor History-/Cleanup-Löschung und verändert kein Spielergebnis.
- Falls die Backend-/API-Semantik weiterhin `retentionProtected` heißt, diese technische Benennung nicht breit refactoren; der Schwerpunkt ist sichtbarer UI-Text.
- Serien-Endbildschirm-Buttons prüfen und nachschärfen:
  - Wenn ein nächstes Serienspiel verfügbar ist, soll `Nächstes Serienspiel` der optisch klare Primärpfad sein.
  - `Zurück zum Startbildschirm` soll in diesem Zustand optisch nachrangig und räumlich getrennt erscheinen.
  - Prüfen, ob `Zurück zum Startbildschirm` serverseitig/lokal tatsächlich die Serie oder das Match abbricht, nur die UI verlässt oder einen späteren Resume zulässt.
  - Falls der Startbildschirm-Pfad die Serie faktisch abbricht, eine Bestätigung ergänzen, z. B. mit Text in der Richtung `Matchserie abbrechen? Das nächste Serienspiel wird nicht gestartet.`
  - Falls der Startbildschirm-Pfad nur navigiert und die Serie später fortsetzbar bleibt, sichtbaren Text entsprechend entschärfen, z. B. `Zum Startbildschirm` plus Hinweis/Tooltip `Die Serie bleibt fortsetzbar.`

## Nicht im Scope

- Keine Änderung an Ergebnislogik, Gewinnerermittlung, Serienwertung, Forfeit-Vertrag, Replay, StateHash oder `GameResultSummary`.
- Keine neue Replay-Viewer-Funktion.
- Keine neue Historien-/Cleanup-Policy und keine Änderung der tatsächlichen Retention-Regeln, außer der UI-Text muss vorhandenes Verhalten korrekt beschreiben.
- Keine offiziellen Fremdassets oder geschützten Artworks.
- Kein komplettes Redesign des Endbildschirms.
- Keine Änderung an Wartungs-/Maintenance-Texten wie `Aufheben schützen`, sofern diese nicht dieselbe Result-Modal-Aktion betreffen.
- Kein neuer Serienabbruch-Vertrag über den bereits bestehenden Lifecycle hinaus. Wenn ein echter Serienabbruch fehlt und gebraucht wird, ein separates Paket schneiden.

## Akzeptanzkriterien

- [ ] Runner-Sieg zeigt im Ergebnisfenster ein deutliches Runner-Motiv.
- [ ] Korp-Sieg zeigt im Ergebnisfenster ein deutliches Korp-Motiv.
- [ ] Draw-Zustand ist visuell sauber gelöst und verwendet keine falsche Gewinnergrafik.
- [ ] Die Grafik ist lokal/eigen/generiert oder codebasiert und verletzt keine Asset-/Rechts-Gates.
- [ ] Die Grafik bleibt auf Desktop und Mobile lesbar platziert und überlappt keine Texte, Stats, Serieninfos oder Buttons.
- [ ] Der Button `Spiel aufheben` ist im Result Modal durch einen verständlichen Replay-/Sicherungs-Text ersetzt.
- [ ] Der aktive Zustand benutzt ebenfalls keinen missverständlichen `aufheben`-Text.
- [ ] Tooltip oder Accessible-Label erklärt die Wirkung als Schutz vor History-/Cleanup-Löschung für spätere Replay-Nutzung.
- [ ] Bei verfügbarem nächstem Serienspiel ist `Nächstes Serienspiel` der eindeutige Primärbutton.
- [ ] `Zurück zum Startbildschirm` ist in diesem Zustand optisch nachrangig und nicht direkt mit dem Serien-Primärpfad verwechselbar.
- [ ] Es ist geklärt, ob `Zurück zum Startbildschirm` eine laufende Matchserie abbricht oder nur aus der aktuellen Ansicht herausführt.
- [ ] Falls der Button die Serie faktisch abbricht, gibt es eine klare Sicherheitsabfrage mit verständlichem deutschem Text.
- [ ] Falls der Button die Serie nicht abbricht, erklärt Text/Tooltip, dass die Serie fortsetzbar bleibt.
- [ ] Result-Modal-Tests oder Web-Helper-Tests decken mindestens die Buttontexte und Gewinner-Varianten ab, oder eine begründete manuelle Browser-/Screenshot-Prüfung ist dokumentiert.
- [ ] Hidden-Info-, Token-, Decklisten-, Replay- und StateHash-Grenzen bleiben unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, weil der Schnitt UI- und Textpolitur am bestehenden Ergebnisfenster ohne Regeländerung ist.
- Wahrscheinliche Startpunkte:
  - `apps/web/app/page.tsx`: `GameOverModal`, Result-Modal-Buttontext, Gewinner-/Draw-Auswahl.
  - `apps/web/app/globals.css`: Layout und responsive Darstellung für die neue Ergebnisgrafik.
  - vorhandene Web-Tests rund um Result Modal oder neu fokussierte Helper-/Rendering-Tests.
- Wenn ein Bitmap-Asset erzeugt wird, `imagegen` nutzen und das Ergebnis als eigenes lokales UI-Asset versionieren. Alternativ kann eine codebasierte Illustration/CSS-Komposition genutzt werden, wenn sie hochwertig genug wirkt.
- Ergebnisgrafik darf dekorativ sein, muss aber `aria-hidden` oder sinnvolles Alternativ-/Label-Verhalten bekommen, damit Screenreader nicht mit reiner Deko belastet werden.

## Ergebnisnotiz

Umgesetzt: Ergebnisfenster zeigt ein eigenes codebasiertes Runner-/Korp-/Draw-Motiv ohne externe Assets. Die Replay-Sicherung nutzt klare Texte und zugängliche Tooltips statt `Spiel aufheben`. Bei verfügbarer Serienfortsetzung bleibt `Nächstes Serienspiel` der Primärpfad; der Startbildschirm-Pfad heißt `Serie verlassen`, ist sekundär und fragt vor dem lokalen Sitzungsverlassen nach.
