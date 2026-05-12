param(
  [ValidateSet('install', 'catalog', 'engine', 'ai', 'web', 'server', 'typecheck', 'test', 'lint', 'build')]
  [string]$Task = 'install'
)

$ErrorActionPreference = 'Stop'

$expectedRoot = 'C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET'
$actualRoot = (git rev-parse --show-toplevel).Trim() -replace '/', '\'
if ($actualRoot -ne $expectedRoot) {
  throw "Unexpected workspace: $actualRoot"
}

switch ($Task) {
  'install' { corepack pnpm install --frozen-lockfile }
  'catalog' { corepack pnpm --filter '@netgrid/catalog' test }
  'engine' { corepack pnpm --filter '@netgrid/engine' test }
  'ai' { corepack pnpm --filter '@netgrid/ai' test }
  'web' { corepack pnpm --filter '@netgrid/web' test }
  'server' { corepack pnpm --filter '@netgrid/server' test }
  'typecheck' { corepack pnpm typecheck }
  'test' { corepack pnpm test }
  'lint' { corepack pnpm lint }
  'build' { corepack pnpm build }
}
