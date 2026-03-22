# Delegates to gate-360-local.mjs (cross-platform). Prefer: pnpm gate:360:local
#
#   -SkipDocker   → --skip-docker
#   -Strict        → --strict
#   -Verbose       → --verbose

param(
    [switch]$SkipDocker,
    [switch]$Strict,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$mjs = Join-Path $PSScriptRoot "gate-360-local.mjs"
$nodeArgs = @($mjs)
if ($SkipDocker) { $nodeArgs += "--skip-docker" }
if ($Strict) { $nodeArgs += "--strict" }
if ($Verbose) { $nodeArgs += "--verbose" }

& node @nodeArgs
exit $LASTEXITCODE
