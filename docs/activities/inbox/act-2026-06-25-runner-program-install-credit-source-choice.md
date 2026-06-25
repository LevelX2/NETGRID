---
activityId: act-2026-06-25-runner-program-install-credit-source-choice
status: inbox
kind: fix
area: engine
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-25
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-Programminstallation: Creditquellen gezielt aufteilen

## Ziel

Beim Installieren von Runner-Programmen soll der Spieler optional steuerbare Installations-Creditquellen wie `Zetatech Software Installer` selbst auswählen und mengenbezogen aufteilen können, statt dass die Engine automatisch alle verfügbaren Spezial-/Recurring-Credits vor normalen Credits verbraucht oder identische `Installieren`-Aktionen anbietet.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-25 im Spiel gegen die KI: Der Runner hat `Zetatech Software Installer` installiert. Beim Installieren eines Programms erscheinen neben der normalen Installation und `Mit Programmtrash installieren` weitere scheinbar identische `Installieren`-Optionen. Die dritte Option wirkt wie der Installationspfad unter Nutzung der sich erneuernden Zeta-Credits, ist aber nicht unterscheidbar beschriftet.
- Regelverdacht des Nutzers: Der Kartentext ist als optionaler Einsatz zu verstehen (`you may use these bits`), nicht als Zwang, automatisch alle passenden Bits auszugeben. Der Runner muss daher entscheiden können, ob und wie viele dieser Credits verwendet werden und wie viel aus normalen Credits bezahlt wird.
- Mehrquellenfall: Es können mehrere passende Quellen existieren, z. B. zwei `Zetatech Software Installer` oder andere installierbare Programm-Creditquellen. Die Auswahl muss pro Quelle und Betrag möglich sein.
- Aktueller Codebefund:
  - `packages/engine/src/card-implementations/onr-v1/runner/programs/zetatech-software-installer.ts` modelliert Zeta als `restrictedHostedCreditSource` mit `usableFor: ["install_programs"]` und `allowUseWhileOverwritingSource: true`.
  - `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts` aggregiert `availableRunnerProgramInstallCredits` aus normalen Runner-Credits, Recurring-/Hosted-/temporären Install-Credits und verbraucht in `spendRunnerInstallCredits` automatisch erst temporäre, dann restricted/hosted, dann Recurring- und zuletzt normale Credits.
  - `packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts` enthält bereits einen Zeta-Test, der vollständigen Verbrauch der Zeta-Bits für eine Programminstallation erwartet.
  - `apps/web/app/action-board-ui.ts` beschriftet `runnerProgramTrashBeforeInstall` bereits als `Mit Programmtrash installieren`, unterscheidet aber andere differierende Installationspfade ohne eigenes Kontextlabel häufig weiter nur als `Installieren`.
- Verwandte erledigte Pakete:
  - `docs/activities/done/act-2026-05-21-runner-program-install-free-mu.md`
  - `docs/activities/done/act-2026-05-21-runner-program-install-trash-choice-ui.md`
  - `docs/activities/done/act-2026-05-22-duplicate-hand-install-actions-program-resource.md`
  - `docs/activities/done/act-2026-05-21-counter-display-special-and-recurring-counters.md`

## Scope

- Für Runner-Programminstallationen eine engine-seitig validierte Zahlungsaufteilung einführen oder ein bestehendes Choice-Modell so erweitern, dass optionale Installations-Creditquellen pro Quelle und Betrag ausgewählt werden können.
- Mindestens `Zetatech Software Installer` abdecken; dabei prüfen, ob dieselbe generische Lösung für bestehende `runner_program_install`-/`install_programs`-Creditquellen passt.
- Der Restbetrag muss aus normalen Runner-Credits bezahlt werden können. Wenn normale Credits ausreichen, muss auch `0` aus optionalen Spezialquellen eine legale Auswahl sein.
- Bei mehreren Quellen muss die Auswahl source-stabil sein, z. B. über `sourceCardInstanceId` plus Betrag, nicht nur über eine aggregierte Summe.
- Die Kostenaufteilung muss mit bestehenden Programminstallationsvarianten zusammenspielen:
  - normale Programminstallation aus der Grip,
  - Programminstallation mit vorherigem Programmtrash/MU-Freimachen,
  - Zeta-Overlay-Installation über den Installer selbst,
  - vorhandene Hosted-/Daemon-Pfade, soweit sie denselben Zahlungshelfer nutzen.
- `applyAction` beziehungsweise die Choice-Auflösung muss Side, `actionId`, `stateVersion`, Timing, Installziel, MU-/Trash-Auswahl, verfügbare normale Credits, verfügbare Quellcounter und gewählte Beträge erneut validieren.
- PublicEvents/Chronik sollen side-sicher anzeigen können, wie viele normale Credits und wie viele Credits aus sichtbaren Installationsquellen ausgegeben wurden, ohne verdeckte Zonen oder private Payloads offenzulegen.
- Web-UI: Wenn mehrere Installationspfade sichtbar bleiben, müssen sie unterscheidbar benannt werden. Für die eigentliche Zahlungswahl ist eine kompakte Auswahl mit Quelle, verfügbarem Betrag und gewähltem Betrag ausreichend.

