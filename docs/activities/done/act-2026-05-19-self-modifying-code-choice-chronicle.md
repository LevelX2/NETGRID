---
activityId: act-2026-05-19-self-modifying-code-choice-chronicle
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-19-run-window-action-label-compactness
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "Self-Modifying Code"
  - corepack pnpm --filter @netgrid/engine test -- index.test.ts -t "Self-Modifying Code"
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Self-Modifying Code: Programmauswahl in der Chronik konkret anzeigen

## Ziel

Wenn der Runner `Self-Modifying Code` während eines Runs opfert, ein Programm aus dem Stack auswählt und installiert, soll die Chronik diesen Ablauf konkret anzeigen. Statt `Du hast eine Entscheidung beantwortet.` soll dort erkennbar sein, welches Programm vorgezeigt und installiert wurde, z. B. `Du hast <Programmname> aus dem Stack vorgezeigt und im Rig installiert.`

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19 mit Screenshot:
  - Nach Aktivierung von `Self-Modifying Code` zeigt die Chronik korrekt `Du hast Self-Modifying Code aktiviert.`
  - Die anschließende Programmauswahl wird aber nur als `Du hast eine Entscheidung beantwortet.` dargestellt.
  - Fachlich soll sichtbar sein, dass ein Programm ausgewählt und installiert wurde.
- Aktuelle Web-Chronik:
  - `apps/web/app/chronicle.ts` fällt bei unbekannten Choice-Events auf `eine Entscheidung beantwortet` zurück.
  - Der vorhandene `hiddenZoneAction === "search_stack"`-Pfad kann bereits Stack-Reveals und Installationen konkret beschreiben.
- Aktuelle Engine-Hinweise:
  - `packages/engine/src/index.ts` nutzt für SMC-Choice-Payloads `hiddenZoneAction: "self_modifying_code_install_program"`.
  - Der Payload enthält u. a. `publicRevealDefinitionId`, `selectedCount`, `searchDestination`, `shuffled`, `installed` und Blocker wie `installBlockedReason`.
  - Bei MU-Mangel gibt es außerdem `self_modifying_code_free_mu` als Folgechoice.
- Verwandtes Paket:
  - `act-2026-05-19-run-window-action-label-compactness` betrifft SMC nur als Run-Window-Buttontext. Dieses Paket betrifft die aufgelöste Chronik.

## Scope

- Web-Chronik für `hiddenZoneAction: "self_modifying_code_install_program"` konkret formatieren.
- Erfolgsfall darstellen:
  - Quelle: `Self-Modifying Code`,
  - Programm aus dem Stack öffentlich vorgezeigt,
  - Programmname,
  - installiert im Rig,
  - Shuffle-Hinweis, wenn vorhanden.
- Nicht-Install-Fälle konkret, aber knapp darstellen:
  - vorgezeigt, aber nicht installiert,
  - Grund, falls side-sicher vorhanden, z. B. `nicht genug Credits`, `Unique bereits installiert`.
- MU-Folgefall darstellen:
  - `MU muss freigemacht werden`, solange die Installation noch wartet.
  - Nach erfolgreicher MU-Auswahl soll die Chronik ebenfalls nicht generisch bleiben, sondern das installierte SMC-Ziel und die freigemachten Programme nachvollziehbar machen, soweit die Payload diese Daten side-sicher enthält.
- Prüfen, ob die Engine-Payload für die finale MU-Choice genug Zielprogramminformation enthält. Falls nicht, kleinstmögliche Payload-Ergänzung vorsehen, ohne Hidden-Info zu leaken.
- Web-Chroniktests ergänzen:
  - SMC aktiviert,
  - SMC-Stack-Choice installiert Programm,
  - optionaler MU-Folgefall oder explizit als Folgepaket, falls Payload fehlt.

## Nicht im Scope

- Keine Änderung an `Self-Modifying Code`-Regeln, Timing, Kosten, Stack-Suche, Installation, Memory-Regeln oder Shuffle.
- Keine Änderung am Run-Window-Buttonlabel; das liegt im verwandten Compactness-Paket.
- Keine allgemeine Neufassung aller `select_cards`-Chronikeinträge.
- Keine Hidden-Info-Ausweitung: Vor Auswahl bleibt Stack privat; nach SMC-Auflösung darf nur die öffentlich vorgezeigte/regelmäßig bekannte Zielkarte in die öffentliche Chronik.
- Keine Änderung an Replay oder StateHash außer einer ggf. notwendigen, side-sicheren PublicPayload-Ergänzung für die Chronik.

## Akzeptanzkriterien

- [ ] Der Screenshot-Fall ist per Chroniktest reproduziert: SMC-Aktivierung plus anschließende SMC-Programmauswahl.
- [ ] Die SMC-Programmauswahl rendert nicht mehr als `Du hast eine Entscheidung beantwortet.`
- [ ] Bei erfolgreicher Installation nennt die Chronik den Programmnamen und dass das Programm im Rig installiert wurde.
- [ ] Bei nicht installierbaren Zielen oder MU-Mangel erscheint eine konkrete, side-sichere Meldung statt des generischen Choice-Fallbacks.
- [ ] Falls die finale MU-Auswahl Teil desselben Ablaufs ist, bleibt auch dieser Folgeeintrag konkret oder ein enger Folge-Hotfix wird angelegt.
- [ ] Existing-Chroniktests für generische Choice-Fallbacks bleiben erhalten; nur SMC-spezifische Choice-Payloads werden konkreter behandelt.
- [ ] Hidden-Info-Grenzen bleiben gewahrt: keine nicht ausgewählten Stack-Karten, keine privaten Suchlisten und keine FullState-Daten in PublicEvents oder Chronik.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
  - falls Payloaddaten fehlen: `packages/engine/src/index.ts` und `packages/engine/src/index.test.ts`
- In der Chronik kann der bestehende `search_stack`-Formatpfad als Muster dienen, aber `self_modifying_code_install_program` sollte explizit erkannt werden, weil die Engine diesen eigenen `hiddenZoneAction`-Wert sendet.
- Prüfen, ob `cardTitle` aus `publicRevealDefinitionId` bereits korrekt aufgelöst wird. Falls nicht, muss der Formatkontext die Definition wie bei anderen Public-Reveal-Fällen auflösen.
- Bei MU-Folgechoice (`self_modifying_code_free_mu`) prüfen, ob `installedProgramDefinitionId` aus `installRunnerProgramFromStackWithoutClick` im Payload landet und von der Chronik genutzt werden kann.

## Ergebnisnotiz

Erledigt: Die Web-Chronik erkennt `self_modifying_code_install_program` und `self_modifying_code_free_mu` jetzt explizit. Erfolgreiche SMC-Programmauswahlen nennen das vorgezeigte und installierte Programm, Blockfälle nennen den side-sicheren Grund, und MU-Folgeentscheidungen zeigen das installierte Programm plus die für MU getrashten Programme.

Die Engine-PublicPayload wurde minimal um side-sichere SMC-Ergebnisfelder ergänzt (`sourceDefinitionId`, Installationsstatus, Blockgrund und pluralisierte getrashte Definitionen), damit die Chronik ohne FullState- oder Hidden-Info-Zugriff konkret bleiben kann.

Checks: fokussierte Web- und Engine-Tests sowie Web- und Engine-Typechecks bestanden. `git diff --check` wird vor dem Paketcommit ausgeführt.
