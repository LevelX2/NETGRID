# Corp Defense Reserve und persistente ICE-Rezbewertung – Umsetzungsprozess

Status: in Bearbeitung
Datum: 2026-07-27
Arbeitsbranch: `codex/corp-defense-reserve-persistent-rez`
Arbeits-Worktree: `C:\Projekte\NETGRID_corp-defense-reserve-persistent-rez`

## Quelle/Vorgabe

Der globale Plan `corp.defend_servers` muss eine lokal produktive ICE-Rez im
aktuellen Runner-Run ablehnen, wenn sie eine höherrangige, vollständig
belegte Score-/Defense-Reserve aufzehrt. Die Reserve muss zeitgestuft
rechnen: sofort benötigte Rezkosten vor dem nächsten Corp-Zug bleiben liquide;
Score- und Advancementkosten des nächsten Corp-Zugs dürfen um garantiert aus
freien, nicht bereits gebundenen Corp-Klicks erzeugbare Credits sinken.

Zusätzlich muss eine dauerhafte kostenlose Rez auf einem wirklich
schützenswerten Server zulässig sein, wenn ein bekanntes zugriffsrelevantes
ICE zwar aktuell kostenlos passiert wird, aber als aktive künftige Defense
Rolle erfüllt. Ein sicherer Ressourcenverbrauch wie Rent-I-Con bleibt ein
eigenständiger positiver Sofortfall.

## Zielprüfung

Die Vorgabe ist für eine automatische Umsetzung präzise genug:

- Die alleinige fachliche Ownership ist `corp.defend_servers`.
- Score-Parents liefern nur gebundene Schutz- und Score-Fortsetzungsbedarfe.
- Alle Kosten-, Klick- und Rezbehauptungen sind Engine-zertifiziert,
  stateversionsgebunden und fail-closed.
- Die Akzeptanz erfolgt über realistische Ingame-Regressionen mit echten
  Engine-Aktionen, nicht über frei konstruierte Action-Scores.
- Ein eigener Rez-, Attrition- oder Zentralreserveplan ist ausgeschlossen.

## Gesamtziel

Die Plan-first-Corp-KI trifft innerhalb genau einer globalen
`corp.defend_servers`-Planinstanz eine nachvollziehbare, lexikographische
Entscheidung zwischen aktueller Rez, Decline und dem Bewahren von Liquidität
für gebundene Score- und Defense-Fortsetzungen. Alle neuen Verhaltensfälle
sind über vollständige Engine-/KI-Spielszenarien regressionsgeschützt.

## Annahmen

- Der normale Corp-Credit-Klick ist nur für künftig freie Corp-Klicks eine
  garantierte Konversion; Draw, unbekannte Karten, Zufall und bedingte
  Auszahlungen zählen nicht.
- Ein Score-Fortsetzungsbedarf wird nur reserviert, wenn Zielagenda,
  verbleibende Schritte, Deadline und alle erforderlichen Quotes vollständig
  sichtbar und gebunden sind.
- `corp.score_agenda` ist alleiniger Eigentümer dieser Berechnung. Es
  veröffentlicht die Engine-zertifizierte Zeitreserve; `corp.defend_servers`
  darf sie ausschließlich konsumieren und nicht aus Kartentext oder eigener
  Zukunftsschätzung rekonstruieren.
- Die Schutzreserve vor dem nächsten Corp-Zug umfasst nur Routen, die der
  Runner mit seiner nachgewiesenen verbleibenden Aktionskapazität erreichen
  kann; sie summiert keine pauschale Gesamtheit aller ICE.
- Ein dauerhaft kostenloses ICE wird nicht pauschal gerezzt: Es braucht einen
  aktiven Defense-Need, eine persistente Rez und darf keine höherrangige
  gebundene Route verschlechtern.

## Nicht-Ziele

- Keine Simulation beliebig vieler zukünftiger Züge oder unbekannter Karten.
- Keine gedruckten Kosten- oder Kartentext-Fallbacks.
- Keine Änderung der Kartenregeln, Hidden-Info-Grenzen, Replay- oder
  StateHash-Verträge.
- Keine neue Planinstanz und keine allgemeine Zentralreserve.
- Keine UI- oder Serveränderung außerhalb erforderlicher side-sicherer
  DecisionDebug-Evidence.

## Controller-Invarianten

