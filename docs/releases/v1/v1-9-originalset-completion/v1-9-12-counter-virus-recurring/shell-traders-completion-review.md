# V1.9.12 Shell Traders Completion Review

Stand: 2026-07-17 (MU-Korrektur)
Status: implemented_completion_corrected
Primaerer Agent: release-implementation-agent

## Zweck

Diese Completion-Nacharbeit ergaenzt den formalen V1.9.12-Abschluss, ohne `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/final-review.md` umzuschreiben. Repariert wurde genau `The Shell Traders` (`onr_v1_176_the-shell-traders`) als enge V1.9.12-Spur. Es wurde keine weitere Karte promotet.

## Korrekturstand 2026-07-17

- Ein Livebefund aus `match_8107a9dffe8cd234`, State-Version 208, zeigte den
  verbliebenen Vertragsfehler: Bei 4/4 MU bot die Engine `Rent-I-Con` (2 MU)
  trotz zweier installierter `The Shell Traders` nicht als Vorbereitungsziel
  an.
- Die MU-Prüfung erfolgt nicht mehr beim Beiseitelegen eines Programms mit
  Shell-Countern. Entscheidend ist die verpflichtende Installation, wenn der
  letzte Shell-Counter entfernt wird.
- Reicht die MU dann nicht aus, bleibt der letzte Counter zunächst liegen und
  die Engine öffnet die kartennamensneutrale, verpflichtende Runner-Choice
  `delayed_install_memory`. Erst nach ausreichend ausgewähltem Programmtrash
  entfernt sie den Counter und installiert das vorbereitete Programm
  kostenlos.
- Quelle, Ziel, Counterstand, Programmauswahl und freigemachte MU werden bei
  der Choice-Auflösung erneut validiert. Der Vertrag gilt gleichermaßen für
  die bezahlte 1-Credit-Fähigkeit und das automatische Entfernen zu
  Runner-Zugbeginn.
- Regressionen schützen den konkreten `Rent-I-Con`-Zielpfad, ungültige und
  stale Choices, Corp-Sichtbarkeit, Startzugfortsetzung, Replay und StateHash.

### Verifikation der Korrektur

- Fokussiert: 3 Testdateien mit 49 Tests grün.
- Engine-Typecheck: grün.
- Vollständige Engine-Suite: 188 Testdateien mit 1.717 Tests grün.
- Changed-File-Format, Package Boundaries und Diff-Check: grün.

## Umgesetzter Kartenvertrag

- Die falsche Recurring-Credit-Ersatzfunktion wurde aus Runtime, Katalog, Manifest, AI-Hints und Szenarien entfernt.
- `The Shell Traders` bleibt eine normal installierbare Runner-Resource.
- Eine installierte Kopie erzeugt im Runner-Hauptfenster eine `trigger_ability`-LegalAction, mit der der Runner eine eigene Programm- oder Hardwarekarte aus der Grip vorbereitet.
- Das Grip-Ziel wird erst bei erfolgreicher Aufloesung public face-up in `special.set_aside` gelegt; vorher leaken Corp-Views und PublicEvents keine Handidentitaet.
- Die beiseitegelegte Karte erhaelt oeffentliche `shell`-Counter in Hoehe ihrer normalen Installationskosten.
- Am Runner-Zugbeginn entfernt jede installierte `The Shell Traders`-Kopie genau einen Shell-Counter. Bei mehreren Shell-Counter-Zielen wird eine verpflichtende Runner-Choice geoeffnet und danach fuer weitere installierte Kopien fortgesetzt.
- Die 1-Credit-Faehigkeit entfernt in den bestehenden Runner-Fenstern `runner_action.main`, `run.encounter_ice` und `run.jack_out_window` genau einen Shell-Counter.
- Wenn der letzte Shell-Counter entfernt wurde, installiert die Engine die vorbereitete Programm- oder Hardwarekarte automatisch ohne normale Installations-Creditkosten.
- Programme pruefen MU. Bei zu wenig freier MU wird eine Runner-Choice zum Trashen installierter Programme geoeffnet; danach installiert die Karte kostenlos aus Set Aside.

