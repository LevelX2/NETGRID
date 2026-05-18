# Bestandsaufnahme 2026-05-04

Status: abgeschlossen
Stand: 2026-05-04
Branch: `codex/bestandsaufnahme-2026-05-04`

## Kurzfazit

Der versionierte Workspace ist technisch lauffähig und die Quality Gates sind grün. Der dokumentierte Hauptstand bis V0.99 und S01 ist im Code im Wesentlichen nachvollziehbar: Engine, KI, Server, Web, Katalog, Decks und Tests decken die geplanten schmalen Gates ab.

Die größte Lücke ist keine rote Testsuite, sondern eine Status- und Scope-Lücke: Nach V0.99/S01 wurden ein lokaler Deckbuilder-Ausbau und ein privater O:NR-v1-Testzugang gemergt, ohne dass README, Statusseiten und Planung das sauber als eigenen Stand eingeordnet hatten. O:NR ist aktuell ein privates lokales Overlay mit Engine-Harness und Web-Katalog-/Deckvalidierungsansatz, aber kein vollständig integrierter, versionierter, serverseitig startbarer Kartenpool.

## Geprüfter Bestand

Versionierter Code:

- `packages/shared`: zentrale Typen, Kartenregister, Actions, Events, PlayerViews und Mechanikverträge.
- `packages/engine`: reine TypeScript-Rules-Engine mit deterministischem `createGame`, `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `replayEvents` und `hashState`.
- `packages/ai`: side-sichere AI-Inputs, Runner-/Corp-Heuristiken, Difficulty-Profile, Simulation und Reason-Codes.
- `packages/catalog`: lokaler Karten-Snapshot, Statusmodell, Katalogindex und Such-/Filterlogik.
- `packages/decks`: lokale Deckentwürfe, Validierung, Snapshots, Deckhashes, Import/Export und sichere Public Metadata.
- `apps/server`: privater Match-Service mit REST/WebSocket, Hash-only Tokens, Reconnect, Undo, AI-Modi, S01-Serie und JSON-Storage.
- `apps/web`: Next.js-Oberfläche mit Matchstart, Board, CardView/Preview, Katalog, Deckeditor, Result Modal, Audio und lokalen Bild-/Katalog-APIs.

Versionierte Daten und Dokumente:

- 166 abgeleitete Dokumente unter `docs/derived/`.
- 108 versionierte JSON-Artefakte unter `data/` außerhalb lokaler Laufzeit-/Assetordner.
- Mechanics Coverage bis `data/rules/mechanics-coverage-0.99.json`.
- Final Reviews für V0.1 bis V0.9, V0.92 bis V0.99 und S01-Artefakte.

Lokale ignorierte Artefakte:

- `data/runtime/` enthält lokale Multiplayer-Laufzeitdaten.
- `data/local/` enthält private O:NR-v1-Katalog-, Import-, Review- und Testzugangsartefakte.
- `data/local-assets/` enthält lokale Kartenbilder und generierte Bildartefakte. Dieser Ordner ist korrekt ignoriert.
- Im lokalen O:NR-v1-Importreport sind 374 Limited-Katalogkarten erfasst; 45 davon sind als lokal privat implementiert/playable/deck-legal eingeordnet.
- Der lokale O:NR-1996-Bildcache umfasst mehrere hundert Dateien und ist nicht versioniert.

## Umgesetzt

- MVP 0.1 bis MVP 0.9 sind als Anforderungen, Implementierung, Validierung und Final Reviews dokumentiert.
- V0.92 Mechanik-Inventar und V0.93 M1-Engine-Fundament sind umgesetzt.
- V0.94 bis V0.99 sind als schmale Mechanik-Gates umgesetzt:
  - Net-/Meat-Damage und Flatline,
  - Runner-Resources und tag-basiertes Resource-Trash,
  - Trace, Link und Bidding,
  - Jack-out, Breach und enger Multiaccess,
  - Identity-Setup-/Static-Modifier und Hidden-Zone-Tools,
  - Hosting, Viren, Purge, Counter-Familien, Recurring Credits und Bad Publicity.
- S01 ist umgesetzt: `GameResultSummary`, Ergebnisfenster, Spielziel-Auswahl, private Zwei-Spiel-Serie mit Seitenwechsel und opt-in Web-Audio.
- Lokaler Deckeditor und Match Setup funktionieren für versionierte V0.8-Snapshots und lokale Entwürfe im freigegebenen lokalen Format.
- Die Web-Chronicle-Tests wurden in den normalen Testlauf aufgenommen; vorher waren sie vorhanden, aber durch die Vitest-Include-Regeln nicht entdeckt.

## Teilweise Oder Nicht Sauber Eingeordnet

- O:NR-v1-Testzugang:
  - Engine-Unit-Tests spielen 45 lokale private O:NR-v1-Karten über vorhandene Mechaniken.
  - Die Web-Katalog-/Deck-API kann den lokalen Overlay-Snapshot aus `data/local/` lesen.
  - Lokale Bilder werden nur über ignorierte lokale Dateien bedient.
  - Der Server-Matchstart validiert dagegen weiterhin gegen den versionierten V0.8-Karten-Snapshot und akzeptiert O:NR-Deck-Snapshots nicht als normalen Matchstartpfad.
  - Es gibt keine versionierte O:NR-Requirements-/Implementation-/Final-Review-Datei, kein versioniertes O:NR-Manifest und keine AI-/Multiplayer-Smokes für O:NR als eigenen Gate-Scope.
- V0.91 Asset-Gate:
  - Requirements und private lokale Nutzungsentscheidung sind dokumentiert.
  - Ein lokaler Bild-/Katalogpfad existiert praktisch bereits.
  - Eine vollständige versionierte V0.91-Implementierungsreview für diesen lokalen Pfad fehlt.
- Build:
  - `corepack pnpm build` besteht.
  - Die bekannte Turbopack-NFT-Warnung zur `card-images`-Route bleibt bestehen und sollte in einem Härtungsschritt reduziert oder ausdrücklich akzeptiert werden.

## Nicht Umgesetzt

- Mulligan als echter Setup-Choice-Schritt.
- Vollständige Setup-/Deckout-/Archives-facedown-Normalisierung.
- Core-Damage und Damage-Prevention.
- Prevention, Avoid, Interrupt und Replacement.
- Set Aside, Remove from Game und Ownership-/Control-Wechsel.
- Vollständige offizielle Deckbuilding-/Formatregeln mit Factions, Influence, Agenda-Dichte, Rotation und Banlisten.
- Vollständig integrierter offizieller oder O:NR-Kartenpool als normaler Matchstartpfad.
- Öffentliche Plattformfunktionen wie Accounts, Matchmaking, Rankings, Turniere, Chat oder öffentliche Replay-Plattform.
- SQLite-Persistenz; aktueller privater Stand nutzt JSON-Storage.
- Screenshot-/Browser-E2E-Regressionslauf für die aktuelle UI und lokale Kartenbilder.

## Widersprüche Und Dokumentationsdrift

- `README.md` war fachlich veraltet: Es endete bei MVP 0.7/V0.8 als nächstem Schritt, obwohl Code und Status bis V0.99/S01 reichen.
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.4.md` nannte V0.5 bis V0.9 als abgeschlossen, aber V0.94 bis V0.99/S01 und O:NR nicht als aktuellen Anschluss.
- `docs/releases/mvp/roadmaps/mechanics-completion-plan.md` war eine historische Planungsfassung und nannte als nächsten Schritt noch V0.94 Requirements, obwohl V0.94 bis V0.99 abgeschlossen sind.
- `docs/architecture/card-rules/mechanics-coverage-matrix.md` trug den Titel 0.99, beschrieb im Zweck aber noch "nach V0.96".
- In älteren Quellen ist "kein Deckbuilder" als MVP-0.1/0.2-Nichtziel korrekt. Der aktuelle lokale Deckeditor ist ein späterer V0.6-Scope und daher kein Widerspruch, muss aber sprachlich klar von einem freien öffentlichen Deckbuilder getrennt bleiben.
- O:NR ist post-V0.91 als private lokale Nutzung plausibel eingeordnet, aber die aktuelle spielbare Engine-Harness-Schicht geht über reine Bildanzeige hinaus. Das braucht eine eigene bewusste Scope-Entscheidung.