## Nicht im Scope

- Keine allgemeine Neugestaltung aller Payment-Flows für Trace, Run-Kosten, Tag-Entfernung oder Access-Trash. Dieses Paket begrenzt sich auf Runner-Programminstallationskosten.
- Keine Änderung daran, welche Karten installiert werden dürfen, welche MU-Regeln gelten oder wann Programmtrash erlaubt ist.
- Keine Client-Regelautorität: Die UI darf keine eigene Legalität berechnen, sondern nur Engine-`LegalActions` und `pendingChoice` bedienen.
- Keine Hidden-Info-Offenlegung in PlayerViews, PublicEvents, WebSocket-Payloads, Reconnect-Payloads, Replays, Logs oder Client-Fehlern.
- Keine neue Kartenfreigabe, kein neuer Kartenpool und keine Decklegalitätsänderung.
- Keine pauschale Änderung an Valu-Pak-/temporären Credit-Bundles, bevor geprüft ist, ob diese Quellen regeltextlich ebenfalls optional oder bewusst automatisch zu verbrauchen sind.

## Akzeptanzkriterien

- [ ] Bei installiertem `Zetatech Software Installer`, 2 verfügbaren Zeta-Bits und genug normalen Credits kann der Runner beim Installieren eines Programms legal `0`, `1` oder `2` Zeta-Bits verwenden, sofern Kosten und verfügbare Credits das erlauben.
- [ ] Bei zwei passenden installierten Quellen kann der Runner die Beträge pro Quelle unterscheiden, z. B. Quelle A 1 Bit, Quelle B 0 Bits, Rest normale Credits.
- [ ] Wenn normale Credits nicht ausreichen, aber optionale Installationsquellen ausreichen, erzwingt die Engine keine bestimmte Quelle, sondern verlangt eine gültige Aufteilung, deren Summe die Kosten deckt.
- [ ] Nach erfolgreicher Installation sind normale Credits, Zeta-/Recurring-/Hosted-Counter, installierte Karte, MU, Host/Overlay und Heap/Rig-Zustand korrekt.
- [ ] Ungültige Aufteilungen werden abgelehnt: zu viel aus einer Quelle, negative Beträge, nicht passende Quelle, entfernte Quelle, stale state, falsche Seite, falscher Kartentyp, Timing-Drift und nicht gedeckte Gesamtkosten.
- [ ] Die UI zeigt keine zwei identischen `Installieren`-Buttons für regeltechnisch verschiedene Installationspfade; Zahlungswahl und Programmtrash-/Overlay-Kontext sind unterscheidbar.
- [ ] PublicPayload/Chronik bleiben side-sicher und enthalten keine privaten Karteninstanzen, Grip-/Stack-/HQ-/R&D-Inhalte oder private Payloads.
- [ ] Replay und StateHash bleiben deterministisch.
- [ ] Bestehende Tests für Programmtrash vor Installation, Zeta-Overlay-Install, Hosted-/Daemon-Install, `Self-Modifying Code`, `The Shell Traders` und `Valu-Pak Software Bundle` bleiben grün oder werden bewusst mit dokumentierter Regelbegründung angepasst.

## Umsetzungshinweise

- Bevorzugter technischer Schnitt: nicht mehrere scheinbar gleiche `install_card`-LegalActions nur wegen Payment erzeugen, sondern nach Auswahl des Installationspfads eine Zahlungs-Choice öffnen, wenn mehr als eine regelkonforme Aufteilung existiert.
- Für eindeutige Fälle kann die Engine weiter automatisch auflösen, solange keine optionale Entscheidung verloren geht.
- Die bestehende Logik in `availableRunnerProgramInstallCredits` darf für grobe Legalitätsprüfung bleiben, sollte aber nicht die endgültige Zahlungsentscheidung ersetzen.
- `spendRunnerInstallCredits` braucht voraussichtlich eine optionale Payment-Breakdown-Eingabe. Ohne Breakdown sollte sie nur in wirklich eindeutigen oder bewusst automatischen Fällen automatisch Quellen verbrauchen.
- UI-seitig kann ein Stepper-/Plus-Minus-Modell pro Quelle ausreichen: pro Klick eine Quelle um 1 erhöhen oder senken, der Restbetrag wird aus normalen Credits angezeigt.
- Falls die Analyse zeigt, dass mehrere Payment-Quellenfamilien unterschiedliche Regeltexte haben, soll dieses Paket nur die optionalen `may use`-Quellen umstellen und weitere Familien als kleine Folge-Activities anlegen.

## Ergebnisnotiz

Noch offen.
