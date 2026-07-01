# Agenda Strategy/Rolle Hierarchy Pilot Process

Status: `active`

Quelle/Vorgabe: Nutzerauftrag vom 2026-07-01. Ausgangspunkt ist die fachliche Klärung, dass die strategische Rolle keine unabhängige Karteninformation ist, sondern je Strategieanker eine untergeordnete Rolleninformation bildet.

Arbeitsbranch: `codex/agenda-strategy-role-pilot`

Arbeits-Worktree: `C:\Projekte\NETGRID_AGENDA_STRATEGY_ROLE_PILOT`

## Zielprüfung

Die Vorgabe ist für einen Pilotumbau ausreichend präzise.

- Gesamtziel: Agenda-Karten speichern und zeigen Strategieanker und strategische Rolle als geprüftes Paar.
- Endzustand: Aktive Hints unterstützen `strategySupportPairs`; Inspector-Index, Catalog-API und UI stellen Rollen unter dem jeweiligen Strategieanker dar.
- In Scope: Agenda-Hints, insbesondere Classic-Agendas, Ontologie-/Taxonomievalidierung, Inspector-Index, Catalog-API, Inspector-UI, gezielte Tests und Abschlussreport.
- Nicht in Scope: Engine-Regeln, neue LegalActions, produktive Planner-Gewichte, neue Strategy IDs, Hidden-Info-Projektion, Push oder PR.

## Gesamtziel

`/Goal Arbeite den Agenda-Strategieanker/Rollen-Pilot vollständig und sequenziell von AGENDA-ROLE-00 bis AGENDA-ROLE-04 ab, verifiziere die relevanten AI-Gates und dokumentiere Ergebnis und Restgrenzen.`

Der Pilot ist abgeschlossen, wenn:

- aktive Agenda-Hints explizite `strategySupportPairs` speichern können;
- alle vier Classic-Agendas mit Taktiksignalen, Strategieanker und zugehöriger Rolle geprüft sind;
- vorhandene Agenda-Review-Paare im aktiven Hint-/Inspector-Pfad nutzbar sind;
- die UI Rollen hierarchisch unter Strategieankern zeigt und lose Rollen nur als Fallback kennzeichnet;
- ein Vorher/Nachher-Report pro Agenda vorliegt.

## Annahmen

- Die bestehende Strategy-Goal-Taxonomie reicht aus.
- Die bestehende Rollenliste bleibt kanonische Grobrolle; feineres Agenda-Vokabular wird als `roleDetail` gespeichert.
- `lineSupport` und `strategicRole` bleiben im Pilot als kompatible Summary-Felder erhalten.
- Karten ohne echten Strategieanker bleiben support-only und erhalten keine künstlichen Paare.
- AI023-Review-Evidence ist für vorhandene Originalset-/Proteus-Agenda-Paare belastbar.

## Controller-Invarianten

- Strategieanker und strategische Rolle sind fachlich ein Paar: `strategyId -> role`.
- Eine Rolle ohne zugehörigen Strategieanker ist nur Legacy-/Fallback-Anzeige.
- `roleDetail` präzisiert, ersetzt aber nicht die kanonische Grobrolle.
- Evidence verweist nur auf bekannte Taktik- oder Funktionssignale.
- `strategySupportPairs` bleiben während des Pilots mit `lineSupport` und `strategicRole` kompatibel.
- Rules Engine, LegalActions, Replay, StateHash und Hidden-Info-Verträge bleiben unverändert.

## Paketfolge

| Paket          | Titel                               | Done-Gate                                                                       |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| AGENDA-ROLE-00 | Prozess und Bestandsprüfung         | Prozessartefakt und Scope liegen vor.                                           |
| AGENDA-ROLE-01 | Aktives Paarmodell und Agenda-Daten | Agenda-Hints tragen fachlich geprüfte Paare oder bleiben bewusst support-only.  |
| AGENDA-ROLE-02 | Validatoren und Generatoren         | Ungültige Rollen, Evidence, Confidence oder Summary-Inkonsistenzen schlagen an. |
| AGENDA-ROLE-03 | Catalog API und Inspector-UI        | UI zeigt Rollen unter Ankern; Legacy-Rollen sind Fallback.                      |
| AGENDA-ROLE-04 | Tests, Reports und Abschlussreview  | Gates laufen; Vorher/Nachher-Report ist geschrieben.                            |

## Verifikationsregeln

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy`
- gezielte `@netgrid/ai`- und `@netgrid/web`-Tests
- `git diff --check`

## Sicherheitsblocker

Der Pilot stoppt, wenn eine Änderung verdeckte Karten- oder Zoneninformationen in KI-Inputs, Logs, PlayerViews, PublicEvents oder Inspector-Daten einführt, LegalActions erzeugt oder verändert, Engine-/Replay-/StateHash-Verträge berührt oder produktive AI-Entscheidungen ohne eigenes Gate neu gewichtet.

## Abschlusskriterien

- Aktive Agenda-Hints können hierarchische Strategie/Rolle-Paare ausdrücken.
- Classic-Agendas sind einzeln geprüft.
- Inspector-Index, Catalog-API und UI transportieren die Hierarchie.
- Validatoren sichern die neue Struktur.
- Der Report nennt Agenda, Text, Vorher/Nachher-Status, Taktiksignale, Strategieanker und Rollen.