## Tests Und Gates

Ausgeführt am 2026-05-04:

- `corepack pnpm lint`: bestanden.
- `corepack pnpm typecheck`: bestanden.
- `corepack pnpm test`: bestanden.
  - Pakettests: Catalog 6, Decks 7, Engine 66, AI 25, Server 21, Web 7.
  - Root-Specs: 38.
  - Gesamt im normalen Testlauf nach Testentdeckungsfix: 170 Tests.
- `corepack pnpm build`: bestanden.
  - Bekannte Warnung: Turbopack meldet weiterhin einen NFT-Trace-Hinweis zur `card-images`-Route.

Testkorrektur:

- `vitest.config.ts` wurde erweitert, damit `apps/web/app/chronicle.test.ts` im normalen `@netgrid/web`-Testlauf entdeckt wird.

Nicht ausgeführt:

- Kein manueller Browser-Smoke in zwei Fenstern.
- Kein screenshotbasierter UI-Regressionslauf.
- Kein Langzeit-Soak.
- Kein echter LAN-/HTTPS-/WSS-Betriebstest.

## Nächste Sinnvolle Schritte

1. O:NR-v1-Testzugang entscheiden:
   - engine-only und experimentell lassen,
   - sauber als eigenes lokales Gate versionieren und in Server/Deck/AI/Multiplayer integrieren,
   - oder aus dem versionierten Spielbarkeitskern herausnehmen.
2. Falls O:NR bleibt:
   - versionierte O:NR-Scope-Datei, Manifest, Testmatrix und Final Review anlegen,
   - Server-Matchstart mit lokalem Overlay explizit erlauben oder bewusst blockieren,
   - AI-/Multiplayer-/Visibility-/Replay-Smokes ergänzen,
   - lokale Asset- und Textquellen weiter als private nicht versionierte Artefakte behandeln.
3. V1.0-/Stabilisierungsscope festlegen:
   - JSON-Storage vs SQLite,
   - Browser-E2E und Screenshot-Smokes,
   - Build-Warnung `card-images` reduzieren,
   - privater Betrieb/Backup/Recovery.
4. Mechanik-Folgegate wählen:
   - M2 Setup/Mulligan/Deckout,
   - M11 Prevention/Avoid/Interrupt/Replacement,
   - M12 tiefere Deckbuilding-/Formatregeln,
   - oder ein kleiner O:NR-Kartenslice auf Basis bereits implementierter Mechaniken.
