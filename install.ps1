# Windows launcher: checks for Node and Git, then runs install.mjs with whatever options you pass.
#   powershell -ExecutionPolicy Bypass -File install.ps1           core skills + MCP servers
#   powershell -ExecutionPolicy Bypass -File install.ps1 --all     everything in the catalog
$ErrorActionPreference = 'Stop'
foreach ($tool in 'node', 'git') {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "$tool is not installed. Install it first:" -ForegroundColor Red
        if ($tool -eq 'node') { Write-Host '  winget install OpenJS.NodeJS.LTS' } else { Write-Host '  winget install Git.Git' }
        exit 1
    }
}
& node (Join-Path $PSScriptRoot 'install.mjs') @args
exit $LASTEXITCODE
