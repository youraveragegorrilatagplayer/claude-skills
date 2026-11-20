# Installs every skill and agent in this repo into Claude Code on this computer.
#   powershell -ExecutionPolicy Bypass -File install.ps1          # skip skills that already exist
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Force   # overwrite them with this repo's copy
param([switch]$Force)
$ErrorActionPreference = 'Stop'
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$claude = Join-Path $HOME '.claude'
$skillsDir = Join-Path $claude 'skills'
$agentsDir = Join-Path $claude 'agents'
New-Item -ItemType Directory -Force $skillsDir, $agentsDir | Out-Null
$added = 0; $skipped = 0

function Install-Dir($src, $name) {
    $dest = Join-Path $skillsDir $name
    if (Test-Path $dest) {
        if (-not $Force) { $script:skipped++; Write-Host "  skip   $name (already installed)"; return }
        Remove-Item -Recurse -Force $dest
    }
    Copy-Item -Recurse $src $dest
    $script:added++; Write-Host "  added  $name"
}

Write-Host "Skills from this repo:"
Get-ChildItem (Join-Path $here 'skills') -Directory | ForEach-Object { Install-Dir $_.FullName $_.Name }

Write-Host "Skills fetched from their original repos:"
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("claude-skills-" + [guid]::NewGuid())
New-Item -ItemType Directory $tmp | Out-Null
try {
    foreach ($u in (Get-Content (Join-Path $here 'upstream.json') -Raw | ConvertFrom-Json)) {
        $clone = Join-Path $tmp $u.name
        git clone --depth 1 --quiet $u.repo $clone
        if ($LASTEXITCODE -ne 0) { Write-Warning "could not clone $($u.repo)"; continue }
        $src = Join-Path $clone $u.path
        Copy-Item (Join-Path $clone $u.license_file) (Join-Path $src 'LICENSE') -Force -ErrorAction SilentlyContinue
        Install-Dir $src $u.name
    }
} finally { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }

Write-Host "Agents:"
Get-ChildItem (Join-Path $here 'agents') -Filter *.md | ForEach-Object {
    $dest = Join-Path $agentsDir $_.Name
    if ((Test-Path $dest) -and -not $Force) { Write-Host "  skip   $($_.BaseName)"; return }
    Copy-Item $_.FullName $dest -Force; Write-Host "  added  $($_.BaseName)"
}
Write-Host ""
Write-Host "Done: $added skills added, $skipped already there. Restart Claude Code (or start a new session) to load them."
