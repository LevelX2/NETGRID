param(
  [Parameter(Mandatory = $true)]
  [string]$Message,

  [switch]$Push
)

$ErrorActionPreference = 'Stop'

$expectedRoot = 'C:\Projekte\NETGRID_AUTOMATION_V1_9_ORIGINALSET'
$actualRoot = (git rev-parse --show-toplevel).Trim() -replace '/', '\'
if ($actualRoot -ne $expectedRoot) {
  throw "Unexpected workspace: $actualRoot"
}

$branch = (git branch --show-current).Trim()
if ($branch -ne 'codex/v1-9-originalset-completion') {
  throw "Unexpected branch: $branch"
}

if ($Message -notmatch '^(WIP V1\.9\.(1[0-9]|2[0-2]): .+|V1\.9\.(1[0-9]|2[0-2]): .+)$') {
  throw "Commit message is outside the V1.9.10-V1.9.22 automation contract."
}

git add .

$status = git status --short
if (-not $status) {
  Write-Output 'No versionable changes to commit.'
  exit 0
}

git commit -m $Message

if ($Push) {
  git push origin codex/v1-9-originalset-completion
}
