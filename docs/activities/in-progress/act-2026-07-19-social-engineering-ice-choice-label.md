---
activityId: act-2026-07-19-social-engineering-ice-choice-label
status: in_progress
kind: implementation
area: engine-ui-contract
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt: 2026-07-19
completedAt:
branch: codex/social-engineering-ice-choice-label
releaseTarget: current-state
blockedBy: []
resultArtifacts: []
checks: []
---

# Social-Engineering-ICE-Auswahl eindeutig beschriften

## Quelle/Vorgabe

Playtest-Fund vom 19. Juli 2026: Nach einem falschen Korp-Guess bei `Social
Engineering` zeigt die Runner-Entscheidung ein bereits sichtbares ICE nur mit
seinem Kartentitel. Mehrere gleichnamige sichtbare ICE vor demselben oder vor
verschiedenen Forts sind dadurch in der Auswahl nicht unterscheidbar.

## Zielprüfung

Die Vorgabe ist für eine automatische Umsetzung ausreichend präzise. Der
betroffene Auswahlaufbau, das bestehende Positions-Fallback und die fokussierte
Testebene sind bestimmbar. Die Änderung bleibt ein enger Anzeigevertrag ohne
Regel-, Auswahl- oder State-Änderung.

## Gesamtziel

Die `Social Engineering`-Zielwahl bezeichnet jedes auswählbare ICE eindeutig:

- sichtbares ICE: `<Kartentitel> (<Fort> ICE <Position>)`;
- verdecktes ICE: `<Fort> ICE <Position>` ohne Kartentitel.

## Annahmen

- Die vorhandene Positionszählung `index + 1` ist der führende UI-Vertrag.
- Das bereits verwendete Muster `Quandary (HQ ICE 1)` ist die gewünschte
  Darstellungsform.
- Die konkrete Auswahl bleibt über die bestehende Options-ID und den Wert
  `<serverId>|<cardId>` gebunden.

## Nicht-Ziele

- Keine Änderung an `Social Engineering`, Run-, Auto-Pass- oder Rez-Regeln.
- Keine globale Umstellung aller ICE-Auswahlbeschriftungen.
- Keine Änderung an `PlayerAction`, `LegalAction`, Replay oder StateHash.
- Keine Offenlegung verdeckter Kartentitel und keine neue öffentliche Payload.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Implementierung und Commits erfolgen ausschließlich im Arbeits-Worktree
  `C:\Projekte\NETGRID_SOCIAL_ENGINEERING_ICE_CHOICE_LABEL` auf Branch
  `codex/social-engineering-ice-choice-label`.
- Der Hauptworkspace bleibt bis zum finalen lokalen Merge unberührt.
- Jedes Paket benötigt grüne Checks, `git diff --check` und einen eigenen
  Commit.
- Follow-ups erweitern den Scope nicht stillschweigend.

## Automatische Fehlerbehandlung

- Fokussierte Testfehler werden innerhalb des aktuellen Pakets eng analysiert
  und behoben.
- Nicht zum nächsten Paket wechseln, solange das Done-Gate rot ist.
- Fremde oder bereits bestehende Fehler werden als Blocker oder begründet
  ausgelassener Check dokumentiert; sie führen nicht zu Nebenumbauten.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn für ein eindeutiges Label verdeckte Kartentitel
offengelegt, der Hidden-Info-Vertrag abgeschwächt oder die konkrete Auswahl
nicht mehr über eine Karteninstanz revalidiert werden müsste. Removal Condition
ist ein positionsbasiertes Label ohne zusätzliche geheime Information.

## State Machine

`preflight -> paket_1_prozessartefakt -> paket_2_label_und_tests ->
final_verify -> main_merge -> cleanup -> complete`

Bei einem Sicherheitsblocker wechselt der Prozess aus dem aktiven Zustand nach
`blocked`; ansonsten gibt es keine Paketüberspringung.

## Paketfolge

1. `P1` – Prozessartefakt und verbindlichen Vertrag versionieren.
2. `P2` – Social-Engineering-ICE-Labels und Regressionstest umsetzen.