1. Nur Engine-LegalActions bleiben ausführbare Route Heads.
2. `corp.score_agenda` besitzt den Score-Fortsetzungsbedarf einschließlich
   freier Klick-Credit-Konversion; `corp.defend_servers` besitzt die globale
   ICE-, Rez- und Reservewahl.
3. Score-Parents delegieren einen servergebundenen Claim und Priorität, aber
   keine ICE-Auswahl.
4. Reservekomponenten sind zeitgestuft, eindeutig identifiziert und dürfen
   nicht doppelt gezählt werden.
5. Unvollständige, stale oder nicht gebundene Quotes erzeugen keinen
   geschätzten Betrag.
6. Decline bleibt ausführbar, wenn keine nach dem Gesamtportfolio zulässige
   produktive Rezroute existiert.
7. Öffentliche Runner-Ausgaben, Events und Replays erhalten keine Corp-
   privaten Claimdetails.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Fehlende Engine-Facts, Quotes oder LegalAction-Bindungen: fail-closed,
  diagnostisch sichtbar, keine Ersatzheuristik.
- Ein Fachkonflikt zwischen terminalem Zugriffsschutz und einer gebundenen
  Score-Reserve wird nicht still geglättet; der P1/P2-Vertrag wird in einem
  Test als expliziter Vorrang gesichert.
- Greift der Runner den gebundenen Agenda-Server selbst an, hat dessen
  produktive aktuelle Rez Vorrang vor der späteren Advancement-Cashreserve
  derselben Agenda; der Score-Parent wird nach dem Run revalidiert.
- Tests mit künstlichem `AiDecisionInput` ohne Engine-Zustandsübergang dürfen
  keine neue Spielerhaltensentscheidung allein beweisen.
- Wenn ein benötigter Testzustand mit dem aktiven Kartenpool nicht real
  erreichbar ist, darf ausschließlich eine test-only Engine-Fixture die
  Mechanik nachbilden; sie erweitert keinen produktiven Kartenpool.

## State Machine

```text
Facts/Quotes aktuell
  -> Score-/Defense-Claims ableiten
  -> zeitgestufte Reserveportfolio-Projektion
  -> aktuelle Rezroute lokal projektieren
  -> Portfolio-Zulassung oder reserve_blocked
  -> Rez oder Decline als exakt gebundener Route Head
  -> applyAction
  -> StateVersion-Revalidierung
```

## Paketfolge

| Paket | Ziel                                                                                                                        | Done-Gate                                            | Commit                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| P0    | Prozessvertrag und Testmatrix                                                                                               | Artefakt vollständig, Diff-Check                     | `docs(ai): define defense reserve rez process`         |
| P1    | Bestehende reale Rez-/Break-Grundwahrheiten als Engine-/KI-Regressionsbasis sichern                                         | fokussierte Tests grün                               | `test(ai): establish rez reserve scenario baseline`    |
| P2    | Gewünschte Konflikt- und Zeitreserve-Szenarien zuerst als Tests formulieren und die fehlenden Engine-Facts minimal ergänzen | neue Szenarien beweisen Facts, alte unverändert grün | `test(engine): specify timed defense reserve facts`    |
| P3    | Gemeinsame Defense-Claims, zeitgestufte Reserve und globale Rez-/Decline-Auswahl implementieren                             | alle P1/P2-Szenarien grün, Quote-/Safety-Guards grün | `fix(ai): preserve defense reserve across rez windows` |
| P4    | Persistente kostenlose Defense-Rez, vollständige Regressionen und Dokumentationsrückführung                                 | fokussierte und paketnahe Gates grün                 | `test(ai): cover persistent free defense rez`          |
| P5    | Finaler Worktree-Check, Integration nach `main` und verifizierter Cleanup                                                   | main grün, Worktree/Branch entfernt                  | Merge nach `main`                                      |

## Szenario-Matrix

