---
activityId: act-2026-05-17-runner-ai-post-break-access-hotfix
status: done
kind: fix
area: ai
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: runner AI / central run access
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.test.ts
  - apps/server/src/multiplayer.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash|last ICE|sequenced|strength is the missing"
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts -t "Krash breaking Filter|explicit Human Corp rez decision"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
relatedActivities:
  - act-2026-05-17-runner-ai-jack-out-after-passing-ice
  - act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle
  - act-2026-05-17-runner-ai-repeat-rd-run
---

# Runner-KI: nach bezahltem ICE-Break wirklich auf R&D zugreifen

## Ziel

Die Runner-KI darf einen erfolgreichen zentralen Run nicht nach bezahltem Break und passiertem letztem ICE ohne konkreten side-sicheren Grund per `jack_out` abbrechen. Wenn R&D/HQ erreicht ist und Zugriff legal oder durch `continue_run` unmittelbar erreichbar ist, soll die KI den Zugriff nehmen statt die investierten Credits wirkungslos wegzuwerfen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-17 mit Screenshot nach Abschluss von `act-2026-05-17-runner-ai-jack-out-after-passing-ice`.
- Die Chronik ist inzwischen verständlicher: `Die Runner-KI hat den Run abgebrochen.` mit Beschreibung `Auf dem angegriffenen Server wurde keine Karte zugegriffen.` und Chip `Kein Zugriff`.
- Der eigentliche AI-Fehler besteht weiter:
  - Runner-KI startet Run auf R&D.
  - Runner-KI bricht mit `Krash` die `Filter`-Subroutine und zahlt die Break-Kosten.
  - Runner-KI passiert das ICE.
  - Statt auf die oberste R&D-Karte zuzugreifen, wählt sie `jack_out`.
- Fachliche Einordnung: Das ist für einen normalen R&D-Run ohne side-sicher bekannte Gefahr unsinnig. Eine unbekannte R&D-Topkarte darf nicht als Ambush-Risiko behandelt werden, weil die Runner-KI sie vor dem Zugriff nicht kennt. Ambush-/Gefahrvermeidung ist nur zulässig, wenn es rechtmäßig side-sichere Information gibt, z. B. vorheriger Zugriff, Expose/Reveal oder öffentliche Events.
- Das erledigte Paket `act-2026-05-17-runner-ai-jack-out-after-passing-ice` enthält bereits einen angeblich grünen Test `continues into R&D access after passing the last ICE instead of jacking out` und eine Ergebnisnotiz, nach der die KI `continue_run` in den Zugriff wähle. Der reale Playtest widerspricht dem; daher ist die alte Regression offenbar zu eng, synthetisch oder nicht identisch mit dem Live-Entscheidungspfad.

## Scope

- Den realen End-to-end-Entscheidungspfad reproduzieren:
  - Engine-State mit R&D, einem rezzbaren/rezzted `Filter` als letztem ICE, Runner mit installiertem `Krash` und ausreichenden Credits.
  - AI-Entscheidungen sequenziell durch den Run laufen lassen: Start Run, Encounter, Break, Continue/Pass ICE, Server-Movement-/Access-Fenster.
  - Nicht nur isoliert eine vorbereitete `access.resolve_card`-Situation testen.
- Prüfen, ob der Live-Pfad andere Inputs nutzt als der alte Test:
  - `buildAiDecisionInput`/DTO-Felder für Run-Position, letztes ICE, Server, Access-Fenster.
  - `chooseRunnerAction` vs. Plan-/Baseline-Auswahl.
  - Server-/Web-AI-Integration, falls der echte Playtest nicht denselben Entscheidungsweg wie der fokussierte Unit-Test nutzt.
- Runner-KI-Scoring/Planung korrigieren:
  - Nach passiertem letztem ICE vor R&D/HQ muss `continue_run`/`access_card` gegenüber `jack_out` klar gewinnen, solange keine konkrete side-sichere Gefahr oder ein anderer höherwertiger legaler Access-Entscheid existiert.
  - Bereits gezahlte Break-/Run-Kosten sollen nicht durch grundlosen Jack-out entwertet werden.
  - `jack_out` bleibt legal und kann sinnvoll sein, wenn noch weitere ICE/Gefahren folgen oder eine side-sicher bekannte negative Access-Situation vorliegt.
- Regression so anlegen, dass sie den früheren Scheinerfolg verhindert:
  - Test muss scheitern, wenn nach `break_subroutine` und `continue_run`/`ICE passiert` als nächster Runner-AI-Entscheid `jack_out` gewählt wird.
  - Test muss belegen, dass im unbekannten R&D-Topkartenfall keine versteckte Ambush-Annahme verwendet wird.