## Paketdetails

### P1 – Prozessartefakt

- **Ziel:** Scope, Invarianten, Paketfolge und Abschlussregeln verbindlich
  dokumentieren.
- **Eingangsvoraussetzungen:** sauberer Hauptworkspace; freier Zielpfad und
  Branch; neuer Worktree auf aktuellem `main`.
- **Konkrete Arbeit:** dieses Activity-Artefakt in `in-progress` anlegen.
- **Kernartefakte:** diese Datei.
- **Checks:** `git diff --check`; Activity-Metadaten und Scope lesen.
- **Done-Gate:** Artefakt ist vollständig, nur paketzugehörige Änderung ist
  gestaged und committed.
- **Commit-Message:** `docs: define Social Engineering ICE label process`

### P2 – Eindeutige Auswahlbeschriftung

- **Ziel:** Sichtbare ICE mit Titel, Fort und Position; verdeckte ICE nur mit
  Fort und Position anzeigen.
- **Eingangsvoraussetzungen:** `P1` committed; kein offener Blocker.
- **Konkrete Arbeit:** Labelbildung im spezifischen Social-Engineering-
  Zielwahlpfad ergänzen und fokussierten Regressionstest für doppelte sichtbare
  Kartentitel sowie ein verdecktes ICE hinzufügen.
- **Kernartefakte:**
  `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts` und der
  zugehörige Test.
- **Checks:** fokussierter Vitest-Lauf; `git diff --check`; bei Bedarf passende
  Typechecks.
- **Done-Gate:** Zwei gleichnamige sichtbare ICE sind durch ihre Position
  unterscheidbar; das verdeckte ICE enthält keinen Titel; der Auswahlwert bleibt
  instanzgebunden; alle fokussierten Checks sind grün; Activity liegt mit
  Ergebnisnotiz unter `done`.
- **Commit-Message:** `fix(engine): disambiguate Social Engineering ICE choices`

## Verifikationsregeln

- Der Test muss die vollständigen Optionslabels prüfen, nicht nur Teilstrings.
- Mindestens zwei sichtbare ICE mit gleichem Titel und unterschiedlichen
  Positionen werden abgedeckt.
- Mindestens ein verdecktes ICE wird ohne Titel abgedeckt.
- Nach jedem Paket und nach dem finalen Merge läuft `git diff --check`.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/social-engineering-ice-choice-label`.
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_SOCIAL_ENGINEERING_ICE_CHOICE_LABEL`.
- Vor dem Merge wird ein weitergelaufenes `main` defensiv in den Arbeitsbranch
  integriert und die fokussierte Verifikation wiederholt.
- Der abgeschlossene Branch wird bevorzugt per Fast-Forward lokal nach `main`
  gemergt.
- Push und Pull Request sind nicht autorisiert.
- Nach erfolgreichem Merge wird der saubere Worktree ohne `--force` entfernt;
  Git-Liste und Dateisystem werden geprüft. Danach wird der gemergte Branch mit
  `git branch -d` gelöscht.

## Controller-Prompt-Kern

`/Goal` Arbeite den Prozess „Social-Engineering-ICE-Auswahl eindeutig
beschriften“ vollständig und sequenziell von `P1` bis `P2` ab. Arbeite nur im
festgelegten Worktree und Branch, verifiziere und committe jedes Paket, stoppe
bei einem Hidden-Info-Sicherheitsblocker, merge den abgeschlossenen Branch lokal
nach `main` und markiere das Ziel erst nach verifiziertem Worktree- und
Branch-Cleanup als vollständig.

## Abschlusskriterien

- [ ] `P1` und `P2` sind jeweils geprüft und committed.
- [ ] Die eindeutige sichtbare Beschriftung und das verdeckte Fallback sind
  regressionsgesichert.
- [ ] Der Arbeitsbranch ist lokal nach `main` integriert.
- [ ] `main` ist sauber und geprüft.
- [ ] Arbeits-Worktree und gemergter Arbeitsbranch sind verifiziert entfernt.

## Ergebnisnotiz

Noch offen.
