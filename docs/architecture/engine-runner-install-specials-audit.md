# ENGINE-ARCH-8: Runner Install Specials Audit

Stand: 2026-05-23

Scope: reiner Architektur-Audit nach ENGINE-ARCH-6/7. Keine Produktionscodeaenderung, keine Kartenmigration, keine Gameplay-Aenderung, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsaenderung, keine Marker-/ActionID-/PendingChoice-Aenderung.

## 1. Kurzfazit

ENGINE-ARCH-6 hat die einfachen direkten Runner-Install-LegalActions fuer Program, Hardware und Resource sauber nach `packages/engine/src/game/turn/runner-install-actions.ts` extrahiert. Die verbliebenen Runner-Install-Sonderfaelle sind aber keine homogene Restgruppe. Sie teilen sich in vier Risikoklassen:

1. Grip-nahe Sonder-LegalActions in `runnerMainActions`: Programmtrash-before-install, Daemon-Hosting, Zetatech Overlay, Agenda-Punkt-Kosten, Code Viral Cache und Data-Fort-Zielserver.
2. Restricted action sequence: Valu-Pak Software Bundle mit temporaeren Install-Credits und eigener End-Turn-Route.
3. Special-/Hidden-Zone-Installpfade: Shell Traders, Sneak Preview, Self-Modifying Code und CardImplementation-Such-/Install-Choices.
4. Ausfuehrungsmonolith: `installCard`, das Runner- und Corp-Install, Payment, MU, Hosting, Hidden Resource Redaction, Lifecycle Effects, Region/Root-Logik und Spezialmarker zusammenhaelt.

Der kleinste sinnvolle naechste Produktionsschnitt ist **ENGINE-ARCH-9-runner-program-trash-before-install**. Dieser Pfad ist action-building-seitig klein, klar markiert und durch bestehende Tests abgesichert. Die Ausfuehrung und PendingChoice-Aufloesung sollten dabei noch in `index.ts` bleiben.

## 2. Ausgangspunkt

Ausgangspunkt war ein sauberer Worktree auf `codex/card-implementation-next-task`.

Relevante Commits waren vorhanden:

| Commit | Status | Bedeutung |
|--------|--------|-----------|
| `c31c21932e5fc9bb7efac93318048aeeb8097251` | vorhanden | ENGINE-ARCH-6: einfache Runner-Install-Actions |
| `158aceedfe0d9fad7b4e58d3fa6d8ef1e59a4900` | vorhanden | ENGINE-ARCH-7: Corp-Install-Boundary |
| `16515075d0bb6d9a339f494d1b83b87f3d3a0529` | vorhanden | ENGINE-ARCH-5: Runner-Draw-Builder |

