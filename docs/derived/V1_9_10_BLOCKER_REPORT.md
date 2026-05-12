# V1.9.10 Blocker Report

Stand: 2026-05-12
Status: active

## Blocker

| Blocker-ID | Status | Betroffener Release | Beschreibung | Removal Condition |
| --- | --- | --- | --- | --- |
| `PNPM_INSTALL_EPERM_NODE_MODULES_MISSING_2026-05-12` | active | V1.9.10 | `node_modules` fehlt im festen Automations-Worktree; `corepack pnpm --filter @netgrid/catalog test -- index.test.ts` findet deshalb `vitest` nicht. `corepack pnpm install --offline` scheitert mit `EPERM` beim Entfernen eines `_tmp_*`-Files im Worktree. | Dependency-Setup im Worktree erfolgreich herstellen, danach Katalog-, Engine-, AI-, Typecheck- und Workspace-Tests erneut ausführen. |
| `GIT_WORKTREE_INDEX_LOCK_PERMISSION_DENIED_2026-05-12` | active | V1.9.10 | `git add` kann keinen `C:/Projekte/NETGRID/.git/worktrees/NETGRID_AUTOMATION_V1_9_ORIGINALSET/index.lock` anlegen. Ein vorhandener `index.lock` liegt nicht vor. | Schreibrechte auf `C:\Projekte\NETGRID\.git\worktrees\NETGRID_AUTOMATION_V1_9_ORIGINALSET` für Index-Lock-Erzeugung wiederherstellen, dann WIP erneut adden/committen/pushen. |

## Nicht blockierend

Der vorgeschriebene Worktree-Lock unter `.codex-runlogs/v1_9_originalset_completion.lock` konnte in diesem Lauf angelegt werden. Der frühere externe Lock-Pfad ist nicht mehr verwendet.