## Sichtbarkeit, Replay und StateHash

- Set-Aside-LegalActions fuer Grip-Ziele sind Runner-privat; Corp-PlayerViews erhalten keine privaten Zielinformationen.
- Nach Aufloesung ist die Set-Aside-Karte public face-up und die Shell-Counter-Anzahl in PlayerViews sichtbar.
- PublicEvents fuer Set Aside, Shell-Counter-Removal, pending MU und Auto-Install enthalten nur oeffentliche Zieldefinitionen nach Reveal.
- `applyAction` revalidiert Side, `actionId`, `stateVersion`, installierte Quelle, Timingfenster, Click-/Creditkosten, Zielzone, Zieltyp, Counter-Anzahl und Auto-Install-Bedingungen.
- Die Engine-Regression replayt den Shell-Traders-Pfad bis zum gleichen finalen `StateHash`.

## UI, Chronik und KI

- Die Web-Action-Board-Helfer beschriften die Resource-Aktionen als `Karte vorbereiten` und `Shell-Counter entfernen`.
- Shell-Counter werden als eigener Badge-Typ angezeigt.
- Die Chronik beschreibt Set Aside, Shell-Counter-Removal, kostenloses Auto-Install und MU-Folgeinstallation mit Shell-Traders-spezifischen Texten.
- Runner-KI bevorzugt Shell-Traders-Set-Aside-LegalActions fuer vorbereitete Installationen und behandelt diese nicht als generische Economy- oder Recurring-Karte.
- Runner-KI beantwortet verpflichtende Shell-Traders-Start-of-turn-Choices deterministisch anhand der niedrigsten verbleibenden Shell-Counter-Anzahl.

## Datenartefakte

- `data/manifests/card-implementation-manifest-1.9.12.json` fuehrt `The Shell Traders` jetzt als `shell_traders_set_aside_install_resolver`.
- `data/rules/mechanics-coverage-1.9.12.json` dokumentiert den neuen Mechanikpfad `mechanic.shell_traders.set_aside_delayed_install`.
- `data/ai/ai-card-hints-deck-legal-v1912.json`, `data/manifests/deck-legal-ai-approval-v1912-manifest.json` und `data/scenarios/ai-deck-legal-v1912-smokes.json` trennen Shell Traders von der Recurring-Gruppe und fuehren ein eigenes Completion-Szenario.
- `data/scenarios/v1912-counter-virus-recurring-release-smoke.json` dokumentiert die reparierte Shell-Traders-Abdeckung.

## Bewusste Grenzen

- Es wurde keine breite neue Paid-Ability-Timing-Engine gebaut.
- Die 1-Credit-Faehigkeit ist in den bestehenden Runner-Fenstern `runner_action.main`, `run.encounter_ice` und `run.jack_out_window` verfuegbar; Access-, Corp-Rez- und Corp-Trash-Fenster bleiben fuer eine spaetere Timing-Verbreiterung ausserhalb dieses Reparaturschnitts.
- Zusatzkosten, Hosting-Sonderfaelle und nicht modellierte Sonderinstallationen werden nicht stillschweigend erweitert. Der aktuelle Zielpool laeuft ueber normale Programm-/Hardware-Installation und MU-Choice.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`: pass, 287 Tests.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/web test`: pass, 100 Tests.
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass, 93 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/catalog test`: pass, 36 Tests.
- `corepack pnpm --filter @netgrid/catalog typecheck`: pass.
- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass, 72 Tests.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung aus `apps/web/next.config.ts`.

## Gate-Ergebnis

`V1_9_12_shell_traders_completion_done: true`

`V1_9_12_final_review_unchanged: true`

`scope_extra_cards_promoted: false`