Gelesene und ausgewertete Quellen:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/turn/runner-install-actions.ts`
- `packages/engine/src/game/turn/runner-install-actions.test.ts`
- `packages/engine/src/game/turn/corp-install-actions.ts`
- `packages/engine/src/game/turn/action-builders.ts`
- `packages/engine/src/game/payment/`
- `packages/engine/src/ability-engine/`
- `packages/engine/src/compatibility/`
- `packages/engine/src/index.test.ts`
- `packages/engine/src/game/index.test.ts`
- `docs/architecture/engine-turn-legal-actions-boundary-analysis.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`

`docs/architecture/engine-runner-install-actions-boundary-analysis.md` existierte im aktuellen Stand nicht.

## 3. Messwerte

| Artefakt | Messwert |
|----------|----------|
| `packages/engine/src/index.ts` | 31.887 LOC |
| `runnerMainActions` | `index.ts:3451-4437`, 987 LOC |
| `installCard` | `index.ts:10002-10368`, 367 LOC |
| `runner-install-actions.ts` | 67 LOC |
| `runner-install-actions.test.ts` | 116 LOC |
| `corp-install-actions.ts` | 110 LOC |
| `action-builders.ts` | 169 LOC |
| `index.test.ts` | 45.889 LOC |
| `game/index.test.ts` | 237 LOC |

Der verbliebene direkte Runner-Grip-Installbereich in `runnerMainActions` liegt in `index.ts:3571-3788` und umfasst 218 LOC. In diesem Bereich gibt es:

- 6 direkte `action(...)`-Calls fuer Sonderfaelle.
- 3 `buildRunner...InstallAction(...)`-Calls fuer die bereits extrahierten Standardfaelle.
- 2 CardImplementation-Agenda-Cost-Helper-Callsites (`cardImplementationAgendaPointInstallCost`).
- 0 SpecialZone-Helper-Callsites im direkten Grip-Installblock.
- 5 Payment-/Cost-nahe Helper-Callsites, wenn `availableRunnerProgramInstallCredits` und `pickRunnerAgendaForAgendaPointCost` als Installkosten-/Forfeit-Helfer gezaehlt werden.
- 2 Hosting-Helper-Callsites (`canOverlayProgramOnZetatechSoftwareInstaller`, `canHostProgramOnDaemon`).
- 4 Data-Fort-Target-Referenzen.
- 2 Code-Viral-Cache-Gating-Referenzen.

Zusaetzliche installrelevante Sonderpfade liegen ausserhalb dieses Blocks:

- Valu-Pak: `index.ts:3339-3449` und `index.ts:3465-3493`.
- Shell Traders: `index.ts:4168-4246` und `index.ts:8876-9088`.
- Program-trash PendingChoice: `index.ts:9867-9992`.
- Sneak Preview: `index.ts:24178-24440`.
- CardImplementation stack/heap install choices inkl. Self-Modifying-Code-nahe Pfade: `index.ts:22856-23210`, `index.ts:23147-23205`, `index.ts:23931-24067`.
- Payment-/restricted-hosted Credits: `index.ts:30155-30276`.

## 4. Verbliebene Runner-Install-Sonderfaelle

Die nach ENGINE-ARCH-6 verbliebenen Sonderfaelle sind bewusst nicht im einfachen `runner-install-actions.ts` gelandet, weil sie mindestens eines der folgenden Risiken tragen:

- sie oeffnen oder loesen PendingChoices,
- sie binden Hidden-Zone-/Special-Zone-Informationen,
- sie veraendern temporaere Action-Sequenz-Flags,
- sie haengen an MU-/Hosting-/Payment-Revalidation,
- sie mutieren installierte Karten jenseits des normalen `install_card`-Pfades,
- sie schreiben PublicPayload-/Replay-Marker, die Web, Replay und Chronik stabil erwarten.

Die bestehenden Modulgrenzen sind deshalb korrekt konservativ: `runner-install-actions.ts` enthaelt nur die direkten Program-/Hardware-/Resource-Action-Objekte mit stabiler ActionID und Payload. Die Risiko- und Ausfuehrungslogik bleibt in `index.ts`.

## 5. Spezialfall-Tabelle

| Spezialfall | Aktueller Codepfad | Action-Erzeugung | Ausfuehrung | Hidden Info? | Payment/MU? | Host/Zone? | Kann separat geschnitten werden? | Risiko | Empfehlung |
|-------------|--------------------|------------------|-------------|--------------|-------------|------------|----------------------------------|--------|------------|
| Programmtrash-before-install | `runnerMainActions` `index.ts:3587-3606`; Choice `index.ts:9867-9992`; `installCard` `index.ts:10020-10031` | einzelner `install_card` mit `runnerProgramTrashBeforeInstall: true` | oeffnet erst PendingChoice, resolved danach wieder ueber `installCard` | ja, Choice ist `hidden_info_barrier`, Auswahl installierter Programme ist aber Runner-seitig | ja, Installkosten plus MU-Freimachung | keine SpecialZone; nur Rig/Grip | ja, action-building-seitig klein | mittel: PendingChoice-IDs und Payloadmarker duerfen nicht driften | Naechster Schnitt: Builder fuer Action-Objekt extrahieren, Choice/Execution in `index.ts` lassen |
| Hosting/Daemon | `runnerMainActions` `index.ts:3607-3669`; `canHostProgramOnDaemon` `index.ts:4555-4583`; `installCard` `index.ts:10035-10069`, `10183-10185`, `10222-10227` | `install_card` mit `hostOnCardId` und TargetRequirement `hostProgram` | normale Install-Ausfuehrung mit `hostedOn`, ohne MU fuer gehostetes Programm | niedrig, Host ist public installed Runner program | hoch: Daemon-Kapazitaet, MU, install_programs Credits | ja, Hostbindung an installed Daemon | spaeter ja, aber nicht zuerst | mittel bis hoch: Hosted-MU und Payment muessen exakt bleiben | Nach Programtrash als eigener Hosted-Install-Schnitt |
| Zetatech Overlay | `runnerMainActions` `index.ts:3614-3644`; `canOverlayProgramOnZetatechSoftwareInstaller` `index.ts:4609-4624`; `installCard` `index.ts:10039-10068`, `10097-10100`, `10232-10248` | `install_card` mit `hostOnCardId` und `v1922ZetatechOverlayInstall: true` | normale Install-Ausfuehrung plus Overlay-Payload und recurring-credit-spent Marker | niedrig | hoch: recurring/hosted payment credit accounting | ja, Host/Overlay | nicht isoliert vom Hosted-Install schneiden | hoch: Source-removal/Stale-Revalidation und Recurring-Credit-Payload | Mit Hosted-Install-Schnitt zusammen behandeln |
| Agenda-Punkt-Kosten | `runnerMainActions` `index.ts:3671-3710`, `3725-3758`; Cost Helper `index.ts:17461`; Forfeit Helper `index.ts:19768-19782`; `installCard` `index.ts:10103-10128` | Hardware/Resource `install_card` mit `installAgendaPointCost`, `forfeitAgendaCardId`, `installCostReason` | `installCard` validiert deklarierte Kosten und forfeitet Agenda | nein, ScoreArea ist public | ja, nicht Credit-Payment, aber Zusatzkosten/Revalidation | `removed_from_game` SpecialZone-Marker fuer forfeited Agenda | ja, aber nur als Install-Cost-Context | mittel: Action-Payload und specialZoneReason muessen stabil bleiben | Nach Hosted-Install als Cost-Target-Context schneiden |
| Code Viral Cache | `runnerMainActions` `index.ts:3719-3724`; `installCard` `index.ts:10075-10082`; weitere Runtime bei `index.ts:8614-8621`, `29838`, `29910`, `30025` | Resource-Install wird nur nach erfolgreichem HQ-Run angeboten | normale Resource-Installation; weitere Kartenlogik ausserhalb Install | nein | niedrig bis mittel: Timing-/Run-Flag statt Payment | nein | ja, aber nur als Teil von Resource eligibility | niedrig bis mittel: HQ-run flag darf nicht anders interpretiert werden | Bei Resource-Install-Eligibility-Context mitnehmen, nicht als eigener Schnitt |
| Data-Fort-Zielserver | `requiresDataFortInstallTarget` `index.ts:1171-1175`; `runnerMainActions` `index.ts:3759-3785`; `installCard` `index.ts:10070-10095`, `10228-10230` | pro Corp-Server ein `install_card` mit `selectedServerId` und `selectedServerLabel` | normale Resource-Installation mit `selectedServerId` auf CardInstance | ja mittel: Server ist public, aber Zielbindung darf keine hidden Carddaten leaken | niedrig bis mittel: Installkosten normal, aber Revalidation benoetigt Serverexistenz | Serverbindung, keine SpecialZone | ja, aber nur mit Target-Context | mittel: ActionID-Reihenfolge und Label muessen pro Server stabil bleiben | Mit Agenda-Punkt-Kosten als Install-Cost/Target-Context schneiden |
| Valu-Pak | Flags `index.ts:3339-3449`; Sonderphase `index.ts:3465-3493`; Payment `index.ts:30267-30275`, `30312-30323`; Execution `installCard` `index.ts:10249` | frueher Return aus `runnerMainActions`, nur Program-Install-Bundle und spezielles End-Turn | installiert ueber `installCard`, verbraucht temporaere Action-/Credit-Flags | nein | hoch: temporaere Credits, Action-Sequenz, End-Turn | keine SpecialZone | nein, zuerst separat auditieren | hoch: Rueckkehr/Reihenfolge aller LegalActions in Valu-Pak-Phase | Vorerst in `index.ts`; spaeter eigener restricted-sequence Schnitt |
| Shell Traders | Action-Erzeugung `index.ts:4168-4246`; Target Helpers `index.ts:8876-8925`; Resolver `index.ts:8927-9088` | `trigger_ability`, nicht `install_card`; bereitet Karten aus Grip set-aside vor und entfernt Shell-Counter | setzt Karten public set-aside; installiert spaeter kostenlos nach Counter-Entfernung | hoch: Grip-Ziel, `hiddenZoneBarrier`, public set-aside | ja: Kosten werden in Shell-Counter uebersetzt; spaeter 1 Credit pro Counter | SpecialZone `set_aside` | nein fuer Install-Schnitt; eher SpecialZone/Counter-Schnitt | hoch: Hidden Info und PublicPayload sind zentral | Nicht mit Runner-Install-LegalActions schneiden |
| Sneak Preview | `index.ts:24178-24440`; Tests `index.test.ts:17020`, `17094` | Choice-basierter Start ueber Event/Resolver, nicht normaler MainAction-Install | Hidden-Zone Source Choice, Program Choice, kostenlose temporäre Installation, ggf. Stack-Shuffle | hoch: Stack/Heap-Auswahl, Reveal/PublicPayload | MU ja, Kosten free | Stack/Heap, temporärer Return | nein | sehr hoch: Hidden-Zone, Shuffle, temporary return, Replay-Marker | Als Special-Zone-/Hidden-Zone-Install-Audit behandeln |
| Self-Modifying Code | stack search/install target helpers `index.ts:22856-23210`, `23147-23205`; SMC Resolver `index.ts:23420-23715`; Tests `index.test.ts:17375`, `17425` | Encounter-only activated ability, nicht Runner-MainAction | source trash, Stack-Suche, paid install, deterministic shuffle | hoch: Stack-Suche und Reveal | hoch: paid install plus source-trash | Stack hidden zone, run/encounter bound | nein | sehr hoch: Run-window, Hidden-Zone, Shuffle, Payment | Nicht vor Run/Encounter- und Special-Zone-Grenzen schneiden |
| `installCard` | `index.ts:10002-10368` | keine Action-Erzeugung; zentrale Ausfuehrung | Runner- und Corp-Install inklusive Payment, MU, Hosting, Hidden Resource, Lifecycle, Region/Root | ja: hidden runner resources und Corp concealed roots/ICE | hoch | alle normalen Install-Zonen plus hosted/special markers | nein, erst intern kartieren | sehr hoch: zentrale Revalidation und Mutation | Spaeter eigener `ENGINE-ARCH-9-install-card-internal-map`, aber nicht als naechster kleinster Code-Schnitt |

## 6. Risiken

ActionID-/Payload-Risiko: Die Sonderactions nutzen bestehende `action(...)`/`buildLegalAction(...)`-Semantik. Jede Extraktion muss exakt dieselben `actionId`, Labels, Costs, Payloads und `targetRequirements` erzeugen. Besonders kritisch sind `runnerProgramTrashBeforeInstall`, `hostOnCardId`, `v1922ZetatechOverlayInstall`, `installAgendaPointCost`, `forfeitAgendaCardId`, `selectedServerId`, `selectedServerLabel` und Valu-Pak-Marker.

PendingChoice-Risiko: Programtrash, Sneak Preview, SMC und CardImplementation-Stack/Heap-Installpfade erzeugen oder konsumieren Choices mit stabilen `choiceId`-/`source`-Mustern. Diese duerfen nicht nebenbei veraendert werden.

Hidden-Info-Risiko: Shell Traders, Sneak Preview, SMC und Stack-/Heap-Suchpfade sind Hidden-Zone-lastig. Auch wenn Teile read-only aussehen, koennen Labels, Options, `cardSearchPresentation`, Reveal-Modi und PublicPayload-Marker hidden data leaken.

Payment-/MU-Risiko: Hosted Credits, Valu-Pak temporary credits, recurring program install credits, daemon capacity, normal MU, Shell-Counter-Kosten und Agenda-Punkt-Kosten sind derzeit ueber mehrere lokale Helper verteilt. Ein zu frueher Umzug kann doppelte Kostenlogik erzeugen.

Execution-Risiko: `installCard` validiert und mutiert weiterhin sehr viel. Ein LegalAction-Builder-Schnitt ist sicherer als ein Ausfuehrungsschnitt, solange `installCard` nicht intern kartiert ist.

Replay-/PublicPayload-Risiko: Viele Marker sind explizit historische Vertragspunkte fuer Replay, Chronik und PublicPayload. Dazu gehoeren unter anderem `hiddenZoneBarrier`, `hiddenZoneAction`, `specialZone`, `specialZoneVisibility`, `specialZoneReason`, `publicRevealKind`, `shuffled`, `temporaryInstall`, `runnerProgramTrashBeforeInstallResolved` und Valu-Pak-/Zetatech-spezifische Felder.

## 7. Was nicht verschoben werden sollte

Nicht als naechster Schritt verschieben:

- `installCard` als Ganzes.
- Sneak Preview, Self-Modifying Code und CardImplementation-Stack/Heap-Installpfade.
- Shell Traders als Teil der normalen Runner-Install-LegalActions.
- Valu-Pak als Teil des normalen Grip-Installblocks.
- Daemon-Hosting und Zetatech Overlay zusammen mit Programtrash.
- Payment-Ausfuehrung, Hosted-Credit-Spending oder temporaere Valu-Pak-Credits.
- Hidden-Zone-Choices oder `cardSearchPresentation`-Objekte.
- Runner-Install-Ausfuehrung oder MU-Mutation.

Diese Teile sind entweder mutierend, hidden-info-kritisch oder revalidierungsstark. Sie sollten nicht in einen Turn-Action-Builder-Schnitt hineingezogen werden.

## 8. Empfohlener naechster Produktionsschnitt

Empfohlen wird **Option A: ENGINE-ARCH-9-runner-program-trash-before-install**.

Begruendung:

- Der Action-Erzeugungspfad ist klein und lokal: `index.ts:3587-3606`.
- Die Eligibility ist bereits in kleinen read-only Helfern gebuendelt: `installedRunnerProgramTrashOptionsForInstall`, `runnerProgramInstallMemoryReachableAfterTrash`, `shouldOfferRunnerProgramTrashBeforeInstall` in `index.ts:3376-3410`.
- Die Ausfuehrung ist klar getrennt: `installCard` oeffnet nur die Choice (`index.ts:10020-10031`), `resolveRunnerProgramTrashBeforeInstallChoice` loest sie auf (`index.ts:9913-9992`) und ruft danach wieder `installCard`.
- Bestehende Tests sichern den Pfad direkt ab: `index.test.ts:5859` und `index.test.ts:5916`.
- Der Schnitt muss keine SpecialZone, keine Stack-/Heap-Suche, keine Hosted Credits und keine Valu-Pak-Sequence anfassen.

Nicht empfohlen als naechster Schritt:

- Option B (`runner-hosted-install-boundary`) ist sinnvoll, aber Hosting und Zetatech haengen bereits an hosted credits, MU-Ausnahmen und Overlay-Payloads.
- Option C (`runner-install-cost-target-context`) ist sinnvoll, aber Agenda-Punkt-Kosten und Data-Fort-Zielserver mischen Cost- und Target-Revalidation.
- Option D (`special-zone-install-audit`) ist fachlich wichtig, sollte aber erst nach dem kleinen Programtrash-Schnitt kommen.
- Option E (`install-card-internal-map`) wird spaeter noetig, ist aber fuer den naechsten Produktionsschnitt breiter als erforderlich.

## 9. Akzeptanzkriterien fuer ENGINE-ARCH-9-runner-program-trash-before-install

Minimaler Zielumfang:

- Neuer oder erweiterter turn-naher Builder, zum Beispiel `buildRunnerProgramTrashBeforeInstallAction(...)`.
- Kein Import aus `../index` oder `../../index` in neuen `game/turn/*`-Modulen.
- `runnerMainActions` ersetzt nur den direkten `action(...)`-Call fuer `runnerProgramTrashBeforeInstall`.
- Eligibility darf in `index.ts` bleiben, falls sie sonst breite Dependencies erzeugt.
- `startRunnerProgramTrashBeforeInstallChoice`, `resolveRunnerProgramTrashBeforeInstallChoice` und `installCard` bleiben in `index.ts`.
- ActionID, Label, Costs, Payload und TargetRequirements bleiben exakt gleich.
- Keine Aenderung an `choiceId`, `pendingChoice.source`, `hiddenZoneBarrier`, Replay- oder PublicPayload-Markern.
- Bestehende Tests `index.test.ts` bleiben unveraendert gruen.
- Ein kleiner Builder-Test darf die stabile Actionform pruefen; kein neuer Gameplay-Test ist notwendig.

Pruefpflicht fuer den Schnitt:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/turn/...`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts`
- `corepack pnpm --filter @netgrid/web typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`, falls der Arbeitsstand weiterhin Server-Typecheck als Gate nutzt
- `git diff --check`
- `git diff --cached --check`