| ID  | Reale Spielkonstellation                                                                                                 | Erwartung                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Filter gegen Rent-I-Con: 0 Corp, 1 Runner, sicherer Run-End-Trash                                                        | Rez; Breaker wird nach dem Run getrasht                                                                                                        |
| R2  | kostenloser Break ohne Verbrauch                                                                                         | keine reine Ressourcenabtauschroute                                                                                                            |
| R3  | produktive R&D-Rez unterschreitet die unmittelbar nötige Score-Remote-Rez-/Advance-Reserve, Runner hat weitere Klicks    | Decline mit Reserve-Evidence                                                                                                                   |
| R4  | dieselbe Lage mit ausreichender Liquidität                                                                               | R&D-Rez, spätere Remote-Rez bleibt bezahlbar                                                                                                   |
| R5  | nur ein Advancement offen, freie Corp-Klicks liefern sichere Credits                                                     | geringere Folgereserve, zulässige Rez                                                                                                          |
| R6  | alle kommenden Corp-Klicks sind für Score-Fortsetzung gebunden                                                           | keine Klick-Credit-Anrechnung                                                                                                                  |
| R7  | Runner hat nach dem aktuellen Run keine Angriffskapazität mehr                                                           | keine unnötige Sofort-Rezreserve                                                                                                               |
| R8a | mehrere unrezzte ICE nacheinander auf dem aktuell angegriffenen Server                                                   | unvollständiger äußerer Ressourcenquote wird fail-closed declined; eine innere Stopprez wird dadurch nie „auf Verdacht“ unfinanzierbar gemacht |
| R8b | mehrere wichtige Server mit konkurrierenden unrezzten ICE                                                                | minimales exaktes, nach Parent-Priorität und Runner-Angriffskapazität ausgewähltes Reserveportfolio                                            |
| R8c | ein günstigeres hinreichendes Stop-ICE auf Server A lässt zugleich die notwendige Rez auf wichtigem Server B finanzieren | globales Portfolio wählt die günstigere Stopproute statt der lokal stärkeren, teureren Alternative                                             |
| R9  | kostenlose, persistente zugriffsrelevante Rez bei kostenloser Passage auf wichtigem Server                               | `free_persistent_defense` zulässig                                                                                                             |
| R10 | R9 auf unwichtigem Server oder bei höherem Claim                                                                         | keine automatische Rez                                                                                                                         |
| R11 | temporäres Derez oder stale/unvollständiger Quote                                                                        | keine persistente/geschätzte Route                                                                                                             |
| R12 | terminale unmittelbare Gefahr gegen gebundene Reserve                                                                    | explizit getestete lexikographische Vorrangregel                                                                                               |

## Verifikationsregeln

- Jede neue Verhaltensregel erhält mindestens eine positive, negative und
  Grenzprobe über `createGameAfterSetup`, `getLegalActions`, `getPlayerView`,
  `chooseAiAction` und, wo eine Folge behauptet wird, `applyAction`.
- Assertions prüfen Action-ID, Credits, spätere Legalität/Bezahlbarkeit,
  DecisionDebug/Disposition und side-sichere Runner-Projektion.
- Paketnah mindestens AI- und Engine-Vitest sowie beide Typechecks ausführen.
- Vor jedem Commit: `git diff --check`, gezielte Staging-Prüfung und sauberer
  Worktree-Status.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich `C:\Projekte\NETGRID_corp-defense-reserve-persistent-rez`
  auf `codex/corp-defense-reserve-persistent-rez` bearbeiten.
- Kein Start von Server oder Webclient aus dem Worktree.
- Jedes abgeschlossene Paket erhält genau einen fokussierten Commit.
- Vor finalem Merge wird aktuelles `main` defensiv integriert und die
  vollständige relevante Verification wiederholt.
- Nach erfolgreichem lokalen Main-Merge wird der saubere Worktree per
  `git worktree remove` entfernt, in Git und im Dateisystem überprüft und der
  gemergte Branch per `git branch -d` gelöscht.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Corp Defense Reserve und persistente
ICE-Rezbewertung“ vollständig und sequenziell von P0 bis P5 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die Wiki-First-Quellen, die Agentenvorgabe und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_corp-defense-reserve-persistent-rez auf Branch
codex/corp-defense-reserve-persistent-rez. Nutze den Hauptworkspace nur für
den finalen Merge. Arbeite immer nur am aktiven Paket, führe dessen Checks
aus und committe es. Bei Sicherheitsblocker: stoppe, dokumentiere Removal
Condition und frage nicht nach. Nach P5: main verifizieren, Worktree und
Branch verifiziert entfernen und Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Die R1–R12-Matrix besitzt passende, reale Engine-/KI-Regressionen.
- `corp.defend_servers` entscheidet Rez oder Decline nach dem vollständigen
  zeitgestuften Portfolio und nicht nach isolierter lokaler Attrition.
- Bestehende LegalAction-, Quote-, Hidden-Info-, Replay- und StateHash-
  Grenzen bleiben erhalten.
- Alle Paketcommits sind nach lokalem `main` integriert.
- Main ist geprüft; Worktree und Arbeitsbranch sind entfernt und deren
  Entfernung ist doppelt verifiziert.