- Falls der Fehler aus einer Integration zwischen Engine, PlayerView, AIInput und Server-Tick entsteht, genau dort testen und nicht nur in `packages/ai`.

## Nicht im Scope

- Keine weitere Chronik-Textkorrektur; die aktuelle Meldung `Run abgebrochen / Kein Zugriff` ist hier gerade der bestätigende Hinweis auf den AI-Fehler.
- Keine Änderung an `Krash`-, `Filter`- oder allgemeiner Breaker-Pump-Logik, sofern die vorherigen Regressionen weiter grün bleiben.
- Keine Hidden-Info-Erweiterung: Die Runner-KI darf keine R&D-Topkarte, Ambush-Karte oder verdeckte HQ-/R&D-Information kennen, die nicht rechtmäßig aus PlayerView, LegalActions oder side-sicheren PublicEvents stammt.
- Keine pauschale Abschaffung von `jack_out`; nur grundloses Auschecken nach erreichtem zentralem Zugriff verhindern.
- Keine Änderung an LegalAction-Regeln, Replay oder StateHash, außer ein tatsächlicher Engine-/PlayerView-Vertragsfehler ist der Grundbefund und wird eng getestet.

## Akzeptanzkriterien

- [x] Ein End-to-end-AI-Test reproduziert den Playtestfall: `Krash` bricht `Filter`, das ICE wird passiert, danach wählt die Runner-KI Zugriff/Weiterlaufen zum Zugriff und nicht `jack_out`.
- [x] Der Test startet vor oder spätestens im Encounter und läuft die AI-Entscheidungen sequenziell durch; er darf nicht nur einen bereits idealisierten Access-State prüfen.
- [x] Im unbekannten R&D-Topkartenfall gibt es keine AI-Evidenz oder Reason, die eine nicht bekannte Ambush-/Gefahrkarte annimmt.
- [x] `jack_out` bleibt in einem getrennten Test möglich oder sinnvoll bewertet, wenn echte side-sichere Gründe bestehen, z. B. weitere gefährliche ICE oder rechtmäßig bekannte negative Access-Situation.
- [x] Die vorhandenen Tests aus `act-2026-05-17-runner-ai-jack-out-after-passing-ice`, `act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle` und R&D-Repeat bleiben grün.
- [x] Falls der Bug im Server-/Web-AI-Tick statt im AI-Paket liegt, deckt ein passender Integrationstest diesen Pfad ab.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts`: Scoring für `jack_out`, `continue_run`, `access_card`; Reason-Codes `runner.run.jack_out_before_access_low_value`, `runner.access.open_card`.
  - `packages/ai/src/runner-plans.ts`: Plan-Kandidaten und Run-/Access-Bewertung für zentrale Server.
  - `packages/ai/src/index.test.ts`: vorhandene Tests um `Krash`, `Filter`, `last ICE`, `access after pass` und R&D-Repeat.
  - `packages/engine/src/index.ts`: nur prüfen, ob PlayerView/LegalActions im Server-Movement-/Access-Fenster die für AI nötige Run-Position korrekt projizieren.
  - Server-/Web-AI-Tick prüfen, falls der Live-Spielpfad `chooseRunnerAction` anders aufruft als die fokussierten Unit-Tests.
- Der entscheidende Testfall ist nicht „Chronik zeigt Jack-out sauber“, sondern „KI entscheidet im echten Pfad nicht für Jack-out“.
- Wenn der alte Test weiterhin grün ist, muss dokumentiert werden, warum er den Livefehler nicht abgedeckt hat, und die neue Regression muss genau diese Lücke schließen.

## Ergebnisnotiz

Der alte Unit-Test war zu eng, weil er Break und Passieren des ICE manuell vorbereitete und danach nur das Server-Movement-Fenster isoliert prüfte. Die neue AI-Regression in `packages/ai/src/index.test.ts` startet im `Krash`/`Filter`-Encounter und lässt die Runner-KI sequenziell `break_subroutine`, `continue_run`, `continue_run` und `access_card` wählen; `jack_out` taucht in der Sequenz nicht auf und die Decision-Daten enthalten keine Ambush-/Gefahrannahme zur unbekannten R&D-Topkarte.

Zusätzlich deckt `apps/server/src/multiplayer.test.ts` den echten Human-Corp-vs-Runner-KI-`advance_ai`-Pfad ab: Die Korp muss `Filter` explizit rezzen, danach läuft die Runner-KI im getakteten Serverpfad durch Break, Passieren des ICE, Weiterlaufen zum Zugriff und R&D-Access. Die bestehende AI-Scoring-/Planlogik war dafür bereits korrekt; die Activity schließt die fehlende Livepfad-Regression. Keine Engine-, LegalAction-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.
